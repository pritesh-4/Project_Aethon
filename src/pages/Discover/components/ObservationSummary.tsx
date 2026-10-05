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
    <div className="relative rounded border border-[#5BD8F5]/30 bg-[#0B0F14] p-5 shadow-sm">
      <div className="flex flex-col gap-4">
        {/* Top Identification Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1C2630] pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-[#5BD8F5]" />
            <span className="text-xs font-medium text-[#E6EDF2]">Loaded observation</span>
            <span className="text-[#7F8B95]">•</span>
            <span className="text-sm font-semibold text-[#5BD8F5] font-mono">{observation.id}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#7F8B95]">
            <span className="rounded border border-[#5BD8F5]/30 bg-[#5BD8F5]/10 px-2 py-0.5 text-xs font-medium text-[#5BD8F5]">
              Ready for analysis
            </span>
          </div>
        </div>

        {/* Observation Name & Description */}
        <div>
          <h3 className="text-sm font-semibold text-[#E6EDF2]">{observation.name}</h3>
          <p className="mt-0.5 text-xs text-[#7F8B95]">
            Source: {observation.telescope} • Coordinates: {observation.coordinates.ra} /{' '}
            {observation.coordinates.dec}
          </p>
        </div>

        {/* Instrumentation Telemetry Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 rounded border border-[#1C2630] bg-[#10161D] p-3 text-xs">
          <div>
            <span className="block text-[11px] text-[#7F8B95]">Format</span>
            <span className="text-xs font-medium text-[#E6EDF2] font-mono">
              {observation.format}
            </span>
          </div>

          <div>
            <span className="block text-[11px] text-[#7F8B95]">Samples</span>
            <span className="text-xs font-medium text-[#5BD8F5] font-mono">
              {observation.samplesCount.toLocaleString()}
            </span>
          </div>

          <div>
            <span className="block text-[11px] text-[#7F8B95]">Duration</span>
            <span className="text-xs font-medium text-[#E6EDF2] font-mono">
              {observation.durationString}
            </span>
          </div>

          <div>
            <span className="block text-[11px] text-[#7F8B95]">Bandwidth</span>
            <span className="text-xs font-medium text-[#E6EDF2] font-mono">
              {observation.bandwidthMHz.toFixed(1)} MHz
            </span>
          </div>

          <div>
            <span className="block text-[11px] text-[#7F8B95]">Frequency</span>
            <span className="text-xs font-medium text-[#5BD8F5] font-mono">
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
            Remove
          </Button>

          <Button variant="primary" size="md" withArrow onClick={onInitiateDiscovery}>
            Start discovery
          </Button>
        </div>
      </div>
    </div>
  );
}
