import type { CandidateObservationSummary } from '../types.ts';

export interface CandidateSummaryProps {
  summary: CandidateObservationSummary;
}

export function CandidateSummary({ summary }: CandidateSummaryProps) {
  return (
    <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] px-4 py-2.5 font-mono text-xs select-none">
      <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-800/80">
        {/* Item 1: Observation ID & Target */}
        <div className="flex-1 min-w-[130px] pt-1 sm:pt-0 sm:px-3 first:pl-0">
          <span className="block text-[10px] text-[#84929C] uppercase tracking-wider">
            OBSERVATION
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xs font-bold text-[#66E3FF]">{summary.observationId}</span>
            <span className="text-[10px] text-slate-400 font-sans truncate max-w-[110px]">
              • {summary.targetName.split(' ')[0]}
            </span>
          </div>
        </div>

        {/* Item 2: Samples Count */}
        <div className="flex-1 min-w-[120px] pt-1 sm:pt-0 sm:px-3">
          <span className="block text-[10px] text-[#84929C] uppercase tracking-wider">SAMPLES</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xs font-bold text-[#EAF4F7]">
              {summary.samplesCount.toLocaleString()}
            </span>
            <span className="text-[9px] text-slate-500 uppercase">I/Q</span>
          </div>
        </div>

        {/* Item 3: Anomalous Regions */}
        <div className="flex-1 min-w-[130px] pt-1 sm:pt-0 sm:px-3">
          <span className="block text-[10px] text-[#84929C] uppercase tracking-wider">
            ANOMALOUS REGIONS
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xs font-bold text-[#EAF4F7]">
              {summary.anomalousRegionsCount}
            </span>
            <span className="text-[9px] text-slate-500 uppercase">ISOLATED</span>
          </div>
        </div>

        {/* Item 4: High Priority */}
        <div className="flex-1 min-w-[110px] pt-1 sm:pt-0 sm:px-3">
          <span className="block text-[10px] text-[#84929C] uppercase tracking-wider">
            HIGH-PRIORITY
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xs font-bold text-[#FFB84D]">{summary.highPriorityCount}</span>
            <span className="text-[9px] text-amber-500/70 uppercase">CANDIDATES</span>
          </div>
        </div>

        {/* Item 5: Duration */}
        <div className="flex-1 min-w-[110px] pt-1 sm:pt-0 sm:px-3">
          <span className="block text-[10px] text-[#84929C] uppercase tracking-wider">
            DURATION
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xs font-bold text-slate-300">{summary.durationString}</span>
            <span className="text-[9px] text-slate-500 uppercase">UTC</span>
          </div>
        </div>

        {/* Item 6: Center Frequency */}
        <div className="flex-1 min-w-[120px] pt-1 sm:pt-0 sm:px-3 last:pr-0">
          <span className="block text-[10px] text-[#84929C] uppercase tracking-wider">
            FREQUENCY
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xs font-bold text-[#66E3FF]">
              {summary.centerFrequencyMHz.toFixed(2)}
            </span>
            <span className="text-[9px] text-slate-500 uppercase">MHz</span>
          </div>
        </div>
      </div>
    </div>
  );
}
