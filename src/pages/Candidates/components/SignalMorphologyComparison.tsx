import type { CandidateSignalData } from '../types.ts';
import { GitCompare, ArrowRightLeft } from 'lucide-react';

export interface SignalMorphologyComparisonProps {
  candidate: CandidateSignalData;
}

export function SignalMorphologyComparison({ candidate }: SignalMorphologyComparisonProps) {
  const morphology = candidate.morphology;

  return (
    <div className="rounded border border-[#1C2630] bg-[#0B0F14] p-3.5 select-none">
      <div className="flex items-center justify-between border-b border-[#1C2630] pb-2 mb-3">
        <div className="flex items-center gap-1.5">
          <GitCompare className="h-3.5 w-3.5 text-[#5BD8F5]" />
          <h4 className="text-xs font-semibold text-[#E6EDF2]">Signal morphology comparison</h4>
        </div>

        <div className="flex items-center gap-1 text-xs">
          <span className="text-[#7F8B95]">Divergence:</span>
          <span
            className={`font-medium ${
              morphology.divergenceDegree === 'HIGH'
                ? 'text-[#E8AE50]'
                : morphology.divergenceDegree === 'MODERATE'
                  ? 'text-[#5BD8F5]'
                  : 'text-[#7F8B95]'
            }`}
          >
            {morphology.divergenceDegree.toLowerCase()} ({morphology.cosineDistance.toFixed(3)})
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Observed Signal Description */}
        <div className="rounded border border-[#5BD8F5]/30 bg-[#10161D] p-2.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-[#5BD8F5] font-medium">
            <span>Observed signal</span>
            <span className="font-mono">{candidate.id}</span>
          </div>
          <p className="text-xs text-[#E6EDF2] leading-snug">{morphology.observedType}</p>
          <span className="block text-[11px] text-[#7F8B95] font-mono">
            Drift: {candidate.driftRateHzPerSec.toFixed(2)} Hz/s • SNR: +{candidate.snrDb} dB
          </span>
        </div>

        {/* Nearest Known Natural/Terrestrial Pattern */}
        <div className="rounded border border-[#1C2630] bg-[#06080B] p-2.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] text-[#7F8B95] font-medium">
            <span>Nearest known pattern</span>
            <span>Reference library</span>
          </div>
          <p className="text-xs text-[#7F8B95] leading-snug">{morphology.nearestKnownType}</p>
          <span className="block text-[11px] text-[#7F8B95] font-mono">
            Cosine distance: {morphology.cosineDistance.toFixed(3)}
          </span>
        </div>
      </div>

      {/* Scientific Principle Footer */}
      <div className="mt-2.5 rounded bg-[#10161D] border border-[#1C2630] px-2.5 py-1.5 text-xs text-[#7F8B95] leading-normal flex items-start gap-2">
        <ArrowRightLeft className="h-3.5 w-3.5 text-[#5BD8F5] shrink-0 mt-0.5" />
        <span>
          Candidates are prioritized by measuring displacement from known astrophysical and
          interference manifolds in learned latent embedding space.
        </span>
      </div>
    </div>
  );
}
