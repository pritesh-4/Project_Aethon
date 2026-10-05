import type { DiscoveryStage } from '../types.ts';
import { StatusIndicator } from '@/components/ui/StatusIndicator.tsx';
import { Sparkles, Terminal } from 'lucide-react';

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
    <header className="border-b border-slate-800/80 bg-[#080D1A]/60 px-4 py-2.5 backdrop-blur-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: Scientific Header Title and Subsystem Meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-bold tracking-widest text-[#EAF4F7] uppercase font-sans">
              DISCOVERY
            </span>
            <span className="text-slate-600">//</span>
            <span className="text-[11px] text-[#84929C] tracking-wider uppercase">
              AUTONOMOUS SIGNAL SEARCH
            </span>
          </div>

          <div className="hidden sm:block h-3.5 w-px bg-slate-800" />

          <div className="flex items-center gap-1.5 text-[11px] text-[#84929C]">
            <span className="text-slate-500 uppercase">SEARCH SPACE //</span>
            <span className="text-[#66E3FF] font-medium">RADIO OBSERVATIONS</span>
          </div>

          <div className="hidden md:block h-3.5 w-px bg-slate-800" />

          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-[#84929C]">
            <Terminal className="h-3 w-3 text-slate-500" />
            <span className="text-slate-500 uppercase">ENGINE //</span>
            <span className="text-slate-300">AETHON DISCOVERY CORE</span>
          </div>
        </div>

        {/* Right: Engine Status Indicator */}
        <div className="flex items-center gap-3 font-mono text-[11px] self-end sm:self-center">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3 w-3 text-[#66E3FF]" />
            <span className="text-slate-400 text-[10px] uppercase">DISCOVERY ENGINE</span>
            <StatusIndicator
              status={isRunning ? 'active' : stage === 'complete' ? 'nominal' : 'online'}
              label={isRunning ? 'SEARCHING' : stage === 'complete' ? 'COMPLETE' : 'READY'}
              pulse={isRunning}
              className="text-[10px]"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
