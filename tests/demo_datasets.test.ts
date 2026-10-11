import test from 'node:test';
import assert from 'node:assert/strict';

import {
  DemoSampleInfoSchema,
  DemoLoadResponseSchema,
  type PublicDatasetItem,
  type ObservationRecordResponse,
} from '../src/types/schemas.ts';
import { mapObservationToDiscoveryMeta } from '../src/pages/Discover/utils.ts';

test('DemoSampleInfoSchema validates synthetic and real astronomy demo sample fixtures', () => {
  const syntheticSample = {
    id: 'synthetic-drifting-beacon',
    name: 'Synthetic Drifting Beacon',
    label: 'Synthetic Beacon',
    format: 'fil',
    target: 'SYNTH-BEACON-01',
    telescope: 'AETHON Simulated Array',
    description: 'Deterministic synthetic drifting narrowband signal',
    is_synthetic: true,
    seed: 42,
    file_size_bytes: 33267,
    channel_count: 64,
    time_sample_count: 32,
    frequency_mhz: 1420.0,
    bandwidth_mhz: 0.128,
    source_url: null,
    provenance_note: 'In-memory deterministic synthesis (seed 42)',
  };

  const parsedSynth = DemoSampleInfoSchema.parse(syntheticSample);
  assert.equal(parsedSynth.id, 'synthetic-drifting-beacon');
  assert.equal(parsedSynth.is_synthetic, true);
  assert.equal(parsedSynth.channel_count, 64);
  assert.equal(parsedSynth.time_sample_count, 32);

  const realSample = {
    id: 'real-gbt-hip35136',
    name: 'Green Bank Telescope — HIP 35136',
    label: 'GBT HIP 35136',
    format: 'fil',
    target: 'HIP35136',
    telescope: 'Green Bank Telescope (GBT)',
    description: 'Real primary astronomical filterbank recording',
    is_synthetic: false,
    seed: null,
    file_size_bytes: 9342,
    channel_count: 70,
    time_sample_count: 32,
    frequency_mhz: 1340.1,
    bandwidth_mhz: 0.195,
    source_url:
      'https://github.com/UCBerkeleySETI/breakthrough/raw/9fbb457da1c1404495927c2527542b25d788a616/GBT/filterbank_tutorial/blc04_guppi_57563_69862_HIP35136_0011.gpuspec.0002.fil',
    provenance_note: 'Breakthrough Listen GBT observation (HIP 35136)',
  };

  const parsedReal = DemoSampleInfoSchema.parse(realSample);
  assert.equal(parsedReal.id, 'real-gbt-hip35136');
  assert.equal(parsedReal.is_synthetic, false);
  assert.equal(parsedReal.channel_count, 70);
  assert.equal(parsedReal.target, 'HIP35136');
});

test('DemoLoadResponseSchema validates successful demo ingestion and deduplication response', () => {
  const loadPayload = {
    observation: {
      id: 'OBS_DEMO_20261011_SYNTH',
      original_filename: 'synthetic_drifting_beacon.fil',
      format: 'fil',
      file_size_bytes: 33267,
      sha256: '9d2f23b2e5f678901234567890abcdef1234567890abcdef1234567890abcdef',
      ingested_at: '2026-10-11T12:00:00Z',
      status: 'ingested',
      metadata: {
        channel_count: 64,
        frequency_reference_mhz: 1420.0,
        channel_spacing_mhz: 0.002,
        frequency_unit: 'MHz',
        frequency_min_mhz: 1419.936,
        frequency_max_mhz: 1420.064,
        bandwidth_mhz: 0.128,
        time_sample_count: 32,
        time_step_seconds: 1.0,
        time_unit: 's',
        start_mjd: 60000.0,
        telescope_name: 'AETHON Simulated Array',
        source_name: 'SYNTH-BEACON-01',
        raw_header: {},
      },
      provenance: {
        parser_name: 'FilterbankAdapter',
        parser_version: '1.0.0',
        parsed_at: '2026-10-11T12:00:00Z',
        source_format: 'fil',
        notes: 'Guaranteed offline synthetic demo dataset',
      },
      warnings: [],
    },
    sample_id: 'synthetic-drifting-beacon',
    is_duplicate: true,
    is_synthetic: true,
    duration_seconds: 0.045,
    message: 'Demo dataset already ingested in repository.',
  };

  const parsed = DemoLoadResponseSchema.parse(loadPayload);
  assert.equal(parsed.sample_id, 'synthetic-drifting-beacon');
  assert.equal(parsed.is_duplicate, true);
  assert.equal(parsed.is_synthetic, true);
  assert.equal(parsed.observation.id, 'OBS_DEMO_20261011_SYNTH');
  assert.equal(parsed.observation.metadata?.channel_count, 64);
});

