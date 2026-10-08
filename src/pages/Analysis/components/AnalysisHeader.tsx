import { Link } from 'react-router';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import type { SignalAnalysisRecord } from '../types.ts';

export interface AnalysisHeaderProps {
  record: SignalAnalysisRecord;
  prevCandidateId: string | null;
  nextCandidateId: string | null;
}

export function AnalysisHeader({ record, prevCandidateId, nextCandidateId }: AnalysisHeaderProps) {
  const isHigh = record.priority === 'HIGH';

  return (
    <header className="border-b border-[#1C2630] bg-[#0B0F14] px-4 sm:px-6 py-3 select-none">
      <div className="max-w-7xl mx-auto space-y-2.5">
        {/* Navigation Breadcrumb & Candidate Switcher */}
        <div className="flex items-center justify-between text-xs text-[#7F8B95]">
          <div className="flex items-center gap-1.5">
            <Link
              to="/candidates"
              className="flex items-center gap-1 text-[#7F8B95] hover:text-[#5BD8F5] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Candidates</span>
            </Link>
            <span>/</span>
            <span className="text-[#5BD8F5] font-mono">{record.candidateId}</span>
          </div>

          {/* Prev / Next Candidate Switcher */}
          <div className="flex items-center gap-1.5">
            {prevCandidateId ? (
              <Link
                to={`/analysis/${prevCandidateId}`}
                className="inline-flex items-center gap-1 rounded border border-[#1C2630] bg-[#10161D] px-2 py-0.5 text-xs text-[#7F8B95] hover:border-[#5BD8F5] hover:text-[#5BD8F5] transition-colors"
              >
                <ChevronLeft className="h-3 w-3" />
                <span>Prev</span>
              </Link>
            ) : (
              <span className="text-[#7F8B95]/40 text-xs px-2 py-0.5">First</span>
            )}

            <span className="text-[#1C2630]">|</span>

            {nextCandidateId ? (
              <Link
                to={`/analysis/${nextCandidateId}`}
                className="inline-flex items-center gap-1 rounded border border-[#1C2630] bg-[#10161D] px-2 py-0.5 text-xs text-[#7F8B95] hover:border-[#5BD8F5] hover:text-[#5BD8F5] transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            ) : (
              <span className="text-[#7F8B95]/40 text-xs px-2 py-0.5">Last</span>
            )}
          </div>
        </div>

        {/* Main Title & Key Identifiers */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-base sm:text-lg font-semibold text-[#E6EDF2] font-mono">
              {record.candidateId}
            </h1>

            <span
              className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${
                isHigh
                  ? 'border border-[#E8AE50]/40 bg-[#E8AE50]/10 text-[#E8AE50]'
                  : 'border border-[#7F8B95]/30 bg-[#7F8B95]/10 text-[#7F8B95]'
              }`}
            >
              {record.priority} priority
            </span>

            <span className="text-[#7F8B95]">•</span>
            <span className="text-xs text-[#7F8B95]">{record.targetName}</span>
            <span className="text-[#7F8B95]">•</span>
            <span className="text-xs text-[#5BD8F5] font-mono">
              {record.frequencyMHz.toFixed(3)} MHz
            </span>
          </div>

          <div className="text-xs text-[#7F8B95] font-mono">{record.telescope}</div>
        </div>
      </div>
    </header>
  );
}
