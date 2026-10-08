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

  const getPriorityTag = (priority: CandidatePriority) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#D4864A] bg-[#221B16] px-1.5 py-0.5 rounded-[2px] border border-[#D4864A]/30">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#9A9C96] bg-[#181B19] px-1.5 py-0.5 rounded-[2px] border border-[#242825]">
            MED
          </span>
        );
      case 'LOW':
        return (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#666963] bg-[#121413] px-1.5 py-0.5 rounded-[2px] border border-[#242825]">
            LOW
          </span>
        );
    }
  };

  return (
    <section className="space-y-3 select-none font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#242825] pb-2.5">
        <div>
          <h3 className="text-sm font-medium text-[#E6E4DD]">Detected Signals</h3>
          <p className="text-xs text-[#848780]">
            Candidate carriers screened in observation {observationId || ''}
          </p>
        </div>

        <Link to="/candidates">
          <Button variant="ghost" size="sm" icon={<ArrowRight className="h-3 w-3" />}>
            Candidate Review Ledger
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 border border-[#242825] bg-[#101211] rounded-[2px] overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-[#242825]">
        {/* Candidate Ranking List / Table (8 cols) */}
        <div className="lg:col-span-8 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#242825] bg-[#0C0E0D] text-[10px] font-mono uppercase tracking-wider text-[#767973]">
                <th className="py-2.5 px-3 font-normal hidden sm:table-cell">Rank</th>
                <th className="py-2.5 px-3 font-normal">Identifier</th>
                <th className="py-2.5 px-3 font-normal hidden sm:table-cell">Frequency</th>
                <th className="py-2.5 px-3 font-normal text-right hidden md:table-cell">
                  Drift Rate
                </th>
                <th className="py-2.5 px-3 font-normal text-center">Priority</th>
                <th className="py-2.5 px-3 font-normal text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1D211F]">
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
                        ? 'bg-[#181B19] text-[#E6E4DD]'
                        : 'hover:bg-[#141615] text-[#9A9C96]'
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
                      <div className="sm:hidden text-[10px] text-[#848780] font-normal">
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
                    <td className="py-2.5 px-3 text-center">{getPriorityTag(cand.priority)}</td>
                    <td className="py-2.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <Link to={`/analysis/${cand.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<ExternalLink className="h-3 w-3" />}
                        >
                          <span className="sr-only">Inspect {cand.id}</span>
                        </Button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Candidate Quick Review Inspector (4 cols) */}
        <div className="lg:col-span-4 p-4 flex flex-col justify-between bg-[#0E100F] space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#242825] pb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#767973]">
                Candidate Profile
              </span>
              {getPriorityTag(selectedCandidate.priority)}
            </div>

            <div>
              <span className="text-sm font-semibold text-[#D4864A] font-mono">
                {selectedCandidate.id}
              </span>
              <p className="text-xs text-[#9A9C96] mt-0.5">{selectedCandidate.targetName}</p>
            </div>

            {/* Ruled Telemetry List */}
            <div className="divide-y divide-[#1D211F] border-y border-[#242825] text-xs">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[11px] font-mono text-[#767973]">Frequency</span>
                <span className="font-mono text-[#E6E4DD]">
                  {selectedCandidate.frequencyMHz.toFixed(3)} MHz
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-[11px] font-mono text-[#767973]">Drift rate</span>
                <span className="font-mono text-[#D4864A]">
                  {selectedCandidate.driftRateHzPerSec} Hz/s
                </span>
              </div>
            </div>

            {/* Scientific Explanation */}
            <div className="space-y-1">
              <span className="block text-[10px] font-mono uppercase tracking-wider text-[#767973]">
                Screening Notes
              </span>
              <p className="text-xs text-[#9A9C96] leading-relaxed">
                {selectedCandidate.explanation.persistenceReason}
              </p>
            </div>
          </div>

          <div className="pt-2 border-t border-[#242825]">
            <Link to={`/analysis/${selectedCandidate.id}`} className="block w-full">
              <Button variant="primary" size="sm" withArrow className="w-full text-xs">
                Inspect candidate in detail
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