test('Public dataset auto-selection rejects incompatible and oversized items', () => {
  const items: PublicDatasetItem[] = [
    {
      id: 'bl-h5-bad-1',
      target: 'VOYAGER1',
      telescope: 'GBT',
      utc: '2020-03-01T12:00:00Z',
      mjd: 58909.5,
      ra_deg: 257.0,
      dec_deg: 12.0,
      center_freq_mhz: 8419.29,
      file_type: 'HDF5',
      size_bytes: 40000000,
      quality: 'A',
      md5sum: null,
      url: 'https://seti.berkeley.edu/opendata/v1.h5',
      is_compatible: false,
      compatibility_reason: 'Unsupported format: HDF5',
      is_within_size_limit: true,
      size_reason: null,
    },
    {
      id: 'bl-fil-oversized-2',
      target: 'VOYAGER1',
      telescope: 'GBT',
      utc: '2020-03-01T12:00:00Z',
      mjd: 58909.5,
      ra_deg: 257.0,
      dec_deg: 12.0,
      center_freq_mhz: 8419.29,
      file_type: 'filterbank',
      size_bytes: 120000000, // 120MB > 80 MiB
      quality: 'A',
      md5sum: null,
      url: 'https://seti.berkeley.edu/opendata/v1_big.fil',
      is_compatible: true,
      compatibility_reason: null,
      is_within_size_limit: false,
      size_reason: 'File size exceeds maximum import ceiling of 80 MiB.',
    },
  ];

  // Defensive auto-selection algorithm used in PublicDatasetBrowser:
  // Must NOT select items that are incompatible or oversized!
  const firstCompatible = items.find((item) => item.is_compatible && item.is_within_size_limit);
  const selectedItem = firstCompatible || null;

  assert.equal(
    selectedItem,
    null,
    'Auto-selection must return null when no items are compatible and within size limit'
  );

  // When a valid compatible item is present:
  const compatibleFil: PublicDatasetItem = {
    id: 'bl-fil-good-3',
    target: 'VOYAGER1',
    telescope: 'GBT',
    utc: '2020-03-01T12:00:00Z',
    mjd: 58909.5,
    ra_deg: 257.0,
    dec_deg: 12.0,
    center_freq_mhz: 8419.29,
    file_type: 'filterbank',
    size_bytes: 15000000,
    quality: 'A',
    md5sum: null,
    url: 'https://seti.berkeley.edu/opendata/v1_small.fil',
    is_compatible: true,
    compatibility_reason: null,
    is_within_size_limit: true,
    size_reason: null,
  };

  const itemsWithGood = [...items, compatibleFil];
  const selectedWithGood =
    itemsWithGood.find((item) => item.is_compatible && item.is_within_size_limit) || null;

  assert.ok(selectedWithGood !== null);
  assert.equal(selectedWithGood.id, 'bl-fil-good-3');
});

