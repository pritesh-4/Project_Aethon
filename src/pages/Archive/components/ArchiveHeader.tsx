import type { ArchiveSummaryStats } from '../types.ts';
import { Database } from 'lucide-react';

export interface ArchiveHeaderProps {
  stats: ArchiveSummaryStats;
}

export function ArchiveHeader({ stats }: ArchiveHeaderProps) {
  return (
    <header className="border-b border-[#242825] bg-[#0F1110] px-4 sm:px-6 py-2.5 select-none font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Left: Identity */}
        <div className="flex items-center gap-2.5 text-xs">
          <Database className="h-3.5 w-3.5 text-[#D4864A] shrink-0" />
          <h1 className="text-sm font-medium tracking-tight text-[#E6E4DD]">Archive Ledger</h1>
          <span className="text-[#363C38]">•</span>
          <span className="text-xs text-[#848780] hidden md:inline">
            Historical survey pointings and candidate events
          </span>
        </div>

        {/* Right: Inline Ledger Stats */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-[#767973]">TOTAL:</span>
            <span className="font-mono text-[#E6E4DD] tabular-nums text-xs">
              {stats.totalObservations}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-[#767973]">ANALYZED:</span>
            <span className="font-mono text-[#E6E4DD] tabular-nums text-xs">{stats.analyzed}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-[#767973]">CANDIDATES:</span>
            <span className="font-mono text-[#D4864A] tabular-nums text-xs">
              {stats.candidateEvents}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-[#767973]">REVIEW:</span>
            <span className="font-mono text-[#D4864A] tabular-nums text-xs">
              {stats.flaggedForReview}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
