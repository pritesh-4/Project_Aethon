import type { ArchivedObservation } from '../types.ts';
import { cn } from '@/lib/utils.ts';

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
          <span className="inline-flex items-center gap-1.5 text-xs text-[#D4864A] font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D4864A]" />
            <span>REVIEW</span>
          </span>
        );
      case 'candidate':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#E6E4DD] font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D4864A]" />
            <span>CANDIDATE</span>
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#C84A4A] font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C84A4A]" />
            <span>FAIL</span>
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#767973] font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-[#666963]" />
            <span>ARCHIVED</span>
          </span>
        );
      case 'analyzed':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#848780] font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-[#529E72]" />
            <span>ANALYZED</span>
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
        'group relative w-full text-left transition-colors duration-150 cursor-pointer select-none px-3.5 py-2.5 outline-none font-sans',
        'focus-visible:ring-1 focus-visible:ring-[#D4864A] focus-visible:ring-inset',
        isSelected ? 'bg-[#181B19] text-[#E6E4DD]' : 'hover:bg-[#141615] text-[#9A9C96]'
      )}
    >
      {/* Active Left Indicator */}
      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[#D4864A]" />}

      {/* Desktop 5-Column Ledger Row */}
      <div className="hidden sm:grid sm:grid-cols-12 sm:items-center sm:gap-2 text-xs">
        {/* 1. Date */}
        <div className="col-span-3 text-[#767973] font-mono tabular-nums truncate">
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
        <div className="col-span-2 text-[#848780] font-mono text-[11px]">
          {observation.candidates.length === 1
            ? '1 event'
            : `${observation.candidates.length} events`}
        </div>

        {/* 4. Highest Priority */}
        <div className="col-span-2">
          {highestPriority === 'HIGH' && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#D4864A] bg-[#221B16] px-1.5 py-0.5 rounded-[2px] border border-[#D4864A]/30">
              HIGH
            </span>
          )}
          {highestPriority === 'MEDIUM' && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#9A9C96] bg-[#181B19] px-1.5 py-0.5 rounded-[2px] border border-[#242825]">
              MED
            </span>
          )}
          {highestPriority === 'LOW' && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#666963] bg-[#121413] px-1.5 py-0.5 rounded-[2px] border border-[#242825]">
              LOW
            </span>
          )}
          {!highestPriority && <span className="text-[#555852] text-xs font-mono">—</span>}
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

        <div className="flex items-center justify-between text-[11px] text-[#848780]">
          <span className="font-mono tabular-nums">{dateDisplay}</span>
          <div className="flex items-center gap-2">
            <span className="font-mono">
              {observation.candidates.length === 1
                ? '1 event'
                : `${observation.candidates.length} events`}
            </span>
            {highestPriority && (
              <span
                className={cn(
                  'text-[10px] font-mono',
                  highestPriority === 'HIGH' ? 'text-[#D4864A]' : 'text-[#848780]'
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
