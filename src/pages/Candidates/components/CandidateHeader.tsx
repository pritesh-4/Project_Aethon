import type { CandidateFilterState } from '../types.ts';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

export interface CandidateHeaderProps {
  observationId: string;
  targetName: string;
  totalIdentified: number;
  highPriorityCount: number;
  filters: CandidateFilterState;
  onFilterChange: (newFilters: CandidateFilterState) => void;
  totalCount: number;
  filteredCount: number;
}

export function CandidateHeader({
  observationId,
  targetName,
  totalIdentified,
  highPriorityCount,
  filters,
  onFilterChange,
  totalCount,
  filteredCount,
}: CandidateHeaderProps) {
  return (
    <header className="border-b border-[#1C2630] bg-[#0B0F14] px-4 py-3 select-none font-sans">
      <div className="flex flex-col gap-3">
        {/* Top Line: Title & Observation Context */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <h1 className="text-sm font-semibold text-[#E6EDF2]">Candidate triage</h1>
            <span className="text-[#1C2630] hidden sm:inline">|</span>
            <span className="text-[#7F8B95]">
              Observation <span className="text-[#5BD8F5] font-mono">{observationId}</span>
            </span>
            <span className="text-[#1C2630] hidden sm:inline">|</span>
            <span className="text-[#7F8B95] truncate max-w-[200px]">{targetName}</span>
            <span className="text-[#1C2630] hidden sm:inline">|</span>
            <span className="text-xs text-[#7F8B95]">{totalIdentified} events</span>
            <span className="rounded border border-[#E8AE50]/40 bg-[#E8AE50]/10 px-2 py-0.5 text-xs font-medium text-[#E8AE50]">
              {highPriorityCount} high priority
            </span>
          </div>

          <div className="text-xs text-[#7F8B95]">
            Showing <strong className="text-[#E6EDF2] font-semibold">{filteredCount}</strong> of{' '}
            {totalCount}
          </div>
        </div>

        {/* Bottom Line: Search & Filters Toolbar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-2 border-t border-[#1C2630]/60">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
              placeholder="Search candidate ID, frequency, classification..."
              className="h-8 w-full rounded-[4px] border border-[#1C2630] bg-[#06080B] pl-8 pr-3 text-xs text-[#E6EDF2] placeholder-[#7F8B95] focus:border-[#5BD8F5] focus:outline-none transition-colors font-mono"
            />
          </div>

          {/* Filter & Sort Controls */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Priority Filter */}
            <div className="flex items-center gap-1.5 text-xs text-[#7F8B95]">
              <Filter className="h-3.5 w-3.5 text-slate-500" />
              <span>Priority:</span>
              <select
                value={filters.priorityFilter}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    priorityFilter: e.target.value as CandidateFilterState['priorityFilter'],
                  })
                }
                aria-label="Filter by priority"
                className="h-7 rounded-[4px] border border-[#1C2630] bg-[#10161D] px-2 text-xs text-[#E6EDF2] focus:border-[#5BD8F5] focus:outline-none transition-colors cursor-pointer"
              >
                <option value="ALL">All priorities</option>
                <option value="HIGH">High priority</option>
                <option value="MEDIUM">Medium priority</option>
                <option value="LOW">Low priority</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="flex items-center gap-1.5 text-xs text-[#7F8B95]">
              <ArrowUpDown className="h-3.5 w-3.5 text-slate-500" />
              <span>Sort:</span>
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  onFilterChange({
                    ...filters,
                    sortBy: e.target.value as CandidateFilterState['sortBy'],
                  })
                }
                aria-label="Sort candidates"
                className="h-7 rounded-[4px] border border-[#1C2630] bg-[#10161D] px-2 text-xs font-mono text-[#5BD8F5] focus:border-[#5BD8F5] focus:outline-none transition-colors cursor-pointer"
              >
                <option value="priority">Investigation priority</option>
                <option value="anomalyIndex">Anomaly index</option>
                <option value="persistence">Persistence</option>
                <option value="snr">Peak SNR</option>
                <option value="frequency">Frequency</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
