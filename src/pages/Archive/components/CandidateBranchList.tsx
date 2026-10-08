import { Link } from 'react-router';
import { ExternalLink } from 'lucide-react';
import type { ArchivedCandidateEvent } from '../types.ts';

export interface CandidateBranchListProps {
  observationId: string;
  candidates: ArchivedCandidateEvent[];
}

export function CandidateBranchList({ observationId, candidates }: CandidateBranchListProps) {
  if (candidates.length === 0) {
    return (
      <div className="border border-[#242825] bg-[#0E100F] p-3 text-center text-xs text-[#767973] font-mono rounded-[2px]">
        No candidate events surfaced from {observationId}
      </div>
    );
  }

  return (
    <div className="border border-[#242825] bg-[#101211] rounded-[2px] divide-y divide-[#1D211F] overflow-hidden select-none font-sans">
      {candidates.map((cand) => (
        <Link
          key={cand.id}
          to={`/analysis/${cand.signalId}`}
          className="group flex items-center justify-between p-2.5 hover:bg-[#161817] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A]"
        >
          {/* Candidate ID & Physical Measurements */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-medium text-[#E6E4DD] group-hover:text-[#D4864A] transition-colors">
                {cand.fullId || cand.id}
              </span>
              <span className="text-[#848780] font-mono text-[11px]">
                {cand.frequencyMHz.toFixed(2)} MHz
              </span>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-[#666963] font-mono">
              <span>SNR: +{cand.snrDb.toFixed(1)} dB</span>
              <span>·</span>
              <span>
                Drift:{' '}
                {cand.driftRateHzPerSec > 0 ? `+${cand.driftRateHzPerSec}` : cand.driftRateHzPerSec}{' '}
                Hz/s
              </span>
            </div>
          </div>

          {/* Priority & Navigation Link */}
          <div className="flex items-center gap-2">
            {cand.priority === 'HIGH' && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#D4864A] bg-[#221B16] px-1.5 py-0.5 rounded-[2px] border border-[#D4864A]/30">
                HIGH
              </span>
            )}
            {cand.priority === 'MEDIUM' && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#9A9C96] bg-[#181B19] px-1.5 py-0.5 rounded-[2px] border border-[#242825]">
                MED
              </span>
            )}
            {cand.priority === 'LOW' && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#666963] bg-[#121413] px-1.5 py-0.5 rounded-[2px] border border-[#242825]">
                LOW
              </span>
            )}

            <ExternalLink className="h-3 w-3 text-[#666963] group-hover:text-[#D4864A] transition-colors" />
          </div>
        </Link>
      ))}
    </div>
  );
}
