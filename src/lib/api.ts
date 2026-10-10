import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios';

import type {
  ApiErrorPayload,
  HealthStatus,
  ObservationRecordResponse,
  ObservationListResponse,
  SpectralSliceResponse,
  ProcessedObservationResponse,
  DetectionResponse,
  AnalysisResponse,
  CandidateResponse,
  CandidateListResponse,
  CandidateAssessment,
  CandidateDossier,
  CreateCandidateRequest,
  ReviewCandidateRequest,
  ReviewCandidateResponse,
  CandidateStatus,
} from '@/types/schemas.ts';

/**
 * Safely resolves an environment variable across both Vite browser bundles
 * (import.meta.env) and Node.js test environments (process.env).
 */
function getEnvVar(key: string): string | undefined {
  if (
    typeof import.meta !== 'undefined' &&
    (import.meta as unknown as { env?: Record<string, string> }).env
  ) {
    return (import.meta as unknown as { env: Record<string, string> }).env[key];
  }
  const proc =
    typeof globalThis !== 'undefined'
      ? (globalThis as unknown as { process?: { env?: Record<string, string> } }).process
      : undefined;
  if (proc?.env) {
    return proc.env[key];
  }
  return undefined;
}

/**
 * Normalizes configured base URL from environment.
 * Prevents path duplication such as /api/api/observations.
 *
 * Config resolution:
 * - VITE_API_BASE_URL: e.g. "http://localhost:8000/api" or "http://localhost:8000"
 * - Defaults to "http://localhost:8000/api" in local development.
 */
function resolveBaseUrl(): string {
  const envUrl = getEnvVar('VITE_API_BASE_URL')?.trim();
  if (!envUrl) {
    return 'http://localhost:8000/api';
  }
  // Strip trailing slashes
  const clean = envUrl.replace(/\/+$/, '');
  // If user provided origin without /api, we ensure /api prefix is present since FastAPI mounts routes at /api
  if (!clean.endsWith('/api')) {
    return `${clean}/api`;
  }
  return clean;
}

export function getBaseUrl(): string {
  return resolveBaseUrl();
}

export { resolveBaseUrl };

export const API_BASE_URL = resolveBaseUrl();

/**
 * Checks whether explicit offline demonstration mode is enabled.
 * Defaults to false unless VITE_DEMO_MODE="true".
 */
export function isDemoMode(): boolean {
  return getEnvVar('VITE_DEMO_MODE') === 'true';
}

/**
 * Primary Axios client configured for AETHON scientific data exchange.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds for heavy scientific signal processing / anomaly detection
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Client-Agent': 'Aethon-Observatory-Frontend/2.0',
  },
});

/**
 * Request interceptor injecting telemetry trace headers for auditability.
 */
apiClient.interceptors.request.use(
  (config) => {
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    config.headers.set('X-Telemetry-Trace', traceId);
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(normalizeApiError(error));
  }
);

/**
 * Formats and normalizes arbitrary errors into a consistent, safe ApiErrorPayload.
 * Extracts useful validation details without leaking filesystem paths or stack traces.
 */
