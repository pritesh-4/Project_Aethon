import type { SignalAnalysisRecord } from '../types.ts';
import { GitCompare, ArrowRightLeft } from 'lucide-react';

export interface PatternComparisonProps {
  record: SignalAnalysisRecord;
}

export function PatternComparison({ record }: PatternComparisonProps) {
  const comp = record.comparison;

  return (
    <div className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-4 font-mono select-none">
      <div className="flex items-center justify-between border-b border-[#1C2630] pb-2 mb-3">
        <div className="flex items-center gap-1.5">
          <GitCompare className="h-3.5 w-3.5 text-[#5BD8F5]" />
          <h4 className="text-xs font-medium text-[#E6EDF2]">Pattern comparison and divergence</h4>
        </div>

        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="text-[#7F8B95]">Divergence:</span>
          <span className="font-medium text-[#E8AE50]">
            {comp.divergenceDegree} ({comp.cosineDistance.toFixed(3)})
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Left: Current Observation */}
        <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-3 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-[#5BD8F5] font-medium">
            <span>Current observation</span>
            <span>{record.candidateId}</span>
          </div>

          {/* Micro Spectrogram Representation */}
          <div className="h-14 w-full rounded-[1px] bg-[#06080B] border border-[#1C2630] relative flex items-center justify-center overflow-hidden">
            <span className="text-[10px] text-[#5BD8F5] font-mono tracking-widest">
              ───╲────────────╲───
            </span>
            <span className="absolute bottom-1 right-2 text-[8px] text-[#7F8B95] font-mono">
              df/dt: {record.driftRateHzPerSec.toFixed(2)} Hz/s
            </span>
          </div>

          <p className="text-[11px] text-[#E6EDF2] font-sans">{comp.observedSignature}</p>
        </div>

        {/* Right: Nearest Known Pattern */}
        <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-3 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-[#7F8B95] font-medium">
            <span>Nearest reference pattern</span>
            <span>{comp.catalogReference}</span>
          </div>

          {/* Micro Pulsar Profile Representation */}
          <div className="h-14 w-full rounded-[1px] bg-[#06080B] border border-[#1C2630] relative flex items-center justify-center overflow-hidden">
            <span className="text-[10px] text-[#7F8B95] font-mono tracking-widest">
              ░░▒▓██▓▒░░░░░░▒▓██▓▒░░
            </span>
            <span className="absolute bottom-1 right-2 text-[8px] text-[#7F8B95] font-mono">
              Cosine distance: {comp.cosineDistance.toFixed(3)}
            </span>
          </div>

          <p className="text-[11px] text-[#7F8B95] font-sans">{comp.nearestKnownPattern}</p>
        </div>
      </div>

      <div className="mt-3 rounded-[1px] border border-[#1C2630] bg-[#06080B] px-2.5 py-1.5 text-[10px] text-[#7F8B95] leading-normal flex items-start gap-1.5">
        <ArrowRightLeft className="h-3 w-3 text-[#5BD8F5] shrink-0 mt-0.5" />
        <span>
          Signal representation demonstrates measurable divergence relative to learned distributions
          of known astrophysical signals and common interference patterns.
        </span>
      </div>
    </div>
  );
}
