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
    <header className="border-b border-[#D6D2C9] bg-[#FAF8F5] px-4 sm:px-6 py-6 sm:py-8 select-none font-sans">
      <div className="max-w-7xl mx-auto space-y-3">
        {/* Breadcrumb Navigation Strip */}
        <div className="flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-2 text-[#76828D]">
            <Link
              to="/candidates"
              className="inline-flex items-center gap-1.5 hover:text-[#17202A] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>CANDIDATES QUEUE</span>
            </Link>
            <span className="text-[#D6D2C9]">/</span>
            <span className="text-[#56616A]">SIGNAL INVESTIGATION</span>
          </div>

          {/* Adjacent Candidate Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#76828D] uppercase hidden sm:inline">SPECIMEN:</span>
            {prevCandidateId ? (
              <Link
                to={`/analysis/${prevCandidateId}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] border border-[#D6D2C9] bg-[#FFFFFF] text-[#56616A] hover:text-[#17202A] hover:border-[#376A9B] transition-colors text-[11px]"
                aria-label="Previous candidate"
              >
                <ChevronLeft className="h-3 w-3" />
                <span>PREV</span>
              </Link>
            ) : (
              <span className="px-2.5 py-1 rounded-[2px] border border-[#D6D2C9] bg-[#EAE7E0] text-[#76828D] text-[11px] cursor-not-allowed opacity-60">
                PREV
              </span>
            )}

            {nextCandidateId ? (
              <Link
                to={`/analysis/${nextCandidateId}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[2px] border border-[#D6D2C9] bg-[#FFFFFF] text-[#56616A] hover:text-[#17202A] hover:border-[#376A9B] transition-colors text-[11px]"
                aria-label="Next candidate"
              >
                <span>NEXT</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            ) : (
              <span className="px-2.5 py-1 rounded-[2px] border border-[#D6D2C9] bg-[#EAE7E0] text-[#76828D] text-[11px] cursor-not-allowed opacity-60">
                NEXT
              </span>
            )}
          </div>
        </div>

        {/* Candidate Identity */}
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-[#17202A] font-mono font-bold">
              {record.candidateId}
            </h1>

            {record.priority === 'HIGH' && (
              <span className="font-mono text-xs uppercase tracking-wider text-[#9E6E20] bg-[#FDF6E9] px-2 py-0.5 rounded-[2px] border border-[#E8CFA0] font-semibold">
                HIGH PRIORITY CANDIDATE
              </span>
            )}
            {record.priority === 'MEDIUM' && (
              <span className="font-mono text-xs uppercase tracking-wider text-[#56616A] bg-[#EAE7E0] px-2 py-0.5 rounded-[2px] border border-[#D6D2C9]">
                MEDIUM PRIORITY
              </span>
            )}
            {record.priority === 'LOW' && (
              <span className="font-mono text-xs uppercase tracking-wider text-[#76828D] bg-[#F4F1EA] px-2 py-0.5 rounded-[2px] border border-[#D6D2C9]">
                LOW PRIORITY
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-[#56616A]">
            <span className="text-[#17202A] font-medium font-sans text-sm">
              {record.targetName}
            </span>
            <span className="text-[#D6D2C9]">·</span>
            <span>
              {record.frequencyMHz != null
                ? `${record.frequencyMHz.toFixed(3)} MHz`
                : 'Unavailable'}
            </span>
            <span className="text-[#D6D2C9]">·</span>
            <span>{record.telescope || 'Unspecified instrument'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
