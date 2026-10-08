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
    <section className="border border-[#D6D2C9] bg-[#FAF8F5] rounded-[3px] px-5 py-4 select-none font-sans shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Clear Scientific Results */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#3D7D54]" />
            <span className="font-mono text-[11px] uppercase tracking-wider text-[#3D7D54] font-medium">
              Screening complete
            </span>
            <span className="text-[#B8B3A8]">•</span>
            <span className="text-xs text-[#56616A] font-mono">{summary.observationId}</span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold tracking-tight text-[#17202A]">
              {summary.candidates.length} candidate signals isolated
            </span>
            <span className="text-xs text-[#56616A] hidden md:inline">
              Narrowband carriers with persistent Doppler drift confirmed across baseline
            </span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            icon={<RotateCcw className="h-3.5 w-3.5" />}
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
