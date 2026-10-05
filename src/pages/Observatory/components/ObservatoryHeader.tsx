import type { ObservationStatus } from '../types.ts';
import { StatusIndicator } from '@/components/ui/StatusIndicator.tsx';
import { Activity, Cpu } from 'lucide-react';

export interface ObservatoryHeaderProps {
  observationId: string;
  status: ObservationStatus;
  targetName: string;
  telescope: string;
  observationList: { id: string; name: string }[];
  onSelectObservation: (id: string) => void;
}

export function ObservatoryHeader({
  observationId,
  status,
  targetName,
  telescope,
  observationList,
  onSelectObservation,
}: ObservatoryHeaderProps) {
  const getStatusColor = (s: ObservationStatus) => {
    switch (s) {
      case 'IDLE':
        return 'text-[#84929C] border-slate-700 bg-slate-900/40';
      case 'LOADING':
        return 'text-[#66E3FF] border-[#66E3FF]/40 bg-[#06b6d4]/10';
      case 'ANALYZING':
        return 'text-[#66E3FF] border-[#66E3FF]/70 bg-[#06b6d4]/15 animate-pulse';
      case 'ANOMALY_DETECTED':
        return 'text-[#FFB84D] border-[#FFB84D]/70 bg-amber-950/30';
      case 'CANDIDATE_READY':
        return 'text-emerald-400 border-emerald-500/70 bg-emerald-950/30';
    }
  };

  const getStatusLabel = (s: ObservationStatus) => {
    switch (s) {
      case 'IDLE':
        return 'STANDBY';
      case 'LOADING':
        return 'BUFFERING';
      case 'ANALYZING':
        return 'PROCESSING';
      case 'ANOMALY_DETECTED':
        return 'ANOMALY DETECTED';
      case 'CANDIDATE_READY':
        return 'CANDIDATE READY';
    }
  };

  return (
    <header className="border-b border-slate-800/80 bg-[#080D1A]/60 px-4 py-2.5 backdrop-blur-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left: Compact Scientific Title & Active Observation Metadata */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 font-mono text-xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold tracking-widest text-[#EAF4F7] uppercase font-sans">
                OBSERVATORY
              </span>
              <span className="text-slate-600">//</span>
              <span className="text-[11px] text-[#84929C] tracking-wider uppercase">
                DEEP-SKY SIGNAL ANALYSIS
              </span>
            </div>
          </div>

          <div className="hidden sm:block h-3.5 w-px bg-slate-800" />

          {/* Observation Switcher / Identifier */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-[#84929C] uppercase">OBSERVATION //</span>
            <div className="relative">
              <select
                aria-label="Select Observation Record"
                value={observationId}
                onChange={(e) => onSelectObservation(e.target.value)}
                className="h-6 rounded-[2px] border border-slate-700/80 bg-[#0A0E13] px-2 text-[11px] font-mono text-[#66E3FF] focus:border-[#66E3FF] focus:outline-none transition-colors cursor-pointer"
              >
                {observationList.map((obs) => (
                  <option key={obs.id} value={obs.id}>
                    {obs.id} — {obs.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="hidden md:block h-3.5 w-px bg-slate-800" />

          {/* Target & Aperture Breadcrumb */}
          <div className="hidden lg:flex items-center gap-1.5 text-[11px] text-[#84929C]">
            <span className="text-slate-400 font-medium">{targetName}</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-500 text-[10px] truncate max-w-[200px]">{telescope}</span>
          </div>

          <div className="hidden sm:block h-3.5 w-px bg-slate-800" />

          {/* Status Badge */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-[#84929C] uppercase">STATUS //</span>
            <span
              className={`rounded-[2px] border px-1.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase ${getStatusColor(
                status
              )}`}
            >
              {getStatusLabel(status)}
            </span>
          </div>
        </div>

        {/* Right: Thin Subsystem Health Indicators */}
        <div className="flex items-center gap-4 font-mono text-[11px] text-[#84929C] self-end lg:self-center">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3 w-3 text-[#66E3FF]" />
            <span className="text-slate-400">SIGNAL ENGINE</span>
            <StatusIndicator status="online" label="ONLINE" pulse={false} className="text-[10px]" />
          </div>

          <div className="h-3.5 w-px bg-slate-800" />

          <div className="flex items-center gap-1.5">
            <Cpu className="h-3 w-3 text-emerald-400" />
            <span className="text-slate-400">INFERENCE ENGINE</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase text-emerald-400 tracking-wider">
              <span className="h-1.5 w-1.5 rounded-none bg-emerald-400" />
              READY
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