export function normalizeApiError(error: unknown): ApiErrorPayload {
  if (axios.isAxiosError(error)) {
    const axiosErr = error as AxiosError<Record<string, unknown>>;
    const data = axiosErr.response?.data;
    const status = axiosErr.response?.status;

    // Handle FastAPI 422 RequestValidationError structure { detail: [...] } or { message, details: { errors: [...] } }
    let message = 'An unexpected server error occurred during telemetry processing.';
    let details: Record<string, unknown> | null = null;
    let code = axiosErr.code || `HTTP_${status || 'ERROR'}`;

    if (data && typeof data === 'object') {
      if (typeof data.message === 'string' && data.message.trim()) {
        message = data.message;
      } else if (typeof data.detail === 'string' && data.detail.trim()) {
        message = data.detail;
      } else if (Array.isArray(data.detail)) {
        // FastAPI validation array
        const validationMsgs = (data.detail as Array<{ loc?: unknown[]; msg?: string }>)
          .map((item) => {
            const field = Array.isArray(item.loc) ? item.loc.join('.') : 'field';
            return `${field}: ${item.msg || 'invalid'}`;
          })
          .slice(0, 3);
        message = `Validation failed: ${validationMsgs.join('; ')}`;
        details = { errors: data.detail };
      }

      if (typeof data.code === 'string') {
        code = data.code;
      }
      if (data.details && typeof data.details === 'object') {
        details = data.details as Record<string, unknown>;
      }
    } else if (axiosErr.message) {
      if (axiosErr.message === 'Network Error') {
        message =
          'Unable to connect to AETHON backend service. Verify backend is running on port 8000.';
        code = 'NETWORK_DISCONNECTED';
      } else if (axiosErr.code === 'ECONNABORTED' || axiosErr.message.includes('timeout')) {
        message = 'Telemetry request timed out while processing scientific data matrix.';
        code = 'REQUEST_TIMEOUT';
      } else {
        message = axiosErr.message;
      }
    }

    // Specific HTTP status fallback guidance
    const hasDataMessage = Boolean(data && (data.message || data.detail));
    if (status === 404 && !hasDataMessage) {
      message = 'The requested scientific observation, candidate, or slice was not found.';
      code = 'NOT_FOUND';
    } else if (status === 413 && !hasDataMessage) {
      message = 'Observation upload exceeds permissible file size ceiling (maximum 100MB).';
      code = 'PAYLOAD_TOO_LARGE';
    } else if (status === 422 && !hasDataMessage) {
      message = 'Scientific coordinate or parameter bounds validation failed.';
      code = 'UNPROCESSABLE_ENTITY';
    } else if (status === 500 && !hasDataMessage) {
      message = 'Internal scientific analysis error. Please check server telemetry logs.';
      code = 'INTERNAL_SERVER_ERROR';
    }

    return {
      message,
      code,
      status,
      timestamp: new Date().toISOString(),
      details: details ?? undefined,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      code: 'CLIENT_ERROR',
      status: 0,
      timestamp: new Date().toISOString(),
    };
  }

  return {
    message: typeof error === 'string' ? error : 'Unknown error during scientific operations.',
    code: 'UNKNOWN_ERROR',
    status: 0,
    timestamp: new Date().toISOString(),
  };
}

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    const normalized = normalizeApiError(error);
    const isDev =
      typeof import.meta !== 'undefined' &&
      (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV;
    if (isDev) {
      console.warn(
        `[AETHON API Error ${normalized.status || 'ERR'}]: ${normalized.message}`,
        normalized
      );
    }
    return Promise.reject(normalized);
  }
);

/**
 * ============================================================================
 * TYPED API METHODS FOR REAL BACKEND ENDPOINTS
 * ============================================================================
 */

/**
 * 1. Health Probe (GET /api/health or /health)
 */
export async function getHealth(): Promise<HealthStatus> {
  const response = await apiClient.get<HealthStatus>('/health');
  return response.data;
}

/**
 * 2. Upload Observation (POST /api/observations)
 * Accepts multipart/form-data with "file" parameter.
 */
export async function uploadObservation(
  file: File,
  onProgress?: (percent: number) => void
): Promise<ObservationRecordResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiClient.post<ObservationRecordResponse>('/observations', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percent);
      }
    },
  });
  return response.data;
}

/**
 * 3. List Ingested Observations (GET /api/observations)
 */
export async function getObservations(params?: {
  limit?: number;
  offset?: number;
}): Promise<ObservationListResponse> {
  const response = await apiClient.get<ObservationListResponse>('/observations', { params });
  return response.data;
}

/**
 * 4. Get Observation Details (GET /api/observations/{id})
 */
export async function getObservation(id: string): Promise<ObservationRecordResponse> {
  const response = await apiClient.get<ObservationRecordResponse>(
    `/observations/${encodeURIComponent(id)}`
  );
  return response.data;
}

/**
 * 5. Bounded Canonical Spectral Slice (GET /api/observations/{id}/slice)
 */
export async function getObservationSlice(
  observationId: string,
  params?: {
    time_start?: number;
    time_stop?: number;
    frequency_start?: number;
    frequency_stop?: number;
  }
): Promise<SpectralSliceResponse> {
  const response = await apiClient.get<SpectralSliceResponse>(
    `/observations/${encodeURIComponent(observationId)}/slice`,
    { params }
  );
  return response.data;
}

/**
 * 6. Signal Preprocessing & RFI Quality Assessment (POST /api/observations/{id}/process)
 */
export async function processObservation(
  observationId: string,
  payload?: {
    time_start?: number;
    time_stop?: number;
    frequency_start?: number;
    frequency_stop?: number;
    config?: Record<string, unknown>;
  }
): Promise<ProcessedObservationResponse> {
  const response = await apiClient.post<ProcessedObservationResponse>(
    `/observations/${encodeURIComponent(observationId)}/process`,
    payload ?? {}
  );
  return response.data;
}

/**
 * 7. Scientific Anomaly Detection (POST /api/observations/{id}/detect)
 */
export async function detectAnomalies(
  observationId: string,
  payload?: {
    time_start?: number;
    time_stop?: number;
    frequency_start?: number;
    frequency_stop?: number;
    config?: Record<string, unknown>;
  }
): Promise<DetectionResponse> {
  const response = await apiClient.post<DetectionResponse>(
    `/observations/${encodeURIComponent(observationId)}/detect`,
    payload ?? {}
  );
  return response.data;
}

