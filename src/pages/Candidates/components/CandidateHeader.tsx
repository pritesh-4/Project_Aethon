import type { CandidateFilterState } from '../types.ts';
import { Search, Filter } from 'lucide-react';

export interface CandidateHeaderProps {
  observationId: string;
  totalIdentified: number;
  highPriorityCount: number;
  filters: CandidateFilterState;
  onFilterChange: (newFilters: CandidateFilterState) => void;
  filteredCount: number;
  totalCount: number;
}

export function CandidateHeader({
  observationId,
  totalIdentified,
  highPriorityCount,
  filters,
  onFilterChange,
  filteredCount,
  totalCount,
}: CandidateHeaderProps) {
  return (
    <header className="border-b border-[#242825] bg-[#0E100F] px-4 sm:px-6 py-6 sm:py-8 select-none font-sans">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Role 1: Page Identity + Role 4: Supporting Orientation */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#767973] uppercase tracking-wider">
              <span>AETHON WORKSPACE</span>
              <span>/</span>
              <span>TRIAGE QUEUE</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-[#E6E4DD]">
              Candidates
            </h1>
            <p className="text-sm text-[#9A9C96] leading-relaxed max-w-xl">
              Prioritized candidate events surfaced from observation{' '}
              <span className="font-mono text-[#D4864A] font-semibold">{observationId}</span> for
              researcher review and multi-telescope replication.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 self-start sm:self-end pb-1 font-mono text-xs text-[#848780]">
            <div>
              <span className="text-[#666963] uppercase">TOTAL:</span>{' '}
              <span className="text-[#E6E4DD] font-semibold">{totalIdentified}</span>
            </div>
            <span>·</span>
            <div>
              <span className="text-[#666963] uppercase">HIGH PRIORITY:</span>{' '}
              <span className="text-[#D4864A] font-semibold">{highPriorityCount}</span>
            </div>
          </div>
        </div>

        {/* Toolbar: Search & Priority Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#1F2321]">
          <div className="flex flex-wrap items-center gap-3">
            {/* Quick Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#666963]" />
              <input
                type="text"
                value={filters.searchQuery}
                onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
                placeholder="Search candidate ID..."
                className="h-8 w-48 sm:w-56 rounded-[2px] border border-[#242825] bg-[#141715] pl-8 pr-2.5 text-xs text-[#E6E4DD] placeholder-[#666963] focus:border-[#D4864A] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A] transition-colors font-mono"
              />
            </div>

            {/* Priority Filter */}
            <div className="flex items-center gap-2">
              <Filter className="h-3.5 w-3.5 text-[#666963]" />
              <select
                value={filters.priorityFilter}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    priorityFilter: e.target.value as CandidateFilterState['priorityFilter'],
                  })
                }
                aria-label="Filter candidates by priority"
                className="h-8 rounded-[2px] border border-[#242825] bg-[#141715] px-2.5 text-xs text-[#E6E4DD] focus:border-[#D4864A] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A] transition-colors cursor-pointer"
              >
                <option value="ALL">All priorities ({totalCount})</option>
                <option value="HIGH">High priority ({highPriorityCount})</option>
                <option value="MEDIUM">Medium priority</option>
                <option value="LOW">Low priority</option>
              </select>
            </div>
          </div>

          <span className="text-xs font-mono text-[#767973]">
            Showing <strong className="text-[#E6E4DD] font-semibold">{filteredCount}</strong> of{' '}
            {totalCount} records
          </span>
        </div>
      </div>
    </header>
  );
}
