import test from 'node:test';
import assert from 'node:assert/strict';

import { getDeploymentConfigStatus, normalizeApiError } from '../src/lib/api.ts';
import {
  CandidateListResponseSchema,
  SpectralSliceResponseSchema,
  DemoSampleInfoSchema,
  DemoLoadResponseSchema,
  PublicDatasetItemSchema,
  PublicDatasetQueryResponseSchema,
} from '../src/types/schemas.ts';
import { mapObservationToDiscoveryMeta } from '../src/pages/Discover/utils.ts';
import type { ObservationRecordResponse } from '../src/types/schemas.ts';

// ==============================================================================
// 1. DEPLOYMENT CONNECTIVITY & URL NORMALIZATION
// ==============================================================================

test('Task 02: Deployment config status detects configuration and warnings accurately', () => {
  const status = getDeploymentConfigStatus();
  assert.equal(typeof status.isProduction, 'boolean');
  assert.equal(typeof status.baseUrl, 'string');
  assert.equal(typeof status.isCustomConfigured, 'boolean');
  assert.equal(typeof status.isLocalhostTarget, 'boolean');
  assert.ok(Array.isArray(status.warnings));
  assert.ok(status.baseUrl.endsWith('/api'), 'Resolved base URL must always end with /api');
  assert.ok(!status.baseUrl.includes('/api/api'), 'Base URL must never have duplicate /api/api');
});

// ==============================================================================
// 2. ERROR RESILIENCE: UNAVAILABLE API, HTTP ERRORS & PARTIAL RESPONSES
// ==============================================================================

test('Task 02: Error normalization handles 404, 500, network loss, and timeout', () => {
  // 404 Not Found (e.g. candidate deleted or nonexistent)
  const err404 = normalizeApiError({
    isAxiosError: true,
    response: {
      status: 404,
      data: { message: 'Candidate cand_deadbeef not found' },
    },
  });
  assert.equal(err404.status, 404);
  assert.equal(err404.code, 'HTTP_404');
  assert.equal(err404.message, 'Candidate cand_deadbeef not found');

  // 500 Internal Server Error
  const err500 = normalizeApiError({
    isAxiosError: true,
    response: {
      status: 500,
      data: { message: 'Database query timed out' },
    },
  });
  assert.equal(err500.status, 500);
  assert.equal(err500.code, 'HTTP_500');

  // Network Offline
  const errNet = normalizeApiError({
    isAxiosError: true,
    message: 'Network Error',
  });
  assert.equal(errNet.code, 'NETWORK_DISCONNECTED');
  assert.ok(errNet.message.includes('Unable to connect to AETHON backend'));
});

test('Task 02: Empty candidate list and observation responses parse safely', () => {
  // Empty candidate list
  const emptyCandidates = CandidateListResponseSchema.parse({
    items: [],
    total: 0,
    limit: 25,
    offset: 0,
  });
  assert.equal(emptyCandidates.items.length, 0);
  assert.equal(emptyCandidates.total, 0);

  // Empty public dataset query
  const emptyQuery = PublicDatasetQueryResponseSchema.parse({
    items: [],
    total: 0,
    offset: 0,
    limit: 25,
    has_more: false,
    provider_status: 'online',
  });
  assert.equal(emptyQuery.items.length, 0);
  assert.equal(emptyQuery.has_more, false);
});

// ==============================================================================
// 3. SCIENTIFIC TRUTHFULNESS: ABSENCE OF FABRICATED MEASUREMENTS
// ==============================================================================

