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
    <header className="border-b border-[#1C2630] bg-[#0B0F14] px-4 py-2.5 select-none">
      {/* Subtle Breadcrumb + Navigation Strip */}
      <div className="flex items-center justify-between border-b border-[#1C2630] pb-2 mb-2 text-xs text-[#7F8B95]">
        <div className="flex items-center gap-1.5">
          <Link
            to="/candidates"
            className="flex items-center gap-1 text-[#7F8B95] hover:text-[#5BD8F5] transition-colors"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Candidates</span>
          </Link>
          <span className="text-[#7F8B95]">/</span>
          <span className="text-[#E6EDF2] font-mono">{record.candidateId}</span>
          <span className="text-[#7F8B95]">/</span>
          <span className="text-[#5BD8F5]">Signal analysis</span>
        </div>

        {/* Candidate Prev/Next Navigator */}
        <div className="flex items-center gap-2">
          {prevCandidateId ? (
            <Link
              to={`/analysis/${prevCandidateId}`}
              className="inline-flex items-center gap-1 rounded border border-[#1C2630] bg-[#10161D] px-2 py-0.5 text-xs hover:border-[#5BD8F5] hover:text-[#5BD8F5] transition-colors"
            >
              <ChevronLeft className="h-3 w-3" />
              <span>Prev</span>
            </Link>
          ) : (
            <span className="text-[#7F8B95] text-xs">First</span>
          )}

          <span className="text-[#1C2630]">|</span>

          {nextCandidateId ? (
            <Link
              to={`/analysis/${nextCandidateId}`}
              className="inline-flex items-center gap-1 rounded border border-[#1C2630] bg-[#10161D] px-2 py-0.5 text-xs hover:border-[#5BD8F5] hover:text-[#5BD8F5] transition-colors"
            >
              <span>Next</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          ) : (
            <span className="text-[#7F8B95] text-xs">Last</span>
          )}
        </div>
      </div>

      {/* Main Title Strip */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Scientific Header Title */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-[#E6EDF2]">Signal analysis</h1>
            <span className="text-[#7F8B95]">•</span>
            <span className="text-sm font-semibold text-[#5BD8F5] font-mono">
              {record.candidateId}
            </span>
          </div>

          <div className="hidden sm:block h-3.5 w-px bg-[#1C2630]" />

          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-[#7F8B95]">Unclassified candidate</span>
            <span className="text-[#7F8B95]">•</span>
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                isHigh
                  ? 'border border-[#E8AE50]/40 bg-[#E8AE50]/10 text-[#E8AE50]'
                  : 'border border-[#7F8B95]/40 bg-[#7F8B95]/10 text-[#7F8B95]'
              }`}
            >
              Priority: {record.priority.toLowerCase()}
            </span>
          </div>

          <div className="hidden md:block h-3.5 w-px bg-[#1C2630]" />

          <div className="hidden md:flex items-center gap-1 text-xs text-[#7F8B95]">
            <span>Target:</span>
            <span className="text-[#E6EDF2]">{record.targetName}</span>
          </div>
        </div>

        {/* Right: Engine Status Indicator */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <Activity className="h-3.5 w-3.5 text-[#5BD8F5]" />
          <StatusIndicator status="nominal" label="Ready" pulse={false} className="text-xs" />
        </div>
      </div>
    </header>
  );
}
