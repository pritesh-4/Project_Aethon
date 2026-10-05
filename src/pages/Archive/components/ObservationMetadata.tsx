import type { ArchivedObservation } from '../types.ts';

export interface ObservationMetadataProps {
  observation: ArchivedObservation;
}

export function ObservationMetadata({ observation }: ObservationMetadataProps) {
  const metadataRows = [
    { label: 'Observation ID', value: observation.id },
    { label: 'Data source', value: observation.telescope },
    {
      label: 'Target coordinates',
      value: `RA ${observation.coordinates.ra} · Dec ${observation.coordinates.dec}`,
    },
    { label: 'Frequency', value: `${observation.frequency.toFixed(4)} MHz` },
    { label: 'Bandwidth', value: `${observation.bandwidth.toFixed(1)} MHz` },
    { label: 'Duration', value: `${observation.durationString} (${observation.duration}s)` },
    { label: 'Sample count', value: observation.sampleCount.toLocaleString() },
    {
      label: 'Analysis duration',
      value: `${(observation.analysisTimeMs / 1000).toFixed(2)}s (${observation.analysisTimeMs} ms)`,
    },
    { label: 'Model version', value: `${observation.modelName} v${observation.modelVersion}` },
    { label: 'Pipeline status', value: observation.pipelineStatus },
  ];

  return (
    <div className="font-mono text-xs select-none">
      <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] overflow-hidden">
        <div className="border-b border-[#1C2630] bg-[#0B0F14] px-3 py-1.5 text-[10px] text-slate-400 font-medium">
          Observation parameters
        </div>

        <div className="divide-y divide-[#1C2630]/60">
          {metadataRows.map((row) => (
            <div
              key={row.label}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-3 py-1.5 gap-0.5 sm:gap-2 text-[10px]"
            >
              <span className="text-slate-500 text-[9px] shrink-0">{row.label}</span>
              <span className="font-mono text-[#E6EDF2] truncate text-right">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
