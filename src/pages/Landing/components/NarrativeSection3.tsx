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

  // Sub-phases for narrative text
  const op1 = getSubOpacity(0.42, 0.44, 0.49, 0.51);
  const op2 = getSubOpacity(0.5, 0.52, 0.57, 0.59);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none px-6">
      {/* Main Narrative Statements */}
      <div className="relative w-full max-w-3xl text-center">
        {/* Statement 1 */}
        {op1 > 0 && (
          <div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 transition-opacity duration-200"
            style={{ opacity: op1 }}
          >
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-normal tracking-tight text-[#E6EDF2] font-sans">
              A signature distinct from noise.
            </h2>
            <p className="mt-4 text-base sm:text-lg font-sans text-[#7F8B95] max-w-xl mx-auto">
              Narrowband spectral coherence and persistent linear Doppler drift.
            </p>
          </div>
        )}

        {/* Statement 2 */}
        {op2 > 0 && (
          <div
            className="absolute inset-x-0 top-1/2 -translate-y-1/2 transition-opacity duration-200"
            style={{ opacity: op2 }}
          >
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-normal tracking-tight text-[#5BD8F5] font-sans">
              Detecting subtle coherence.
            </h2>
            <p className="mt-4 text-base sm:text-lg font-sans text-[#7F8B95] max-w-xl mx-auto">
              Transforming raw spectral matrices into learned representation spaces.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
