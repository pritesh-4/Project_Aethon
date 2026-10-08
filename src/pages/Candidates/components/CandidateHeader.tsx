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
    <header className="border-b border-[#1C2630] bg-[#0B0F14] px-4 sm:px-6 py-3 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Title and Context */}
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold tracking-tight text-[#E6EDF2]">
              Candidate triage
            </h1>
            <span className="text-[#7F8B95]">•</span>
            <span className="text-xs text-[#7F8B95] font-mono">{observationId}</span>
          </div>
          <p className="text-xs text-[#7F8B95]">
            {totalIdentified} events detected • {highPriorityCount} prioritized for immediate review
          </p>
        </div>

        {/* Search & Priority Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quick Search */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#7F8B95]" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
              placeholder="Search candidate ID..."
              className="h-8 w-full sm:w-56 rounded border border-[#1C2630] bg-[#06080B] pl-8 pr-2.5 text-xs text-[#E6EDF2] placeholder-[#7F8B95] focus:border-[#5BD8F5] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5] transition-colors font-mono"
            />
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 text-xs text-[#7F8B95]">
            <Filter className="h-3.5 w-3.5 text-[#7F8B95]" />
            <select
              value={filters.priorityFilter}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  priorityFilter: e.target.value as CandidateFilterState['priorityFilter'],
                })
              }
              aria-label="Filter candidates by priority"
              className="h-8 rounded border border-[#1C2630] bg-[#10161D] px-2 text-xs text-[#E6EDF2] focus:border-[#5BD8F5] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5] transition-colors cursor-pointer"
            >
              <option value="ALL">All priorities ({totalCount})</option>
              <option value="HIGH">High priority ({highPriorityCount})</option>
              <option value="MEDIUM">Medium priority</option>
              <option value="LOW">Low priority</option>
            </select>
          </div>

          <span className="text-xs text-[#7F8B95] pl-1 hidden sm:inline">
            Showing <strong className="text-[#E6EDF2] font-mono">{filteredCount}</strong>
          </span>
        </div>
      </div>
    </header>
  );
}
