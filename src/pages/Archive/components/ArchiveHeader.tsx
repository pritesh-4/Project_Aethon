import type { ArchiveSummaryStats } from '../types.ts';

export interface ArchiveHeaderProps {
  stats: ArchiveSummaryStats;
}

export function ArchiveHeader({ stats }: ArchiveHeaderProps) {
  return (
    <div className="border-b border-[#1C2630] bg-[#0B0F14] px-4 py-4 sm:px-6 select-none font-mono">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5BD8F5]" />
            <h1 className="text-sm sm:text-base font-medium text-[#E6EDF2] font-mono">
              Observation archive
            </h1>
          </div>
        </div>

        {/* Stat Readouts */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 sm:flex sm:items-center sm:gap-6 text-[11px] text-[#7F8B95]">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px]">Total observations:</span>
            <span className="font-medium text-[#E6EDF2] tabular-nums">
              {stats.totalObservations}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px]">Analyzed:</span>
            <span className="font-medium text-[#E6EDF2] tabular-nums">{stats.analyzed}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px]">Candidate events:</span>
            <span className="font-medium text-[#5BD8F5] tabular-nums">{stats.candidateEvents}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px]">Flagged for review:</span>
            <span className="font-medium text-[#E8AE50] tabular-nums">
              {stats.flaggedForReview}
            </span>
          </div>
        </div>

        {/* Right side: Demonstration Archive Notice */}
        <div className="flex items-center justify-end sm:justify-start lg:justify-end border-t border-[#1C2630] pt-2 lg:border-t-0 lg:pt-0">
          <div className="flex items-center gap-1.5 text-[11px] text-[#7F8B95]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5BD8F5]" />
            <span>Demonstration archive</span>
          </div>
        </div>
      </div>
    </div>
  );
}
