import type { ArchiveSummaryStats } from '../types.ts';
import { Database } from 'lucide-react';

export interface ArchiveHeaderProps {
  stats: ArchiveSummaryStats;
}

export function ArchiveHeader({ stats }: ArchiveHeaderProps) {
  return (
    <header className="border-b border-[#242825] bg-[#141715] px-4 py-4 sm:px-6 select-none">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between max-w-7xl mx-auto">
        {/* Title and Purpose */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-[2px] border border-[#242825] bg-[#1A1E1B] flex items-center justify-center text-[#D4864A]">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-medium text-[#E6E4DD]">Observation archive</h1>
            <p className="text-xs text-[#9A9C96]">
              Historical ledger of telescope pointings and candidate events
            </p>
          </div>
        </div>

        {/* Quiet Scientific Ledger Stats */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:flex sm:items-center sm:gap-6 text-xs text-[#9A9C96]">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px]">Total pointings:</span>
            <span className="font-mono text-[#E6E4DD] tabular-nums">{stats.totalObservations}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px]">Analyzed:</span>
            <span className="font-mono text-[#E6E4DD] tabular-nums">{stats.analyzed}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px]">Candidate events:</span>
            <span className="font-mono text-[#D4864A] tabular-nums">{stats.candidateEvents}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px]">Under review:</span>
            <span className="font-mono text-[#D4864A] tabular-nums">{stats.flaggedForReview}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
