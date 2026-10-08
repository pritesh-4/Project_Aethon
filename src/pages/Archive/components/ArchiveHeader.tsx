import type { ArchiveSummaryStats } from '../types.ts';

export interface ArchiveHeaderProps {
  stats: ArchiveSummaryStats;
}

export function ArchiveHeader({ stats }: ArchiveHeaderProps) {
  return (
    <header className="border-b border-[#242825] bg-[#0E100F] px-4 sm:px-6 py-6 sm:py-8 select-none font-sans">
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-[#767973] uppercase tracking-wider">
          <span>AETHON WORKSPACE</span>
          <span>/</span>
          <span>REPOSITORY</span>
        </div>

        {/* Role 1: Page Identity (32-40px) */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-[#E6E4DD]">
              Archive
            </h1>
            <p className="text-sm text-[#9A9C96] leading-relaxed mt-1 max-w-xl">
              Chronological ledger of astronomical pointings, anomaly classifications, and candidate
              records.
            </p>
          </div>

          {/* Quiet Summary Line (Per Rule 25) */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-[#848780] self-start sm:self-auto">
            <span>
              <strong className="text-[#E6E4DD] font-semibold">{stats.totalObservations}</strong>{' '}
              pointings
            </span>
            <span className="text-[#363C38]">·</span>
            <span>
              <strong className="text-[#E6E4DD] font-semibold">{stats.analyzed}</strong> analyzed
            </span>
            <span className="text-[#363C38]">·</span>
            <span>
              <strong className="text-[#D4864A] font-semibold">{stats.candidateEvents}</strong>{' '}
              candidates
            </span>
            <span className="text-[#363C38]">·</span>
            <span>
              <strong className="text-[#D4864A] font-semibold">{stats.flaggedForReview}</strong> in
              review
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
