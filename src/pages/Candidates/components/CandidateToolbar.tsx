import type { CandidateFilterState } from '../types.ts';
import { Search, Filter, ArrowUpDown } from 'lucide-react';

export interface CandidateToolbarProps {
  filters: CandidateFilterState;
  onFilterChange: (newFilters: CandidateFilterState) => void;
  totalCount: number;
  filteredCount: number;
}

export function CandidateToolbar({
  filters,
  onFilterChange,
  totalCount,
  filteredCount,
}: CandidateToolbarProps) {
  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-2.5 font-mono text-xs select-none">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-500" />
        <input
          type="text"
          value={filters.searchQuery}
          onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
          placeholder="SEARCH CANDIDATE ID, FREQUENCY, TARGET..."
          className="h-8 w-full rounded-[2px] border border-slate-700/80 bg-[#05070A] pl-8 pr-3 text-xs text-[#EAF4F7] placeholder-slate-500 focus:border-[#66E3FF] focus:outline-none transition-colors"
        />
      </div>

      {/* Filter & Sort Controls */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Priority Filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="h-3 w-3 text-slate-500" />
          <span className="text-[10px] text-[#84929C] uppercase">PRIORITY:</span>
          <select
            value={filters.priorityFilter}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                priorityFilter: e.target.value as CandidateFilterState['priorityFilter'],
              })
            }
            aria-label="Filter by priority"
            className="h-7 rounded-[2px] border border-slate-700/80 bg-[#05070A] px-2 text-[11px] font-mono text-[#EAF4F7] focus:border-[#66E3FF] focus:outline-none transition-colors cursor-pointer"
          >
            <option value="ALL">ALL PRIORITIES</option>
            <option value="HIGH">HIGH PRIORITY (AMBER)</option>
            <option value="MEDIUM">MEDIUM PRIORITY</option>
            <option value="LOW">LOW PRIORITY</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="flex items-center gap-1.5">
          <ArrowUpDown className="h-3 w-3 text-slate-500" />
          <span className="text-[10px] text-[#84929C] uppercase">SORT:</span>
          <select
            value={filters.sortBy}
            onChange={(e) =>
              onFilterChange({
                ...filters,
                sortBy: e.target.value as CandidateFilterState['sortBy'],
              })
            }
            aria-label="Sort candidates"
            className="h-7 rounded-[2px] border border-slate-700/80 bg-[#05070A] px-2 text-[11px] font-mono text-[#66E3FF] focus:border-[#66E3FF] focus:outline-none transition-colors cursor-pointer"
          >
            <option value="priority">INVESTIGATION PRIORITY</option>
            <option value="anomalyIndex">ANOMALY INDEX (HIGHEST)</option>
            <option value="persistence">PERSISTENCE</option>
            <option value="snr">SIGNAL-TO-NOISE (SNR)</option>
            <option value="frequency">FREQUENCY</option>
          </select>
        </div>

        {/* Counter */}
        <div className="text-[10px] text-slate-500 pl-1 hidden sm:inline">
          SHOWING <strong className="text-slate-300 font-semibold">{filteredCount}</strong> OF{' '}
          {totalCount}
        </div>
      </div>
    </div>
  );
}
