import { ChevronRight } from 'lucide-react';
import type { ArchivedObservation } from '../types.ts';
import { cn } from '@/lib/utils.ts';

export interface ObservationRecordProps {
  observation: ArchivedObservation;
  isSelected: boolean;
  onSelect: (observation: ArchivedObservation) => void;
}

export function ObservationRecord({ observation, isSelected, onSelect }: ObservationRecordProps) {
  // Status indicator styling
  const renderStatus = () => {
    switch (observation.status) {
      case 'review':
        return (
          <span className="inline-flex items-center gap-1.5 text-[#E8AE50] font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E8AE50]" />
            <span>Under review</span>
          </span>
        );
      case 'candidate':
        return (
          <span className="inline-flex items-center gap-1.5 text-[#5BD8F5] font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5BD8F5]" />
            <span>Candidate event</span>
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 text-[#D95C5C] font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D95C5C]" />
            <span>Failed</span>
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1.5 text-slate-500 font-normal">
            <span className="h-1.5 w-1.5 rounded-full border border-slate-600 bg-transparent" />
            <span>Archived</span>
          </span>
        );
      case 'analyzed':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-slate-400 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
            <span>Analyzed</span>
          </span>
        );
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-selected={isSelected}
      onClick={() => onSelect(observation)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(observation);
        }
      }}
      className={cn(
        'group relative w-full text-left font-mono transition-all duration-150 outline-none cursor-pointer select-none rounded-[2px]',
        'border',
        isSelected
          ? 'border-[#5BD8F5]/60 bg-[#10161D]'
          : 'border-[#1C2630] bg-[#0B0F14] hover:border-slate-700 hover:bg-[#10161D]'
      )}
    >
      {/* Active Left Indicator Bar */}
      {isSelected && <div className="absolute -left-[1px] top-0 bottom-0 w-[3px] bg-[#5BD8F5]" />}

      {/* Main Specimen Grid */}
      <div className="p-3 sm:p-3.5">
        {/* Row 1: Observation ID, Target, and Status */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1C2630] pb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500">Observation</span>
              <span
                className={cn(
                  'text-xs font-semibold tracking-wider',
                  isSelected ? 'text-[#5BD8F5]' : 'text-[#E6EDF2]'
                )}
              >
                {observation.id}
              </span>
            </div>

            <span className="text-slate-700 hidden sm:inline">·</span>

            <span className="text-[10px] text-[#7F8B95] truncate max-w-[200px] sm:max-w-[260px]">
              {observation.targetName}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px]">
            {renderStatus()}
            <ChevronRight
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-150',
                isSelected
                  ? 'text-[#5BD8F5] translate-x-0.5 opacity-100'
                  : 'text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'
              )}
            />
          </div>
        </div>

        {/* Row 2: Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2.5 text-[10px]">
          {/* TIMESTAMP */}
          <div>
            <span className="block text-[9px] text-slate-500">Timestamp</span>
            <span className="text-[#E6EDF2] tabular-nums font-mono text-[10px]">
              {observation.timestamp}
            </span>
          </div>

          {/* FREQUENCY */}
          <div>
            <span className="block text-[9px] text-slate-500">Frequency</span>
            <span className="text-[#E6EDF2] tabular-nums font-mono text-[10px]">
              {observation.frequency.toFixed(2)} MHz
            </span>
          </div>

          {/* DURATION */}
          <div>
            <span className="block text-[9px] text-slate-500">Duration</span>
            <span className="text-[#E6EDF2] tabular-nums font-mono text-[10px]">
              {observation.durationString}
            </span>
          </div>

          {/* ANOMALOUS REGIONS */}
          <div>
            <span className="block text-[9px] text-slate-500">Anomalous regions</span>
            <span
              className={cn(
                'tabular-nums font-mono text-[10px] font-semibold',
                observation.anomalousRegions > 0 ? 'text-[#E8AE50]' : 'text-slate-400'
              )}
            >
              {observation.anomalousRegions > 0
                ? `${observation.anomalousRegions}`
                : 'None detected'}
            </span>
          </div>

          {/* TOP CANDIDATE */}
          <div>
            <span className="block text-[9px] text-slate-500">Top candidate</span>
            {observation.topCandidate ? (
              <span className="text-[#5BD8F5] font-mono text-[10px] font-semibold">
                {observation.topCandidate}
              </span>
            ) : (
              <span className="text-slate-600 font-mono text-[10px]">None</span>
            )}
          </div>
        </div>

        {/* Bottom Status / Candidates Count Readout if candidates exist */}
        {observation.candidates.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-[#1C2630]/60 flex items-center justify-between text-[9px] text-[#7F8B95]">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Candidates:</span>
              <span className="text-[#E6EDF2] font-semibold">{observation.candidates.length}</span>
              <span className="text-slate-700">·</span>
              <span className="text-slate-500">High priority:</span>
              <span className="text-[#E8AE50] font-semibold">
                {observation.highPriorityCandidates}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {observation.candidates.map((cand) => (
                <span
                  key={cand.id}
                  className={cn(
                    'px-1 py-0.2 rounded-[1px] text-[8px] font-mono border',
                    cand.priority === 'HIGH'
                      ? 'border-[#E8AE50]/40 bg-[#E8AE50]/10 text-[#E8AE50]'
                      : cand.priority === 'MEDIUM'
                        ? 'border-cyan-800/40 bg-cyan-950/20 text-cyan-300'
                        : 'border-[#1C2630] bg-[#10161D] text-slate-400'
                  )}
                >
                  {cand.label}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
