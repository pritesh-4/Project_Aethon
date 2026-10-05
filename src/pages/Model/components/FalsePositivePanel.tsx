import { FALSE_POSITIVE_SOURCES } from '../data/modelData.ts';
import { ShieldAlert } from 'lucide-react';

export function FalsePositivePanel() {
  return (
    <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-5 font-mono select-none">
      {/* Provocative, Scientific Reality Header */}
      <div className="border-b border-slate-800/80 pb-3 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="h-4 w-4 text-[#FFB84D]" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#EAF4F7]">
            THE HARD PART IS NOT FINDING ANOMALIES. IT IS DETERMINING WHETHER THEY MATTER.
          </h2>
        </div>
        <p className="text-xs text-slate-400 font-sans leading-relaxed">
          Astronomical radio instrumentation operates in an electromagnetic environment saturated
          with human telecommunications, orbital constellations, and stochastic receiver noise.
          AETHON’s primary computational duty is systematic false-positive filtration.
        </p>
      </div>

      {/* Grid of Potential False Positive Sources */}
      <div className="space-y-1.5 mb-5">
        <span className="text-[10px] text-[#84929C] uppercase font-bold tracking-wider block">
          TAXONOMY OF KNOWN FALSE-POSITIVE MECHANISMS
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {FALSE_POSITIVE_SOURCES.map((source) => {
            const isCritical = source.riskFactor === 'CRITICAL';
            const isElevated = source.riskFactor === 'ELEVATED';

            return (
              <div
                key={source.id}
                className="rounded-[2px] border border-slate-800 bg-[#05070A]/80 p-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                    <span className="text-[10px] font-bold text-slate-200 uppercase truncate">
                      {source.name}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1 rounded-[1px] uppercase ${
                        isCritical
                          ? 'border border-red-500/80 bg-red-950/40 text-red-400'
                          : isElevated
                            ? 'border border-amber-500/80 bg-amber-950/40 text-amber-400'
                            : 'border border-slate-700 bg-slate-900 text-slate-400'
                      }`}
                    >
                      {source.riskFactor}
                    </span>
                  </div>

                  <div className="text-[10px] text-[#84929C] mb-1">
                    <span className="text-slate-500">ORIGIN:</span> {source.origin}
                  </div>

                  <p className="text-[11px] text-slate-400 font-sans leading-relaxed mb-2">
                    {source.frequencyProfile}
                  </p>
                </div>

                <div className="border-t border-slate-800/80 pt-2 mt-1">
                  <span className="block text-[9px] text-[#66E3FF] uppercase font-semibold">
                    AETHON MITIGATION:
                  </span>
                  <p className="text-[10px] text-slate-300 font-sans leading-snug mt-0.5">
                    {source.mitigationStrategy}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* The Screening Funnel Flow */}
      <div className="rounded-[2px] border border-cyan-800/60 bg-[#05070A] p-4 text-xs font-mono">
        <span className="block text-[10px] text-[#66E3FF] font-bold uppercase tracking-wider mb-3">
          AETHON MULTI-TIER FILTERING & TRIAGE FUNNEL
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center text-center">
          <div className="rounded-[2px] border border-slate-800 bg-[#0A0E13] p-2.5">
            <span className="text-[9px] text-[#84929C] uppercase block">STAGE 1 // INGESTION</span>
            <span className="text-xs font-bold text-slate-200 mt-1 block">
              100% RAW OBSERVATION
            </span>
            <span className="text-[9px] text-slate-500">Baseband Nyquist stream</span>
          </div>

          <div className="rounded-[2px] border border-slate-800 bg-[#0A0E13] p-2.5">
            <span className="text-[9px] text-cyan-400 uppercase block">STAGE 2 // SCREENING</span>
            <span className="text-xs font-bold text-cyan-300 mt-1 block">
              AUTOMATED RFI REJECTION
            </span>
            <span className="text-[9px] text-slate-400">Spatial beam differencing</span>
          </div>

          <div className="rounded-[2px] border border-slate-800 bg-[#0A0E13] p-2.5">
            <span className="text-[9px] text-amber-400 uppercase block">STAGE 3 // TRIAGE</span>
            <span className="text-xs font-bold text-[#FFB84D] mt-1 block">
              PRIORITIZED CANDIDATES
            </span>
            <span className="text-[9px] text-slate-400">Persistence & anomaly rating</span>
          </div>

          <div className="rounded-[2px] border border-emerald-800 bg-emerald-950/30 p-2.5">
            <span className="text-[9px] text-emerald-400 uppercase block">STAGE 4 // GATEWAY</span>
            <span className="text-xs font-bold text-emerald-300 mt-1 block">SCIENTIFIC REVIEW</span>
            <span className="text-[9px] text-slate-300">Astronomer verification</span>
          </div>
        </div>
      </div>
    </div>
  );
}
