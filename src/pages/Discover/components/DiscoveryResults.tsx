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
    <section className="rounded-[2px] border border-[#D4864A]/40 bg-[#1A1E1B] p-5 sm:p-6 shadow-sm select-none font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        {/* Left: Clear Scientific Results */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#D4864A]" />
            <span className="text-xs font-medium text-[#D4864A]">Observation analyzed</span>
            <span className="text-[#363C38]">•</span>
            <span className="text-xs text-[#9A9C96] font-mono">{summary.observationId}</span>
          </div>

          <h3 className="text-base sm:text-lg font-medium tracking-tight text-[#E6E4DD]">
            {summary.candidates.length} candidates identified
          </h3>

          <p className="text-xs text-[#9A9C96]">
            Narrowband carriers with persistent Doppler drift confirmed across observation baseline.
          </p>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="ghost"
            size="sm"
            icon={<RotateCcw className="h-3.5 w-3.5" />}
            onClick={onReset}
          >
            New analysis
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={<ArrowDown className="h-3.5 w-3.5" />}
            onClick={onViewCandidates}
          >
            View candidates
          </Button>
        </div>
      </div>
    </section>
  );
}
