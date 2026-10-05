import type { SignalAnalysisRecord } from '../types.ts';

export interface ObservationMetadataProps {
  record: SignalAnalysisRecord;
}

export function ObservationMetadata({ record }: ObservationMetadataProps) {
  const fields = [
    { label: 'Observation ID', value: record.observationId },
    { label: 'Frequency', value: `${record.frequencyMHz.toFixed(4)} MHz` },
    {
      label: 'Bandwidth',
      value: `${record.bandwidthKHz} kHz (${(record.bandwidthKHz / 1000).toFixed(4)} MHz)`,
    },
    { label: 'Duration', value: `${record.durationSeconds.toFixed(1)} s` },
    { label: 'Peak SNR', value: `+${record.snrDb.toFixed(1)} dB` },
    { label: 'Sample count', value: record.samplesCount.toLocaleString() },
    { label: 'Doppler drift', value: `${record.driftRateHzPerSec.toFixed(2)} Hz/s` },
    { label: 'Coordinates', value: `RA ${record.coordinates.ra} · Dec ${record.coordinates.dec}` },
  ];

  return (
    <div className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-3 font-mono text-xs select-none">
      <div className="flex items-center justify-between border-b border-[#1C2630] pb-2 mb-2.5">
        <span className="text-[10px] font-medium text-[#7F8B95]">Observation metadata</span>
        <span className="text-[9px] text-[#7F8B95]">Instrument: {record.telescope}</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2.5">
        {fields.map((f) => (
          <div key={f.label} className="border-l border-[#1C2630] pl-2.5">
            <span className="block text-[9px] text-[#7F8B95]">{f.label}</span>
            <span className="text-xs font-medium text-[#E6EDF2] truncate block mt-0.5">
              {f.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