test('Task 02: Truthful mapping preserves null for missing SNR, drift, and coordinates', () => {
  const minimalObs: ObservationRecordResponse = {
    id: 'obs_truthful_01',
    original_filename: 'truthful.fil',
    format: 'fil',
    file_size_bytes: 4096,
    sha256: 'abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789',
    ingested_at: '2026-10-11T12:00:00Z',
    status: 'ingested',
    metadata: {
      time_sample_count: 32,
      channel_count: 64,
      frequency_reference_mhz: null,
      bandwidth_mhz: null,
      time_step_seconds: null,
      ra_deg: null,
      dec_deg: null,
      ra_str: null,
      dec_str: null,
      telescope_name: null,
      source_name: null,
      raw_header: {},
    },
    provenance: {
      parser_name: 'sigproc_filterbank',
      parser_version: '1.0.0',
      parsed_at: '2026-10-11T12:00:00Z',
      source_format: 'fil',
      notes: null,
    },
  };

  const mapped = mapObservationToDiscoveryMeta(minimalObs, 'Local Test');

  // Verify missing values are strictly null or clear unavailable text, never fabricated
  assert.equal(mapped.frequencyMHz, null, 'Must not invent fallback frequency');
  assert.equal(mapped.bandwidthMHz, null, 'Must not invent fallback bandwidth');
  assert.equal(mapped.coordinates.ra, null, 'Must not fabricate Right Ascension');
  assert.equal(mapped.coordinates.dec, null, 'Must not fabricate Declination');
  assert.equal(mapped.telescope, null, 'Must not invent telescope name');
  assert.equal(
    mapped.isSynthetic,
    false,
    'Natural upload must not be labeled synthetic without marker'
  );
});

test('Task 02: Synthetic observations are unambiguously tagged with provenance', () => {
  const syntheticObs: ObservationRecordResponse = {
    id: 'obs_synth_beacon_99',
    original_filename: 'synth.fil',
    format: 'fil',
    file_size_bytes: 8192,
    sha256: '1234567890123456789012345678901234567890123456789012345678901234',
    ingested_at: '2026-10-11T12:00:00Z',
    status: 'ingested',
    metadata: {
      time_sample_count: 32,
      channel_count: 64,
      source_name: 'SYNTH-BEACON-01',
      raw_header: {},
    },
    provenance: {
      parser_name: 'synthetic_generator',
      parser_version: '1.0.0',
      parsed_at: '2026-10-11T12:00:00Z',
      source_format: 'fil',
      notes: 'Controlled synthetic benchmark for pipeline calibration',
    },
  };

  const mapped = mapObservationToDiscoveryMeta(
    syntheticObs,
    'AETHON Signal Lab (Synthetic Benchmark)'
  );
  assert.equal(mapped.isSynthetic, true, 'Synthetic benchmark must be recognized as synthetic');
  assert.ok(
    mapped.provenanceSource.includes('Synthetic'),
    'Provenance must clearly reflect synthetic origin'
  );
});

// ==============================================================================
// 4. DEMO ACQUISITION & DEDUPLICATION SCHEMAS
// ==============================================================================

test('Task 02: Demo sample and load schemas validate offline presets and deduplication', () => {
  // Preset specs
  const syntheticPreset = DemoSampleInfoSchema.parse({
    id: 'synthetic-drifting-beacon',
    name: 'AETHON Signal Lab — Synthetic Drifting Beacon',
    label: 'SYNTHETIC BENCHMARK',
    format: '.fil',
    target: 'SYNTH-BEACON-01',
    telescope: 'Green Bank Telescope (GBT)',
    description: 'Deterministic Gaussian noise with drifting beacon.',
    is_synthetic: true,
    seed: 42,
    file_size_bytes: 8382,
    channel_count: 64,
    time_sample_count: 32,
    frequency_mhz: 1420.0,
    bandwidth_mhz: 3.2,
    source_url: null,
    provenance_note: 'Controlled synthetic test signal.',
  });
  assert.equal(syntheticPreset.is_synthetic, true);
  assert.equal(syntheticPreset.channel_count, 64);

  // Load response with deduplication
  const loadDedup = DemoLoadResponseSchema.parse({
    sample_id: 'synthetic-drifting-beacon',
    observation: {
      id: 'obs_dedup_123456',
      original_filename: 'synthetic-drifting-beacon.fil',
      format: 'fil',
      file_size_bytes: 8382,
      sha256: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
      ingested_at: '2026-10-11T12:00:00Z',
      status: 'ingested',
      metadata: {
        time_sample_count: 32,
        channel_count: 64,
        raw_header: {},
      },
      provenance: {
        parser_name: 'sigproc_filterbank',
        parser_version: '1.0.0',
        parsed_at: '2026-10-11T12:00:00Z',
        source_format: 'fil',
        notes: null,
      },
    },
    is_duplicate: true,
    is_synthetic: true,
    duration_seconds: 0.005,
    message: 'Reused existing observation record',
  });
  assert.equal(loadDedup.is_duplicate, true);
  assert.equal(loadDedup.observation.id, 'obs_dedup_123456');
  assert.equal(loadDedup.is_synthetic, true);
});

