import { Link } from 'react-router';
import { StatusIndicator } from '@/components/ui/StatusIndicator.tsx';
import { ChevronLeft, ChevronRight, Activity, ArrowLeft } from 'lucide-react';
import type { SignalAnalysisRecord } from '../types.ts';

export interface AnalysisHeaderProps {
  record: SignalAnalysisRecord;
  prevCandidateId: string | null;
  nextCandidateId: string | null;
}

export function AnalysisHeader({ record, prevCandidateId, nextCandidateId }: AnalysisHeaderProps) {
  const isHigh = record.priority === 'HIGH';

  return (
    <header className="border-b border-slate-800/80 bg-[#080D1A]/70 px-4 py-2.5 backdrop-blur-sm select-none font-mono">
      {/* Subtle Breadcrumb + Navigation Strip */}
      <div className="flex items-center justify-between border-b border-slate-800/60 pb-2 mb-2 text-[10px] text-[#84929C]">
        <div className="flex items-center gap-1.5">
          <Link
            to="/candidates"
            className="flex items-center gap-1 text-slate-400 hover:text-[#66E3FF] transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>CANDIDATES</span>
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300 font-semibold">{record.candidateId}</span>
          <span className="text-slate-600">/</span>
          <span className="text-[#66E3FF]">DEEP SIGNAL ANALYSIS</span>
        </div>

        {/* Candidate Prev/Next Navigator */}
        <div className="flex items-center gap-2">
          {prevCandidateId ? (
            <Link
              to={`/analysis/${prevCandidateId}`}
              className="inline-flex items-center gap-1 rounded-[1px] border border-slate-800 bg-slate-900/60 px-2 py-0.5 text-[9px] uppercase hover:border-[#66E3FF] hover:text-[#66E3FF] transition-colors"
            >
              <ChevronLeft className="h-2.5 w-2.5" />
              <span>PREV ({prevCandidateId})</span>
            </Link>
          ) : (
            <span className="text-slate-600 text-[9px]">FIRST</span>
          )}

          <span className="text-slate-700">|</span>

          {nextCandidateId ? (
            <Link
              to={`/analysis/${nextCandidateId}`}
              className="inline-flex items-center gap-1 rounded-[1px] border border-slate-800 bg-slate-900/60 px-2 py-0.5 text-[9px] uppercase hover:border-[#66E3FF] hover:text-[#66E3FF] transition-colors"
            >
              <span>NEXT ({nextCandidateId})</span>
              <ChevronRight className="h-2.5 w-2.5" />
            </Link>
          ) : (
            <span className="text-slate-600 text-[9px]">LAST</span>
          )}
        </div>
      </div>

      {/* Main Title Strip */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Scientific Header Title */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold tracking-widest text-[#EAF4F7] uppercase font-sans">
              SIGNAL ANALYSIS
            </span>
            <span className="text-slate-600">//</span>
            <span className="text-sm font-bold text-[#66E3FF] tracking-wider">
              {record.candidateId}
            </span>
          </div>

          <div className="hidden sm:block h-3.5 w-px bg-slate-800" />

          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-slate-400 font-medium">UNCLASSIFIED PATTERN</span>
            <span className="text-slate-600">•</span>
            <span
              className={`rounded-[1px] px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider ${
                isHigh
                  ? 'border border-amber-500/70 bg-amber-950/40 text-[#FFB84D]'
                  : 'border border-cyan-800/70 bg-cyan-950/40 text-[#66E3FF]'
              }`}
            >
              INVESTIGATION PRIORITY: {record.priority}
            </span>
          </div>

          <div className="hidden md:block h-3.5 w-px bg-slate-800" />

          <div className="hidden md:flex items-center gap-1 text-[11px] text-[#84929C]">
            <span>TARGET //</span>
            <span className="text-slate-300 font-sans">{record.targetName}</span>
          </div>
        </div>

        {/* Right: Engine Status Indicator */}
        <div className="flex items-center gap-3 font-mono text-[11px] self-end sm:self-center">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-[#66E3FF]" />
            <span className="text-slate-400 text-[10px] uppercase">ANALYSIS ENGINE</span>
            <StatusIndicator status="nominal" label="READY" pulse={false} className="text-[10px]" />
          </div>
        </div>
      </div>
    </header>
  );
}
