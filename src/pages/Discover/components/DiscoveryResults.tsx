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
    <div className="rounded-[2px] border border-emerald-500/70 bg-gradient-to-r from-emerald-950/30 via-[#0A1624] to-[#0A0E13] p-4 font-mono shadow-[0_4px_24px_rgba(16,185,129,0.12)] select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left: Summary Metrics */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              DISCOVERY COMPLETE
            </span>
            <span className="text-slate-600">//</span>
            <span className="text-xs text-[#EAF4F7]">RECORD {summary.observationId}</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="text-slate-300">
              <strong className="text-emerald-300 font-semibold">
                {summary.samplesAnalyzed.toLocaleString()}
              </strong>{' '}
              <span className="text-[#84929C]">SIGNAL SAMPLES ANALYZED</span>
            </span>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <span className="text-slate-300">
              <strong className="text-[#66E3FF] font-semibold">
                {summary.anomalousRegionsCount}
              </strong>{' '}
              <span className="text-[#84929C]">ANOMALOUS REGIONS IDENTIFIED</span>
            </span>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <span className="text-slate-300">
              <strong className="text-emerald-400 font-semibold">
                {summary.highPriorityCandidatesCount}
              </strong>{' '}
              <span className="text-[#84929C]">HIGH-PRIORITY CANDIDATES</span>
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
            NEW DISCOVERY
          </Button>

          <Button variant="primary" size="sm" withArrow onClick={onScrollToCandidates}>
            VIEW CANDIDATES
          </Button>
        </div>
      </div>
    </div>
  );
}
