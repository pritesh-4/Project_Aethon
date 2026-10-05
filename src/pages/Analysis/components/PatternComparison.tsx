import type { SignalAnalysisRecord } from '../types.ts';
import { GitCompare, ArrowRightLeft } from 'lucide-react';

export interface PatternComparisonProps {
  record: SignalAnalysisRecord;
}

export function PatternComparison({ record }: PatternComparisonProps) {
  const comp = record.comparison;

  return (
    <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-4 font-mono select-none">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
        <div className="flex items-center gap-1.5">
          <GitCompare className="h-3.5 w-3.5 text-[#66E3FF]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#EAF4F7]">
            PATTERN COMPARISON & MORPHOLOGICAL DIVERGENCE
          </h4>
        </div>

        <div className="flex items-center gap-1.5 text-[10px]">
          <span className="text-[#84929C] uppercase">DIVERGENCE //</span>
          <span className="font-bold text-[#FFB84D] uppercase">
            {comp.divergenceDegree} ({comp.cosineDistance.toFixed(3)})
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {/* Left: Current Observation */}
        <div className="rounded-[2px] border border-cyan-800/70 bg-[#05070A] p-3 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-[#66E3FF] font-semibold uppercase">
            <span>CURRENT OBSERVATION</span>
            <span>{record.candidateId}</span>
          </div>

          {/* Micro Spectrogram Representation */}
          <div className="h-14 w-full rounded-[1px] bg-slate-950 border border-slate-800 relative flex items-center justify-center overflow-hidden">
            <span className="text-[10px] text-[#66E3FF] font-mono tracking-widest">
              ───╲────────────╲───
            </span>
            <span className="absolute bottom-1 right-2 text-[8px] text-slate-500 font-mono">
              df/dt: {record.driftRateHzPerSec.toFixed(2)} Hz/s
            </span>
          </div>

          <p className="text-[11px] text-[#EAF4F7] font-sans">{comp.observedSignature}</p>
        </div>

        {/* Right: Nearest Known Pattern */}
        <div className="rounded-[2px] border border-slate-800 bg-[#05070A] p-3 space-y-2">
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase">
            <span>NEAREST KNOWN PATTERN</span>
            <span>{comp.catalogReference}</span>
          </div>

          {/* Micro Pulsar Profile Representation */}
          <div className="h-14 w-full rounded-[1px] bg-slate-950 border border-slate-800 relative flex items-center justify-center overflow-hidden">
            <span className="text-[10px] text-slate-400 font-mono tracking-widest">
              ░░▒▓██▓▒░░░░░░▒▓██▓▒░░
            </span>
            <span className="absolute bottom-1 right-2 text-[8px] text-slate-500 font-mono">
              COSINE DISTANCE: {comp.cosineDistance.toFixed(3)}
            </span>
          </div>

          <p className="text-[11px] text-slate-300 font-sans">{comp.nearestKnownPattern}</p>
        </div>
      </div>

      <div className="mt-3 rounded-[1px] border border-slate-800/80 bg-[#05070A]/80 px-2.5 py-1.5 text-[10px] text-[#84929C] leading-normal flex items-start gap-1.5">
        <ArrowRightLeft className="h-3 w-3 text-cyan-400 shrink-0 mt-0.5" />
        <span>
          The candidate is not simply an anomaly in isolation; it demonstrates significant
          mathematical divergence relative to learned manifolds of all known astrophysical and
          terrestrial transmitters.
        </span>
      </div>
    </div>
  );
}
