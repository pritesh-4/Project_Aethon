import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios';

/**
 * Standard API error payload returned from the AETHON ML/backend service.
 */
export interface ApiErrorPayload {
  message: string;
  code?: string;
  status?: number;
  timestamp?: string;
  details?: Record<string, unknown>;
}

/**
 * Base URL resolved from Vite environment variables.
 * Falls back to localhost REST API endpoint for local development.
 */
const BASE_URL: string = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

/**
 * Primary Axios client configured for AETHON astronomical data exchange.
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000, // 30 seconds for heavy ML inference payloads
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Client-Agent': 'Aethon-Observatory-Frontend/1.0',
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // Allows injection of authentication tokens or telemetry trace headers
    const telemetryTraceId = `trace-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    config.headers.set('X-Telemetry-Trace', telemetryTraceId);
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError<ApiErrorPayload>) => {
    const errorDetails: ApiErrorPayload = {
      message:
        error.response?.data?.message ||
        error.message ||
        'Unknown network anomaly during telemetry request',
      code: error.code,
      status: error.response?.status,
      timestamp: new Date().toISOString(),
      details: error.response?.data?.details,
    };

    if (import.meta.env.DEV) {
      console.warn(`[AETHON API Anomaly] ${error.config?.url}:`, errorDetails);
    }

    return Promise.reject(errorDetails);
  }
);

/**
 * Strongly typed wrapper helpers for REST interactions
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

export async function uploadSignalFile<T>(
  url: string,
  formData: FormData,
  onProgress?: (percent: number) => void
): Promise<T> {
  const response = await apiClient.post<T>(url, formData, {
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
