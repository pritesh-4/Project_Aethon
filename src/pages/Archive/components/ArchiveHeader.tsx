import type { ArchiveSummaryStats } from '../types.ts';

export interface ArchiveHeaderProps {
  stats: ArchiveSummaryStats;
}

export function ArchiveHeader({ stats }: ArchiveHeaderProps) {
  return (
    <div className="border-b border-slate-800/80 bg-[#0A0E13] px-4 py-4 sm:px-6 select-none font-mono">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Title & Subtitle */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-none bg-[#66E3FF] shadow-[0_0_8px_rgba(102,227,255,0.6)]" />
            <h1 className="text-sm sm:text-base font-bold tracking-[0.25em] text-[#EAF4F7] uppercase font-mono">
              OBSERVATION ARCHIVE
            </h1>
          </div>
          <p className="text-[10px] tracking-[0.2em] text-[#84929C] uppercase font-mono">
            ASTRONOMICAL DATA REGISTRY
          </p>
        </div>

        {/* Center / Stat Readouts */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:flex sm:items-center sm:gap-6 text-[11px] text-[#84929C]">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 uppercase text-[10px] tracking-wider">
              TOTAL OBSERVATIONS
            </span>
            <span className="text-slate-600">//</span>
            <span className="font-semibold text-[#EAF4F7] tabular-nums">
              {stats.totalObservations}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 uppercase text-[10px] tracking-wider">ANALYZED</span>
            <span className="text-slate-600">//</span>
            <span className="font-semibold text-[#EAF4F7] tabular-nums">{stats.analyzed}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 uppercase text-[10px] tracking-wider">
              CANDIDATE EVENTS
            </span>
            <span className="text-slate-600">//</span>
            <span className="font-semibold text-[#66E3FF] tabular-nums">
              {stats.candidateEvents}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 uppercase text-[10px] tracking-wider">
              FLAGGED FOR REVIEW
            </span>
            <span className="text-slate-600">//</span>
            <span className="font-semibold text-[#FFB84D] tabular-nums">
              {stats.flaggedForReview}
            </span>
          </div>
        </div>

        {/* Right side: ARCHIVE STATUS */}
        <div className="flex items-center justify-end sm:justify-start lg:justify-end border-t border-slate-900 pt-2 lg:border-t-0 lg:pt-0">
          <div className="flex flex-col items-end text-right font-mono">
            <span className="text-[9px] tracking-[0.2em] text-slate-500 uppercase">
              ARCHIVE STATUS
            </span>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold tracking-wider text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-none bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
              <span>SYNCHRONIZED</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
