interface NarrativeSection5Props {
  progress: number; // 0.78 to 0.90
}

export function NarrativeSection5({ progress }: NarrativeSection5Props) {
  const sectionAlpha =
    Math.min(1, Math.max(0, (progress - 0.78) * 10)) *
    Math.min(1, Math.max(0, (0.9 - progress) * 10));

  return (
    <div
      className="absolute inset-0 flex flex-col justify-between pointer-events-none select-none p-6 transition-opacity duration-300"
      style={{ opacity: sectionAlpha }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pt-10 sm:pt-14 px-2 sm:px-8 font-sans">
        <div>
          <span className="text-xs text-[#5BD8F5] font-medium">Candidate identification</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#5BD8F5]" />
          <span className="text-xs text-[#E6EDF2] font-medium">Candidate isolated</span>
        </div>
      </div>

      {/* Main Center Discovery Dossier */}
      <div className="relative w-full max-w-3xl mx-auto text-center my-auto px-4">
        <div className="space-y-1 mb-6">
          <p className="text-lg sm:text-xl font-normal text-[#7F8B95] font-sans">
            Distinct from noise. Distinct from local interference.
          </p>
          <h2 className="text-3xl sm:text-5xl font-normal tracking-tight text-[#5BD8F5] font-sans mt-2">
            An anomalous narrowband candidate.
          </h2>
        </div>

        {/* Candidate card - explicitly labeled demonstration data */}
        <div className="mt-6 mx-auto max-w-xl rounded-[4px] border border-[#172230] bg-[#0B0F14] p-4 sm:p-5 text-left font-sans">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#172230] pb-2.5 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-[#5BD8F5]">SIG-089A</span>
              <span className="text-[11px] text-[#7F8B95] font-sans">(Simulated observation)</span>
            </div>
            <span className="text-xs font-medium px-2 py-0.5 rounded-[4px] bg-[#1C160E] border border-[#E8AE50]/30 text-[#E8AE50]">
              Investigation priority: High
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
            <div>
              <span className="text-[#7F8B95]">Source: </span>
              <span className="text-[#E6EDF2]">Synthetic Target Alpha</span>
            </div>
            <div>
              <span className="text-[#7F8B95]">Frequency: </span>
              <span className="text-[#5BD8F5] font-mono">1420.4057 MHz</span>
            </div>
            <div>
              <span className="text-[#7F8B95]">Drift rate: </span>
              <span className="text-[#5BD8F5] font-mono">-0.32 Hz/s</span>
            </div>
            <div>
              <span className="text-[#7F8B95]">Data source: </span>
              <span className="text-[#E6EDF2]">Demonstration run</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom status */}
      <div className="pb-10 sm:pb-14 px-2 sm:px-8 text-center text-xs text-[#7F8B95]">
        <span>Candidate queued for human review</span>
      </div>
    </div>
  );
}
