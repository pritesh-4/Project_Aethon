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
          <span className="inline-flex items-center gap-1.5 text-xs text-[#E8AE50]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E8AE50]" />
            <span>Under review</span>
          </span>
        );
      case 'candidate':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#5BD8F5]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5BD8F5]" />
            <span>Candidate event</span>
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#D95C5C]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D95C5C]" />
            <span>Failed</span>
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#7F8B95]">
            <span className="h-1.5 w-1.5 rounded-full border border-slate-600" />
            <span>Archived</span>
          </span>
        );
      case 'analyzed':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-[#7F8B95]">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
            <span>Analyzed</span>
          </span>
        );
    }
  };

  // Format date display (e.g., "2026-10-05 14:42")
  const dateDisplay = observation.timestamp.replace(' UTC', '').slice(0, 16);

  return (
    <button
      type="button"
      aria-selected={isSelected}
      onClick={() => onSelect(observation)}
      className={cn(
        'group relative w-full text-left font-mono transition-colors duration-150 cursor-pointer select-none rounded border px-3 py-2.5 outline-none',
        'focus-visible:ring-1 focus-visible:ring-[#5BD8F5] focus-visible:border-[#5BD8F5]',
        isSelected
          ? 'border-[#5BD8F5] bg-[#10161D]'
          : 'border-[#1C2630] bg-[#0B0F14] hover:border-[#1C2630]/80 hover:bg-[#10161D]'
      )}
    >
      {/* Active Left Indicator */}
      {isSelected && <div className="absolute -left-[1px] top-0 bottom-0 w-[2px] bg-[#5BD8F5]" />}

      {/* Desktop 5-Column Ledger Row (Date, Observation ID, Candidate Count, Highest Priority, Status) */}
      <div className="hidden sm:grid sm:grid-cols-12 sm:items-center sm:gap-2 text-xs">
        {/* 1. Date */}
        <div className="col-span-3 text-[#7F8B95] tabular-nums truncate">{dateDisplay}</div>

        {/* 2. Observation ID */}
        <div
          className={cn(
            'col-span-3 font-semibold tracking-wider transition-colors truncate',
            isSelected ? 'text-[#5BD8F5]' : 'text-[#E6EDF2] group-hover:text-[#5BD8F5]'
          )}
        >
          {observation.id}
        </div>

        {/* 3. Candidate Count */}
        <div className="col-span-2 text-[#7F8B95] tabular-nums">
          {observation.candidates.length === 1
            ? '1 candidate'
            : `${observation.candidates.length} candidates`}
        </div>

        {/* 4. Highest Priority */}
        <div className="col-span-2">
          {highestPriority === 'HIGH' && (
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border border-[#E8AE50]/40 bg-[#E8AE50]/10 text-[#E8AE50]">
              HIGH
            </span>
          )}
          {highestPriority === 'MEDIUM' && (
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border border-[#5BD8F5]/30 bg-[#5BD8F5]/10 text-[#5BD8F5]">
              MEDIUM
            </span>
          )}
          {highestPriority === 'LOW' && (
            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-medium border border-[#1C2630] bg-[#06080B] text-[#7F8B95]">
              LOW
            </span>
          )}
          {!highestPriority && <span className="text-[#7F8B95] text-xs">—</span>}
        </div>

        {/* 5. Status */}
        <div className="col-span-2 flex justify-start sm:justify-end">{renderStatus()}</div>
      </div>

      {/* Mobile Stacked 5-Field View */}
      <div className="sm:hidden space-y-1.5 text-xs">
        <div className="flex items-center justify-between">
          <span
            className={cn(
              'font-semibold tracking-wider',
              isSelected ? 'text-[#5BD8F5]' : 'text-[#E6EDF2]'
            )}
          >
            {observation.id}
          </span>
          {renderStatus()}
        </div>

        <div className="flex items-center justify-between text-[11px] text-[#7F8B95]">
          <span className="tabular-nums">{dateDisplay}</span>
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
                  highestPriority === 'HIGH'
                    ? 'text-[#E8AE50]'
                    : highestPriority === 'MEDIUM'
                      ? 'text-[#5BD8F5]'
                      : 'text-[#7F8B95]'
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
