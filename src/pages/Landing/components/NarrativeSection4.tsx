interface NarrativeSection4Props {
  progress: number; // 0.58 to 0.78
}

const STAGES = [
  {
    step: '01',
    name: 'TIME–FREQUENCY REPRESENTATION',
    short: 'OBSERVE',
    description:
      'High-cadence polyphase filterbanks resolve gigabit I/Q telemetry streams into millions of 3.8 Hz channels.',
    metric: 'FFT RESOLUTION // 3.81 Hz / BIN',
  },
  {
    step: '02',
    name: 'LATENT REPRESENTATION',
    short: 'REPRESENT',
    description:
      'Multi-head transformer encoders embed the time-frequency spectrotemporal patch into a continuous manifold.',
    metric: 'EMBEDDING DIM // 768-D LATENT SPACE',
  },
  {
    step: '03',
    name: 'ANOMALY ANALYSIS',
    short: 'COMPARE',
    description:
      'Residual reconstruction loss & Mahalanobis distance quantify divergence against the background cosmic distribution.',
    metric: 'DIVERGENCE SCORE // Δ(x) = 4.82σ',
  },
  {
    step: '04',
    name: 'CANDIDATE GENERATION',
    short: 'DETECT',
    description:
      'Barycentric orbital drift correction filters local satellites and confirms topocentric celestial origin.',
    metric: 'DRIFT COHERENCE // 99.84% NON-LEO',
  },
];

export function NarrativeSection4({ progress }: NarrativeSection4Props) {
  // Normalize progress inside Section 4 (0.58 to 0.78)
  const normProg = Math.max(0, Math.min(1, (progress - 0.58) / 0.2));
  const activeStageIndex = Math.min(3, Math.floor(normProg * 4));
  const activeStage = STAGES[activeStageIndex];

  const sectionAlpha =
    Math.min(1, Math.max(0, (progress - 0.58) * 8)) *
    Math.min(1, Math.max(0, (0.78 - progress) * 8));

  return (
    <div
      className="absolute inset-0 flex flex-col justify-between pointer-events-none select-none p-6 transition-opacity duration-300"
      style={{ opacity: sectionAlpha }}
    >
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-10 sm:pt-14 px-2 sm:px-8 font-mono">
        <div>
          <span className="text-[10px] tracking-[0.25em] text-cyan-400 uppercase font-semibold">
            SECTION 04 // THE INTELLIGENCE
          </span>
          <p className="text-[9px] text-slate-400 mt-0.5">
            AUTONOMOUS DISCOVERY PIPELINE // REAL-TIME INFERENCE
          </p>
        </div>

        {/* 4-Step Pipeline Stepper */}
        <div className="flex items-center gap-1.5 sm:gap-3 text-[10px]">
          {STAGES.map((s, idx) => {
            const isActive = idx === activeStageIndex;
            const isPast = idx < activeStageIndex;
            return (
              <div
                key={s.step}
                className={`flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${
                  isActive
                    ? 'border-cyan-500/80 bg-cyan-950/60 text-cyan-300 font-semibold'
                    : isPast
                      ? 'border-slate-800 bg-slate-900/40 text-slate-400'
                      : 'border-slate-900 bg-slate-950/30 text-slate-400'
                }`}
              >
                <span>{s.step}</span>
                <span className="hidden md:inline">{s.short}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Dynamic Stage Display */}
      <div className="relative w-full max-w-3xl mx-auto text-center my-auto px-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-800/60 bg-cyan-950/40 text-[10px] font-mono tracking-widest text-cyan-400 mb-4">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          STAGE {activeStage.step} // {activeStage.short}
        </div>

        <h2 className="text-2xl sm:text-4xl md:text-5xl font-light tracking-tight text-slate-100 font-sans transition-all duration-200">
          {activeStage.name}
        </h2>

        <p className="mt-4 text-xs sm:text-base text-slate-400 max-w-xl mx-auto leading-relaxed font-sans">
          {activeStage.description}
        </p>

        <div className="mt-6 inline-block font-mono text-[10px] sm:text-xs text-cyan-400/90 tracking-wider px-3 py-1 rounded border border-slate-800/80 bg-slate-950/70">
          {activeStage.metric}
        </div>
      </div>

      {/* Bottom Telemetry Bar */}
      <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 pb-10 sm:pb-14 px-2 sm:px-8">
        <div>
          <span>PIPELINE LATENCY: </span>
          <span className="text-emerald-400 font-medium">
            14.2 ms / FRAME [TENSORRT ACCELERATED]
          </span>
        </div>
        <div>
          <span>FALSE ALARM RATE: </span>
          <span className="text-slate-300">P_FA &lt; 10⁻⁸</span>
        </div>
      </div>
    </div>
  );
}
