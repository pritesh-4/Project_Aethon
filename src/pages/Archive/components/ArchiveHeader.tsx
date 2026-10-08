import type { ArchiveSummaryStats } from '../types.ts';

export interface ArchiveHeaderProps {
  stats: ArchiveSummaryStats;
}

export function ArchiveHeader({ stats }: ArchiveHeaderProps) {
  return (
    <header className="border-b border-[#D6D2C9] bg-[#FAF8F5] px-4 sm:px-6 py-6 sm:py-8 select-none font-sans">
      <div className="max-w-7xl mx-auto space-y-3">
        <div className="flex items-center gap-2 text-xs font-mono text-[#76828D] uppercase tracking-wider">
          <span>AETHON WORKSPACE</span>
          <span>/</span>
          <span>REPOSITORY</span>
        </div>

        {/* Page Identity */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
          <div>
            <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-[#17202A] font-serif">
              Archive
            </h1>
            <p className="text-sm text-[#56616A] leading-relaxed mt-1 max-w-xl">
              Chronological research ledger of astronomical pointings, anomaly classifications, and
              candidate records.
            </p>
          </div>

          {/* Quiet Summary Line */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-[#56616A] self-start sm:self-auto">
            <span>
              <strong className="text-[#17202A] font-semibold">{stats.totalObservations}</strong>{' '}
              pointings
            </span>
            <span className="text-[#D6D2C9]">·</span>
            <span>
              <strong className="text-[#17202A] font-semibold">{stats.analyzed}</strong> analyzed
            </span>
            <span className="text-[#D6D2C9]">·</span>
            <span>
              <strong className="text-[#376A9B] font-semibold">{stats.candidateEvents}</strong>{' '}
              candidates
            </span>
            <span className="text-[#D6D2C9]">·</span>
            <span>
              <strong className="text-[#9E6E20] font-semibold">{stats.flaggedForReview}</strong> in
              review
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
