import { useNavigate } from 'react-router';
import { ExternalLink, Crosshair } from 'lucide-react';
import type { ArchivedCandidateEvent } from '../types.ts';
import { cn } from '@/lib/utils.ts';

export interface CandidateBranchListProps {
  observationId: string;
  candidates: ArchivedCandidateEvent[];
}

export function CandidateBranchList({ observationId, candidates }: CandidateBranchListProps) {
  const navigate = useNavigate();

  if (candidates.length === 0) {
    return (
      <div className="rounded-[2px] border border-slate-800/80 bg-[#05070A] p-3 text-center text-xs font-mono text-slate-500">
        NO CANDIDATE EVENTS EXTRACTED FOR THIS OBSERVATION RUN
      </div>
    );
  }

  return (
    <div className="font-mono text-xs select-none">
      {/* Root Node: Observation ID */}
      <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-[#66E3FF]">
        <Crosshair className="h-3.5 w-3.5" />
        <span>{observationId}</span>
        <span className="text-slate-600">//</span>
        <span className="text-[10px] text-slate-400 font-normal">
          {candidates.length} {candidates.length === 1 ? 'CANDIDATE EVENT' : 'CANDIDATE EVENTS'}
        </span>
      </div>

      {/* Tree Branches */}
      <div className="mt-1 space-y-1 pl-1">
        {candidates.map((cand, index) => {
          const isLast = index === candidates.length - 1;
          const branchChar = isLast ? '└──' : '├──';

          return (
            <div
              key={cand.id}
              role="button"
              tabIndex={0}
              onClick={() => navigate(`/analysis/${cand.signalId}`)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  navigate(`/analysis/${cand.signalId}`);
                }
              }}
              className="group flex items-center justify-between rounded-[2px] px-2 py-1.5 hover:bg-[#10161D] border border-transparent hover:border-slate-800 cursor-pointer transition-colors"
            >
              {/* Left Branch + Candidate ID */}
              <div className="flex items-center gap-2">
                <span className="text-slate-600 select-none">{branchChar}</span>
                <span className="font-bold text-[#EAF4F7] group-hover:text-[#66E3FF] transition-colors">
                  {cand.label}
                </span>
                <span className="text-slate-600 text-[10px]">//</span>
                <span className="text-[10px] text-slate-400">
                  {cand.frequencyMHz.toFixed(2)} MHz
                </span>
                <span className="text-[10px] text-slate-500 hidden sm:inline">
                  (SNR: +{cand.snrDb.toFixed(1)} dB)
                </span>
              </div>

              {/* Right Priority & Nav Icon */}
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-[1px] text-[9px] font-mono border font-semibold tracking-wider uppercase',
                    cand.priority === 'HIGH'
                      ? 'border-[#FFB84D]/40 bg-[#FFB84D]/10 text-[#FFB84D]'
                      : cand.priority === 'MEDIUM'
                        ? 'border-cyan-800/40 bg-cyan-950/20 text-cyan-300'
                        : 'border-slate-800 bg-slate-900/40 text-slate-400'
                  )}
                >
                  {cand.priority}
                </span>

                <ExternalLink className="h-3 w-3 text-slate-600 group-hover:text-[#66E3FF] transition-colors" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
