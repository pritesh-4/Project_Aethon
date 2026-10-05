import { RotateCcw, SearchX } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';

export interface ArchiveEmptyStateProps {
  searchQuery?: string;
  onClearFilters: () => void;
}

export function ArchiveEmptyState({ searchQuery, onClearFilters }: ArchiveEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-10 text-center font-mono select-none my-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[2px] border border-slate-800 bg-[#05070A] text-slate-500">
        <SearchX className="h-6 w-6 text-slate-400" />
      </div>

      {searchQuery ? (
        <div className="space-y-3 max-w-md">
          <div className="text-xs uppercase tracking-widest text-[#66E3FF]">
            QUERY // {searchQuery}
          </div>
          <div className="text-sm font-bold tracking-wider text-[#EAF4F7]">
            0 MATCHING OBSERVATIONS
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed uppercase">
            NO OBSERVATIONS MATCH THE CURRENT QUERY.
            <br />
            ADJUST THE SEARCH PARAMETERS OR CLEAR THE ACTIVE FILTERS.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="sm"
              onClick={onClearFilters}
              icon={<RotateCcw className="h-3 w-3" />}
            >
              CLEAR SEARCH
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 max-w-md">
          <div className="text-sm font-bold tracking-wider text-[#EAF4F7]">
            NO OBSERVATIONS MATCH THE CURRENT FILTER CRITERIA
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed uppercase">
            ADJUST THE ACTIVE STATUS, DATE, OR PRIORITY FILTERS TO DISPLAY REGISTRY SPECIMENS.
          </p>
          <div className="pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={onClearFilters}
              icon={<RotateCcw className="h-3 w-3" />}
            >
              RESET ALL FILTERS
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
