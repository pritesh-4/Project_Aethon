import type { CandidateSignalData } from '../types.ts';

export interface CandidateRowProps {
  candidate: CandidateSignalData;
  isSelected: boolean;
  onSelect: (candidate: CandidateSignalData) => void;
}

export function CandidateRow({ candidate, isSelected, onSelect }: CandidateRowProps) {
  const isHigh = candidate.priority === 'HIGH';

  const formatReviewState = (status: CandidateSignalData['status']) => {
    switch (status) {
      case 'REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#848780]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#848780]" />
            PENDING
          </span>
        );
      case 'INVESTIGATING':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#D4864A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4864A]" />
            IN REVIEW
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#529E72]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#529E72]" />
            CONFIRMED
          </span>
        );
      case 'FLAGGED_RFI':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#C84A4A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C84A4A]" />
            RFI
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#666963]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#666963]" />
            CATALOGED
          </span>
        );
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(candidate);
    }
  };

  return (
    <tr
      tabIndex={0}
      aria-selected={isSelected}
      onClick={() => onSelect(candidate)}
      onKeyDown={handleKeyDown}
      className={`group transition-colors cursor-pointer select-none text-xs outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A] focus-visible:ring-inset font-sans ${
        isSelected ? 'bg-[#1C1815] text-[#E6E4DD]' : 'hover:bg-[#141615] text-[#9A9C96]'
      }`}
    >
      {/* 1. CANDIDATE IDENTIFIER & TARGET */}
      <td className="py-3 px-3 sm:px-4">
        <div className="flex items-center gap-2.5">
          {isSelected ? (
            <span className="h-2 w-2 rounded-full bg-[#D4864A] shrink-0" />
          ) : isHigh ? (
            <span
              className="h-1.5 w-1.5 rounded-full bg-[#D4864A]/80 shrink-0"
              title="High priority"
            />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-transparent shrink-0" />
          )}
          <div className="flex flex-col">
            <span
              className={`font-mono text-xs font-semibold transition-colors ${
                isSelected ? 'text-[#D4864A]' : 'text-[#E6E4DD] group-hover:text-[#D4864A]'
              }`}
            >
              {candidate.id}
            </span>
            <span className="text-[11px] text-[#848780]">{candidate.targetName}</span>
          </div>
        </div>
      </td>

      {/* 2. ANOMALY EVIDENCE SUMMARY */}
      <td className="py-3 px-3">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-xs font-medium text-[#D4864A]">
              {(candidate.anomalyIndex * 100).toFixed(1)}%
            </span>
            <span className="text-[10px] text-[#767973] uppercase font-mono">anomaly</span>
          </div>
          <span className="text-[11px] text-[#848780] line-clamp-1">
            {candidate.persistence > 0.7
              ? 'Persistent carrier across baseline'
              : 'Intermittent localized structure'}
          </span>
        </div>
      </td>

      {/* 3. PRIORITY TAG */}
      <td className="py-3 px-3 text-center">
        {candidate.priority === 'HIGH' && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#D4864A] bg-[#221B16] px-1.5 py-0.5 rounded-[2px] border border-[#D4864A]/30 font-semibold">
            HIGH
          </span>
        )}
        {candidate.priority === 'MEDIUM' && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#9A9C96] bg-[#181B19] px-1.5 py-0.5 rounded-[2px] border border-[#242825]">
            MED
          </span>
        )}
        {candidate.priority === 'LOW' && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#666963] bg-[#121413] px-1.5 py-0.5 rounded-[2px] border border-[#242825]">
            LOW
          </span>
        )}
      </td>

      {/* 4. REVIEW STATE */}
      <td className="py-3 px-3 sm:px-4 text-right">{formatReviewState(candidate.status)}</td>
    </tr>
  );
}
