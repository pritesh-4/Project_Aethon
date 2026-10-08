import { Link } from 'react-router';
import { ExternalLink } from 'lucide-react';
import type { ArchivedCandidateEvent } from '../types.ts';
import { Badge } from '@/components/ui/Badge.tsx';

export interface CandidateBranchListProps {
  observationId: string;
  candidates: ArchivedCandidateEvent[];
}

export function CandidateBranchList({ observationId, candidates }: CandidateBranchListProps) {
  if (candidates.length === 0) {
    return (
      <div className="rounded-[2px] border border-[#242825] bg-[#101211] p-3 text-center text-xs text-[#9A9C96]">
        No candidate events surfaced from {observationId}
      </div>
    );
  }

  return (
    <div className="space-y-1.5 text-xs select-none">
      {candidates.map((cand) => (
        <Link
          key={cand.id}
          to={`/analysis/${cand.signalId}`}
          className="group flex items-center justify-between rounded-[2px] border border-[#242825] bg-[#101211] p-2.5 hover:border-[#2E332F] hover:bg-[#1A1E1B] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A]"
        >
          {/* Candidate ID & Physical Measurements */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-medium font-mono text-[#E6E4DD] group-hover:text-[#D4864A] transition-colors">
                {cand.fullId || cand.id}
              </span>
              <span className="text-[#9A9C96] font-mono text-[11px]">
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
            {cand.priority === 'HIGH' && <Badge variant="copper">High</Badge>}
            {cand.priority === 'MEDIUM' && <Badge variant="slate">Medium</Badge>}
            {cand.priority === 'LOW' && <Badge variant="neutral">Low</Badge>}

            <ExternalLink className="h-3 w-3 text-[#666963] group-hover:text-[#D4864A] transition-colors" />
          </div>
        </Link>
      ))}
    </div>
  );
}
