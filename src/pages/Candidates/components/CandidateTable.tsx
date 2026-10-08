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
      <div className="flex h-64 flex-col items-center justify-center rounded-[2px] border border-[#242825] bg-[#141715] p-8 text-center select-none">
        <Layers className="h-6 w-6 text-[#666963] mb-2" />
        <span className="text-xs font-medium text-[#E6E4DD]">
          No candidate signals match current filter
        </span>
        <span className="mt-1 text-xs text-[#9A9C96]">
          Clear search or adjust priority filter to view other candidate entries
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-[2px] border border-[#242825] bg-[#141715] overflow-hidden select-none">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#242825] bg-[#101211] text-xs text-[#9A9C96]">
              <th className="py-2.5 px-3 sm:px-4 font-normal">Candidate</th>
              <th className="py-2.5 px-3 font-normal hidden md:table-cell">Observed at</th>
              <th className="py-2.5 px-3 font-normal">Frequency</th>
              <th className="py-2.5 px-3 font-normal text-right hidden sm:table-cell">SNR</th>
              <th className="py-2.5 px-3 font-normal text-right hidden sm:table-cell">Drift</th>
              <th className="py-2.5 px-3 font-normal text-right">Anomaly evidence</th>
              <th className="py-2.5 px-3 sm:px-4 font-normal text-right">Review state</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#242825]/60">
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