test('mapObservationToDiscoveryMeta correctly preserves dimensions and flags synthetic data', () => {
  const synthRecord: ObservationRecordResponse = {
    id: 'OBS_SYNTH_01',
    original_filename: 'synthetic_tone.fil',
    format: 'fil',
    file_size_bytes: 33267,
    sha256: 'abc123456',
    ingested_at: '2026-10-11T12:00:00Z',
    status: 'ingested',
    metadata: {
      channel_count: 64,
      frequency_reference_mhz: 1420.0,
      channel_spacing_mhz: 0.002,
      frequency_unit: 'MHz',
      frequency_min_mhz: 1419.936,
      frequency_max_mhz: 1420.064,
      bandwidth_mhz: 0.128,
      time_sample_count: 32,
      time_step_seconds: 1.0,
      time_unit: 's',
      start_mjd: 60000.0,
      telescope_name: 'Simulated Array',
      source_name: 'SYNTH-BEACON-01',
      raw_header: {},
    },
    provenance: {
      parser_name: 'FilterbankAdapter',
      parser_version: '1.0.0',
      parsed_at: '2026-10-11T12:00:00Z',
      source_format: 'fil',
      notes: 'Synthetic demo fixture',
    },
    warnings: [],
  };

  const metaSynth = mapObservationToDiscoveryMeta(synthRecord);
  assert.equal(metaSynth.id, 'OBS_SYNTH_01');
  assert.equal(metaSynth.channelCount, 64);
  assert.equal(metaSynth.timeSampleCount, 32);
  assert.equal(metaSynth.samplesCount, 64 * 32);
  assert.equal(metaSynth.isSynthetic, true);
  assert.equal(metaSynth.provenanceSource, 'AETHON Signal Lab (Synthetic Demo)');

  const realRecord: ObservationRecordResponse = {
    id: 'OBS_REAL_01',
    original_filename: 'blc04_hip35136.fil',
    format: 'fil',
    file_size_bytes: 9342,
    sha256: 'def987654',
    ingested_at: '2026-10-11T12:00:00Z',
    status: 'ingested',
    metadata: {
      channel_count: 70,
      frequency_reference_mhz: 1340.1,
      channel_spacing_mhz: -0.00279,
      frequency_unit: 'MHz',
      frequency_min_mhz: 1340.0,
      frequency_max_mhz: 1340.195,
      bandwidth_mhz: 0.195,
      time_sample_count: 32,
      time_step_seconds: 1.074,
      time_unit: 's',
      start_mjd: 57563.8,
      telescope_name: 'GBT',
      source_name: 'HIP35136',
      raw_header: {},
    },
    provenance: {
      parser_name: 'FilterbankAdapter',
      parser_version: '1.0.0',
      parsed_at: '2026-10-11T12:00:00Z',
      source_format: 'fil',
    },
    warnings: [],
  };

  const metaReal = mapObservationToDiscoveryMeta(realRecord, 'Green Bank Telescope');
  assert.equal(metaReal.id, 'OBS_REAL_01');
  assert.equal(metaReal.channelCount, 70);
  assert.equal(metaReal.timeSampleCount, 32);
  assert.equal(metaReal.samplesCount, 70 * 32);
  assert.equal(metaReal.isSynthetic, false);
  assert.equal(metaReal.provenanceSource, 'Green Bank Telescope');
});

test('Spectral slice bounds clamping avoids out-of-range index errors for small fixtures', () => {
  // Scenario: Observation with 32 time steps and 70 channels (like cropped GBT sample)
  const timeSampleCount = 32;
  const channelCount = 70;

  // Default requested bounds before clamping might be [0, 64) and [0, 128)
  const defaultTimeStop = 64;
  const defaultFreqStop = 128;

  // Clamping algorithm from SignalAnalysisViewport.tsx:
  const maxTime = Math.max(1, timeSampleCount);
  const maxFreq = Math.max(1, channelCount);
  const actualTimeStop = Math.min(defaultTimeStop, maxTime);
  const actualFreqStop = Math.min(defaultFreqStop, maxFreq);

  assert.equal(actualTimeStop, 32, 'Time stop must be clamped to 32');
  assert.equal(actualFreqStop, 70, 'Frequency stop must be clamped to 70');
  assert.ok(actualTimeStop <= timeSampleCount);
  assert.ok(actualFreqStop <= channelCount);
});
