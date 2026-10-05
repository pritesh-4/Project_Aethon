interface NarrativeSection3Props {
  progress: number; // 0.38 to 0.58
}

export function NarrativeSection3({ progress }: NarrativeSection3Props) {
  const getSubOpacity = (start: number, peakStart: number, peakEnd: number, end: number) => {
    if (progress < start || progress > end) return 0;
    if (progress >= peakStart && progress <= peakEnd) return 1;
    if (progress < peakStart) return (progress - start) / (peakStart - start);
    return 1 - (progress - peakEnd) / (end - peakEnd);
  };

  // Telemetry frame stays visible throughout the section
  const frameOpacity =
    Math.min(1, Math.max(0, (progress - 0.38) * 8)) *
    Math.min(1, Math.max(0, (0.58 - progress) * 8));

  // Sub-phases for narrative text
  const op1 = getSubOpacity(0.42, 0.44, 0.49, 0.51);
  const op2 = getSubOpacity(0.5, 0.52, 0.57, 0.59);

  return (
    <div className="absolute inset-0 flex flex-col justify-between pointer-events-none select-none p-6">
      {/* Top telemetry tag */}
      <div
        className="flex items-center justify-between text-center font-mono transition-opacity duration-300 pt-10 sm:pt-14 px-2 sm:px-8"
        style={{ opacity: frameOpacity }}
      >
        <div className="text-left">
          <span className="text-[10px] tracking-[0.25em] text-cyan-400 uppercase font-semibold">
            SECTION 03 // THE SIGNAL
          </span>
          <p className="text-[9px] text-slate-400 mt-0.5">
            TIME–FREQUENCY SPECTROTEMPORAL PROJECTION
          </p>
        </div>

        {/* Small Scientific Labels around the visual */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] text-slate-400">
          <span className="px-2 py-0.5 rounded border border-slate-800 bg-slate-950/80">
            OBSERVATION // <span className="text-slate-200">AET-04721</span>
          </span>
          <span className="px-2 py-0.5 rounded border border-slate-800 bg-slate-950/80">
            FREQUENCY // <span className="text-cyan-400">1420.3700 MHz</span>
          </span>
          <span className="px-2 py-0.5 rounded border border-slate-800 bg-slate-950/80 hidden sm:inline">
            WINDOW // <span className="text-slate-200">00:04:32</span>
          </span>
          <span className="px-2 py-0.5 rounded border border-slate-800 bg-slate-950/80 hidden md:inline">
            RFI ESTIMATE // <span className="text-emerald-400">LOW</span>
          </span>
        </div>
      </div>

      {/* Main Narrative Statements */}
      <div className="relative w-full max-w-3xl mx-auto text-center my-auto">
        {/* Statement 1: Something doesn't fit */}
        {op1 > 0 && (
          <div className="transition-opacity duration-200" style={{ opacity: op1 }}>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-light tracking-tight text-slate-100 font-sans">
              SOMETHING DOESN'T FIT.
            </h2>
            <p className="mt-4 font-mono text-xs sm:text-sm tracking-widest text-cyan-400/90 uppercase">
              CARRIER BANDWIDTH IS UNDER 4 HZ • PERSISTENT LINEAR DRIFT RATE DETECTED
            </p>
          </div>
        )}

        {/* Statement 2: That is where AETHON begins */}
        {op2 > 0 && (
          <div className="transition-opacity duration-200" style={{ opacity: op2 }}>
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-light tracking-tight text-cyan-300 font-sans">
              THAT IS WHERE AETHON BEGINS.
            </h2>
            <p className="mt-4 font-mono text-xs sm:text-sm tracking-widest text-slate-400 uppercase">
              DEEP NEURAL TIME-FREQUENCY LATENT PROJECTION INITIATED
            </p>
          </div>
        )}
      </div>

      {/* Bottom Telemetry Readouts */}
      <div
        className="flex items-center justify-between font-mono text-[10px] text-slate-400 pb-10 sm:pb-14 px-2 sm:px-8 transition-opacity duration-300"
        style={{ opacity: frameOpacity }}
      >
        <div>
          <span>DISPERSION MEASURE: </span>
          <span className="text-slate-300">2.64 pc cm⁻³</span>
        </div>
        <div>
          <span>DOPPLER SLOPE: </span>
          <span className="text-cyan-400 font-medium">
            df/dt = -0.32 Hz/s [BARYCENTRIC RESIDUAL]
          </span>
        </div>
      </div>
    </div>
  );
}
