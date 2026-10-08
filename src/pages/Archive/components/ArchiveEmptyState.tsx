import { RotateCcw, Search } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';

export interface ArchiveEmptyStateProps {
  searchQuery?: string;
  onClearFilters: () => void;
}

export function ArchiveEmptyState({ searchQuery, onClearFilters }: ArchiveEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[2px] border border-[#242825] bg-[#141715] p-10 text-center select-none my-6">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-[2px] border border-[#242825] bg-[#1A1E1B] text-[#666963]">
        <Search className="h-4 w-4 text-[#9A9C96]" />
      </div>

      <div className="space-y-3 max-w-md">
        <h3 className="text-sm font-medium text-[#E6E4DD]">
          No matching observation records found
        </h3>

        <p className="text-xs text-[#9A9C96] leading-relaxed">
          {searchQuery ? (
            <>
              No archived records matched{' '}
              <span className="text-[#D4864A] font-mono">"{searchQuery}"</span>. Try adjusting the
              observation ID format or resetting date and status filters.
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
