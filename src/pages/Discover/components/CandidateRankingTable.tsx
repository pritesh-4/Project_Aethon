import { Link } from 'react-router';
import type { DiscoveredCandidate, CandidatePriority } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import { ListFilter, ExternalLink } from 'lucide-react';

export interface CandidateRankingTableProps {
  candidates: DiscoveredCandidate[];
  selectedCandidateId: string;
  onSelectCandidate: (candidate: DiscoveredCandidate) => void;
  visibleCount?: number;
}

export function CandidateRankingTable({
  candidates,
  selectedCandidateId,
  onSelectCandidate,
  visibleCount = candidates.length,
}: CandidateRankingTableProps) {
  const displayedCandidates = candidates.slice(0, visibleCount);

  const getPriorityBadge = (priority: CandidatePriority) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span className="rounded border border-[#E8AE50]/40 bg-[#E8AE50]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#E8AE50]">
            High
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="rounded border border-[#7F8B95]/40 bg-[#7F8B95]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#7F8B95]">
            Medium
          </span>
        );
      case 'LOW':
        return (
          <span className="rounded border border-[#1C2630] bg-[#10161D] px-1.5 py-0.5 text-[10px] font-medium text-[#7F8B95]">
            Low
          </span>
        );
    }
  };

  return (
    <div className="rounded border border-[#1C2630] bg-[#0B0F14] p-4 select-none">
      {/* Table Header Strip */}
      <div className="flex items-center justify-between border-b border-[#1C2630] pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <ListFilter className="h-3.5 w-3.5 text-[#5BD8F5]" />
          <h4 className="text-xs font-semibold text-[#E6EDF2]">Candidate events</h4>
        </div>

        <div className="text-[11px] text-[#7F8B95]">Ranked by anomaly residual</div>
      </div>

      {/* Responsive Scientific Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-[#1C2630] text-[11px] text-[#7F8B95]">
              <th className="py-2 px-3 font-medium">Rank</th>
              <th className="py-2 px-3 font-medium">Candidate</th>
              <th className="py-2 px-3 font-medium text-right">Anomaly index</th>
              <th className="py-2 px-3 font-medium text-right">Persistence</th>
              <th className="py-2 px-3 font-medium text-right">Known similarity</th>
              <th className="py-2 px-3 font-medium text-right">Interference risk</th>
              <th className="py-2 px-3 font-medium text-center">Priority</th>
              <th className="py-2 px-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1C2630]/60">
            {displayedCandidates.map((cand) => {
              const isSelected = cand.id === selectedCandidateId;

              return (
                <tr
                  key={cand.id}
                  role="button"
                  tabIndex={0}
                  aria-pressed={isSelected}
                  onClick={() => onSelectCandidate(cand)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectCandidate(cand);
                    }
                  }}
                  className={`transition-colors cursor-pointer focus:outline-none ${
                    isSelected
                      ? 'bg-[#5BD8F5]/10 text-[#E6EDF2]'
                      : 'hover:bg-[#10161D] text-[#7F8B95]'
                  }`}
                >
                  <td className="py-2.5 px-3 font-mono text-[#7F8B95]">0{cand.rank}</td>
                  <td className="py-2.5 px-3 font-semibold font-mono text-[#5BD8F5]">{cand.id}</td>
                  <td className="py-2.5 px-3 font-semibold font-mono text-right text-[#5BD8F5]">
                    {cand.anomalyIndex.toFixed(3)}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-right text-[#E6EDF2]">
                    {(cand.persistence * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 font-mono text-right text-[#7F8B95]">
                    {(cand.knownSimilarity * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 font-mono text-right text-[#7F8B95]">
                    {(cand.rfiRisk * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-center">{getPriorityBadge(cand.priority)}</td>
                  <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <Link to={`/analysis/${cand.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<ExternalLink className="h-3 w-3" />}
                      >
                        Inspect
                      </Button>
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
