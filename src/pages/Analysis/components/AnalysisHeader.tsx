import { Link } from 'react-router';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import type { SignalAnalysisRecord } from '../types.ts';

export interface AnalysisHeaderProps {
  record: SignalAnalysisRecord;
  prevCandidateId: string | null;
  nextCandidateId: string | null;
}

export function AnalysisHeader({ record, prevCandidateId, nextCandidateId }: AnalysisHeaderProps) {
  const priorityColor = record.priority === 'HIGH' ? 'text-[#D4864A]' : 'text-[#9A9C96]';

  return (
    <header className="border-b border-[#242825] bg-[#0F1110] px-4 sm:px-6 py-2 select-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Breadcrumb + Candidate Identity */}
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to="/candidates"
            className="flex items-center gap-1 text-[#666963] hover:text-[#E6E4DD] transition-colors shrink-0"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </Link>

          <span className="text-[#242825] shrink-0">/</span>

          <div className="flex items-center gap-2.5 min-w-0">
            <h1 className="text-sm font-medium text-[#E6E4DD] font-mono shrink-0">
              {record.candidateId}
            </h1>
            <span className={`text-[10px] uppercase tracking-wider font-medium ${priorityColor}`}>
              {record.priority}
            </span>
            <span className="text-[#242825] hidden sm:inline">·</span>
            <span className="text-xs text-[#9A9C96] truncate hidden sm:inline">
              {record.targetName}
            </span>
            <span className="text-[#242825] hidden sm:inline">·</span>
            <span className="text-xs text-[#E6E4DD] font-mono hidden sm:inline">
              {record.frequencyMHz.toFixed(3)} MHz
            </span>
            <span className="text-[#242825] hidden lg:inline">·</span>
            <span className="text-xs text-[#666963] font-mono hidden lg:inline">
              {record.telescope}
            </span>
          </div>
        </div>

        {/* Right: Candidate Switcher */}
        <div className="flex items-center gap-1 shrink-0">
          {prevCandidateId ? (
            <Link
              to={`/analysis/${prevCandidateId}`}
              className="inline-flex items-center justify-center w-7 h-7 rounded-sm text-[#666963] hover:text-[#E6E4DD] hover:bg-[#141715] transition-colors"
              aria-label="Previous candidate"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <span className="w-7 h-7" />
          )}

          {nextCandidateId ? (
            <Link
              to={`/analysis/${nextCandidateId}`}
              className="inline-flex items-center justify-center w-7 h-7 rounded-sm text-[#666963] hover:text-[#E6E4DD] hover:bg-[#141715] transition-colors"
              aria-label="Next candidate"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          ) : (
            <span className="w-7 h-7" />
          )}
        </div>
      </div>
    </header>
  );
}
