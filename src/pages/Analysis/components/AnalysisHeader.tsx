import { Link } from 'react-router';
import { ChevronLeft, ChevronRight, ArrowLeft } from 'lucide-react';
import type { SignalAnalysisRecord } from '../types.ts';
import { Badge } from '@/components/ui/Badge.tsx';

export interface AnalysisHeaderProps {
  record: SignalAnalysisRecord;
  prevCandidateId: string | null;
  nextCandidateId: string | null;
}

export function AnalysisHeader({ record, prevCandidateId, nextCandidateId }: AnalysisHeaderProps) {
  const isHigh = record.priority === 'HIGH';

  return (
    <header className="border-b border-[#242825] bg-[#141715] px-4 sm:px-6 py-3 select-none">
      <div className="max-w-7xl mx-auto space-y-2.5">
        {/* Navigation Breadcrumb & Candidate Switcher */}
        <div className="flex items-center justify-between text-xs text-[#9A9C96]">
          <div className="flex items-center gap-1.5">
            <Link
              to="/candidates"
              className="flex items-center gap-1 text-[#9A9C96] hover:text-[#E6E4DD] transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Candidates</span>
            </Link>
            <span className="text-[#666963]">/</span>
            <span className="text-[#D4864A] font-mono">{record.candidateId}</span>
          </div>

          {/* Prev / Next Candidate Switcher */}
          <div className="flex items-center gap-1.5">
            {prevCandidateId ? (
              <Link
                to={`/analysis/${prevCandidateId}`}
                className="inline-flex items-center gap-1 rounded-[2px] border border-[#242825] bg-[#1A1E1B] px-2 py-0.5 text-xs text-[#9A9C96] hover:border-[#D4864A]/50 hover:text-[#E6E4DD] transition-colors"
              >
                <ChevronLeft className="h-3 w-3" />
                <span>Prev</span>
              </Link>
            ) : (
              <span className="text-[#666963] text-xs px-2 py-0.5">First</span>
            )}

            <span className="text-[#242825]">|</span>

            {nextCandidateId ? (
              <Link
                to={`/analysis/${nextCandidateId}`}
                className="inline-flex items-center gap-1 rounded-[2px] border border-[#242825] bg-[#1A1E1B] px-2 py-0.5 text-xs text-[#9A9C96] hover:border-[#D4864A]/50 hover:text-[#E6E4DD] transition-colors"
              >
                <span>Next</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
            ) : (
              <span className="text-[#666963] text-xs px-2 py-0.5">Last</span>
            )}
          </div>
        </div>

        {/* Main Title & Key Identifiers */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-base sm:text-lg font-medium text-[#E6E4DD] font-mono">
              {record.candidateId}
            </h1>

            {isHigh ? (
              <Badge variant="copper">High priority review</Badge>
            ) : (
              <Badge variant="slate">{record.priority} priority</Badge>
            )}

            <span className="text-[#666963]">•</span>
            <span className="text-xs text-[#9A9C96]">{record.targetName}</span>
            <span className="text-[#666963]">•</span>
            <span className="text-xs text-[#E6E4DD] font-mono">
              {record.frequencyMHz.toFixed(3)} MHz
            </span>
          </div>

          <div className="text-xs text-[#9A9C96] font-mono">{record.telescope}</div>
        </div>
      </div>
    </header>
  );
}
