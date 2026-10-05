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
      <div className="flex h-64 flex-col items-center justify-center rounded-[2px] border border-slate-800 bg-[#0A0E13] p-8 text-center font-mono">
        <Layers className="h-6 w-6 text-slate-600 mb-2" />
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          NO CANDIDATE EVENTS MATCH FILTERS
        </span>
        <span className="mt-1 text-[11px] text-slate-500">
          Adjust priority filter or clear search query to inspect other events
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] overflow-hidden select-none">
      <div className="overflow-x-auto">
        <table className="w-full text-left font-mono text-xs">
          <thead>
            <tr className="border-b border-slate-800/80 bg-[#080D1A]/80 text-[10px] text-[#84929C] uppercase tracking-wider">
              <th className="w-1.5 p-0" />
              <th className="py-2.5 px-3 font-semibold">PRIORITY</th>
              <th className="py-2.5 px-3 font-semibold">CANDIDATE</th>
              <th className="py-2.5 px-3 font-semibold text-right">ANOMALY INDEX</th>
              <th className="py-2.5 px-3 font-semibold text-right">PERSISTENCE</th>
              <th className="py-2.5 px-3 font-semibold text-right">KNOWN SIMILARITY</th>
              <th className="py-2.5 px-3 font-semibold text-right">RFI RISK</th>
              <th className="py-2.5 px-3 font-semibold text-right">FREQUENCY</th>
              <th className="py-2.5 px-3 font-semibold text-center">STATUS</th>
              <th className="py-2.5 px-3 font-semibold text-right w-8" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/40">
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
