import type { CandidateObservationSummary } from '../types.ts';

export interface CandidateSummaryProps {
  summary: CandidateObservationSummary;
}

export function CandidateSummary({ summary }: CandidateSummaryProps) {
  return (
    <div className="rounded border border-[#1C2630] bg-[#0B0F14] px-4 py-2.5 text-xs select-none">
      <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-4 divide-y sm:divide-y-0 sm:divide-x divide-[#1C2630]">
        {/* Item 1: Observation ID & Target */}
        <div className="flex-1 min-w-[130px] pt-1 sm:pt-0 sm:px-3 first:pl-0">
          <span className="block text-[11px] text-[#7F8B95]">Observation</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xs font-semibold text-[#5BD8F5] font-mono">
              {summary.observationId}
            </span>
            <span className="text-xs text-[#7F8B95] truncate max-w-[110px]">
              • {summary.targetName.split(' ')[0]}
            </span>
          </div>
        </div>

        {/* Item 2: Samples Count */}
        <div className="flex-1 min-w-[120px] pt-1 sm:pt-0 sm:px-3">
          <span className="block text-[11px] text-[#7F8B95]">Samples</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xs font-semibold text-[#E6EDF2] font-mono">
              {summary.samplesCount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Item 3: Anomalous Regions */}
        <div className="flex-1 min-w-[130px] pt-1 sm:pt-0 sm:px-3">
          <span className="block text-[11px] text-[#7F8B95]">Anomalous regions</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xs font-semibold text-[#5BD8F5] font-mono">
              {summary.anomalousRegionsCount}
            </span>
          </div>
        </div>

        {/* Item 4: High Priority */}
        <div className="flex-1 min-w-[110px] pt-1 sm:pt-0 sm:px-3">
          <span className="block text-[11px] text-[#7F8B95]">High priority</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xs font-semibold text-[#E8AE50] font-mono">
              {summary.highPriorityCount}
            </span>
          </div>
        </div>

        {/* Item 5: Duration */}
        <div className="flex-1 min-w-[110px] pt-1 sm:pt-0 sm:px-3">
          <span className="block text-[11px] text-[#7F8B95]">Duration</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xs font-semibold text-[#E6EDF2] font-mono">
              {summary.durationString}
            </span>
          </div>
        </div>

        {/* Item 6: Center Frequency */}
        <div className="flex-1 min-w-[120px] pt-1 sm:pt-0 sm:px-3 last:pr-0">
          <span className="block text-[11px] text-[#7F8B95]">Center frequency</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xs font-semibold text-[#5BD8F5] font-mono">
              {summary.centerFrequencyMHz.toFixed(2)}
            </span>
            <span className="text-[10px] text-[#7F8B95]">MHz</span>
          </div>
        </div>
      </div>
    </div>
  );
}
