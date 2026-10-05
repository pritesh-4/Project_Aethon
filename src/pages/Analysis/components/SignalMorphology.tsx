import type { SignalAnalysisRecord } from '../types.ts';
import { Activity } from 'lucide-react';

export interface SignalMorphologyProps {
  record: SignalAnalysisRecord;
}

export function SignalMorphology({ record }: SignalMorphologyProps) {
  const morph = record.morphology;

  const params = [
    {
      label: 'TEMPORAL COHERENCE',
      value: morph.temporalCoherence,
      highlight: morph.temporalCoherence === 'HIGH',
    },
    {
      label: 'FREQUENCY STABILITY',
      value: morph.frequencyStability,
      highlight: morph.frequencyStability === 'HIGH',
    },
    { label: 'BANDWIDTH CATEGORY', value: morph.bandwidthCategory, highlight: false },
    {
      label: 'PERSISTENCE STATE',
      value: morph.persistenceState,
      highlight: morph.persistenceState === 'HIGH',
    },
    {
      label: 'MORPHOLOGICAL DEVIATION',
      value: morph.morphologicalDeviation,
      highlight: morph.morphologicalDeviation === 'HIGH',
    },
  ];

  return (
    <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-4 font-mono select-none">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
        <div className="flex items-center gap-1.5">
          <Activity className="h-3.5 w-3.5 text-[#66E3FF]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#EAF4F7]">
            SIGNAL MORPHOLOGY PROFILE
          </h4>
        </div>
        <span className="text-[10px] text-[#84929C] uppercase">PARAMETRIC ATTRIBUTES</span>
      </div>

      <div className="space-y-2">
        {params.map((p) => (
          <div
            key={p.label}
            className="flex items-center justify-between border-b border-slate-800/50 pb-1.5 text-xs"
          >
            <span className="text-slate-400 text-[11px]">{p.label}</span>
            <span
              className={`font-semibold tracking-wider ${
                p.highlight ? 'text-[#66E3FF]' : 'text-slate-200'
              }`}
            >
              {p.value}
            </span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-[11px] text-[#84929C] leading-relaxed border-t border-slate-800/60 pt-2 font-sans">
        {morph.description}
      </p>
    </div>
  );
}
