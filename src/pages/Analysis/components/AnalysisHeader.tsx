import { Link } from 'react-router';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import type { SignalAnalysisRecord } from '../types.ts';

export interface AnalysisHeaderProps {
  record: SignalAnalysisRecord;
  prevCandidateId: string | null;
  nextCandidateId: string | null;
}

export function AnalysisHeader({ record, prevCandidateId, nextCandidateId }: AnalysisHeaderProps) {
  return (
    <header className="border-b border-[#242825] bg-[#0E100F] px-4 sm:px-6 py-6 sm:py-8 select-none font-sans">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Breadcrumb Navigation Strip */}
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-[#767973]">
            <Link
              to="/candidates"
              className="inline-flex items-center gap-1.5 hover:text-[#E6E4DD] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>CANDIDATES QUEUE</span>
            </Link>
            <span className="text-[#363C38]">/</span>
            <span className="text-[#A0A29C]">SIGNAL INVESTIGATION</span>
          </div>

          {/* Adjacent Candidate Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#666963] uppercase hidden sm:inline">SPECIMEN:</span>
            {prevCandidateId ? (
              <Link
                to={`/analysis/${prevCandidateId}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] border border-[#242825] bg-[#141715] text-[#848780] hover:text-[#E6E4DD] hover:border-[#383E3A] transition-colors text-[11px]"
                aria-label="Previous candidate"
              >
                <ChevronLeft className="h-3 w-3" />
                <span>PREV</span>
              </Link>
            ) : (
              <span className="px-2 py-0.5 rounded-[2px] border border-[#1C1F1D] bg-[#0C0E0D] text-[#444741] text-[11px] cursor-not-allowed">
                PREV
              </span>
            )}

            {nextCandidateId ? (
              <Link
                to={`/analysis/${nextCandidateId}`}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] border border-[#242825] bg-[#141715] text-[#848780] hover:text-[#E6E4DD] hover:border-[#383E3A] transition-colors text-[11px]"
                aria-label="Next candidate"
              >
                <span>NEXT</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            ) : (
              <span className="px-2 py-0.5 rounded-[2px] border border-[#1C1F1D] bg-[#0C0E0D] text-[#444741] text-[11px] cursor-not-allowed">
                NEXT
              </span>
            )}
          </div>
        </div>

        {/* Role 1: Authoritative Candidate Identity (32-40px) */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-[#E6E4DD] font-mono">
              {record.candidateId}
            </h1>

            {record.priority === 'HIGH' && (
              <span className="font-mono text-xs uppercase tracking-wider text-[#D4864A] bg-[#221B16] px-2 py-0.5 rounded-[2px] border border-[#D4864A]/30 font-semibold">
                HIGH PRIORITY CANDIDATE
              </span>
            )}
            {record.priority === 'MEDIUM' && (
              <span className="font-mono text-xs uppercase tracking-wider text-[#9A9C96] bg-[#181B19] px-2 py-0.5 rounded-[2px] border border-[#242825]">
                MEDIUM PRIORITY
              </span>
            )}
            {record.priority === 'LOW' && (
              <span className="font-mono text-xs uppercase tracking-wider text-[#666963] bg-[#121413] px-2 py-0.5 rounded-[2px] border border-[#242825]">
                LOW PRIORITY
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-[#848780]">
            <span className="text-[#E6E4DD] font-medium font-sans text-sm">
              {record.targetName}
            </span>
            <span className="text-[#363C38]">·</span>
            <span>{record.frequencyMHz.toFixed(3)} MHz</span>
            <span className="text-[#363C38]">·</span>
            <span>{record.telescope}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
