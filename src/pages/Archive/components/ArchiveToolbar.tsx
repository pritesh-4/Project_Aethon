import { Search, X, RotateCcw, ArrowUpDown } from 'lucide-react';
import type { ArchiveFilterState, ArchiveSortOption, ArchiveStatus } from '../types.ts';

export interface ArchiveToolbarProps {
  filters: ArchiveFilterState;
  onFilterChange: (filters: ArchiveFilterState) => void;
  availableDates: string[];
  totalRecords: number;
  filteredCount: number;
}

export function ArchiveToolbar({
  filters,
  onFilterChange,
  availableDates,
  totalRecords,
  filteredCount,
}: ArchiveToolbarProps) {
  const hasActiveFilters =
    filters.searchQuery !== '' ||
    filters.dateFilter !== 'ALL' ||
    filters.statusFilter !== 'ALL' ||
    filters.priorityFilter !== 'ALL' ||
    filters.sortBy !== 'newest';

  const resetFilters = () => {
    onFilterChange({
      searchQuery: '',
      dateFilter: 'ALL',
      statusFilter: 'ALL',
      anomalyFilter: 'ALL',
      priorityFilter: 'ALL',
      sortBy: 'newest',
    });
  };

  return (
    <div className="border-b border-[#D6D2C9] bg-[#EAE7E0] px-4 py-3 sm:px-6 select-none font-sans">
      <div className="flex flex-col gap-3">
        {/* Top Line: Search Input & Result Count */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-xl">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#76828D]">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
              placeholder="Search observations by ID or date..."
              className="h-8 w-full rounded-[2px] border border-[#D6D2C9] bg-[#FFFFFF] pl-9 pr-8 text-xs text-[#17202A] placeholder:text-[#76828D] focus:border-[#376A9B] focus:outline-none focus:ring-1 focus:ring-[#376A9B] transition-colors font-mono"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-[#76828D] hover:text-[#17202A] transition-colors"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-[#56616A] justify-between sm:justify-end">
            <div>
              <span>Observations: </span>
              <span className="font-mono text-[#17202A] font-semibold tabular-nums">
                {filteredCount}
              </span>
              <span className="text-[#D6D2C9]"> / </span>
              <span className="tabular-nums font-mono text-[#76828D]">{totalRecords}</span>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-[11px] text-[#376A9B] hover:underline cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Line: Clean Filters & Sorting */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 border-t border-[#D6D2C9] text-xs text-[#56616A]">
          {/* DATE Filter */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="filter-date" className="text-[11px] text-[#56616A]">
              Date:
            </label>
            <select
              id="filter-date"
              value={filters.dateFilter}
              onChange={(e) => onFilterChange({ ...filters, dateFilter: e.target.value })}
              className="h-8 rounded-[2px] border border-[#D6D2C9] bg-[#FFFFFF] px-2 text-xs text-[#17202A] focus:border-[#376A9B] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#376A9B] font-mono cursor-pointer"
            >
              <option value="ALL">All dates</option>
              {availableDates.map((date) => (
                <option key={date} value={date}>
                  {date}
                </option>
              ))}
            </select>
          </div>

          {/* STATUS Filter */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="filter-status" className="text-[11px] text-[#56616A]">
              Status:
            </label>
            <select
              id="filter-status"
              value={filters.statusFilter}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  statusFilter: e.target.value as ArchiveStatus | 'ALL',
                })
              }
              className="h-8 rounded-[2px] border border-[#D6D2C9] bg-[#FFFFFF] px-2 text-xs text-[#17202A] focus:border-[#376A9B] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#376A9B] cursor-pointer"
            >
              <option value="ALL">All statuses</option>
              <option value="review">Under review</option>
              <option value="candidate">Candidate event</option>
              <option value="analyzed">Analyzed</option>
              <option value="archived">Archived</option>
              <option value="error">Failed</option>
            </select>
          </div>

          {/* PRIORITY Filter */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="filter-priority" className="text-[11px] text-[#56616A]">
              Priority:
            </label>
            <select
              id="filter-priority"
              value={filters.priorityFilter}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  priorityFilter: e.target.value as ArchiveFilterState['priorityFilter'],
                })
              }
              className="h-8 rounded-[2px] border border-[#D6D2C9] bg-[#FFFFFF] px-2 text-xs text-[#17202A] focus:border-[#376A9B] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#376A9B] cursor-pointer"
            >
              <option value="ALL">All priorities</option>
              <option value="HIGH">High priority</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="hidden lg:block lg:flex-1" />

          {/* SORTING Control */}
          <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
            <label
              htmlFor="sort-archive"
              className="flex items-center gap-1 text-[11px] text-[#56616A]"
            >
              <ArrowUpDown className="h-3 w-3" />
              <span>Sort:</span>
            </label>
            <select
              id="sort-archive"
              value={filters.sortBy}
              onChange={(e) =>
                onFilterChange({ ...filters, sortBy: e.target.value as ArchiveSortOption })
              }
              className="h-8 rounded-[2px] border border-[#D6D2C9] bg-[#FFFFFF] px-2 text-xs text-[#17202A] focus:border-[#376A9B] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#376A9B] cursor-pointer"
            >
              <option value="newest">Most recent</option>
              <option value="oldest">Oldest first</option>
              <option value="candidateCount">Candidate count</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
