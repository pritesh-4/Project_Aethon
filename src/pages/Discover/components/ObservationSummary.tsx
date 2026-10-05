import type { DiscoveryObservationMeta } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import { CheckCircle2, Trash2 } from 'lucide-react';

export interface ObservationSummaryProps {
  observation: DiscoveryObservationMeta;
  onRemove: () => void;
  onInitiateDiscovery: () => void;
}

export function ObservationSummary({
  observation,
  onRemove,
  onInitiateDiscovery,
}: ObservationSummaryProps) {
  return (
    <div className="relative rounded-[2px] border border-cyan-800/70 bg-[#0A0E13] p-5 font-mono shadow-[0_4px_24px_rgba(6,182,212,0.08)]">
      {/* Corner Technical Accents */}
      <span className="pointer-events-none absolute -left-[1px] -top-[1px] h-2 w-2 border-l border-t border-[#66E3FF]" />
      <span className="pointer-events-none absolute -right-[1px] -top-[1px] h-2 w-2 border-r border-t border-[#66E3FF]" />
      <span className="pointer-events-none absolute -left-[1px] -bottom-[1px] h-2 w-2 border-l border-b border-[#66E3FF]" />
      <span className="pointer-events-none absolute -right-[1px] -bottom-[1px] h-2 w-2 border-r border-b border-[#66E3FF]" />

      <div className="flex flex-col gap-5">
        {/* Top Identification Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              OBSERVATION LOADED
            </span>
            <span className="text-slate-600">//</span>
            <span className="text-sm font-bold text-[#66E3FF] tracking-wider">
              {observation.id}
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-[#84929C]">
            <span>STATUS //</span>
            <span className="rounded-[1px] border border-cyan-800/80 bg-cyan-950/40 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 uppercase tracking-wider">
              READY FOR ANALYSIS
            </span>
          </div>
        </div>

        {/* Observation Name & Aperture Description */}
        <div>
          <h3 className="text-sm font-bold text-[#EAF4F7] font-sans">{observation.name}</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Aperture: {observation.telescope} • Coordinates: {observation.coordinates.ra} /{' '}
            {observation.coordinates.dec}
          </p>
        </div>

        {/* Instrumentation Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 rounded-[2px] border border-slate-800/80 bg-[#05070A]/80 p-3 text-xs">
          <div>
            <span className="block text-[10px] text-[#84929C] uppercase tracking-wider">
              FORMAT
            </span>
            <span className="text-xs font-semibold text-[#EAF4F7]">{observation.format}</span>
          </div>

          <div>
            <span className="block text-[10px] text-[#84929C] uppercase tracking-wider">
              SAMPLES
            </span>
            <span className="text-xs font-semibold text-[#66E3FF]">
              {observation.samplesCount.toLocaleString()}
            </span>
          </div>

          <div>
            <span className="block text-[10px] text-[#84929C] uppercase tracking-wider">
              DURATION
            </span>
            <span className="text-xs font-semibold text-[#EAF4F7]">
              {observation.durationString}
            </span>
          </div>

          <div>
            <span className="block text-[10px] text-[#84929C] uppercase tracking-wider">
              BANDWIDTH
            </span>
            <span className="text-xs font-semibold text-[#EAF4F7]">
              {observation.bandwidthMHz.toFixed(1)} MHz
            </span>
          </div>

          <div>
            <span className="block text-[10px] text-[#84929C] uppercase tracking-wider">
              FREQUENCY
            </span>
            <span className="text-xs font-semibold text-[#66E3FF]">
              {observation.frequencyMHz.toFixed(2)} MHz
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <Button
            variant="ghost"
            size="sm"
            icon={<Trash2 className="h-3.5 w-3.5" />}
            onClick={onRemove}
          >
            REMOVE OBSERVATION
          </Button>

          <Button
            variant="primary"
            size="md"
            withArrow
            cornerAccents
            onClick={onInitiateDiscovery}
            className="shadow-[0_0_16px_rgba(102,227,255,0.22)]"
          >
            INITIATE DISCOVERY →
          </Button>
        </div>
      </div>
    </div>
  );
}
