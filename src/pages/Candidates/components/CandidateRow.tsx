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
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#76828D]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#76828D]" />
            PENDING
          </span>
        );
      case 'INVESTIGATING':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#9E6E20] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C19348]" />
            IN REVIEW
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#3D7D54] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#3D7D54]" />
            CONFIRMED
          </span>
        );
      case 'FLAGGED_RFI':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#B64B4B] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B64B4B]" />
            RFI
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#76828D]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#76828D]" />
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
      className={`group transition-colors cursor-pointer select-none text-xs outline-none focus-visible:ring-1 focus-visible:ring-[#376A9B] focus-visible:ring-inset font-sans ${
        isSelected
          ? 'bg-[#EAE7E0] text-[#17202A] border-l-2 border-l-[#376A9B]'
          : 'hover:bg-[#F4F1EA] text-[#56616A]'
      }`}
    >
      {/* 1. CANDIDATE IDENTIFIER & TARGET */}
      <td className="py-3 px-3.5 sm:px-4">
        <div className="flex items-center gap-2.5">
          {isSelected ? (
            <span className="h-2 w-2 rounded-full bg-[#376A9B] shrink-0" />
          ) : isHigh ? (
            <span
              className="h-1.5 w-1.5 rounded-full bg-[#C19348] shrink-0"
              title="High priority"
            />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-transparent shrink-0" />
          )}
          <div className="flex flex-col">
            <span
              className={`font-mono text-xs font-semibold transition-colors ${
                isSelected ? 'text-[#376A9B]' : 'text-[#17202A] group-hover:text-[#376A9B]'
              }`}
            >
              {candidate.id}
            </span>
            <span className="text-[11px] text-[#56616A]">{candidate.targetName}</span>
          </div>
        </div>
      </td>

      {/* 2. ANOMALY EVIDENCE SUMMARY */}
      <td className="py-3 px-3.5">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-xs font-semibold text-[#9E6E20]">
              {candidate.anomalyIndex != null
                ? `${(candidate.anomalyIndex * 100).toFixed(1)}%`
                : '—'}
            </span>
            <span className="text-[10px] text-[#76828D] uppercase font-mono">anomaly</span>
          </div>
          <span className="text-[11px] text-[#56616A] line-clamp-1">
            {candidate.persistence != null
              ? candidate.persistence > 0.7
                ? 'Persistent carrier across baseline'
                : 'Intermittent localized structure'
              : 'Persistence not evaluated'}
          </span>
        </div>
      </td>

      {/* 3. PRIORITY TAG */}
      <td className="py-3 px-3.5 text-center">
        {candidate.priority === 'HIGH' && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#9E6E20] bg-[#FDF6E9] px-2 py-0.5 rounded-[2px] border border-[#E8CFA0] font-semibold">
            HIGH
          </span>
        )}
        {candidate.priority === 'MEDIUM' && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#56616A] bg-[#EAE7E0] px-2 py-0.5 rounded-[2px] border border-[#D6D2C9]">
            MED
          </span>
        )}
        {candidate.priority === 'LOW' && (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#76828D] bg-[#F4F1EA] px-2 py-0.5 rounded-[2px] border border-[#D6D2C9]">
            LOW
          </span>
        )}
      </td>

      {/* 4. REVIEW STATE */}
      <td className="py-3 px-3.5 sm:px-4 text-right">{formatReviewState(candidate.status)}</td>
    </tr>
  );
}
