import type { ArchivedObservation } from '../types.ts';
import { cn } from '@/lib/utils.ts';
import { Badge } from '@/components/ui/Badge.tsx';

export interface ObservationRecordProps {
  observation: ArchivedObservation;
  isSelected: boolean;
  onSelect: (observation: ArchivedObservation) => void;
}

export function ObservationRecord({ observation, isSelected, onSelect }: ObservationRecordProps) {
  // 1. Highest Priority computation
  const getHighestPriority = (): 'HIGH' | 'MEDIUM' | 'LOW' | null => {
    if (!observation.candidates || observation.candidates.length === 0) return null;
    if (observation.candidates.some((c) => c.priority === 'HIGH')) return 'HIGH';
    if (observation.candidates.some((c) => c.priority === 'MEDIUM')) return 'MEDIUM';
    if (observation.candidates.some((c) => c.priority === 'LOW')) return 'LOW';
    return null;
  };

  const highestPriority = getHighestPriority();

  // 2. Status Label & styling
  const renderStatus = () => {
    switch (observation.status) {
      case 'review':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#D4864A]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D4864A]" />
            <span>Under review</span>
          </span>
        );
      case 'candidate':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#E6E4DD]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D4864A]" />
            <span>Candidate event</span>
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#C84A4A]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C84A4A]" />
            <span>Failed</span>
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#9A9C96]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#666963]" />
            <span>Archived</span>
          </span>
        );
      case 'analyzed':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#9A9C96]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#529E72]" />
            <span>Analyzed</span>
          </span>
        );
    }
  };

  const dateDisplay = observation.timestamp.replace(' UTC', '').slice(0, 16);

  return (
    <button
      type="button"
      aria-selected={isSelected}
      onClick={() => onSelect(observation)}
      className={cn(
        'group relative w-full text-left transition-colors duration-150 cursor-pointer select-none rounded-[2px] border px-3 py-2.5 outline-none',
        'focus-visible:ring-1 focus-visible:ring-[#D4864A] focus-visible:border-[#D4864A]',
        isSelected
          ? 'border-[#D4864A]/60 bg-[#1A1E1B]'
          : 'border-[#242825] bg-[#141715] hover:border-[#2E332F] hover:bg-[#181B19]'
      )}
    >
      {/* Active Left Indicator */}
      {isSelected && <div className="absolute -left-[1px] top-0 bottom-0 w-[2px] bg-[#D4864A]" />}

      {/* Desktop 5-Column Ledger Row */}
      <div className="hidden sm:grid sm:grid-cols-12 sm:items-center sm:gap-2 text-xs">
        {/* 1. Date */}
        <div className="col-span-3 text-[#9A9C96] font-mono tabular-nums truncate">
          {dateDisplay}
        </div>

        {/* 2. Observation ID */}
        <div
          className={cn(
            'col-span-3 font-mono font-medium transition-colors truncate',
            isSelected ? 'text-[#D4864A]' : 'text-[#E6E4DD] group-hover:text-[#D4864A]'
          )}
        >
          {observation.id}
        </div>

        {/* 3. Candidate Count */}
        <div className="col-span-2 text-[#9A9C96]">
          {observation.candidates.length === 1
            ? '1 candidate'
            : `${observation.candidates.length} candidates`}
        </div>

        {/* 4. Highest Priority */}
        <div className="col-span-2">
          {highestPriority === 'HIGH' && <Badge variant="copper">High</Badge>}
          {highestPriority === 'MEDIUM' && <Badge variant="slate">Medium</Badge>}
          {highestPriority === 'LOW' && <Badge variant="neutral">Low</Badge>}
          {!highestPriority && <span className="text-[#666963] text-xs">—</span>}
        </div>

        {/* 5. Status */}
        <div className="col-span-2 flex justify-start sm:justify-end">{renderStatus()}</div>
      </div>

      {/* Mobile Stacked 5-Field View */}
      <div className="sm:hidden space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              'font-mono font-medium',
              isSelected ? 'text-[#D4864A]' : 'text-[#E6E4DD]'
            )}
          >
            {observation.id}
          </span>
          {renderStatus()}
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#9A9C96]">
          <span className="font-mono tabular-nums">{dateDisplay}</span>
          <div className="flex items-center gap-2">
            <span>
              {observation.candidates.length === 1
                ? '1 candidate'
                : `${observation.candidates.length} cand.`}
            </span>
            {highestPriority && (
              <span
                className={cn(
                  'text-[10px] font-medium',
                  highestPriority === 'HIGH' ? 'text-[#D4864A]' : 'text-[#9A9C96]'
                )}
              >
                [{highestPriority}]
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
