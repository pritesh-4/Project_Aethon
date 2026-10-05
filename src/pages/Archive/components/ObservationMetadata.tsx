import type { ArchivedObservation } from '../types.ts';

export interface ObservationMetadataProps {
  observation: ArchivedObservation;
}

export function ObservationMetadata({ observation }: ObservationMetadataProps) {
  const metadataRows = [
    { label: 'OBSERVATION ID', value: observation.id },
    { label: 'DATA SOURCE / TELESCOPE', value: observation.telescope },
    {
      label: 'TARGET COORDINATES',
      value: `RA ${observation.coordinates.ra} // DEC ${observation.coordinates.dec}`,
    },
    { label: 'FREQUENCY', value: `${observation.frequency.toFixed(4)} MHz` },
    { label: 'BANDWIDTH', value: `${observation.bandwidth.toFixed(1)} MHz` },
    { label: 'DURATION', value: `${observation.durationString} (${observation.duration}s)` },
    { label: 'SAMPLE COUNT', value: observation.sampleCount.toLocaleString() },
    {
      label: 'ANALYSIS TIME',
      value: `${(observation.analysisTimeMs / 1000).toFixed(2)}s (${observation.analysisTimeMs} ms)`,
    },
    { label: 'MODEL VERSION', value: `${observation.modelName} v${observation.modelVersion}` },
    { label: 'PIPELINE STATUS', value: observation.pipelineStatus },
  ];

  return (
    <div className="font-mono text-xs select-none">
      <div className="rounded-[2px] border border-slate-800/80 bg-[#05070A] overflow-hidden">
        <div className="border-b border-slate-800/80 bg-[#0A0E13] px-3 py-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
          <span>TECHNICAL METADATA SPECIFICATION</span>
          <span className="text-slate-600">// REST API SPECIMEN</span>
        </div>

        <div className="divide-y divide-slate-800/50">
          {metadataRows.map((row) => (
            <div
              key={row.label}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-3 py-1.5 gap-0.5 sm:gap-2 text-[10px]"
            >
              <span className="text-slate-500 uppercase tracking-wider text-[9px] shrink-0">
                {row.label}
              </span>
              <span className="font-mono text-[#EAF4F7] truncate text-right">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
