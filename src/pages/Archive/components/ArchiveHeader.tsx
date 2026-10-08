import type { ArchiveSummaryStats } from '../types.ts';
import { Database } from 'lucide-react';

export interface ArchiveHeaderProps {
  stats: ArchiveSummaryStats;
}

export function ArchiveHeader({ stats }: ArchiveHeaderProps) {
  return (
    <header className="border-b border-[#1C2630] bg-[#0B0F14] px-4 py-4 sm:px-6 select-none font-mono">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Title and Purpose */}
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded border border-[#1C2630] bg-[#06080B] flex items-center justify-center text-[#5BD8F5]">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-semibold text-[#E6EDF2]">
              Observation Archive
            </h1>
            <p className="text-xs text-[#7F8B95]">
              Historical record of telescope pointings and candidate events
            </p>
          </div>
        </div>

        {/* Quiet Scientific Ledger Stats */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:flex sm:items-center sm:gap-6 text-xs text-[#7F8B95]">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px]">Total observations:</span>
            <span className="font-semibold text-[#E6EDF2] tabular-nums">
              {stats.totalObservations}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px]">Analyzed:</span>
            <span className="font-semibold text-[#E6EDF2] tabular-nums">{stats.analyzed}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px]">Candidate events:</span>
            <span className="font-semibold text-[#5BD8F5] tabular-nums">
              {stats.candidateEvents}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px]">Under review:</span>
            <span className="font-semibold text-[#E8AE50] tabular-nums">
              {stats.flaggedForReview}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
