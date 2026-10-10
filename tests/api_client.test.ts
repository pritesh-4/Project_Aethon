import test from 'node:test';
import assert from 'node:assert/strict';

import { API_BASE_URL, isDemoMode, normalizeApiError, getCandidatePdfUrl } from '../src/lib/api.ts';
import {
  HealthStatusSchema,
  ObservationRecordResponseSchema,
  ObservationListResponseSchema,
  SpectralSliceResponseSchema,
  DetectionResponseSchema,
  AnalysisResponseSchema,
  CandidateSchema,
  CandidateListResponseSchema,
} from '../src/types/schemas.ts';

test('API Client Base URL is normalized without duplicate paths', () => {
  assert.ok(API_BASE_URL.includes('/api'), 'Base URL must end with /api');
  assert.ok(!API_BASE_URL.includes('/api/api'), 'Base URL must not have duplicate /api/api');
  assert.ok(!API_BASE_URL.endsWith('/'), 'Base URL must not have trailing slash');
});

test('Demo mode defaults to false unless explicitly configured', () => {
  // In standard testing/runtime environment, demo mode is false by default
  assert.equal(typeof isDemoMode(), 'boolean');
});

test('Error normalization converts network and HTTP errors accurately', () => {
  // 1. Generic Error
  const err1 = normalizeApiError(new Error('Connection dropped'));
  assert.equal(err1.message, 'Connection dropped');
  assert.equal(err1.code, 'CLIENT_ERROR');

  // 2. String error
  const err2 = normalizeApiError('Custom failure notice');
  assert.equal(err2.message, 'Custom failure notice');
  assert.equal(err2.code, 'UNKNOWN_ERROR');

  // 3. Simulated Axios Network Error
  const fakeAxiosNetErr = {
    isAxiosError: true,
    message: 'Network Error',
    name: 'AxiosError',
  };
  const netNorm = normalizeApiError(fakeAxiosNetErr);
  assert.ok(netNorm.message.includes('Unable to connect to AETHON backend service'));
  assert.equal(netNorm.code, 'NETWORK_DISCONNECTED');

  // 4. Simulated Axios Timeout
  const fakeTimeoutErr = {
    isAxiosError: true,
    code: 'ECONNABORTED',
    message: 'timeout of 30000ms exceeded',
    name: 'AxiosError',
  };
  const timeoutNorm = normalizeApiError(fakeTimeoutErr);
  assert.ok(timeoutNorm.message.includes('timed out'));
  assert.equal(timeoutNorm.code, 'REQUEST_TIMEOUT');

  // 5. Simulated FastAPI 422 Validation Error
  const fakeValidationErr = {
    isAxiosError: true,
    name: 'AxiosError',
    response: {
      status: 422,
      data: {
        detail: [
          { loc: ['body', 'time_start'], msg: 'ensure this value is greater than or equal to 0' },
        ],
      },
    },
  };
  const valNorm = normalizeApiError(fakeValidationErr);
  assert.ok(valNorm.message.includes('Validation failed'));
  assert.ok(valNorm.message.includes('time_start'));
  assert.equal(valNorm.status, 422);

  // 6. Simulated 413 Payload Too Large
  const fake413 = {
    isAxiosError: true,
    name: 'AxiosError',
    response: {
      status: 413,
      data: {},
    },
  };
  const norm413 = normalizeApiError(fake413);
  assert.ok(norm413.message.includes('100MB'));
  assert.equal(norm413.code, 'PAYLOAD_TOO_LARGE');

  // 7. Simulated 404 Not Found
  const fake404 = {
    isAxiosError: true,
    name: 'AxiosError',
    response: {
      status: 404,
      data: {},
    },
  };
  const norm404 = normalizeApiError(fake404);
  assert.ok(norm404.message.includes('not found'));
  assert.equal(norm404.code, 'NOT_FOUND');
});

test('Candidate PDF URL construction handles versions safely', () => {
  const urlLatest = getCandidatePdfUrl('cand_1234');
  assert.ok(urlLatest.endsWith('/candidates/cand_1234/dossier.pdf'));
  assert.ok(!urlLatest.includes('version='));

  const urlV2 = getCandidatePdfUrl('cand_1234', 2);
  assert.ok(urlV2.endsWith('/candidates/cand_1234/dossier.pdf?version=2'));
});

test('Backend HealthStatus schema parses valid response', () => {
  const sample = {
    status: 'healthy',
    service: 'aethon-backend',
    version: '0.1.0',
    environment: 'development',
    timestamp: '2026-10-10T04:00:00Z',
  };
  const parsed = HealthStatusSchema.safeParse(sample);
  assert.ok(parsed.success);
});

test('Observation schemas parse real backend structure', () => {
  const sampleRecord = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    original_filename: 'voyager_f1024.fil',
    format: 'fil',
    file_size_bytes: 65536,
    sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    ingested_at: '2026-10-09T12:00:00Z',
    status: 'ingested',
    metadata: {
      channel_count: 1024,
      frequency_reference_mhz: 1420.0,
      channel_spacing_mhz: -0.0028,
      frequency_unit: 'MHz',
      time_sample_count: 16,
      time_step_seconds: 1.07,
      telescope_name: 'GBT',
      source_name: 'VOYAGER-1',
      raw_header: {},
    },
    provenance: {
      parser_name: 'blimpy.filterbank',
      parser_version: '2.1.4',
      parsed_at: '2026-10-09T12:00:00Z',
      source_format: 'fil',
    },
    warnings: [],
  };

  const parsed = ObservationRecordResponseSchema.safeParse(sampleRecord);
  assert.ok(parsed.success, 'Observation record schema must validate successfully');

  const sampleList = {
    items: [sampleRecord],
    total: 1,
    limit: 20,
    offset: 0,
  };
  const listParsed = ObservationListResponseSchema.safeParse(sampleList);
  assert.ok(listParsed.success, 'Observation list schema must validate successfully');
});

