import { Search, X, RotateCcw, Filter, ArrowUpDown } from 'lucide-react';
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
    filters.anomalyFilter !== 'ALL' ||
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
    <div className="border-b border-slate-800/80 bg-[#0A0E13] px-4 py-3 sm:px-6 select-none font-mono">
      <div className="flex flex-col gap-3">
        {/* Top Line: Search Input & Result Count */}
        <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-xl">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Search className="h-3.5 w-3.5" />
            </div>
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
              placeholder="SEARCH ARCHIVE [ OBSERVATION ID / FREQUENCY / DATE / CANDIDATE ]"
              className="h-8 w-full rounded-[2px] border border-slate-800 bg-[#05070A] pl-9 pr-8 text-xs text-[#EAF4F7] placeholder:text-slate-600 focus:border-[#66E3FF]/70 focus:outline-none focus:ring-1 focus:ring-[#66E3FF]/30 transition-colors uppercase font-mono"
            />
            {filters.searchQuery && (
              <button
                type="button"
                onClick={() => onFilterChange({ ...filters, searchQuery: '' })}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-500 hover:text-[#EAF4F7] transition-colors"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 text-[10px] text-[#84929C] justify-between sm:justify-end">
            <div>
              <span>REGISTRY RECORDS: </span>
              <span className="font-semibold text-[#EAF4F7] tabular-nums">{filteredCount}</span>
              <span className="text-slate-600"> / </span>
              <span className="tabular-nums text-slate-500">{totalRecords}</span>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors underline-offset-2 hover:underline cursor-pointer"
              >
                <RotateCcw className="h-2.5 w-2.5" />
                <span>RESET FILTERS</span>
              </button>
            )}
          </div>
        </div>

        {/* Bottom Line: Filters & Sorting Controls */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 border-t border-slate-900/80 text-[11px]">
          {/* Filter Group Label */}
          <div className="hidden md:flex items-center gap-1.5 text-slate-500 text-[10px] uppercase tracking-wider">
            <Filter className="h-3 w-3" />
            <span>FILTER:</span>
          </div>

          {/* DATE Filter */}
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="filter-date"
              className="text-[10px] uppercase tracking-wider text-slate-500"
            >
              DATE
            </label>
            <select
              id="filter-date"
              value={filters.dateFilter}
              onChange={(e) => onFilterChange({ ...filters, dateFilter: e.target.value })}
              className="h-7 rounded-[2px] border border-slate-800 bg-[#05070A] px-2 text-[10px] text-[#EAF4F7] focus:border-[#66E3FF]/70 focus:outline-none uppercase font-mono cursor-pointer"
            >
              <option value="ALL">ALL DATES</option>
              {availableDates.map((date) => (
                <option key={date} value={date}>
                  {date}
                </option>
              ))}
            </select>
          </div>

          {/* STATUS Filter */}
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="filter-status"
              className="text-[10px] uppercase tracking-wider text-slate-500"
            >
              STATUS
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
              className="h-7 rounded-[2px] border border-slate-800 bg-[#05070A] px-2 text-[10px] text-[#EAF4F7] focus:border-[#66E3FF]/70 focus:outline-none uppercase font-mono cursor-pointer"
            >
              <option value="ALL">ALL STATUSES</option>
              <option value="review">REVIEW REQUIRED</option>
              <option value="candidate">CANDIDATE FOUND</option>
              <option value="analyzed">ANALYZED</option>
              <option value="archived">ARCHIVED</option>
              <option value="error">ANALYSIS FAILED</option>
            </select>
          </div>

          {/* ANOMALY Filter */}
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="filter-anomaly"
              className="text-[10px] uppercase tracking-wider text-slate-500"
            >
              ANOMALY
            </label>
            <select
              id="filter-anomaly"
              value={filters.anomalyFilter}
              onChange={(e) =>
                onFilterChange({
                  ...filters,
                  anomalyFilter: e.target.value as ArchiveFilterState['anomalyFilter'],
                })
              }
              className="h-7 rounded-[2px] border border-slate-800 bg-[#05070A] px-2 text-[10px] text-[#EAF4F7] focus:border-[#66E3FF]/70 focus:outline-none uppercase font-mono cursor-pointer"
            >
              <option value="ALL">ANY</option>
              <option value="ANOMALOUS">ANOMALOUS (&gt;0)</option>
              <option value="HIGH">HIGH ANOMALY (&ge;10)</option>
              <option value="NONE">NO ANOMALY (0)</option>
            </select>
          </div>

          {/* PRIORITY Filter */}
          <div className="flex items-center gap-1.5">
            <label
              htmlFor="filter-priority"
              className="text-[10px] uppercase tracking-wider text-slate-500"
            >
              PRIORITY
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
              className="h-7 rounded-[2px] border border-slate-800 bg-[#05070A] px-2 text-[10px] text-[#EAF4F7] focus:border-[#66E3FF]/70 focus:outline-none uppercase font-mono cursor-pointer"
            >
              <option value="ALL">ALL</option>
              <option value="HIGH">HIGH PRIORITY</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>

          {/* Spacer */}
          <div className="hidden lg:block lg:flex-1" />

          {/* SORTING Control */}
          <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
            <label
              htmlFor="sort-archive"
              className="flex items-center gap-1 text-[10px] uppercase tracking-wider text-slate-500"
            >
              <ArrowUpDown className="h-2.5 w-2.5" />
              <span>SORT:</span>
            </label>
            <select
              id="sort-archive"
              value={filters.sortBy}
              onChange={(e) =>
                onFilterChange({ ...filters, sortBy: e.target.value as ArchiveSortOption })
              }
              className="h-7 rounded-[2px] border border-slate-800 bg-[#05070A] px-2 text-[10px] text-[#EAF4F7] focus:border-[#66E3FF]/70 focus:outline-none uppercase font-mono cursor-pointer"
            >
              <option value="newest">MOST RECENT</option>
              <option value="oldest">OLDEST FIRST</option>
              <option value="anomalyIndex">ANOMALY INDEX</option>
              <option value="candidateCount">CANDIDATE COUNT</option>
              <option value="priority">INVESTIGATION PRIORITY</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
