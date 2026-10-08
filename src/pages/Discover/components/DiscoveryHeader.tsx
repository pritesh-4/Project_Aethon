import type { DiscoveryStage } from '../types.ts';

export interface DiscoveryHeaderProps {
  stage: DiscoveryStage;
}

export function DiscoveryHeader({ stage }: DiscoveryHeaderProps) {
  const isAnalyzing =
    stage === 'prepare' || stage === 'represent' || stage === 'search' || stage === 'rank';

  const statusDot = isAnalyzing
    ? 'bg-[#D4864A]'
    : stage === 'complete'
      ? 'bg-[#529E72]'
      : 'bg-[#6B706A]';

  const statusLabel = isAnalyzing ? 'Analyzing' : stage === 'complete' ? 'Complete' : 'Ready';
  const statusColor = isAnalyzing
    ? 'text-[#D4864A]'
    : stage === 'complete'
      ? 'text-[#529E72]'
      : 'text-[#9A9C96]';

  return (
    <header className="border-b border-[#242825] bg-[#0F1110] px-4 sm:px-6 py-2.5 select-none">
      <div className="flex items-center justify-between max-w-5xl mx-auto">
        <div className="flex flex-wrap items-center gap-2.5 text-xs min-w-0">
          <h1 className="text-sm font-medium tracking-tight text-[#E6E4DD] shrink-0">Discovery</h1>
          <span className="text-[#242825] hidden sm:inline">·</span>
          <span className="text-[#9A9C96] hidden sm:inline">Unsupervised anomaly screening</span>
        </div>

        {/* Inline status — no bordered badge */}
        <span className={`inline-flex items-center gap-1.5 ${statusColor}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
          <span className="text-xs font-medium">{statusLabel}</span>
        </span>
      </div>
    </header>
  );
}
