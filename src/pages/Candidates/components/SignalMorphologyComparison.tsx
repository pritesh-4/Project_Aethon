import type { CandidateSignalData } from '../types.ts';
import { GitCompare, ArrowRightLeft } from 'lucide-react';

export interface SignalMorphologyComparisonProps {
  candidate: CandidateSignalData;
}

export function SignalMorphologyComparison({ candidate }: SignalMorphologyComparisonProps) {
  const morphology = candidate.morphology;

  return (
    <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-3.5 font-mono select-none">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
        <div className="flex items-center gap-1.5">
          <GitCompare className="h-3.5 w-3.5 text-[#66E3FF]" />
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#EAF4F7]">
            SIGNAL MORPHOLOGY COMPARISON
          </h4>
        </div>

        <div className="flex items-center gap-1 text-[10px]">
          <span className="text-[#84929C] uppercase">DIVERGENCE //</span>
          <span
            className={`font-bold ${
              morphology.divergenceDegree === 'HIGH'
                ? 'text-[#FFB84D]'
                : morphology.divergenceDegree === 'MODERATE'
                  ? 'text-[#66E3FF]'
                  : 'text-slate-400'
            }`}
          >
            {morphology.divergenceDegree} ({morphology.cosineDistance.toFixed(3)})
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Observed Signal Description */}
        <div className="rounded-[2px] border border-cyan-800/70 bg-[#05070A]/80 p-2.5 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-[#66E3FF] font-semibold uppercase">
            <span>OBSERVED SIGNAL</span>
            <span>TARGET // {candidate.id}</span>
          </div>
          <p className="text-[11px] text-[#EAF4F7] font-sans leading-snug">
            {morphology.observedType}
          </p>
          <span className="block text-[9px] text-slate-500 font-mono">
            DRIFT: {candidate.driftRateHzPerSec.toFixed(2)} Hz/s • SNR: +{candidate.snrDb} dB
          </span>
        </div>

        {/* Nearest Known Natural/Terrestrial Pattern */}
        <div className="rounded-[2px] border border-slate-800 bg-[#05070A]/80 p-2.5 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase">
            <span>NEAREST KNOWN PATTERN</span>
            <span>REFERENCE ARCHIVE</span>
          </div>
          <p className="text-[11px] text-slate-300 font-sans leading-snug">
            {morphology.nearestKnownType}
          </p>
          <span className="block text-[9px] text-slate-500 font-mono">
            COSINE DISTANCE: {morphology.cosineDistance.toFixed(3)} [NON-CONVERGENT]
          </span>
        </div>
      </div>

      {/* Scientific Principle Footer */}
      <div className="mt-2.5 rounded-[1px] bg-[#06b6d4]/5 border border-cyan-950 px-2 py-1 text-[9px] text-[#84929C] leading-normal flex items-start gap-1.5">
        <ArrowRightLeft className="h-3 w-3 text-cyan-400 shrink-0 mt-0.5" />
        <span>
          AETHON prioritizes candidates by measuring displacement from known astrophysical & RFI
          manifolds in learned 512-dimensional latent embedding space.
        </span>
      </div>
    </div>
  );
}
