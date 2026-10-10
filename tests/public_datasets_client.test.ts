import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PublicDatasetStatusResponseSchema,
  PublicDatasetItemSchema,
  PublicDatasetQueryResponseSchema,
  PublicDatasetImportRequestSchema,
  PublicDatasetImportResponseSchema,
  type PublicDatasetItem,
  type SpectralSliceResponse,
} from '../src/types/schemas.ts';

test('PublicDatasetStatusResponseSchema parses valid provider status payload', () => {
  const payload = {
    configured: true,
    archive_url: 'https://seti.berkeley.edu/opendata',
    available: true,
    max_import_bytes: 83886080,
    supported_file_types: ['filterbank', '.fil', 'FITS', '.fits'],
    message: null,
  };

  const parsed = PublicDatasetStatusResponseSchema.parse(payload);
  assert.equal(parsed.configured, true);
  assert.equal(parsed.archive_url, 'https://seti.berkeley.edu/opendata');
  assert.equal(parsed.available, true);
  assert.equal(parsed.max_import_bytes, 83886080);
  assert.equal(parsed.supported_file_types.length, 4);
});

test('PublicDatasetItemSchema validates compatible and incompatible items accurately', () => {
  // Compatible Filterbank
  const itemCompatible: PublicDatasetItem = {
    id: 'bl-fil-001',
    target: 'VOYAGER1',
    telescope: 'GBT',
    utc: '2020-03-01T12:00:00Z',
    mjd: 58909.5,
    ra_deg: 257.0,
    dec_deg: 12.0,
    center_freq_mhz: 8419.29,
    file_type: 'filterbank',
    size_bytes: 45000000,
    quality: 'A',
    md5sum: 'd41d8cd98f00b204e9800998ecf8427e',
    url: 'https://seti.berkeley.edu/opendata/voyager1.fil',
    is_compatible: true,
    compatibility_reason: null,
    is_within_size_limit: true,
    size_reason: null,
  };

  const parsed1 = PublicDatasetItemSchema.parse(itemCompatible);
  assert.equal(parsed1.is_compatible, true);
  assert.equal(parsed1.is_within_size_limit, true);

  // Incompatible HDF5
  const itemIncompatible: PublicDatasetItem = {
    id: 'bl-h5-002',
    target: 'VOYAGER1',
    telescope: 'GBT',
    utc: '2020-03-01T12:00:00Z',
    mjd: 58909.5,
    ra_deg: 257.0,
    dec_deg: 12.0,
    center_freq_mhz: 8419.29,
    file_type: 'HDF5',
    size_bytes: 52000000,
    quality: 'A',
    md5sum: null,
    url: 'https://seti.berkeley.edu/opendata/voyager1.h5',
    is_compatible: false,
    compatibility_reason:
      'Unsupported format: HDF5. AETHON currently ingests Filterbank (.fil) and FITS (.fits).',
    is_within_size_limit: true,
    size_reason: null,
  };

  const parsed2 = PublicDatasetItemSchema.parse(itemIncompatible);
  assert.equal(parsed2.is_compatible, false);
  assert.ok(parsed2.compatibility_reason?.includes('Unsupported format: HDF5'));

  // Oversized item (> 80 MiB)
  const itemOversized: PublicDatasetItem = {
    id: 'bl-fil-003',
    target: '3C123',
    telescope: 'Parkes',
    utc: '2021-05-10T14:30:00Z',
    mjd: 59344.6,
    ra_deg: 69.2,
    dec_deg: 29.6,
    center_freq_mhz: 1420.0,
    file_type: 'filterbank',
    size_bytes: 120000000, // 120 MB > 80 MiB ceiling
    quality: 'B',
    md5sum: 'c123456789abcdef0123456789abcdef',
    url: 'https://seti.berkeley.edu/opendata/3c123_large.fil',
    is_compatible: true,
    compatibility_reason: null,
    is_within_size_limit: false,
    size_reason: 'File size exceeds maximum import ceiling of 80 MiB.',
  };

  const parsed3 = PublicDatasetItemSchema.parse(itemOversized);
  assert.equal(parsed3.is_within_size_limit, false);
  assert.ok(parsed3.size_reason?.includes('80 MiB'));
});

test('PublicDatasetQueryResponseSchema parses paginated archive responses without synthetic fabrication', () => {
  const queryResponse = {
    items: [],
    total: 0,
    limit: 25,
    offset: 0,
    has_more: false,
    provider_status: 'empty',
    cached: false,
    query_target: 'UNKNOWN_TARGET_XYZ',
  };

  const parsed = PublicDatasetQueryResponseSchema.parse(queryResponse);
  assert.equal(parsed.items.length, 0);
  assert.equal(parsed.total, 0);
  assert.equal(parsed.provider_status, 'empty');
});

