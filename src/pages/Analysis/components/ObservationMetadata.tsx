import type { SignalAnalysisRecord } from '../types.ts';

export interface ObservationMetadataProps {
  record: SignalAnalysisRecord;
}

export function ObservationMetadata({ record }: ObservationMetadataProps) {
  const fields = [
    { label: 'OBSERVATION ID', value: record.observationId },
    { label: 'FREQUENCY', value: `${record.frequencyMHz.toFixed(4)} MHz` },
    {
      label: 'BANDWIDTH',
      value: `${record.bandwidthKHz} kHz (${(record.bandwidthKHz / 1000).toFixed(4)} MHz)`,
    },
    { label: 'DURATION', value: `${record.durationSeconds.toFixed(1)} s` },
    { label: 'PEAK SNR', value: `+${record.snrDb.toFixed(1)} dB` },
    { label: 'SAMPLES', value: record.samplesCount.toLocaleString() },
    { label: 'DOPPLER DRIFT', value: `${record.driftRateHzPerSec.toFixed(2)} Hz/s` },
    { label: 'COORDINATES', value: `RA ${record.coordinates.ra} / DEC ${record.coordinates.dec}` },
  ];

  return (
    <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-3 font-mono text-xs select-none">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
          OBSERVATION METADATA & TELEMETRY
        </span>
        <span className="text-[9px] text-[#84929C]">
          APERTURE: {record.telescope.split(' ')[0]}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2.5">
        {fields.map((f) => (
          <div key={f.label} className="border-l border-slate-800/80 pl-2.5">
            <span className="block text-[9px] text-[#84929C] uppercase tracking-wider">
              {f.label}
            </span>
            <span className="text-xs font-semibold text-[#EAF4F7] truncate block mt-0.5">
              {f.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
