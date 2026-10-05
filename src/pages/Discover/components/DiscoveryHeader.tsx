import type { DiscoveryStage } from '../types.ts';
import { StatusIndicator } from '@/components/ui/StatusIndicator.tsx';
import { Sparkles } from 'lucide-react';

export interface DiscoveryHeaderProps {
  stage: DiscoveryStage;
}

export function DiscoveryHeader({ stage }: DiscoveryHeaderProps) {
  const isRunning =
    stage === 'preprocessing' ||
    stage === 'transform' ||
    stage === 'representing' ||
    stage === 'searching' ||
    stage === 'ranking';

  return (
    <header className="border-b border-[#1C2630] bg-[#0B0F14] px-4 py-2.5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Scientific Header Title */}
        <div className="flex items-center gap-3">
          <h1 className="text-sm font-semibold tracking-tight text-[#E6EDF2]">Discovery</h1>
          <span className="text-[#7F8B95]">•</span>
          <span className="text-xs text-[#7F8B95]">
            Autonomous anomaly search across observation datasets
          </span>
        </div>

        {/* Right: Engine Status Indicator */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <Sparkles className="h-3.5 w-3.5 text-[#5BD8F5]" />
          <StatusIndicator
            status={isRunning ? 'active' : stage === 'complete' ? 'nominal' : 'online'}
            label={isRunning ? 'Searching' : stage === 'complete' ? 'Complete' : 'Ready'}
            pulse={isRunning}
            className="text-xs"
          />
        </div>
      </div>
    </header>
  );
}
