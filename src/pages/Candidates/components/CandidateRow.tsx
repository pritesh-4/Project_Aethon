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
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[#9A9C96]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#9A9C96]/60" />
            Pending review
          </span>
        );
      case 'INVESTIGATING':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[#D4864A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4864A]" />
            Under review
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[#529E72]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#529E72]" />
            Confirmed
          </span>
        );
      case 'FLAGGED_RFI':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[#C84A4A]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C84A4A]" />
            Flagged RFI
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] text-[#666963]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#666963]" />
            Cataloged
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
      className={`group transition-colors cursor-pointer select-none text-xs outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A] focus-visible:ring-inset ${
        isSelected ? 'bg-[#1A1E1B] text-[#E6E4DD]' : 'hover:bg-[#181B19] text-[#9A9C96]'
      }`}
    >
      {/* 1. CANDIDATE */}
      <td className="py-2.5 px-3 sm:px-4">
        <div className="flex items-center gap-2">
          {isSelected ? (
            <span className="h-1.5 w-1.5 rounded-full bg-[#D4864A] shrink-0" />
          ) : isHigh ? (
            <span
              className="h-1.5 w-1.5 rounded-full bg-[#D4864A]/70 shrink-0"
              title="High priority"
            />
          ) : (
            <span className="h-1.5 w-1.5 rounded-full bg-transparent shrink-0" />
          )}
          <div className="flex flex-col">
            <span
              className={`font-mono text-xs font-medium transition-colors ${
                isSelected ? 'text-[#D4864A]' : 'text-[#E6E4DD]'
              }`}
            >
              {candidate.id}
            </span>
            <span className="text-[10px] text-[#666963]">{candidate.targetName}</span>
          </div>
        </div>
      </td>

      {/* 2. OBSERVED AT */}
      <td className="py-2.5 px-3 font-mono text-[#9A9C96] hidden md:table-cell">
        {candidate.firstDetectedTime.replace('T', ' ').slice(0, 16)}
      </td>

      {/* 3. FREQUENCY */}
      <td className="py-2.5 px-3 font-mono text-[#E6E4DD]">
        {candidate.frequencyMHz.toFixed(3)} MHz
      </td>

      {/* 4. SNR */}
      <td className="py-2.5 px-3 font-mono text-right text-[#C9C8C0] hidden sm:table-cell">
        {candidate.snrDb.toFixed(1)} dB
      </td>

      {/* 5. DRIFT */}
      <td className="py-2.5 px-3 font-mono text-right text-[#9A9C96] hidden sm:table-cell">
        {candidate.driftRateHzPerSec > 0
          ? `+${candidate.driftRateHzPerSec}`
          : candidate.driftRateHzPerSec}{' '}
        Hz/s
      </td>

      {/* 6. ANOMALY EVIDENCE */}
      <td className="py-2.5 px-3 text-right">
        <div className="flex flex-col items-end">
          <span className="font-mono text-xs text-[#E6E4DD]">
            +{candidate.evidenceFactors?.anomalousStructure?.sigma.toFixed(1) || '4.0'}σ
          </span>
          <span className="text-[10px] text-[#666963] font-mono">
            idx {candidate.anomalyIndex.toFixed(2)}
          </span>
        </div>
      </td>

      {/* 7. REVIEW STATE */}
      <td className="py-2.5 px-3 sm:px-4 text-right">{formatReviewState(candidate.status)}</td>
    </tr>
  );
}
