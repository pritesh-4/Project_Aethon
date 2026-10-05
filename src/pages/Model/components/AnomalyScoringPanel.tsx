import { Zap } from 'lucide-react';

export function AnomalyScoringPanel() {
  const segmentsCount = 28;
  const activeScore = 0.947;
  const activeIndex = Math.round(activeScore * segmentsCount);

  return (
    <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-5 font-mono select-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-3 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-[#FFB84D]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#EAF4F7]">
            ANOMALY INDEX & MANIFOLD DEVIATION METRIC
          </h2>
        </div>
        <span className="text-[10px] text-[#84929C] uppercase">
          RECONSTRUCTION RESIDUAL CALCULATION
        </span>
      </div>

      {/* Main Score Visualizer (Section 7: Segmented/Linear Scale) */}
      <div className="space-y-3 rounded-[2px] border border-slate-800 bg-[#05070A] p-4">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
            CONTINUOUS ANOMALY INDEX SPECTRUM
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 uppercase">MEASURED INDEX:</span>
            <span className="text-xl font-bold font-mono text-[#FFB84D]">0.947</span>
          </div>
        </div>

        {/* 28-Segment Linear Analytical Scale */}
        <div className="space-y-1">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: segmentsCount }).map((_, i) => {
              const isActive = i < activeIndex;
              let barColor = 'bg-slate-800/80';
              if (isActive) {
                if (i >= 22) {
                  barColor = 'bg-[#FFB84D] shadow-[0_0_6px_rgba(255,184,77,0.6)]';
                } else if (i >= 14) {
                  barColor = 'bg-[#66E3FF] shadow-[0_0_4px_rgba(102,227,255,0.4)]';
                } else {
                  barColor = 'bg-slate-500';
                }
              }

              return (
                <div key={i} className={`h-4 flex-1 rounded-[1px] transition-colors ${barColor}`} />
              );
            })}
          </div>

          <div className="flex justify-between text-[9px] text-slate-500 font-mono pt-0.5">
            <span>0.000 // NOMINAL BACKGROUND</span>
            <span>0.500 // TRANSIENT THRESHOLD</span>
            <span>1.000 // MAXIMUM DIVERGENCE</span>
          </div>
        </div>

        {/* Textual Scientific Explanation (Cautious phrasing) */}
        <div className="rounded-[2px] border border-slate-800 bg-[#0A0E13] p-3 text-xs text-slate-300 font-sans leading-relaxed">
          <p>
            A higher anomaly index indicates stronger departure from the reference signal structure
            used by the discovery pipeline. It does{' '}
            <strong className="text-slate-100 font-semibold">not</strong> assert an extraterrestrial
            technosignature or confirm astrophysical discovery; rather, it flags signals exhibiting
            structural coherence coupled with severe geometric deviation from learned natural
            distributions.
          </p>
        </div>
      </div>

      {/* Section 16: Signal Manifold Geometry Representation */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Left: ASCII / Graphic Representation of Manifold vs Deviation */}
        <div className="rounded-[2px] border border-slate-800 bg-[#05070A] p-4 flex flex-col justify-between">
          <span className="text-[10px] text-[#84929C] uppercase font-bold tracking-wider mb-2 block">
            MANIFOLD TOPOLOGY // REFERENCE VS OUTLIER
          </span>

          <div className="rounded-[1px] border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] leading-relaxed text-center">
            <div className="text-cyan-400 font-semibold mb-1">[ LEARNED SIGNAL MANIFOLD ]</div>
            <div className="text-slate-500">╭─────────────────────────╮</div>
            <div className="text-slate-400">│ • • • • • • • • • • • • │</div>
            <div className="text-slate-400">│ • • • • • • • • • • • • │</div>
            <div className="text-slate-500">╰─────────────────────────╯</div>
            <div className="text-slate-600 my-1">│ d_cosine = 0.918</div>
            <div className="text-amber-400 font-bold">▼ [ × CANDIDATE AET-04721 ]</div>
          </div>

          <span className="text-[9px] text-slate-500 font-sans mt-2 block">
            Geometric distance from nearest manifold centroid defines the residual index.
          </span>
        </div>

        {/* Right: Anomaly Decomposition Parameters */}
        <div className="rounded-[2px] border border-slate-800 bg-[#05070A] p-4 space-y-2.5">
          <span className="text-[10px] text-[#84929C] uppercase font-bold tracking-wider block">
            INDEX DECOMPOSITION PARAMETERS
          </span>

          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-400 text-[11px]">Reconstruction Residual (L2)</span>
              <span className="font-mono text-xs font-semibold text-[#66E3FF]">0.924</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-400 text-[11px]">Cosine Distance to Nearest Class</span>
              <span className="font-mono text-xs font-semibold text-[#FFB84D]">0.918</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
              <span className="text-slate-400 text-[11px]">Local Outlier Factor (LOF)</span>
              <span className="font-mono text-xs font-semibold text-slate-200">2.84×</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Multi-Cadence Persistence</span>
              <span className="font-mono text-xs font-semibold text-emerald-400">
                87.3% (4/4 ON)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
