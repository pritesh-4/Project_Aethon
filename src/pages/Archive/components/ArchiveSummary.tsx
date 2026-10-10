import type { ArchiveSummaryStats } from '../types.ts';

export interface ArchiveSummaryProps {
  stats: ArchiveSummaryStats;
}

export function ArchiveSummary({ stats }: ArchiveSummaryProps) {
  return (
    <div className="border-b border-[#D6D2C9] bg-[#EAE7E0] px-4 py-3 sm:px-6 select-none font-sans">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Summary Strip */}
        <div className="grid grid-cols-2 gap-4 sm:flex sm:items-center sm:gap-8 text-xs">
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] text-[#56616A]">Observations:</span>
            <span className="font-mono text-[#17202A] font-semibold tabular-nums">
              {stats.totalObservations}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-[11px] text-[#56616A]">Analyzed:</span>
            <span className="font-mono text-[#17202A] font-semibold tabular-nums">
              {stats.analyzed}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-[11px] text-[#56616A]">Anomalous:</span>
            <span className="font-mono text-[#376A9B] font-semibold tabular-nums">
              {stats.anomalous}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-[11px] text-[#56616A]">High priority:</span>
            <span className="font-mono text-[#9E6E20] font-semibold tabular-nums">
              {stats.highPriority}
            </span>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-[11px] text-[#76828D] sm:text-right font-mono">
          <span>Archival observation registry</span>
        </div>
      </div>
    </div>
  );
}
