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
      <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-3 text-center text-xs font-mono text-slate-500">
        No candidate events identified in this observation
      </div>
    );
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'HIGH':
        return 'High';
      case 'MEDIUM':
        return 'Medium';
      case 'LOW':
        return 'Low';
      default:
        return priority;
    }
  };

  return (
    <div className="font-mono text-xs select-none">
      {/* Root Node: Observation ID */}
      <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#5BD8F5]">
        <Crosshair className="h-3.5 w-3.5" />
        <span>{observationId}</span>
        <span className="text-[10px] text-slate-400 font-normal">
          ({candidates.length} {candidates.length === 1 ? 'candidate' : 'candidates'})
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
              className="group flex items-center justify-between rounded-[2px] px-2 py-1.5 hover:bg-[#10161D] border border-transparent hover:border-[#1C2630] cursor-pointer transition-colors"
            >
              {/* Left Branch + Candidate ID */}
              <div className="flex items-center gap-2">
                <span className="text-slate-600 select-none">{branchChar}</span>
                <span className="font-semibold text-[#E6EDF2] group-hover:text-[#5BD8F5] transition-colors">
                  {cand.label}
                </span>
                <span className="text-slate-700 text-[10px]">·</span>
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
                    'px-1.5 py-0.2 rounded-[1px] text-[9px] font-mono border font-medium',
                    cand.priority === 'HIGH'
                      ? 'border-[#E8AE50]/40 bg-[#E8AE50]/10 text-[#E8AE50]'
                      : cand.priority === 'MEDIUM'
                        ? 'border-cyan-800/40 bg-cyan-950/20 text-cyan-300'
                        : 'border-[#1C2630] bg-[#10161D] text-slate-400'
                  )}
                >
                  {getPriorityLabel(cand.priority)}
                </span>

                <ExternalLink className="h-3 w-3 text-slate-600 group-hover:text-[#5BD8F5] transition-colors" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
