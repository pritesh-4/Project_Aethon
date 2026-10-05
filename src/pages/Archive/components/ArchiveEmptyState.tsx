import { RotateCcw, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';

export interface ArchiveEmptyStateProps {
  searchQuery?: string;
  onClearFilters: () => void;
}

export function ArchiveEmptyState({ searchQuery, onClearFilters }: ArchiveEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-10 text-center font-mono select-none my-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[2px] border border-[#1C2630] bg-[#06080B] text-slate-500">
        <SearchX className="h-6 w-6 text-slate-400" />
      </div>

      {searchQuery ? (
        <div className="space-y-3 max-w-md">
          <div className="text-xs text-[#5BD8F5]">Search query: {searchQuery}</div>
          <div className="text-sm font-semibold tracking-wider text-[#E6EDF2]">
            No matching observations
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            No observations match the search parameters.
            <br />
            Adjust search terms or clear filters to view archived observations.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={onClearFilters}
              icon={<RotateCcw className="h-3 w-3" />}
            >
              Clear search
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 max-w-md">
          <div className="text-sm font-semibold tracking-wider text-[#E6EDF2]">
            No observations match the selected filters
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Adjust status, date, or priority filters to view observation records.
          </p>
          <div className="pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onClearFilters}
              icon={<RotateCcw className="h-3 w-3" />}
            >
              Reset filters
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
