import { RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';

export interface ArchiveEmptyStateProps {
  searchQuery?: string;
  onClearFilters: () => void;
}

export function ArchiveEmptyState({ searchQuery, onClearFilters }: ArchiveEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[3px] border border-[#D6D2C9] bg-[#FAF8F5] p-10 text-center select-none my-6 shadow-xs font-sans">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[2px] border border-[#D6D2C9] bg-[#EAE7E0] text-[#76828D]">
        <Search className="h-4 w-4 text-[#56616A]" />
      </div>

      <div className="space-y-3 max-w-md">
        <h3 className="text-sm font-semibold text-[#17202A]">
          No matching observation records found
        </h3>

        <p className="text-xs text-[#56616A] leading-relaxed">
          {searchQuery ? (
            <>
              No archived records matched{' '}
              <span className="text-[#376A9B] font-mono font-medium">"{searchQuery}"</span>. Try
              adjusting the observation ID format or resetting date and status filters.
            </>
          ) : (
            <>
              No archived observations match the current filter criteria. Adjust status, date, or
              priority parameters to view historical records.
            </>
          )}
        </p>

        <div className="pt-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onClearFilters}
            icon={<RotateCcw className="h-3.5 w-3.5" />}
          >
            Reset search and filters
          </Button>
        </div>
      </div>
    </div>
  );
}