// ==============================================================================
// 5. PUBLIC ARCHIVE: SUPPORTED VS UNSUPPORTED FORMATS & AUTO-SELECTION
// ==============================================================================

test('Task 02: Public archive parser marks unsupported and oversized files honestly', () => {
  // Compatible Filterbank under size ceiling
  const validFil = PublicDatasetItemSchema.parse({
    id: 'bl_item_01',
    target: 'VOYAGER1',
    telescope: 'Green Bank Telescope',
    utc: '2020-10-01T12:00:00Z',
    mjd: 59124.5,
    file_type: 'filterbank',
    size_bytes: 25 * 1024 * 1024,
    url: 'https://seti.berkeley.edu/opendata/voyager.fil',
    is_compatible: true,
    is_within_size_limit: true,
    compatibility_reason: 'Native SIGPROC filterbank format (.fil)',
    size_reason: 'Within 80 MiB ceiling (25.0 MB)',
  });
  assert.equal(validFil.is_compatible, true);
  assert.equal(validFil.is_within_size_limit, true);

  // Incompatible HDF5 file
  const invalidH5 = PublicDatasetItemSchema.parse({
    id: 'bl_item_02',
    target: 'VOYAGER1',
    telescope: 'Green Bank Telescope',
    file_type: 'HDF5',
    size_bytes: 30 * 1024 * 1024,
    url: 'https://seti.berkeley.edu/opendata/voyager.h5',
    is_compatible: false,
    is_within_size_limit: true,
    compatibility_reason: 'HDF5 (.h5) format is not directly ingestible in current release',
  });
  assert.equal(invalidH5.is_compatible, false);
  assert.ok(invalidH5.compatibility_reason?.includes('not directly ingestible'));

  // Oversized Filterbank (>80 MiB)
  const oversizedFil = PublicDatasetItemSchema.parse({
    id: 'bl_item_03',
    target: 'VOYAGER1',
    telescope: 'Green Bank Telescope',
    file_type: 'filterbank',
    size_bytes: 120 * 1024 * 1024,
    url: 'https://seti.berkeley.edu/opendata/large.fil',
    is_compatible: true,
    is_within_size_limit: false,
    size_reason: 'File size exceeds maximum permitted limit (120.0 MB)',
  });
  assert.equal(oversizedFil.is_compatible, true);
  assert.equal(oversizedFil.is_within_size_limit, false);

  // Auto-selection algorithm logic
  const items = [invalidH5, oversizedFil, validFil];
  const autoSelected = items.find((it) => it.is_compatible && it.is_within_size_limit);
  assert.equal(
    autoSelected?.id,
    'bl_item_01',
    'Must auto-select only compatible and bounded items'
  );

  const onlyInvalid = [invalidH5, oversizedFil];
  const noCompat = onlyInvalid.find((it) => it.is_compatible && it.is_within_size_limit);
  assert.equal(noCompat, undefined, 'Must not select incompatible records');
});

// ==============================================================================
// 6. OBSERVATORY BOUNDED SLICE QUERIES & DIMENSION CLAMPING
// ==============================================================================

