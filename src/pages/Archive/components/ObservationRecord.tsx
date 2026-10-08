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
          <span className="inline-flex items-center gap-1.5 text-xs text-[#9E6E20] font-mono font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C19348]" />
            <span>REVIEW</span>
          </span>
        );
      case 'candidate':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#376A9B] font-mono font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-[#376A9B]" />
            <span>CANDIDATE</span>
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#B64B4B] font-mono font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-[#B64B4B]" />
            <span>FAIL</span>
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#76828D] font-mono">
            <span className="h-1.5 w-1.5 rounded-full bg-[#76828D]" />
            <span>ARCHIVED</span>
          </span>
        );
      case 'analyzed':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#3D7D54] font-mono font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-[#3D7D54]" />
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
        'group relative w-full text-left transition-colors duration-150 cursor-pointer select-none px-3.5 py-3 outline-none font-sans',
        'focus-visible:ring-1 focus-visible:ring-[#376A9B] focus-visible:ring-inset',
        isSelected ? 'bg-[#EAE7E0] text-[#17202A]' : 'hover:bg-[#F4F1EA] text-[#56616A]'
      )}
    >
      {/* Active Left Indicator */}
      {isSelected && <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#376A9B]" />}

      {/* Desktop 5-Column Ledger Row */}
      <div className="hidden sm:grid sm:grid-cols-12 sm:items-center sm:gap-2 text-xs">
        {/* 1. Date */}
        <div className="col-span-3 text-[#56616A] font-mono tabular-nums truncate">
          {dateDisplay}
        </div>

        {/* 2. Observation ID */}
        <div
          className={cn(
            'col-span-3 font-mono font-semibold transition-colors truncate',
            isSelected ? 'text-[#376A9B]' : 'text-[#17202A] group-hover:text-[#376A9B]'
          )}
        >
          {observation.id}
        </div>

        {/* 3. Candidate Count */}
        <div className="col-span-2 text-[#56616A] font-mono text-[11px]">
          {observation.candidates.length === 1
            ? '1 event'
            : `${observation.candidates.length} events`}
        </div>

        {/* 4. Highest Priority */}
        <div className="col-span-2">
          {highestPriority === 'HIGH' && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#9E6E20] bg-[#FDF6E9] px-2 py-0.5 rounded-[2px] border border-[#E8CFA0] font-semibold">
              HIGH
            </span>
          )}
          {highestPriority === 'MEDIUM' && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#56616A] bg-[#EAE7E0] px-2 py-0.5 rounded-[2px] border border-[#D6D2C9]">
              MED
            </span>
          )}
          {highestPriority === 'LOW' && (
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#76828D] bg-[#F4F1EA] px-2 py-0.5 rounded-[2px] border border-[#D6D2C9]">
              LOW
            </span>
          )}
          {!highestPriority && <span className="text-[#B8B3A8] text-xs font-mono">—</span>}
        </div>

        {/* 5. Status */}
        <div className="col-span-2 flex justify-start sm:justify-end">{renderStatus()}</div>
      </div>

      {/* Mobile Stacked 5-Field View */}
      <div className="sm:hidden space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              'font-mono font-semibold',
              isSelected ? 'text-[#376A9B]' : 'text-[#17202A]'
            )}
          >
            {observation.id}
          </span>
          {renderStatus()}
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#56616A]">
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
                  'text-[10px] font-mono font-semibold',
                  highestPriority === 'HIGH' ? 'text-[#9E6E20]' : 'text-[#56616A]'
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