/**
 * 8. Doppler Drift & Temporal Analysis (POST /api/observations/{id}/analyze-drift)
 */
export async function analyzeDrift(
  observationId: string,
  payload?: {
    time_start?: number;
    time_stop?: number;
    frequency_start?: number;
    frequency_stop?: number;
    config?: Record<string, unknown>;
    historical_events?: unknown[];
  }
): Promise<AnalysisResponse> {
  const response = await apiClient.post<AnalysisResponse>(
    `/observations/${encodeURIComponent(observationId)}/analyze-drift`,
    payload ?? {}
  );
  return response.data;
}

/**
 * 9. List Candidates (GET /api/candidates)
 */
export async function getCandidates(params?: {
  observation_id?: string;
  status?: CandidateStatus;
  min_score?: number;
  max_score?: number;
  limit?: number;
  offset?: number;
}): Promise<CandidateListResponse> {
  const response = await apiClient.get<CandidateListResponse>('/candidates', { params });
  return response.data;
}

/**
 * 10. Get Candidate Details (GET /api/candidates/{id})
 */
export async function getCandidate(candidateId: string): Promise<CandidateResponse> {
  const response = await apiClient.get<CandidateResponse>(
    `/candidates/${encodeURIComponent(candidateId)}`
  );
  return response.data;
}

/**
 * 11. Create / Group Candidate (POST /api/candidates)
 */
export async function createCandidate(payload: CreateCandidateRequest): Promise<CandidateResponse> {
  const response = await apiClient.post<CandidateResponse>('/candidates', payload);
  return response.data;
}

/**
 * 12. Assess Candidate (POST /api/candidates/{id}/assess)
 */
export async function assessCandidate(
  candidateId: string,
  payload?: { scoring_config?: Record<string, unknown> }
): Promise<CandidateAssessment> {
  const response = await apiClient.post<CandidateAssessment>(
    `/candidates/${encodeURIComponent(candidateId)}/assess`,
    payload ?? {}
  );
  return response.data;
}

/**
 * 13. Get Candidate Dossier Snapshot (GET /api/candidates/{id}/dossier)
 */
export async function getCandidateDossier(
  candidateId: string,
  version?: number
): Promise<CandidateDossier> {
  const response = await apiClient.get<CandidateDossier>(
    `/candidates/${encodeURIComponent(candidateId)}/dossier`,
    { params: version ? { version } : undefined }
  );
  return response.data;
}

/**
 * 14. Get PDF Dossier URL (for direct download links or embeds)
 */
export function getCandidatePdfUrl(candidateId: string, version?: number): string {
  const base = `${API_BASE_URL}/candidates/${encodeURIComponent(candidateId)}/dossier.pdf`;
  return version ? `${base}?version=${version}` : base;
}

/**
 * 15. Download PDF Dossier Blob
 */
export async function downloadCandidatePdf(candidateId: string, version?: number): Promise<Blob> {
  const response = await apiClient.get(
    `/candidates/${encodeURIComponent(candidateId)}/dossier.pdf`,
    {
      params: version ? { version } : undefined,
      responseType: 'blob',
    }
  );
  return response.data as Blob;
}

/**
 * 16. Review Candidate Lifecycle Action (POST /api/candidates/{id}/review)
 */
export async function reviewCandidate(
  candidateId: string,
  payload: ReviewCandidateRequest
): Promise<ReviewCandidateResponse> {
  const response = await apiClient.post<ReviewCandidateResponse>(
    `/candidates/${encodeURIComponent(candidateId)}/review`,
    payload
  );
  return response.data;
}

/**
 * Generic REST helpers
 */
export async function getTelemetry<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const response = await apiClient.get<T>(url, config);
  return response.data;
}

export async function postTelemetry<T, B = unknown>(
  url: string,
  data?: B,
  config?: AxiosRequestConfig
): Promise<T> {
  const response = await apiClient.post<T>(url, data, config);
  return response.data;
}

/**
 * Consolidated AETHON API client object
 */
export const api = {
  client: apiClient,
  getBaseUrl,
  isDemoMode,
  normalizeApiError,
  getHealth,
  getObservations,
  getObservation,
  getObservationSlice,
  uploadObservation,
  processObservation,
  detectAnomalies,
  analyzeDrift,
  getCandidates,
  getCandidate,
  createCandidate,
  assessCandidate,
  getCandidateDossier,
  getCandidatePdfUrl,
  downloadCandidatePdf,
  reviewCandidate,
  getTelemetry,
  postTelemetry,
};

export default api;
