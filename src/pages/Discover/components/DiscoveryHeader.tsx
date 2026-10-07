import type { DiscoveryStage } from '../types.ts';
import { StatusIndicator } from '@/components/ui/StatusIndicator.tsx';

export interface DiscoveryHeaderProps {
  stage: DiscoveryStage;
}

export function DiscoveryHeader({ stage }: DiscoveryHeaderProps) {
  const isAnalyzing =
    stage === 'prepare' || stage === 'represent' || stage === 'search' || stage === 'rank';

  const statusType = isAnalyzing ? 'active' : stage === 'complete' ? 'nominal' : 'online';
  const statusLabel = isAnalyzing ? 'Analyzing' : stage === 'complete' ? 'Complete' : 'Ready';

  return (
    <header className="border-b border-[#1C2630] bg-[#0B0F14] px-4 sm:px-6 py-3 select-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5">
          <h1 className="text-sm font-semibold tracking-tight text-[#E6EDF2]">Discovery</h1>
          <span className="text-[#7F8B95]">•</span>
          <span className="text-xs text-[#7F8B95]">
            Autonomous anomaly search across astronomical observations
          </span>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <StatusIndicator
            status={statusType}
            label={statusLabel}
            pulse={isAnalyzing}
            className="text-xs"
          />
        </div>
      </div>
    </header>
  );
}
