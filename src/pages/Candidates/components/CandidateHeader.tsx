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
    <header className="border-b border-[#242825] bg-[#0F1110] px-4 sm:px-6 py-2.5 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 max-w-7xl mx-auto">
        {/* Left: Title + Context inline */}
        <div className="flex flex-wrap items-center gap-2 text-xs min-w-0">
          <h1 className="text-sm font-medium tracking-tight text-[#E6E4DD] shrink-0">
            Candidate review
          </h1>
          <span className="text-[#242825] hidden sm:inline">·</span>
          <span className="text-[#9A9C96] font-mono hidden sm:inline">{observationId}</span>
          <span className="text-[#242825] hidden sm:inline">·</span>
          <span className="text-[#9A9C96] hidden sm:inline">{totalIdentified} isolated</span>
          <span className="text-[#242825] hidden sm:inline">·</span>
          <span className="text-[#D4864A] hidden sm:inline">{highPriorityCount} prioritized</span>
        </div>

        {/* Right: Search & Filter */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Search */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[#666963]" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
              placeholder="Search ID..."
              className="h-7 w-full sm:w-44 rounded-sm border border-[#242825] bg-[#141715] pl-8 pr-2.5 text-xs text-[#E6E4DD] placeholder-[#666963] focus:border-[#D4864A] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A] transition-colors font-mono"
            />
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5">
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
              className="h-7 rounded-sm border border-[#242825] bg-[#141715] px-2 text-xs text-[#E6E4DD] focus:border-[#D4864A] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A] transition-colors cursor-pointer"
            >
              <option value="ALL">All ({totalCount})</option>
              <option value="HIGH">High ({highPriorityCount})</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <span className="text-[11px] text-[#666963] hidden sm:inline">
            <strong className="text-[#E6E4DD] font-mono font-normal">{filteredCount}</strong> shown
          </span>
        </div>
      </div>
    </header>
  );
}
