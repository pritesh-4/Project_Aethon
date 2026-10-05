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
          <span className="inline-flex items-center gap-1 rounded-[1px] border border-amber-500/70 bg-amber-950/40 px-1.5 py-0.2 text-[10px] font-bold text-[#FFB84D] uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-none bg-[#FFB84D]" />
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 rounded-[1px] border border-cyan-800/80 bg-cyan-950/50 px-1.5 py-0.2 text-[10px] font-semibold text-[#66E3FF] uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-none bg-[#66E3FF]" />
            MEDIUM
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 rounded-[1px] border border-slate-800 bg-slate-900/60 px-1.5 py-0.2 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            <span className="h-1.5 w-1.5 rounded-none bg-slate-500" />
            LOW
          </span>
        );
    }
  };

  const getStatusBadge = (status: CandidateSignalData['status']) => {
    switch (status) {
      case 'INVESTIGATING':
        return (
          <span className="text-[10px] text-cyan-400 uppercase font-semibold">INVESTIGATING</span>
        );
      case 'FLAGGED_RFI':
        return (
          <span className="text-[10px] text-slate-500 uppercase font-semibold">RFI FLAGGED</span>
        );
      case 'CONFIRMED':
        return (
          <span className="text-[10px] text-emerald-400 uppercase font-semibold">CONFIRMED</span>
        );
      case 'REVIEW':
      default:
        return <span className="text-[10px] text-slate-400 uppercase">REVIEW</span>;
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
      className={`group relative transition-all duration-150 cursor-pointer select-none font-mono text-xs outline-none ${
        isSelected
          ? 'bg-[#10192A] text-[#EAF4F7] shadow-inner'
          : 'hover:bg-[#0E1521] text-slate-300'
      }`}
    >
      {/* Active Selection Indicator Bar */}
      <td className="w-1.5 p-0">
        <div
          className={`h-full w-1 transition-all ${
            isSelected
              ? candidate.priority === 'HIGH'
                ? 'bg-[#FFB84D]'
                : 'bg-[#66E3FF]'
              : 'group-hover:bg-slate-700 bg-transparent'
          }`}
        />
      </td>

      {/* Priority */}
      <td className="py-2.5 px-3 whitespace-nowrap">{getPriorityBadge(candidate.priority)}</td>

      {/* Candidate Identifier */}
      <td className="py-2.5 px-3 whitespace-nowrap">
        <span
          className={`font-bold tracking-wider transition-colors ${
            isSelected ? 'text-[#66E3FF]' : 'text-[#EAF4F7] group-hover:text-[#66E3FF]'
          }`}
        >
          {candidate.id}
        </span>
      </td>

      {/* Anomaly Index */}
      <td className="py-2.5 px-3 text-right font-bold whitespace-nowrap text-[#66E3FF]">
        {candidate.anomalyIndex.toFixed(3)}
      </td>

      {/* Persistence */}
      <td className="py-2.5 px-3 text-right whitespace-nowrap text-emerald-400">
        {(candidate.persistence * 100).toFixed(1)}%
      </td>

      {/* Known Pattern Similarity */}
      <td className="py-2.5 px-3 text-right whitespace-nowrap text-slate-400">
        {(candidate.knownPatternSimilarity * 100).toFixed(1)}%
      </td>

      {/* RFI Risk */}
      <td className="py-2.5 px-3 text-right whitespace-nowrap">
        <span
          className={
            candidate.interferenceProbability < 0.1
              ? 'text-emerald-400'
              : candidate.interferenceProbability < 0.25
                ? 'text-slate-400'
                : 'text-amber-400'
          }
        >
          {(candidate.interferenceProbability * 100).toFixed(1)}%
        </span>
      </td>

      {/* Frequency */}
      <td className="py-2.5 px-3 text-right whitespace-nowrap text-slate-300">
        {candidate.frequencyMHz.toFixed(2)} MHz
      </td>

      {/* Status */}
      <td className="py-2.5 px-3 text-center whitespace-nowrap">
        {getStatusBadge(candidate.status)}
      </td>

      {/* Arrow Indicator */}
      <td className="py-2.5 px-3 text-right whitespace-nowrap text-slate-500">
        <ArrowRight
          className={`h-3.5 w-3.5 transition-transform duration-200 ${
            isSelected
              ? 'text-[#66E3FF] translate-x-1'
              : 'group-hover:text-slate-300 group-hover:translate-x-0.5'
          }`}
        />
      </td>
    </tr>
  );
}
