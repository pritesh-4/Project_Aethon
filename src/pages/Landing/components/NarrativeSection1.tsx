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
        className="absolute top-16 sm:top-20 text-center transition-opacity duration-300"
        style={{ opacity: Math.max(0, 1 - progress * 8) }}
      >
        <p className="text-xs tracking-wider text-[#5BD8F5] font-medium mb-1">AETHON</p>
        <p className="text-[11px] text-[#7F8B95]">Astronomical Signal Discovery</p>
      </div>

      {/* Main Narrative Sequence - sequentially revealed */}
      <div className="relative w-full max-w-3xl text-center">
        {/* Phrase 1 */}
        {op1 > 0 && (
          <div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 transition-opacity duration-200"
            style={{ opacity: op1 }}
          >
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-normal tracking-tight text-[#E6EDF2] font-sans">
              The sky is full of radio signals.
            </h1>
            <p className="mt-4 font-sans text-sm text-[#7F8B95]">
              Continuous monitoring across the 21 cm neutral hydrogen line.
            </p>
          </div>
        )}

        {/* Phrase 2 */}
        {op2 > 0 && (
          <div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 transition-opacity duration-200"
            style={{ opacity: op2 }}
          >
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-normal tracking-tight text-[#E6EDF2] font-sans">
              Most are known or terrestrial.
            </h1>
            <p className="mt-4 font-sans text-sm text-[#7F8B95]">
              Pulsars, orbital satellites, and ionospheric scatter.
            </p>
          </div>
        )}

        {/* Phrase 3 */}
        {op3 > 0 && (
          <div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 transition-opacity duration-200"
            style={{ opacity: op3 }}
          >
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-normal tracking-tight text-[#5BD8F5] font-sans">
              Some are anomalies.
            </h1>
            <p className="mt-4 font-sans text-sm text-[#7F8B95]">
              Coherent narrowband patterns that diverge from baseline noise.
            </p>
          </div>
        )}

        {/* Phrase 4 - AETHON Reveal */}
        {op4 > 0 && (
          <div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 transition-opacity duration-200"
            style={{ opacity: op4 }}
          >
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-light tracking-wider text-[#E6EDF2] font-sans">
              AETHON
            </h1>
            <p className="mt-4 font-sans text-sm text-[#7F8B95] tracking-wide">
              Autonomous radio anomaly discovery
            </p>
          </div>
        )}
      </div>

      {/* Initial Scroll Prompt */}
      {progress < 0.03 && (
        <div className="absolute bottom-16 sm:bottom-20 flex flex-col items-center gap-2 font-sans text-xs text-[#7F8B95]">
          <span>Scroll to begin</span>
          <span className="h-4 w-px bg-[#243345]" />
        </div>
      )}
    </div>
  );
}
