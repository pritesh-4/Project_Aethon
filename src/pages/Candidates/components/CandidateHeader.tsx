import { Crosshair } from 'lucide-react';
import { StatusIndicator } from '@/components/ui/StatusIndicator.tsx';

export interface CandidateHeaderProps {
  observationId: string;
  totalIdentified: number;
  highPriorityCount: number;
}

export function CandidateHeader({
  observationId,
  totalIdentified,
  highPriorityCount,
}: CandidateHeaderProps) {
  return (
    <header className="border-b border-slate-800/80 bg-[#080D1A]/60 px-4 py-2.5 backdrop-blur-sm select-none">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Scientific Header Title and Subsystem Meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold tracking-widest text-[#EAF4F7] uppercase font-sans">
              CANDIDATE EVENTS
            </span>
            <span className="text-slate-600">//</span>
            <span className="text-[11px] text-[#84929C] tracking-wider uppercase">
              ANOMALOUS SIGNAL TRIAGE
            </span>
          </div>

          <div className="hidden sm:block h-3.5 w-px bg-slate-800" />

          <div className="flex items-center gap-1.5 text-[11px] text-[#84929C]">
            <span className="text-slate-500 uppercase">OBSERVATION //</span>
            <span className="text-[#66E3FF] font-semibold">{observationId}</span>
          </div>

          <div className="hidden md:block h-3.5 w-px bg-slate-800" />

          <div className="flex items-center gap-1.5 text-[11px] text-[#84929C]">
            <span className="text-slate-500 uppercase">EVENTS IDENTIFIED //</span>
            <span className="text-[#EAF4F7] font-semibold">{totalIdentified}</span>
          </div>

          <div className="hidden lg:block h-3.5 w-px bg-slate-800" />

          <div className="flex items-center gap-1.5 text-[11px]">
            <span className="text-slate-500 uppercase">HIGH PRIORITY //</span>
            <span className="rounded-[1px] border border-amber-500/60 bg-amber-950/40 px-1.5 py-0.2 text-[10px] font-bold text-[#FFB84D] uppercase tracking-wider">
              {highPriorityCount}
            </span>
          </div>
        </div>

        {/* Right: Engine Status Indicator */}
        <div className="flex items-center gap-3 font-mono text-[11px] self-end sm:self-center">
          <div className="flex items-center gap-1.5">
            <Crosshair className="h-3.5 w-3.5 text-[#66E3FF]" />
            <span className="text-slate-400 text-[10px] uppercase">DISCOVERY ENGINE</span>
            <StatusIndicator
              status="nominal"
              label="COMPLETE"
              pulse={false}
              className="text-[10px]"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