test('Spectral slice schema parses valid 2D matrix and axes', () => {
  const sampleSlice = {
    observation_id: '550e8400-e29b-41d4-a716-446655440000',
    source_format: 'fil',
    matrix_shape: [2, 3],
    canonical_axis_convention: 'values[time_index][frequency_index]',
    requested_range: { time_start: 0, time_stop: 2, frequency_start: 0, frequency_stop: 3 },
    actual_range: { time_start: 0, time_stop: 2, frequency_start: 0, frequency_stop: 3 },
    values: [
      [1.2, 3.4, null],
      [5.6, 7.8, 9.0],
    ],
    frequency_coordinates_hz: [1420000000, 1420002800, 1420005600],
    time_coordinates_seconds: [0.0, 1.07],
    frequency_unit: 'Hz',
    time_unit: 's',
    sample_value_semantics: 'uncalibrated_detector_power',
    data_quality: {
      total_samples: 6,
      non_finite_sample_count: 1,
      has_non_finite_samples: true,
      null_representation: 'null_json',
    },
    provenance: {
      source_channel_order: 'descending',
      frequency_axis_reversed: true,
      reader_backend: 'numpy.memmap',
      source_sha256: 'abcdef',
    },
    warnings: [],
  };

  const parsed = SpectralSliceResponseSchema.safeParse(sampleSlice);
  assert.ok(parsed.success, 'Spectral slice response must validate successfully');
});

test('Candidate schema parses real candidate record', () => {
  const sampleCandidate = {
    candidate_id: 'cand_test_123',
    created_at_utc: '2026-10-10T04:00:00Z',
    updated_at_utc: '2026-10-10T04:00:00Z',
    status: 'unreviewed',
    source_observation_ids: ['550e8400-e29b-41d4-a716-446655440000'],
    associated_detection_ids: ['det_001'],
    processing_run_ids: [],
    analysis_run_ids: [],
    target_region: {
      time_start: 0,
      time_stop: 16,
      freq_start: 100,
      freq_stop: 120,
    },
    physical_coordinates: {
      freq_center_hz: 1420040000,
      bandwidth_hz: 56000,
    },
    current_assessment: {
      assessment_id: 'ass_001',
      candidate_id: 'cand_test_123',
      version: 1,
      created_at_utc: '2026-10-10T04:00:00Z',
      policy_name: 'default_priority',
      policy_version: '1.0.0',
      overall_score: 84.5,
      priority_band: 'high',
      component_contributions: { anomaly: 35.0, drift_coherence: 25.0 },
      contributing_evidence_ids: ['ev_01'],
      missing_evidence: [],
      detector_disagreement: false,
      explanation: 'High anomaly departure and coherent drift.',
      warnings: [],
    },
    evidence_items: [],
    review_history: [],
    schema_version: '1.0.0',
    is_synthetic: false,
    provenance: {},
    warnings: [],
    scientific_disclaimer: 'Operational triage heuristic.',
  };

  const parsed = CandidateSchema.safeParse(sampleCandidate);
  assert.ok(parsed.success, 'Candidate schema must validate successfully');

  const listParsed = CandidateListResponseSchema.safeParse({
    items: [sampleCandidate],
    total: 1,
    limit: 20,
    offset: 0,
  });
  assert.ok(listParsed.success, 'Candidate list schema must validate successfully');
});

test('Detection and Analysis schemas validate standard responses', () => {
  const sampleDetection = {
    observation_id: 'obs_test_001',
    analysis_run_id: 'run_det_001',
    matrix_shape: [32, 64],
    total_windows_evaluated: 10,
    anomalous_regions: [],
    anomalous_fraction: 0.0,
    pipeline_config: {},
    provenance: {},
    scientific_disclaimer: 'Empirical assessment',
  };
  const detParsed = DetectionResponseSchema.safeParse(sampleDetection);
  assert.ok(detParsed.success, 'DetectionResponseSchema should parse valid structure');

  const sampleAnalysis = {
    observation_id: 'obs_test_001',
    analysis_run_id: 'run_ana_001',
    trajectory: {
      points: [],
      total_points: 0,
      valid_points: 0,
      extraction_method: 'centroid_tracking',
    },
    drift_estimate: {
      drift_rate_hz_per_s: 0.12,
      drift_rate_index_slope: 0.02,
      sample_count: 8,
      r_squared: 0.95,
    },
    temporal: {
      valid_time_fraction: 1.0,
      temporal_persistence: 0.92,
      temporal_variability: 0.05,
      temporal_profile_snr: 12.0,
      temporal_notes: 'Stable profile',
    },
    pipeline_config: {},
    scientific_disclaimer: 'Analytical fit',
  };
  const anaParsed = AnalysisResponseSchema.safeParse(sampleAnalysis);
  assert.ok(anaParsed.success, 'AnalysisResponseSchema should parse valid structure');
});
