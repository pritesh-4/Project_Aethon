import type { ArchiveSummaryStats } from '../types.ts';

export interface ArchiveSummaryProps {
  stats: ArchiveSummaryStats;
}

export function ArchiveSummary({ stats }: ArchiveSummaryProps) {
  return (
    <div className="border-b border-slate-800/80 bg-[#05070A] px-4 py-3 sm:px-6 select-none font-mono">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Restrained Summary Strip */}
        <div className="grid grid-cols-2 gap-4 sm:flex sm:items-center sm:gap-8 text-xs">
          <div className="flex items-baseline gap-3">
            <span className="text-[10px] tracking-[0.18em] text-slate-500 uppercase">
              OBSERVATIONS
            </span>
            <span className="font-semibold tracking-wider text-[#EAF4F7] tabular-nums">
              {stats.totalObservations}
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-[10px] tracking-[0.18em] text-slate-500 uppercase">ANALYZED</span>
            <span className="font-semibold tracking-wider text-[#EAF4F7] tabular-nums">
              {stats.analyzed}
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-[10px] tracking-[0.18em] text-slate-500 uppercase">
              ANOMALOUS
            </span>
            <span className="font-semibold tracking-wider text-[#66E3FF] tabular-nums">
              {stats.anomalous}
            </span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-[10px] tracking-[0.18em] text-slate-500 uppercase">
              HIGH PRIORITY
            </span>
            <span className="font-semibold tracking-wider text-[#FFB84D] tabular-nums">
              {stats.highPriority}
            </span>
          </div>
        </div>

        {/* Disclaimer / Provenance Note */}
        <div className="text-[9px] text-slate-600 uppercase tracking-widest sm:text-right">
          <span>INSTITUTIONAL REGISTRY</span>
          <span className="mx-1.5 text-slate-700">//</span>
          <span className="text-slate-500">DEMONSTRATION ARCHIVE STATE</span>
        </div>
      </div>
    </div>
  );
}
