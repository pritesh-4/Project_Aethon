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
      <div className="relative w-full max-w-3xl text-center">
        {/* Phase 1: Overwhelming Data */}
        {op1 > 0 && (
          <div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 transition-opacity duration-200"
            style={{ opacity: op1 }}
          >
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-normal tracking-tight text-[#E6EDF2] font-sans leading-tight">
              Astronomical data is overwhelming.
            </h2>

            <p className="mt-4 text-base sm:text-lg font-sans text-[#7F8B95] max-w-xl mx-auto">
              Terrestrial radio-frequency interference and orbital constellations obscure faint
              celestial signals.
            </p>
          </div>
        )}

        {/* Phase 2: Knowns vs Unknowns */}
        {op2 > 0 && (
          <div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 transition-opacity duration-200"
            style={{ opacity: op2 }}
          >
            <h3 className="text-3xl sm:text-5xl md:text-6xl font-normal tracking-tight text-[#5BD8F5] font-sans">
              Isolating coherent anomalies.
            </h3>
            <p className="mt-4 text-base sm:text-lg font-sans text-[#7F8B95] max-w-xl mx-auto">
              Separating local transmitters from genuine astronomical candidate events.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