test('PublicDatasetImport schemas validate import request and response payloads', () => {
  const req = {
    url: 'https://seti.berkeley.edu/opendata/sample.fil',
    target: 'VOYAGER1',
    telescope: 'GBT',
    expected_md5sum: 'd41d8cd98f00b204e9800998ecf8427e',
    expected_size_bytes: 45000000,
  };

  const parsedReq = PublicDatasetImportRequestSchema.parse(req);
  assert.equal(parsedReq.url, 'https://seti.berkeley.edu/opendata/sample.fil');
  assert.equal(parsedReq.target, 'VOYAGER1');

  const resp = {
    observation: {
      id: 'OBS_20261011_VOYAGER1',
      original_filename: 'sample.fil',
      format: 'fil',
      file_size_bytes: 45000000,
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      ingested_at: '2026-10-11T00:00:00Z',
      status: 'ingested',
      metadata: {
        channel_count: 128,
        frequency_reference_mhz: 8419.29,
        channel_spacing_mhz: 0.002,
        frequency_unit: 'MHz',
        frequency_min_mhz: 8419.0,
        frequency_max_mhz: 8419.5,
        bandwidth_mhz: 0.5,
        time_sample_count: 64,
        time_step_seconds: 1.0,
        time_unit: 's',
        start_mjd: 58909.5,
        telescope_name: 'GBT',
        source_name: 'VOYAGER1',
        raw_header: {},
      },
      provenance: {
        parser_name: 'FilterbankAdapter',
        parser_version: '1.0.0',
        parsed_at: '2026-10-11T00:00:00Z',
        source_format: 'fil',
      },
      warnings: [],
    },
    import_source_url: 'https://seti.berkeley.edu/opendata/sample.fil',
    bytes_downloaded: 45000000,
    is_duplicate: false,
    duration_seconds: 3.2,
    message: 'Observation successfully imported and ingested into AETHON repository.',
  };

  const parsedResp = PublicDatasetImportResponseSchema.parse(resp);
  assert.equal(parsedResp.observation.id, 'OBS_20261011_VOYAGER1');
  assert.equal(parsedResp.bytes_downloaded, 45000000);
  assert.equal(parsedResp.is_duplicate, false);
});

test('Spectral mathematical derivation correctly computes 1D frequency and time profiles preserving missing values', () => {
  // Matrix: 3 time steps, 4 frequency channels
  // t=0: [10, 20, NaN, 40]
  // t=1: [12, null, 30, 42]
  // t=2: [14, 24, 32, 44]
  const mockSlice: SpectralSliceResponse = {
    observation_id: 'OBS_TEST_001',
    slice_bounds: {
      time_start: 0,
      time_stop: 3,
      frequency_start: 0,
      frequency_stop: 4,
    },
    time_coordinates_seconds: [0.0, 1.0, 2.0],
    frequency_coordinates_hz: [1420000000, 1420100000, 1420200000, 1420300000],
    data_quality: {
      total_samples: 12,
      non_finite_sample_count: 2,
      has_non_finite_samples: true,
      non_finite_fraction: 2 / 12,
    },
    sample_value_semantics: 'relative_linear_power',
    sample_value_unit: 'counts',
    values: [
      [10, 20, Number.NaN, 40],
      [12, null, 30, 42],
      [14, 24, 32, 44],
    ],
  };

  // 1. Frequency Profile Calculation:
  // Channel 0: [10, 12, 14] -> mean = 12
  // Channel 1: [20, null, 24] -> mean = (20 + 24) / 2 = 22 (skips null)
  // Channel 2: [NaN, 30, 32] -> mean = (30 + 32) / 2 = 31 (skips NaN)
  // Channel 3: [40, 42, 44] -> mean = 42
  const n_time = mockSlice.values.length;
  const n_freq = mockSlice.values[0]!.length;
  const freqMeans: (number | null)[] = [];

  for (let f = 0; f < n_freq; f++) {
    let sum = 0;
    let count = 0;
    for (let t = 0; t < n_time; t++) {
      const v = mockSlice.values[t]?.[f];
      if (typeof v === 'number' && !Number.isNaN(v) && Number.isFinite(v)) {
        sum += v;
        count++;
      }
    }
    freqMeans.push(count > 0 ? sum / count : null);
  }

  assert.equal(freqMeans[0], 12);
  assert.equal(freqMeans[1], 22);
  assert.equal(freqMeans[2], 31);
  assert.equal(freqMeans[3], 42);

  // 2. Time Profile Calculation:
  // Time 0: [10, 20, NaN, 40] -> mean = (10 + 20 + 40) / 3 = 70 / 3 ≈ 23.333
  // Time 1: [12, null, 30, 42] -> mean = (12 + 30 + 42) / 3 = 84 / 3 = 28
  // Time 2: [14, 24, 32, 44] -> mean = (14 + 24 + 32 + 44) / 4 = 114 / 4 = 28.5
  const timeMeans: (number | null)[] = [];
  for (let t = 0; t < n_time; t++) {
    let sum = 0;
    let count = 0;
    const row = mockSlice.values[t]!;
    for (let f = 0; f < n_freq; f++) {
      const v = row[f];
      if (typeof v === 'number' && !Number.isNaN(v) && Number.isFinite(v)) {
        sum += v;
        count++;
      }
    }
    timeMeans.push(count > 0 ? sum / count : null);
  }

  assert.ok(Math.abs((timeMeans[0] ?? 0) - 70 / 3) < 1e-4);
  assert.equal(timeMeans[1], 28);
  assert.equal(timeMeans[2], 28.5);
});
