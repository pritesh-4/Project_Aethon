import type { DiscoveryResultSummary } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import { CheckCircle2, RotateCcw } from 'lucide-react';

export interface DiscoveryResultsProps {
  summary: DiscoveryResultSummary;
  onReset: () => void;
  onScrollToCandidates: () => void;
}

export function DiscoveryResults({
  summary,
  onReset,
  onScrollToCandidates,
}: DiscoveryResultsProps) {
  return (
    <div className="rounded border border-[#5BD8F5]/30 bg-[#0B0F14] p-4 select-none shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Summary Metrics */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#5BD8F5]" />
            <span className="text-xs font-semibold text-[#E6EDF2]">
              Discovery complete: {summary.observationId}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="text-[#7F8B95]">
              <strong className="text-[#E6EDF2] font-semibold font-mono">
                {summary.samplesAnalyzed.toLocaleString()}
              </strong>{' '}
              samples analyzed
            </span>
            <span className="text-[#7F8B95] hidden sm:inline">•</span>
            <span className="text-[#7F8B95]">
              <strong className="text-[#5BD8F5] font-semibold font-mono">
                {summary.anomalousRegionsCount}
              </strong>{' '}
              anomalous regions
            </span>
            <span className="text-[#7F8B95] hidden sm:inline">•</span>
            <span className="text-[#7F8B95]">
              <strong className="text-[#E8AE50] font-semibold font-mono">
                {summary.highPriorityCandidatesCount}
              </strong>{' '}
              high-priority candidates
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 self-start md:self-center">
          <Button
            variant="ghost"
            size="sm"
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={onReset}
          >
            New search
          </Button>

          <Button variant="primary" size="sm" withArrow onClick={onScrollToCandidates}>
            View candidates
          </Button>
        </div>
      </div>
    </div>
  );
}
