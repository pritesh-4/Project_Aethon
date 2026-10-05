import type { SignalAnalysisRecord } from '../types.ts';
import { Activity } from 'lucide-react';

export interface SignalMorphologyProps {
  record: SignalAnalysisRecord;
}

export function SignalMorphology({ record }: SignalMorphologyProps) {
  const morph = record.morphology;

  const params = [
    {
      label: 'Temporal coherence',
      value: morph.temporalCoherence,
      highlight: morph.temporalCoherence === 'HIGH',
    },
    {
      label: 'Frequency stability',
      value: morph.frequencyStability,
      highlight: morph.frequencyStability === 'HIGH',
    },
    { label: 'Bandwidth category', value: morph.bandwidthCategory, highlight: false },
    {
      label: 'Persistence state',
      value: morph.persistenceState,
      highlight: morph.persistenceState === 'HIGH',
    },
    {
      label: 'Morphological deviation',
      value: morph.morphologicalDeviation,
      highlight: morph.morphologicalDeviation === 'HIGH',
    },
  ];

  return (
    <div className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-4 font-mono select-none">
      <div className="flex items-center justify-between border-b border-[#1C2630] pb-2 mb-3">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-[#5BD8F5]" />
          <h4 className="text-xs font-medium text-[#E6EDF2]">Signal morphology</h4>
        </div>
      </div>

      <div className="space-y-2">
        {params.map((p) => (
          <div
            key={p.label}
            className="flex items-center justify-between border-b border-[#1C2630]/50 pb-1.5 text-xs"
          >
            <span className="text-[#7F8B95] text-[11px]">{p.label}</span>
            <span className={`font-medium ${p.highlight ? 'text-[#5BD8F5]' : 'text-[#E6EDF2]'}`}>
              {p.value}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-[#7F8B95] leading-relaxed border-t border-[#1C2630] pt-2 font-sans">
        {morph.description}
      </p>
    </div>
  );
}
