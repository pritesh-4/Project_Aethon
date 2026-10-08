import type { CandidateSignalData, CandidatePriority } from '../types.ts';

export interface CandidateRowProps {
  candidate: CandidateSignalData;
  isSelected: boolean;
  onSelect: (candidate: CandidateSignalData) => void;
}

export function CandidateRow({ candidate, isSelected, onSelect }: CandidateRowProps) {
  const isHigh = candidate.priority === 'HIGH';

  const getPriorityBadge = (priority: CandidatePriority) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 rounded border border-[#E8AE50]/40 bg-[#E8AE50]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#E8AE50]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E8AE50]" />
            High
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 rounded border border-[#7F8B95]/30 bg-[#7F8B95]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#7F8B95]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7F8B95]" />
            Medium
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 rounded border border-[#1C2630] bg-[#10161D] px-1.5 py-0.5 text-[10px] font-medium text-[#7F8B95]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7F8B95]/60" />
            Low
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
      className={`group transition-colors cursor-pointer select-none text-xs outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5] focus-visible:ring-inset ${
        isSelected ? 'bg-[#5BD8F5]/10 text-[#E6EDF2]' : 'hover:bg-[#10161D] text-[#7F8B95]'
      }`}
    >
      {/* 1. CANDIDATE */}
      <td className="py-3 px-3 sm:px-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span
              className={`font-semibold font-mono transition-colors ${
                isSelected
                  ? 'text-[#5BD8F5]'
                  : isHigh
                    ? 'text-[#E6EDF2] group-hover:text-[#5BD8F5]'
                    : 'text-[#E6EDF2]'
              }`}
            >
              {candidate.id}
            </span>
            {isHigh && (
              <span
                className="h-1.5 w-1.5 rounded-full bg-[#E8AE50] shrink-0"
                title="High priority candidate"
              />
            )}
          </div>
          <span className="text-[11px] text-[#7F8B95] font-mono">
            {candidate.frequencyMHz.toFixed(2)} MHz
          </span>
        </div>
      </td>

      {/* 2. ANOMALY */}
      <td className="py-3 px-3 text-right">
        <div className="flex flex-col items-end">
          <span className="font-semibold font-mono text-[#5BD8F5]">
            {candidate.anomalyIndex.toFixed(3)}
          </span>
          <span className="text-[10px] text-[#7F8B95] font-mono">
            +{candidate.evidenceFactors?.anomalousStructure?.sigma.toFixed(1) || '4.0'}σ
          </span>
        </div>
      </td>

      {/* 3. PERSISTENCE (Tablet & Desktop) */}
      <td className="py-3 px-3 text-right font-mono text-[#E6EDF2] hidden sm:table-cell">
        {(candidate.persistence * 100).toFixed(1)}%
      </td>

      {/* 4. RFI (Desktop only) */}
      <td className="py-3 px-3 text-right font-mono hidden md:table-cell">
        <span
          className={
            candidate.interferenceProbability < 0.1
              ? 'text-[#5BD8F5]'
              : candidate.interferenceProbability < 0.25
                ? 'text-[#7F8B95]'
                : 'text-[#E8AE50]'
          }
        >
          {(candidate.interferenceProbability * 100).toFixed(1)}%
        </span>
      </td>

      {/* 5. PRIORITY */}
      <td className="py-3 px-3 sm:px-4 text-center">{getPriorityBadge(candidate.priority)}</td>
    </tr>
  );
}
