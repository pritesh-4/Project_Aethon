import type { DiscoveryStage } from '../types.ts';

export interface DiscoveryHeaderProps {
  stage: DiscoveryStage;
}

export function DiscoveryHeader({ stage }: DiscoveryHeaderProps) {
  const isAnalyzing =
    stage === 'prepare' || stage === 'represent' || stage === 'search' || stage === 'rank';

  const statusDot = isAnalyzing
    ? 'bg-[#D4864A] animate-pulse'
    : stage === 'complete'
      ? 'bg-[#529E72]'
      : 'bg-[#6B706A]';

  const statusLabel = isAnalyzing
    ? 'Pipeline active'
    : stage === 'complete'
      ? 'Screening complete'
      : 'Standby';
  const statusColor = isAnalyzing
    ? 'text-[#D4864A]'
    : stage === 'complete'
      ? 'text-[#529E72]'
      : 'text-[#848780]';

  return (
    <header className="border-b border-[#242825] bg-[#0E100F] px-4 sm:px-6 py-6 sm:py-8 select-none font-sans">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        {/* Role 1: Page Identity + Role 4: Supporting Orientation */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#767973] uppercase tracking-wider">
            <span>AETHON WORKSPACE</span>
            <span>/</span>
            <span>DATA INTAKE</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-[#E6E4DD]">
            Discovery
          </h1>
          <p className="text-sm text-[#9A9C96] leading-relaxed max-w-xl">
            Select or ingest astronomical survey data to execute unsupervised time–frequency anomaly
            screening.
          </p>
        </div>

        {/* Role 6: Technical Status */}
        <div className="flex items-center gap-2 self-start sm:self-end pb-1 font-mono text-xs">
          <span
            className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-[2px] border border-[#242825] bg-[#121413] ${statusColor}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
            <span className="text-[11px] uppercase tracking-wider">{statusLabel}</span>
          </span>
        </div>
      </div>
    </header>
  );
}
