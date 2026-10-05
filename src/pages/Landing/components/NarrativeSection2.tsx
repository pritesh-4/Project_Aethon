interface NarrativeSection2Props {
  progress: number; // 0.18 to 0.38
}

export function NarrativeSection2({ progress }: NarrativeSection2Props) {
  // Opacity interpolations for sub-phases
  const getSubOpacity = (start: number, peakStart: number, peakEnd: number, end: number) => {
    if (progress < start || progress > end) return 0;
    if (progress >= peakStart && progress <= peakEnd) return 1;
    if (progress < peakStart) return (progress - start) / (peakStart - start);
    return 1 - (progress - peakEnd) / (end - peakEnd);
  };

  const op1 = getSubOpacity(0.18, 0.2, 0.26, 0.285);
  const op2 = getSubOpacity(0.275, 0.295, 0.36, 0.385);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none px-6">
      {/* Top Section Tag */}
      <div
        className="absolute top-16 sm:top-20 text-center font-mono transition-opacity duration-300"
        style={{ opacity: Math.min(1, Math.max(0, (progress - 0.18) * 10)) }}
      >
        <span className="text-[10px] tracking-[0.25em] text-slate-400 uppercase">
          SECTION 02 // THE PROBLEM
        </span>
      </div>

      <div className="relative w-full max-w-4xl text-center">
        {/* Phase 1: Overwhelming Data */}
        {op1 > 0 && (
          <div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 transition-opacity duration-200"
            style={{ opacity: op1 }}
          >
            <h2 className="text-3xl sm:text-5xl md:text-7xl font-light tracking-tight text-slate-100 font-sans leading-tight">
              ASTRONOMICAL DATA
              <br />
              <span className="text-slate-400">IS NOT SILENT.</span>
            </h2>

            <p className="mt-6 text-2xl sm:text-4xl md:text-5xl font-light tracking-tight text-cyan-300 font-sans">
              IT IS OVERWHELMING.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3 font-mono text-[10px] text-slate-400">
              <span className="px-2.5 py-1 rounded border border-slate-800 bg-slate-950/60">
                8.4 TB / HOUR RAW I/Q STREAM
              </span>
              <span className="px-2.5 py-1 rounded border border-slate-800 bg-slate-950/60">
                14,200 LOW-EARTH ORBIT SATELLITES
              </span>
              <span className="px-2.5 py-1 rounded border border-slate-800 bg-slate-950/60">
                STOCHASTIC COSMIC NOISE FLOOR
              </span>
            </div>
          </div>
        )}

        {/* Phase 2: Knowns vs Unknowns */}
        {op2 > 0 && (
          <div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 transition-opacity duration-200"
            style={{ opacity: op2 }}
          >
            <div className="space-y-2 text-xl sm:text-3xl md:text-4xl font-light tracking-tight text-slate-400 font-sans">
              <p className="text-slate-300">KNOWN SIGNALS.</p>
              <p className="text-slate-400">STOCHASTIC NOISE.</p>
              <p className="text-rose-400/90">TERRESTRIAL INTERFERENCE.</p>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800/80 max-w-md mx-auto">
              <h3 className="text-2xl sm:text-4xl md:text-5xl font-normal tracking-tight text-cyan-300 font-sans">
                AND SOMETHING ELSE.
              </h3>
              <p className="mt-3 font-mono text-[11px] tracking-widest text-slate-400 uppercase">
                A SOLITARY COHERENT DRIFTING SIGNATURE BURIED BENEATH THE INTERFERENCE
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Floating scientific metadata indicators in corners during Section 2 */}
      {progress >= 0.2 && progress <= 0.37 && (
        <div
          className="absolute inset-x-8 bottom-16 sm:bottom-20 flex justify-between font-mono text-[10px] text-slate-400 transition-opacity duration-300"
          style={{ opacity: Math.min(op1 + op2, 1) }}
        >
          <div className="hidden sm:block">
            <span>RFI DENSITY: </span>
            <span className="text-rose-400/80 font-semibold">HIGH [LEO CONSTELLATION OVERLAP]</span>
          </div>
          <div>
            <span>SPECTRAL SEPARATION: </span>
            <span className="text-cyan-400 font-semibold">INITIALIZING EXTRACTION</span>
          </div>
        </div>
      )}
    </div>
  );
}
