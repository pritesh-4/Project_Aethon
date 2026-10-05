export interface AnomalyScaleProps {
  score: number; // 0.000 to 1.000
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
}

export function AnomalyScale({ score, priority }: AnomalyScaleProps) {
  const segmentsCount = 20;
  const activeCount = Math.round(score * segmentsCount);

  return (
    <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-3.5 font-mono select-none">
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-[10px] text-[#84929C] uppercase tracking-wider block">
            ANOMALY INDEX SCORE
          </span>
          <span className="text-[9px] text-slate-500">LATENT RECONSTRUCTION DIVERGENCE</span>
        </div>

        <div className="text-right">
          <span
            className={`text-lg font-bold tracking-wider ${
              priority === 'HIGH'
                ? 'text-[#FFB84D]'
                : priority === 'MEDIUM'
                  ? 'text-[#66E3FF]'
                  : 'text-slate-400'
            }`}
          >
            {score.toFixed(3)}
          </span>
          <span className="text-[9px] text-slate-500 block -mt-1">/ 1.000</span>
        </div>
      </div>

      {/* Discrete 20-Segment Analytical Scale */}
      <div className="mt-2.5 flex items-center gap-1">
        {Array.from({ length: segmentsCount }).map((_, i) => {
          const isActive = i < activeCount;
          let segmentColor = 'bg-slate-800/80';

          if (isActive) {
            if (i > 15) {
              segmentColor = 'bg-[#FFB84D] shadow-[0_0_4px_rgba(255,184,77,0.5)]';
            } else if (i > 10) {
              segmentColor = 'bg-[#66E3FF] shadow-[0_0_4px_rgba(102,227,255,0.4)]';
            } else {
              segmentColor = 'bg-slate-400';
            }
          }

          return (
            <div
              key={i}
              className={`h-3 flex-1 rounded-[1px] transition-colors duration-200 ${segmentColor}`}
            />
          );
        })}
      </div>

      {/* Low / Baseline / High Markers */}
      <div className="mt-1 flex items-center justify-between text-[9px] text-[#84929C]">
        <span>0.000 [GAUSSIAN NOISE]</span>
        <span className="text-slate-600">THRESHOLD 0.700</span>
        <span className="text-amber-400 font-semibold">1.000 [EXTREME DEVIANCE]</span>
      </div>
    </div>
  );
}
