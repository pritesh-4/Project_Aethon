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
      <div className="flex h-64 flex-col items-center justify-center rounded border border-[#1C2630] bg-[#0B0F14] p-8 text-center select-none">
        <Layers className="h-6 w-6 text-[#7F8B95] mb-2" />
        <span className="text-xs font-semibold text-[#E6EDF2]">
          No candidate signals match current filter
        </span>
        <span className="mt-1 text-xs text-[#7F8B95]">
          Clear search or adjust priority filter to view other candidates
        </span>
      </div>
    );
  }

  return (
    <div className="rounded border border-[#1C2630] bg-[#0B0F14] overflow-hidden select-none">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1C2630] bg-[#06080B] text-[11px] text-[#7F8B95] uppercase tracking-wider font-mono">
              <th className="py-2.5 px-4 font-medium">Candidate</th>
              <th className="py-2.5 px-3 font-medium text-right">Anomaly</th>
              <th className="py-2.5 px-3 font-medium text-right">Persistence</th>
              <th className="py-2.5 px-3 font-medium text-right">RFI</th>
              <th className="py-2.5 px-4 font-medium text-center">Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1C2630]/60">
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
