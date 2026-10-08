import type { ArchiveSummaryStats } from '../types.ts';

export interface ArchiveSummaryProps {
  stats: ArchiveSummaryStats;
}

export function ArchiveSummary({ stats }: ArchiveSummaryProps) {
  return (
    <div className="border-b border-[#242825] bg-[#101211] px-4 py-3 sm:px-6 select-none font-sans">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Summary Strip */}
        <div className="grid grid-cols-2 gap-4 sm:flex sm:items-center sm:gap-8 text-xs">
          <div className="flex items-baseline gap-2">
            <span className="text-[11px] text-[#9A9C96]">Observations:</span>
            <span className="font-mono text-[#E6E4DD] tabular-nums">{stats.totalObservations}</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-[11px] text-[#9A9C96]">Analyzed:</span>
            <span className="font-mono text-[#E6E4DD] tabular-nums">{stats.analyzed}</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-[11px] text-[#9A9C96]">Anomalous:</span>
            <span className="font-mono text-[#D4864A] tabular-nums">{stats.anomalous}</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-[11px] text-[#9A9C96]">High priority:</span>
            <span className="font-mono text-[#D4864A] tabular-nums">{stats.highPriority}</span>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-[10px] text-[#666963] sm:text-right">
          <span>Demonstration data registry</span>
        </div>
      </div>
    </div>
  );
}
