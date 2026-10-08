import type { ArchivedObservation } from '../types.ts';

export interface ObservationMetadataProps {
  observation: ArchivedObservation;
}

export function ObservationMetadata({ observation }: ObservationMetadataProps) {
  const metadataRows = [
    { label: 'Observation ID', value: observation.id, mono: true },
    { label: 'Data source', value: observation.telescope, mono: false },
    {
      label: 'Target coordinates',
      value: `RA ${observation.coordinates.ra} · Dec ${observation.coordinates.dec}`,
      mono: true,
    },
    { label: 'Frequency', value: `${observation.frequency.toFixed(4)} MHz`, mono: true },
    { label: 'Bandwidth', value: `${observation.bandwidth.toFixed(1)} MHz`, mono: true },
    {
      label: 'Duration',
      value: `${observation.durationString} (${observation.duration}s)`,
      mono: true,
    },
    { label: 'Sample count', value: observation.sampleCount.toLocaleString(), mono: true },
    {
      label: 'Analysis duration',
      value: `${(observation.analysisTimeMs / 1000).toFixed(2)}s (${observation.analysisTimeMs} ms)`,
      mono: true,
    },
    {
      label: 'Model version',
      value: `${observation.modelName} v${observation.modelVersion}`,
      mono: false,
    },
    { label: 'Pipeline status', value: observation.pipelineStatus, mono: false },
  ];

  return (
    <div className="text-xs select-none">
      <div className="rounded-[2px] border border-[#242825] bg-[#101211] overflow-hidden">
        <div className="border-b border-[#242825] bg-[#141715] px-3 py-1.5 text-[11px] text-[#9A9C96] font-medium">
          Observation parameters
        </div>

        <div className="divide-y divide-[#242825]/60">
          {metadataRows.map((row) => (
            <div
              key={row.label}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-3 py-1.5 gap-0.5 sm:gap-2 text-[11px]"
            >
              <span className="text-[#666963] text-[10px] shrink-0">{row.label}</span>
              <span className={`text-[#E6E4DD] truncate text-right ${row.mono ? 'font-mono' : ''}`}>
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
