import { Zap } from 'lucide-react';

export function AnomalyScoringPanel() {
  const segmentsCount = 28;
  const activeScore = 0.947;
  const activeIndex = Math.round(activeScore * segmentsCount);

  return (
    <div className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-5 font-mono select-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#1C2630] pb-3 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-[#E8AE50]" />
          <h2 className="text-xs font-medium text-[#E6EDF2]">Anomaly index and deviation metric</h2>
        </div>
      </div>

      {/* Main Score Visualizer */}
      <div className="space-y-3 rounded-[2px] border border-[#1C2630] bg-[#06080B] p-4">
        <div className="flex items-baseline justify-between text-xs">
          <span className="text-[10px] text-[#7F8B95] font-medium">
            Continuous anomaly index spectrum
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#7F8B95]">Measured index:</span>
            <span className="text-xl font-medium font-mono text-[#E8AE50]">0.947</span>
          </div>
        </div>

        {/* 28-Segment Linear Analytical Scale */}
        <div className="space-y-1">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: segmentsCount }).map((_, i) => {
              const isActive = i < activeIndex;
              let barColor = 'bg-[#1C2630]/60';
              if (isActive) {
                if (i >= 22) {
                  barColor = 'bg-[#E8AE50]';
                } else if (i >= 14) {
                  barColor = 'bg-[#5BD8F5]';
                } else {
                  barColor = 'bg-[#7F8B95]';
                }
              }

              return (
                <div key={i} className={`h-4 flex-1 rounded-[1px] transition-colors ${barColor}`} />
              );
            })}
          </div>

          <div className="flex justify-between text-[9px] text-[#7F8B95] font-mono pt-0.5">
            <span>0.000 · Nominal baseline</span>
            <span>0.500 · Anomaly threshold</span>
            <span>1.000 · Maximum divergence</span>
          </div>
        </div>

        {/* Textual Scientific Explanation (Cautious phrasing) */}
        <div className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-3 text-xs text-[#7F8B95] font-sans leading-relaxed">
          <p>
            A higher anomaly index indicates stronger departure from the reference signal structure
            used by the discovery pipeline. It does{' '}
            <strong className="text-[#E6EDF2] font-medium">not</strong> assert an extraterrestrial
            technosignature or confirm astrophysical discovery; rather, it flags signals exhibiting
            structural coherence coupled with severe geometric deviation from learned natural
            distributions.
          </p>
        </div>
      </div>

      {/* Signal Manifold Geometry Representation */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        {/* Left: Graphic Representation of Manifold vs Deviation */}
        <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-4 flex flex-col justify-between">
          <span className="text-[10px] text-[#7F8B95] font-medium mb-2 block">
            Manifold topology
          </span>

          <div className="rounded-[1px] border border-[#1C2630] bg-[#06080B] p-4 font-mono text-[11px] leading-relaxed text-center">
            <div className="text-[#5BD8F5] font-medium mb-1">[ Learned signal distribution ]</div>
            <div className="text-[#7F8B95]">╭─────────────────────────╮</div>
            <div className="text-[#7F8B95]">│ • • • • • • • • • • • • │</div>
            <div className="text-[#7F8B95]">│ • • • • • • • • • • • • │</div>
            <div className="text-[#7F8B95]">╰─────────────────────────╯</div>
            <div className="text-[#7F8B95] my-1">│ d_cosine = 0.918</div>
            <div className="text-[#E8AE50] font-medium">▼ [ Candidate AET-04721 ]</div>
          </div>

          <span className="text-[9px] text-[#7F8B95] font-sans mt-2 block">
            Geometric distance from nearest manifold centroid defines the residual index.
          </span>
        </div>

        {/* Right: Anomaly Decomposition Parameters */}
        <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-4 space-y-2.5">
          <span className="text-[10px] text-[#7F8B95] font-medium block">
            Index decomposition parameters
          </span>

          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-[#1C2630] pb-1.5">
              <span className="text-[#7F8B95] text-[11px]">Reconstruction residual (L2)</span>
              <span className="font-mono text-xs font-medium text-[#5BD8F5]">0.924</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#1C2630] pb-1.5">
              <span className="text-[#7F8B95] text-[11px]">Cosine distance to nearest class</span>
              <span className="font-mono text-xs font-medium text-[#E8AE50]">0.918</span>
            </div>
            <div className="flex items-center justify-between border-b border-[#1C2630] pb-1.5">
              <span className="text-[#7F8B95] text-[11px]">Local outlier factor (LOF)</span>
              <span className="font-mono text-xs font-medium text-[#E6EDF2]">2.84×</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#7F8B95] text-[11px]">Multi-cadence persistence</span>
              <span className="font-mono text-xs font-medium text-[#5BD8F5]">87.3% (4/4 ON)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
