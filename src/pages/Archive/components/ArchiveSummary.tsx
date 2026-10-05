import type { ArchiveSummaryStats } from '../types.ts';

export interface ArchiveSummaryProps {
  stats: ArchiveSummaryStats;
}

export function ArchiveSummary({ stats }: ArchiveSummaryProps) {
  return (
    <div className="border-b border-[#1C2630] bg-[#06080B] px-4 py-3 sm:px-6 select-none font-mono">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Summary Strip */}
        <div className="grid grid-cols-2 gap-4 sm:flex sm:items-center sm:gap-8 text-xs">
          <div className="flex items-baseline gap-2">
            <span className="text-[10px] text-[#7F8B95]">Observations:</span>
            <span className="font-medium text-[#E6EDF2] tabular-nums">
              {stats.totalObservations}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-[10px] text-[#7F8B95]">Analyzed:</span>
            <span className="font-medium text-[#E6EDF2] tabular-nums">{stats.analyzed}</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-[10px] text-[#7F8B95]">Anomalous:</span>
            <span className="font-medium text-[#5BD8F5] tabular-nums">{stats.anomalous}</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-[10px] text-[#7F8B95]">High priority:</span>
            <span className="font-medium text-[#E8AE50] tabular-nums">{stats.highPriority}</span>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="text-[9px] text-[#7F8B95] sm:text-right">
          <span>Demonstration data registry</span>
        </div>
      </div>
    </div>
  );
}
