import type { DiscoveryResultSummary } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import { CheckCircle2, RotateCcw, ArrowDown } from 'lucide-react';

export interface DiscoveryResultsProps {
  summary: DiscoveryResultSummary;
  onReset: () => void;
  onViewCandidates: () => void;
}

export function DiscoveryResults({ summary, onReset, onViewCandidates }: DiscoveryResultsProps) {
  return (
    <section className="border-y border-[#242825] bg-[#121513] px-4 sm:px-5 py-3.5 select-none font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Clear Scientific Results */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#529E72]" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#529E72]">
              Analysis Complete
            </span>
            <span className="text-[#363C38]">•</span>
            <span className="text-xs text-[#9A9C96] font-mono">{summary.observationId}</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium tracking-tight text-[#E6E4DD]">
              {summary.candidates.length} candidates isolated
            </span>
            <span className="text-xs text-[#848780] hidden md:inline">
              Narrowband carriers with persistent Doppler drift confirmed across baseline
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            icon={<RotateCcw className="h-3 w-3" />}
            onClick={onReset}
          >
            Reset
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<ArrowDown className="h-3.5 w-3.5" />}
            onClick={onViewCandidates}
          >
            Review candidates
          </Button>
        </div>
      </div>
    </section>
  );
}
