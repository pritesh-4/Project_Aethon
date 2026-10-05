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
          <span className="rounded-[1px] border border-cyan-800/80 bg-cyan-950/60 px-1.5 py-0.2 text-[10px] font-bold text-[#66E3FF] uppercase tracking-wider">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="rounded-[1px] border border-amber-800/80 bg-amber-950/60 px-1.5 py-0.2 text-[10px] font-bold text-[#FFB84D] uppercase tracking-wider">
            MEDIUM
          </span>
        );
      case 'LOW':
        return (
          <span className="rounded-[1px] border border-slate-800 bg-slate-900/80 px-1.5 py-0.2 text-[10px] font-medium text-slate-400 uppercase tracking-wider">
            LOW
          </span>
        );
    }
  };

  return (
    <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-4 font-mono select-none">
      {/* Table Header Strip */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <ListFilter className="h-3.5 w-3.5 text-[#66E3FF]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#EAF4F7]">
            ISOLATED CANDIDATE EVENTS RANKING
          </h4>
        </div>

        <div className="text-[10px] text-[#84929C]">RANKED BY LATENT ANOMALY RESIDUAL</div>
      </div>

      {/* Responsive Scientific Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-[10px] uppercase text-[#84929C]">
              <th className="py-2 px-3 font-semibold">RANK</th>
              <th className="py-2 px-3 font-semibold">IDENTIFIER</th>
              <th className="py-2 px-3 font-semibold text-right">ANOMALY INDEX</th>
              <th className="py-2 px-3 font-semibold text-right">PERSISTENCE</th>
              <th className="py-2 px-3 font-semibold text-right">KNOWN SIMILARITY</th>
              <th className="py-2 px-3 font-semibold text-right">RFI RISK</th>
              <th className="py-2 px-3 font-semibold text-center">INVESTIGATION PRIORITY</th>
              <th className="py-2 px-3 font-semibold text-right">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
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
                  className={`transition-colors cursor-pointer focus:outline-none focus:bg-[#06b6d4]/15 ${
                    isSelected
                      ? 'bg-[#06b6d4]/10 text-[#EAF4F7]'
                      : 'hover:bg-[#10161D]/60 text-slate-300'
                  }`}
                >
                  <td className="py-2.5 px-3 font-semibold text-slate-500">0{cand.rank}</td>
                  <td className="py-2.5 px-3 font-bold text-[#66E3FF]">{cand.id}</td>
                  <td className="py-2.5 px-3 font-bold text-right text-[#66E3FF]">
                    {cand.anomalyIndex.toFixed(3)}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-400">
                    {(cand.persistence * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400">
                    {(cand.knownSimilarity * 100).toFixed(1)}%
                  </td>
                  <td className="py-2.5 px-3 text-right text-slate-400">
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
                        INVESTIGATE
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
