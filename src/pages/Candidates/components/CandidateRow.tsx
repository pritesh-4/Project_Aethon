import type { CandidateSignalData, CandidatePriority } from '../types.ts';
import { ArrowRight } from 'lucide-react';

export interface CandidateRowProps {
  candidate: CandidateSignalData;
  isSelected: boolean;
  onSelect: (candidate: CandidateSignalData) => void;
}

export function CandidateRow({ candidate, isSelected, onSelect }: CandidateRowProps) {
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
          <span className="inline-flex items-center gap-1 rounded border border-[#7F8B95]/40 bg-[#7F8B95]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#7F8B95]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7F8B95]" />
            Medium
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 rounded border border-[#1C2630] bg-[#10161D] px-1.5 py-0.5 text-[10px] font-medium text-[#7F8B95]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7F8B95]" />
            Low
          </span>
        );
    }
  };

  const getStatusBadge = (status: CandidateSignalData['status']) => {
    switch (status) {
      case 'INVESTIGATING':
        return <span className="text-[11px] text-[#5BD8F5] font-medium">Investigating</span>;
      case 'FLAGGED_RFI':
        return <span className="text-[11px] text-[#7F8B95] font-medium">Flagged RFI</span>;
      case 'CONFIRMED':
        return <span className="text-[11px] text-[#5BD8F5] font-medium">Confirmed</span>;
      case 'REVIEW':
      default:
        return <span className="text-[11px] text-[#7F8B95]">Review</span>;
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
      role="button"
      tabIndex={0}
      onClick={() => onSelect(candidate)}
      onKeyDown={handleKeyDown}
      className={`group relative transition-all duration-150 cursor-pointer select-none text-xs outline-none ${
        isSelected ? 'bg-[#5BD8F5]/10 text-[#E6EDF2]' : 'hover:bg-[#10161D] text-[#7F8B95]'
      }`}
    >
      {/* Active Selection Indicator Bar */}
      <td className="w-1.5 p-0">
        <div
          className={`h-full w-1 transition-all ${
            isSelected
              ? candidate.priority === 'HIGH'
                ? 'bg-[#E8AE50]'
                : 'bg-[#5BD8F5]'
              : 'group-hover:bg-[#1C2630] bg-transparent'
          }`}
        />
      </td>

      {/* Priority */}
      <td className="py-2.5 px-3 whitespace-nowrap">{getPriorityBadge(candidate.priority)}</td>

      {/* Candidate Identifier */}
      <td className="py-2.5 px-3 whitespace-nowrap">
        <span
          className={`font-semibold font-mono transition-colors ${
            isSelected ? 'text-[#5BD8F5]' : 'text-[#E6EDF2] group-hover:text-[#5BD8F5]'
          }`}
        >
          {candidate.id}
        </span>
      </td>

      {/* Anomaly Index */}
      <td className="py-2.5 px-3 text-right font-semibold font-mono whitespace-nowrap text-[#5BD8F5]">
        {candidate.anomalyIndex.toFixed(3)}
      </td>

      {/* Persistence */}
      <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap text-[#E6EDF2]">
        {(candidate.persistence * 100).toFixed(1)}%
      </td>

      {/* Known Pattern Similarity */}
      <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap text-[#7F8B95]">
        {(candidate.knownPatternSimilarity * 100).toFixed(1)}%
      </td>

      {/* RFI Risk */}
      <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap">
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

      {/* Frequency */}
      <td className="py-2.5 px-3 text-right font-mono whitespace-nowrap text-[#E6EDF2]">
        {candidate.frequencyMHz.toFixed(2)} MHz
      </td>

      {/* Status */}
      <td className="py-2.5 px-3 text-center whitespace-nowrap">
        {getStatusBadge(candidate.status)}
      </td>

      {/* Arrow Indicator */}
      <td className="py-2.5 px-3 text-right whitespace-nowrap text-[#7F8B95]">
        <ArrowRight
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            isSelected
              ? 'text-[#5BD8F5] translate-x-1'
              : 'group-hover:text-[#E6EDF2] group-hover:translate-x-0.5'
          }`}
        />
      </td>
    </tr>
  );
}
