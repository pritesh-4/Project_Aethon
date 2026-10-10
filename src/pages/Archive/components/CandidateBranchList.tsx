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
      <div className="border border-[#D6D2C9] bg-[#EAE7E0] p-3 text-center text-xs text-[#76828D] font-mono rounded-[2px]">
        No candidate events surfaced from {observationId}
      </div>
    );
  }

  return (
    <div className="border border-[#D6D2C9] bg-[#FAF8F5] rounded-[3px] divide-y divide-[#D6D2C9] overflow-hidden select-none font-sans">
      {candidates.map((cand) => (
        <Link
          key={cand.id}
          to={`/analysis/${cand.signalId}`}
          className="group flex items-center justify-between p-2.5 hover:bg-[#F4F1EA] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#376A9B]"
        >
          {/* Candidate ID & Physical Measurements */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold text-[#17202A] group-hover:text-[#376A9B] transition-colors">
                {cand.fullId || cand.id}
              </span>
              <span className="text-[#56616A] font-mono text-[11px]">
                {cand.frequencyMHz != null ? `${cand.frequencyMHz.toFixed(2)} MHz` : '—'}
              </span>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-[#76828D] font-mono">
              <span>{cand.snrDb != null ? `SNR: +${cand.snrDb.toFixed(1)} dB` : 'SNR: —'}</span>
              <span>·</span>
              <span>
                Drift:{' '}
                {cand.driftRateHzPerSec != null
                  ? `${cand.driftRateHzPerSec > 0 ? '+' : ''}${cand.driftRateHzPerSec} Hz/s`
                  : '—'}
              </span>
            </div>
          </div>

          {/* Priority & Navigation Link */}
          <div className="flex items-center gap-2">
            {cand.priority === 'HIGH' && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#9E6E20] bg-[#FDF6E9] px-2 py-0.5 rounded-[2px] border border-[#E8CFA0] font-semibold">
                HIGH
              </span>
            )}
            {cand.priority === 'MEDIUM' && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#56616A] bg-[#EAE7E0] px-2 py-0.5 rounded-[2px] border border-[#D6D2C9]">
                MED
              </span>
            )}
            {cand.priority === 'LOW' && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#76828D] bg-[#F4F1EA] px-2 py-0.5 rounded-[2px] border border-[#D6D2C9]">
                LOW
              </span>
            )}

            <ExternalLink className="h-3.5 w-3.5 text-[#76828D] group-hover:text-[#376A9B] transition-colors" />
          </div>
        </Link>
      ))}
    </div>
  );
}
