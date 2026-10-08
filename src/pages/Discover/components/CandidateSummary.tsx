import { useState } from 'react';
import { Link } from 'react-router';
import type { DiscoveredCandidate, CandidatePriority } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import { ExternalLink, ArrowRight } from 'lucide-react';

export interface CandidateSummaryProps {
  candidates: DiscoveredCandidate[];
  observationId?: string;
}

export function CandidateSummary({ candidates, observationId }: CandidateSummaryProps) {
  const [selectedCandidate, setSelectedCandidate] = useState<DiscoveredCandidate>(candidates[0]);

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
    <section className="space-y-4 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-[#E6EDF2]">Candidate summary</h3>
          <p className="text-xs text-[#7F8B95]">
            Ranked candidate signals detected in observation {observationId || ''}
          </p>
        </div>

        <Link to="/candidates">
          <Button variant="ghost" size="sm" icon={<ArrowRight className="h-3.5 w-3.5" />}>
            View in candidates triage
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Candidate Ranking List / Table (8 cols) */}
        <div className="lg:col-span-8 rounded border border-[#1C2630] bg-[#0B0F14] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#1C2630] bg-[#06080B] text-[11px] text-[#7F8B95]">
                  <th className="py-2.5 px-3 font-medium hidden sm:table-cell">Rank</th>
                  <th className="py-2.5 px-3 font-medium">Candidate</th>
                  <th className="py-2.5 px-3 font-medium hidden sm:table-cell">Frequency</th>
                  <th className="py-2.5 px-3 font-medium text-right hidden md:table-cell">
                    Drift rate
                  </th>
                  <th className="py-2.5 px-3 font-medium text-center">Priority</th>
                  <th className="py-2.5 px-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1C2630]/60">
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
                      className={`transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5] focus-visible:ring-inset ${
                        isSelected
                          ? 'bg-[#5BD8F5]/10 text-[#E6EDF2]'
                          : 'hover:bg-[#10161D] text-[#7F8B95]'
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono text-[#7F8B95] hidden sm:table-cell">
                        0{cand.rank}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-medium text-[#5BD8F5]">
                        <div>{cand.id}</div>
                        <div className="sm:hidden text-[10px] text-[#7F8B95] font-normal">
                          {cand.frequencyMHz.toFixed(3)} MHz
                        </div>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[#E6EDF2] hidden sm:table-cell">
                        {cand.frequencyMHz.toFixed(3)} MHz
                      </td>
                      <td className="py-2.5 px-3 font-mono text-right text-[#7F8B95] hidden md:table-cell">
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
        <div className="lg:col-span-4 rounded border border-[#1C2630] bg-[#0B0F14] p-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#1C2630] pb-2">
              <span className="text-xs font-semibold text-[#E6EDF2]">Candidate profile</span>
              {getPriorityBadge(selectedCandidate.priority)}
            </div>

            <div>
              <span className="text-sm font-semibold text-[#5BD8F5] font-mono">
                {selectedCandidate.id}
              </span>
              <p className="text-xs text-[#7F8B95]">{selectedCandidate.targetName}</p>
            </div>

            {/* Scientific Attributes */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded border border-[#1C2630] bg-[#10161D] p-2">
                <span className="block text-[11px] text-[#7F8B95]">Frequency</span>
                <span className="font-mono text-[#E6EDF2]">
                  {selectedCandidate.frequencyMHz.toFixed(3)} MHz
                </span>
              </div>

              <div className="rounded border border-[#1C2630] bg-[#10161D] p-2">
                <span className="block text-[11px] text-[#7F8B95]">Drift rate</span>
                <span className="font-mono text-[#5BD8F5]">
                  {selectedCandidate.driftRateHzPerSec} Hz/s
                </span>
              </div>
            </div>

            {/* Scientific Explanation */}
            <div className="rounded border border-[#1C2630] bg-[#06080B] p-2.5 text-xs space-y-1.5">
              <span className="block font-medium text-[#E6EDF2] text-[11px]">
                Identification notes
              </span>
              <p className="text-[11px] text-[#7F8B95] leading-relaxed">
                {selectedCandidate.explanation.persistenceReason}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-[#1C2630] mt-3">
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
