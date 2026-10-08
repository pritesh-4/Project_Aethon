import { useState } from 'react';
import { Link } from 'react-router';
import type { DiscoveredCandidate, CandidatePriority } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge.tsx';

export interface CandidateSummaryProps {
  candidates: DiscoveredCandidate[];
  observationId?: string;
}

export function CandidateSummary({ candidates, observationId }: CandidateSummaryProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<DiscoveredCandidate>(candidates[0]);

  const getPriorityBadge = (priority: CandidatePriority) => {
    switch (priority) {
      case 'HIGH':
        return <Badge variant="copper">High priority</Badge>;
      case 'MEDIUM':
        return <Badge variant="slate">Medium</Badge>;
      case 'LOW':
        return <Badge variant="neutral">Low</Badge>;
    }
  };

  return (
    <section className="space-y-4 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#242825] pb-3">
        <div>
          <h3 className="text-sm font-medium text-[#E6E4DD]">Detected candidates</h3>
          <p className="text-xs text-[#9A9C96]">
            Ranked candidate signals isolated in observation {observationId || ''}
          </p>
        </div>

        <Link to="/candidates">
          <Button variant="ghost" size="sm" icon={<ArrowRight className="h-3.5 w-3.5" />}>
            Candidate review ledger
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Candidate Ranking List / Table (8 cols) */}
        <div className="lg:col-span-8 rounded-[2px] border border-[#242825] bg-[#141715] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#242825] bg-[#101211] text-[11px] text-[#9A9C96]">
                  <th className="py-2.5 px-3 font-normal hidden sm:table-cell">Rank</th>
                  <th className="py-2.5 px-3 font-normal">Candidate identifier</th>
                  <th className="py-2.5 px-3 font-normal hidden sm:table-cell">Frequency</th>
                  <th className="py-2.5 px-3 font-normal text-right hidden md:table-cell">
                    Drift rate
                  </th>
                  <th className="py-2.5 px-3 font-normal text-center">Priority</th>
                  <th className="py-2.5 px-3 font-normal text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#242825]/60">
                {candidates.map((cand) => {
                  const isSelected = cand.id === selectedCandidate.id;

                  return (
                    <tr
                      key={cand.id}
                      tabIndex={0}
                      aria-selected={isSelected}
                      onClick={() => setSelectedCandidate(cand)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setSelectedCandidate(cand);
                        }
                      }}
                      className={`transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A] focus-visible:ring-inset ${
                        isSelected
                          ? 'bg-[#1A1E1B] text-[#E6E4DD]'
                          : 'hover:bg-[#181B19] text-[#9A9C96]'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono text-[#666963] hidden sm:table-cell">
                        0{cand.rank}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-[#E6E4DD]">
                        <div className="flex items-center gap-1.5">
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#D4864A]" />}
                          <span>{cand.id}</span>
                        </div>
                        <div className="sm:hidden text-[10px] text-[#9A9C96] font-normal">
                          {cand.frequencyMHz.toFixed(3)} MHz
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#C9C8C0] hidden sm:table-cell">
                        {cand.frequencyMHz.toFixed(3)} MHz
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right text-[#9A9C96] hidden md:table-cell">
                        {cand.driftRateHzPerSec > 0
                          ? `+${cand.driftRateHzPerSec}`
                          : cand.driftRateHzPerSec}{' '}
                        Hz/s
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

        {/* Selected Candidate Quick Review (4 cols) */}
        <div className="lg:col-span-4 rounded-[2px] border border-[#242825] bg-[#141715] p-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#242825] pb-2">
              <span className="text-xs font-medium text-[#E6E4DD]">Candidate profile</span>
              {getPriorityBadge(selectedCandidate.priority)}
            </div>

            <div>
              <span className="text-sm font-medium text-[#D4864A] font-mono">
                {selectedCandidate.id}
              </span>
              <p className="text-xs text-[#9A9C96]">{selectedCandidate.targetName}</p>
            </div>

            {/* Scientific Attributes */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-[2px] border border-[#242825] bg-[#1A1E1B] p-2">
                <span className="block text-[11px] text-[#9A9C96]">Frequency</span>
                <span className="font-mono text-[#E6E4DD]">
                  {selectedCandidate.frequencyMHz.toFixed(3)} MHz
                </span>
              </div>

              <div className="rounded-[2px] border border-[#242825] bg-[#1A1E1B] p-2">
                <span className="block text-[11px] text-[#9A9C96]">Drift rate</span>
                <span className="font-mono text-[#D4864A]">
                  {selectedCandidate.driftRateHzPerSec} Hz/s
                </span>
              </div>
            </div>

            {/* Scientific Explanation */}
            <div className="rounded-[2px] border border-[#242825] bg-[#101211] p-3 text-xs space-y-1.5">
              <span className="block font-medium text-[#E6E4DD] text-[11px]">
                Identification notes
              </span>
              <p className="text-[11px] text-[#9A9C96] leading-relaxed">
                {selectedCandidate.explanation.persistenceReason}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-[#242825] mt-3">
            <Link to={`/analysis/${selectedCandidate.id}`} className="block w-full">
              <Button variant="primary" size="sm" withArrow className="w-full">
                Inspect candidate in detail
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