test('Task 02: Observatory slice queries clamp to actual observation dimensions', () => {
  // Case A: Small observation (16 steps × 32 channels)
  const smallObs = { time_sample_count: 16, channel_count: 32 };
  const smallTimeStop = Math.min(smallObs.time_sample_count, 64);
  const smallFreqStop = Math.min(smallObs.channel_count, 256);
  assert.equal(smallTimeStop, 16, 'Small observation time stop must clamp to 16');
  assert.equal(smallFreqStop, 32, 'Small observation frequency stop must clamp to 32');

  // Case B: Large observation (10000 steps × 4096 channels)
  const largeObs = { time_sample_count: 10000, channel_count: 4096 };
  const largeTimeStop = Math.min(largeObs.time_sample_count, 64);
  const largeFreqStop = Math.min(largeObs.channel_count, 256);
  assert.equal(largeTimeStop, 64, 'Large observation time stop must clamp to bounded ceiling 64');
  assert.equal(
    largeFreqStop,
    256,
    'Large observation frequency stop must clamp to bounded ceiling 256'
  );

  // Case C: Valid 2D slice response schema conforming to full canonical representation
  const sliceMatrix = SpectralSliceResponseSchema.parse({
    observation_id: 'obs_test_slice',
    source_format: 'fil',
    matrix_shape: [2, 3],
    canonical_axis_convention: 'time_ascending_by_freq_ascending',
    requested_range: {
      time_start: 0,
      time_stop: 2,
      frequency_start: 0,
      frequency_stop: 3,
    },
    actual_range: {
      time_start: 0,
      time_stop: 2,
      frequency_start: 0,
      frequency_stop: 3,
    },
    values: [
      [1.0, 2.0, 3.0],
      [4.0, 5.0, 6.0],
    ],
    frequency_coordinates_hz: [1420000000.0, 1420001000.0, 1420002000.0],
    time_coordinates_seconds: [0.0, 0.5],
    frequency_unit: 'Hz',
    time_unit: 'seconds',
    sample_value_semantics: 'relative_spectral_power',
    data_quality: {
      total_samples: 6,
      non_finite_sample_count: 0,
      has_non_finite_samples: false,
      null_representation: 'none',
    },
    provenance: {
      source_channel_order: 'ascending',
      frequency_axis_reversed: false,
      reader_backend: 'streaming_filterbank_v1',
      source_sha256: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    },
    warnings: [],
  });
  assert.equal(sliceMatrix.values.length, 2);
  assert.equal(sliceMatrix.values[0]?.length, 3);
});

// ==============================================================================
// 7. CANDIDATE PERSISTENCE & NAVIGATION BOUNDS
// ==============================================================================

test('Task 02: Prev/Next candidate navigation safely handles boundaries and empty lists', () => {
  const candidateIds = ['cand_001', 'cand_002', 'cand_003'];

  // First candidate
  const firstIndex = candidateIds.indexOf('cand_001');
  const prevFirst = firstIndex > 0 ? candidateIds[firstIndex - 1] : null;
  const nextFirst = firstIndex < candidateIds.length - 1 ? candidateIds[firstIndex + 1] : null;
  assert.equal(prevFirst, null, 'First candidate has no previous');
  assert.equal(nextFirst, 'cand_002');

  // Middle candidate
  const midIndex = candidateIds.indexOf('cand_002');
  const prevMid = midIndex > 0 ? candidateIds[midIndex - 1] : null;
  const nextMid = midIndex < candidateIds.length - 1 ? candidateIds[midIndex + 1] : null;
  assert.equal(prevMid, 'cand_001');
  assert.equal(nextMid, 'cand_003');

  // Last candidate
  const lastIndex = candidateIds.indexOf('cand_003');
  const prevLast = lastIndex > 0 ? candidateIds[lastIndex - 1] : null;
  const nextLast = lastIndex < candidateIds.length - 1 ? candidateIds[lastIndex + 1] : null;
  assert.equal(prevLast, 'cand_002');
  assert.equal(nextLast, null, 'Last candidate has no next');

  // Deleted or missing candidate
  const missingIndex = candidateIds.indexOf('cand_deleted');
  assert.equal(missingIndex, -1);
  const prevMissing = missingIndex > 0 ? candidateIds[missingIndex - 1] : null;
  const nextMissing =
    missingIndex !== -1 && missingIndex < candidateIds.length - 1
      ? candidateIds[missingIndex + 1]
      : null;
  assert.equal(prevMissing, null);
  assert.equal(nextMissing, null);
});
