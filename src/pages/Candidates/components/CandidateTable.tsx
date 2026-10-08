import type { CandidateSignalData } from '../types.ts';
import { CandidateRow } from './CandidateRow.tsx';
import { Layers } from 'lucide-react';

export interface CandidateTableProps {
  candidates: CandidateSignalData[];
  selectedCandidateId: string | null;
  onSelectCandidate: (candidate: CandidateSignalData) => void;
}

export function CandidateTable({
  candidates,
  selectedCandidateId,
  onSelectCandidate,
}: CandidateTableProps) {
  if (candidates.length === 0) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-[3px] border border-[#D6D2C9] bg-[#FAF8F5] p-8 text-center select-none shadow-xs">
        <Layers className="h-6 w-6 text-[#76828D] mb-2" />
        <span className="text-xs font-semibold text-[#17202A]">
          No candidate signals match current filter
        </span>
        <span className="mt-1 text-xs text-[#56616A]">
          Clear search or adjust priority filter to view other candidate entries.
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-[3px] border border-[#D6D2C9] bg-[#FAF8F5] overflow-hidden select-none font-sans shadow-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            {/* Scannable Queue Columns: Candidate, Anomaly Evidence, Priority, Review State */}
            <tr className="border-b border-[#D6D2C9] bg-[#EAE7E0] text-[11px] font-mono uppercase tracking-wider text-[#56616A]">
              <th className="py-2.5 px-3.5 sm:px-4 font-normal">Candidate Signal</th>
              <th className="py-2.5 px-3.5 font-normal">Anomaly Evidence</th>
              <th className="py-2.5 px-3.5 font-normal text-center">Priority</th>
              <th className="py-2.5 px-3.5 sm:px-4 font-normal text-right">Review State</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#D6D2C9]">
            {candidates.map((candidate) => (
              <CandidateRow
                key={candidate.id}
                candidate={candidate}
                isSelected={candidate.id === selectedCandidateId}
                onSelect={onSelectCandidate}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
