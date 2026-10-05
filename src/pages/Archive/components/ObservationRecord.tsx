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
          <span className="inline-flex items-center gap-1 text-[#FFB84D] font-semibold">
            <span className="h-1.5 w-1.5 rounded-none bg-[#FFB84D] animate-pulse shadow-[0_0_6px_rgba(255,184,77,0.8)]" />
            <span>REVIEW REQUIRED</span>
          </span>
        );
      case 'candidate':
        return (
          <span className="inline-flex items-center gap-1 text-[#66E3FF] font-medium">
            <span className="h-1.5 w-1.5 rounded-none bg-[#66E3FF]" />
            <span>CANDIDATE FOUND</span>
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1 text-[#FF5E5E] font-medium">
            <span className="h-1.5 w-1.5 rounded-none bg-[#FF5E5E]" />
            <span>ANALYSIS FAILED</span>
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1 text-slate-500 font-normal">
            <span className="h-1.5 w-1.5 rounded-none border border-slate-600 bg-transparent" />
            <span>ARCHIVED</span>
          </span>
        );
      case 'analyzed':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
            <span className="h-1.5 w-1.5 rounded-none bg-slate-500" />
            <span>ANALYZED</span>
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
          ? 'border-[#66E3FF]/70 bg-[#10161D] shadow-[0_0_12px_rgba(102,227,255,0.08)]'
          : 'border-slate-800/80 bg-[#0A0E13] hover:border-slate-700 hover:bg-[#0D1219]'
      )}
    >
      {/* Active Left Indicator Bar */}
      {isSelected && (
        <div className="absolute -left-[1px] top-0 bottom-0 w-[3px] bg-[#66E3FF] shadow-[0_0_8px_rgba(102,227,255,0.8)]" />
      )}

      {/* Main Specimen Grid */}
      <div className="p-3 sm:p-3.5">
        {/* Row 1: Observation ID, Target, and Status */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 tracking-wider">OBSERVATION</span>
              <span
                className={cn(
                  'text-xs font-bold tracking-wider',
                  isSelected ? 'text-[#66E3FF]' : 'text-[#EAF4F7]'
                )}
              >
                {observation.id}
              </span>
            </div>

            <span className="text-slate-700 hidden sm:inline">|</span>

            <span className="text-[10px] text-[#84929C] truncate max-w-[200px] sm:max-w-[260px]">
              {observation.targetName}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[10px]">
            {renderStatus()}
            <ChevronRight
              className={cn(
                'h-3.5 w-3.5 transition-transform duration-150',
                isSelected
                  ? 'text-[#66E3FF] translate-x-0.5 opacity-100'
                  : 'text-slate-600 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5'
              )}
            />
          </div>
        </div>

        {/* Row 2: Monospace Technical Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2.5 text-[10px]">
          {/* TIMESTAMP */}
          <div>
            <span className="block text-[9px] uppercase tracking-wider text-slate-500">
              TIMESTAMP
            </span>
            <span className="text-[#EAF4F7] tabular-nums font-mono text-[10px]">
              {observation.timestamp}
            </span>
          </div>

          {/* FREQUENCY */}
          <div>
            <span className="block text-[9px] uppercase tracking-wider text-slate-500">
              FREQUENCY
            </span>
            <span className="text-[#EAF4F7] tabular-nums font-mono text-[10px]">
              {observation.frequency.toFixed(2)} MHz
            </span>
          </div>

          {/* DURATION */}
          <div>
            <span className="block text-[9px] uppercase tracking-wider text-slate-500">
              DURATION
            </span>
            <span className="text-[#EAF4F7] tabular-nums font-mono text-[10px]">
              {observation.durationString}
            </span>
          </div>

          {/* ANOMALOUS REGIONS */}
          <div>
            <span className="block text-[9px] uppercase tracking-wider text-slate-500">
              ANOMALOUS REGIONS
            </span>
            <span
              className={cn(
                'tabular-nums font-mono text-[10px] font-semibold',
                observation.anomalousRegions > 0 ? 'text-[#FFB84D]' : 'text-slate-400'
              )}
            >
              {observation.anomalousRegions > 0
                ? `${observation.anomalousRegions} REGIONS`
                : 'NO SIGNIFICANT ANOMALY'}
            </span>
          </div>

          {/* TOP CANDIDATE */}
          <div>
            <span className="block text-[9px] uppercase tracking-wider text-slate-500">
              TOP CANDIDATE
            </span>
            {observation.topCandidate ? (
              <span className="text-[#66E3FF] font-mono text-[10px] font-semibold">
                {observation.topCandidate}
              </span>
            ) : (
              <span className="text-slate-600 font-mono text-[10px]">NONE RECORDED</span>
            )}
          </div>
        </div>

        {/* Subtle Bottom Status / Candidates Count Readout if candidates exist */}
        {observation.candidates.length > 0 && (
          <div className="mt-2.5 pt-2 border-t border-slate-900/60 flex items-center justify-between text-[9px] text-[#84929C]">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">CANDIDATES IDENTIFIED:</span>
              <span className="text-[#EAF4F7] font-semibold">{observation.candidates.length}</span>
              <span className="text-slate-700">//</span>
              <span className="text-slate-500">HIGH PRIORITY:</span>
              <span className="text-[#FFB84D] font-semibold">
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
                      ? 'border-[#FFB84D]/40 bg-[#FFB84D]/10 text-[#FFB84D]'
                      : cand.priority === 'MEDIUM'
                        ? 'border-cyan-800/40 bg-cyan-950/20 text-cyan-300'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400'
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
