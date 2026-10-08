import type { DiscoveryStage } from '../types.ts';

export interface DiscoveryHeaderProps {
  stage: DiscoveryStage;
}

export function DiscoveryHeader({ stage }: DiscoveryHeaderProps) {
  const isAnalyzing =
    stage === 'prepare' || stage === 'represent' || stage === 'search' || stage === 'rank';

  const statusDot = isAnalyzing
    ? 'bg-[#376A9B] animate-pulse'
    : stage === 'complete'
      ? 'bg-[#3D7D54]'
      : 'bg-[#7E8B96]';

  const statusLabel = isAnalyzing
    ? 'Pipeline active'
    : stage === 'complete'
      ? 'Screening complete'
      : 'Standby';

  const statusStyle = isAnalyzing
    ? 'text-[#376A9B] bg-[#EAF1F8] border-[#B6CDE2]'
    : stage === 'complete'
      ? 'text-[#3D7D54] bg-[#EFF7F2] border-[#B2D8C0]'
      : 'text-[#56616A] bg-[#EAE7E0] border-[#D6D2C9]';

  return (
    <header className="border-b border-[#D6D2C9] bg-[#FAF8F5] px-4 sm:px-6 py-5 sm:py-6 select-none font-sans">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-mono text-[#7E8B96] uppercase tracking-wider">
            <span>AETHON WORKSPACE</span>
            <span>/</span>
            <span>DATA INTAKE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#17202A]">
            Discovery
          </h1>
          <p className="text-sm text-[#56616A] leading-relaxed max-w-xl">
            Select or ingest astronomical survey data to execute unsupervised time–frequency anomaly
            screening.
          </p>
        </div>

        {/* Technical Status */}
        <div className="flex items-center gap-2 self-start sm:self-end pb-1 font-mono text-xs">
          <span
            className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-[3px] border ${statusStyle}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
            <span className="text-[11px] font-sans font-medium uppercase tracking-wider">
              {statusLabel}
            </span>
          </span>
        </div>
      </div>
    </header>
  );
}
