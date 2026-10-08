import { Link } from 'react-router';
import { ExternalLink } from 'lucide-react';
import type { ArchivedCandidateEvent } from '../types.ts';
import { cn } from '@/lib/utils.ts';

export interface CandidateBranchListProps {
  observationId: string;
  candidates: ArchivedCandidateEvent[];
}

export function CandidateBranchList({ observationId, candidates }: CandidateBranchListProps) {
  if (candidates.length === 0) {
    return (
      <div className="rounded border border-[#1C2630] bg-[#06080B] p-3 text-center text-xs font-mono text-[#7F8B95]">
        No candidate events surfaced from {observationId}
      </div>
    );
  }

  return (
    <div className="space-y-1.5 font-mono text-xs select-none">
      {candidates.map((cand) => (
        <Link
          key={cand.id}
          to={`/analysis/${cand.signalId}`}
          className="group flex items-center justify-between rounded border border-[#1C2630] bg-[#06080B] p-2.5 hover:border-[#1C2630]/80 hover:bg-[#10161D] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5]"
        >
          {/* Candidate ID & Physical Measurements */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[#E6EDF2] group-hover:text-[#5BD8F5] transition-colors">
                {cand.fullId || cand.id}
              </span>
              <span className="text-[#7F8B95] text-[10px]">{cand.frequencyMHz.toFixed(2)} MHz</span>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-[#7F8B95]">
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
            <span
              className={cn(
                'px-1.5 py-0.5 rounded text-[10px] font-medium border',
                cand.priority === 'HIGH'
                  ? 'border-[#E8AE50]/40 bg-[#E8AE50]/10 text-[#E8AE50]'
                  : cand.priority === 'MEDIUM'
                    ? 'border-[#5BD8F5]/30 bg-[#5BD8F5]/10 text-[#5BD8F5]'
                    : 'border-[#1C2630] bg-[#10161D] text-[#7F8B95]'
              )}
            >
              {cand.priority}
            </span>

            <ExternalLink className="h-3 w-3 text-[#7F8B95] group-hover:text-[#5BD8F5] transition-colors" />
          </div>
        </Link>
      ))}
    </div>
  );
}
