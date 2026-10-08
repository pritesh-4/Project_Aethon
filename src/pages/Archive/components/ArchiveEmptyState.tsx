import { RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';

export interface ArchiveEmptyStateProps {
  searchQuery?: string;
  onClearFilters: () => void;
}

export function ArchiveEmptyState({ searchQuery, onClearFilters }: ArchiveEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded border border-[#1C2630] bg-[#0B0F14] p-10 text-center font-mono select-none my-6">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded border border-[#1C2630] bg-[#06080B] text-[#7F8B95]">
        <Search className="h-4 w-4 text-[#7F8B95]" />
      </div>

      <div className="space-y-3 max-w-md">
        <h3 className="text-sm font-semibold tracking-wide text-[#E6EDF2] uppercase">
          No observations match your search.
        </h3>

        <p className="text-xs text-[#7F8B95] leading-relaxed">
          {searchQuery ? (
            <>
              No archived records matched <span className="text-[#5BD8F5]">"{searchQuery}"</span>.
              Try checking the observation ID format or removing date and status filters.
            </>
          ) : (
            <>
              No archived observations match the selected filters. Adjust status, date, or priority
              criteria to view historical records.
            </>
          )}
        </p>

        <div className="pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearFilters}
            icon={<RotateCcw className="h-3 w-3" />}
          >
            Reset search and filters
          </Button>
        </div>
      </div>
    </div>
  );
}
