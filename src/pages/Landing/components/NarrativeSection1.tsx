interface NarrativeSection1Props {
  progress: number; // 0.00 to 0.20
}

export function NarrativeSection1({ progress }: NarrativeSection1Props) {
  // Sub-ranges within Section 1 (0.00 to 0.18):
  // 0.00 - 0.04: "THE SKY IS FULL OF SIGNALS."
  // 0.04 - 0.08: "MOST ARE ALREADY KNOWN."
  // 0.08 - 0.13: "SOME ARE NOT."
  // 0.13 - 0.18: "AETHON"

  // Opacity interpolations
  const getSubOpacity = (start: number, peakStart: number, peakEnd: number, end: number) => {
    if (progress < start || progress > end) return 0;
    if (progress >= peakStart && progress <= peakEnd) return 1;
    if (progress < peakStart) return (progress - start) / (peakStart - start);
    return 1 - (progress - peakEnd) / (end - peakEnd);
  };

  const op1 = getSubOpacity(0.0, 0.015, 0.04, 0.055);
  const op2 = getSubOpacity(0.045, 0.06, 0.08, 0.095);
  const op3 = getSubOpacity(0.085, 0.1, 0.125, 0.14);
  const op4 = getSubOpacity(0.125, 0.14, 0.17, 0.19);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none px-6">
      {/* Top minimal status text */}
      <div
        className="absolute top-16 sm:top-20 text-center font-mono transition-opacity duration-300"
        style={{ opacity: Math.max(0, 1 - progress * 8) }}
      >
        <p className="text-[11px] tracking-[0.25em] text-cyan-400 font-semibold mb-1">AETHON</p>
        <p className="text-[9px] tracking-[0.2em] text-slate-400 uppercase">
          ASTRONOMICAL SIGNAL DISCOVERY
        </p>
        <p className="text-[9px] tracking-[0.3em] text-slate-400 mt-2 font-mono">
          SYSTEM // INITIALIZING
        </p>
      </div>

      {/* Main Narrative Sequence - sequentially revealed */}
      <div className="relative w-full max-w-4xl text-center">
        {/* Phrase 1 */}
        {op1 > 0 && (
          <div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 transition-opacity duration-200"
            style={{ opacity: op1 }}
          >
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-light tracking-tight text-slate-100 font-sans">
              THE SKY IS FULL OF SIGNALS.
            </h1>
            <p className="mt-4 font-mono text-xs sm:text-sm tracking-widest text-slate-400 uppercase">
              1.2 BILLION CHANNELS MONITORED ACROSS THE 21CM NEUTRAL HYDROGEN LINE
            </p>
          </div>
        )}

        {/* Phrase 2 */}
        {op2 > 0 && (
          <div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 transition-opacity duration-200"
            style={{ opacity: op2 }}
          >
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-light tracking-tight text-slate-300 font-sans">
              MOST ARE ALREADY KNOWN.
            </h1>
            <p className="mt-4 font-mono text-xs sm:text-sm tracking-widest text-slate-400 uppercase">
              PULSARS • IONOSPHERIC SCATTER • RADAR REFLECTIONS • SATELLITE CHIRPS
            </p>
          </div>
        )}

        {/* Phrase 3 */}
        {op3 > 0 && (
          <div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 transition-opacity duration-200"
            style={{ opacity: op3 }}
          >
            <h1 className="text-3xl sm:text-5xl md:text-7xl font-light tracking-tight text-cyan-300 font-sans">
              SOME ARE NOT.
            </h1>
            <p className="mt-4 font-mono text-xs sm:text-sm tracking-widest text-slate-400 uppercase">
              PERSISTENT NON-STOCHASTIC TOPOCENTRIC ANOMALIES
            </p>
          </div>
        )}

        {/* Phrase 4 - AETHON Reveal */}
        {op4 > 0 && (
          <div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 transition-opacity duration-200"
            style={{ opacity: op4 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-cyan-800/60 bg-cyan-950/40 text-[10px] font-mono tracking-widest text-cyan-400 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              SECTION 01 // THE UNKNOWN
            </div>
            <h1 className="text-5xl sm:text-7xl md:text-9xl font-extralight tracking-widest text-slate-100 font-sans">
              AETHON
            </h1>
            <p className="mt-4 font-mono text-xs sm:text-sm tracking-[0.25em] text-slate-400 uppercase">
              AUTONOMOUS RADIO ANOMALY DISCOVERY FRAMEWORK
            </p>
          </div>
        )}
      </div>

      {/* Initial Scroll Prompt */}
      {progress < 0.03 && (
        <div className="absolute bottom-16 sm:bottom-20 flex flex-col items-center gap-2 font-mono text-[10px] tracking-widest text-slate-400 animate-pulse">
          <span>SCROLL TO ENTER OBSERVATORY SEQUENCE</span>
          <span className="h-4 w-px bg-slate-600" />
        </div>
      )}
    </div>
  );
}
