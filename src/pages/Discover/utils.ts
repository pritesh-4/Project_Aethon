import type { ObservationRecordResponse } from '@/types/schemas.ts';
import type { DiscoveryObservationMeta } from './types.ts';

/**
 * Normalizes an API ObservationRecordResponse into the frontend DiscoveryObservationMeta format.
 */
export function mapObservationToDiscoveryMeta(
  record: ObservationRecordResponse,
  fallbackSource = 'Guaranteed Offline Demo'
): DiscoveryObservationMeta {
  const meta = record.metadata;
  const durSec =
    meta?.time_sample_count != null && meta?.time_step_seconds != null
      ? meta.time_sample_count * meta.time_step_seconds
      : null;
  const durStr =
    durSec != null
      ? `${Math.floor(durSec / 60)
          .toString()
          .padStart(2, '0')}:${Math.floor(durSec % 60)
          .toString()
          .padStart(2, '0')}`
      : null;

  const isSynth =
    meta?.source_name?.includes('SYNTH') ||
    record.original_filename?.includes('synthetic') ||
    (record.provenance?.notes?.toLowerCase().includes('synthetic') ?? false) ||
    false;

  return {
    id: record.id,
    name: meta?.source_name || record.original_filename,
    format: record.format.toUpperCase(),
    samplesCount:
      meta?.time_sample_count != null && meta?.channel_count != null
        ? meta.time_sample_count * meta.channel_count
        : null,
    timeSampleCount: meta?.time_sample_count ?? null,
    channelCount: meta?.channel_count ?? null,
    durationString: durStr,
    bandwidthMHz: meta?.bandwidth_mhz ?? null,
    frequencyMHz: meta?.frequency_reference_mhz ?? null,
    telescope: meta?.telescope_name || null,
    fileSizeBytes: record.file_size_bytes,
    coordinates: {
      ra: meta?.ra_str || (meta?.ra_deg != null ? `${meta.ra_deg.toFixed(4)}°` : null),
      dec: meta?.dec_str || (meta?.dec_deg != null ? `${meta.dec_deg.toFixed(4)}°` : null),
    },
    provenanceSource: isSynth ? 'AETHON Signal Lab (Synthetic Demo)' : fallbackSource,
    isSynthetic: isSynth,
  };
}
