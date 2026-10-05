interface NarrativeSection4Props {
  progress: number; // 0.58 to 0.78
}

const STAGES = [
  {
    step: '01',
    name: 'Time–frequency representation',
    short: 'Spectrogram',
    description:
      'Polyphase filterbanks decompose raw observations into high-resolution frequency channels.',
  },
  {
    step: '02',
    name: 'Latent representation',
    short: 'Embeddings',
    description:
      'Encoders map spectrotemporal patches into a continuous learned representation manifold.',
  },
  {
    step: '03',
    name: 'Anomaly detection',
    short: 'Divergence',
    description:
      'Quantifies divergence from the learned distribution of ordinary celestial and ambient noise.',
  },
  {
    step: '04',
    name: 'Candidate ranking',
    short: 'Ranking',
    description: 'Spatial pointings and Doppler drift consistency isolate viable candidate events.',
  },
];

export function NarrativeSection4({ progress }: NarrativeSection4Props) {
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-10 sm:pt-14 px-2 sm:px-8 font-sans">
        <div>
          <span className="text-xs text-[#5BD8F5] font-medium">Discovery pipeline</span>
        </div>

        {/* 4-Step Pipeline Stepper */}
        <div className="flex items-center gap-1.5 sm:gap-2 text-xs">
          {STAGES.map((s, idx) => {
            const isActive = idx === activeStageIndex;
            const isPast = idx < activeStageIndex;
            return (
              <div
                key={s.step}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border transition-colors ${
                  isActive
                    ? 'border-[#5BD8F5]/80 bg-[#10161D] text-[#5BD8F5] font-medium'
                    : isPast
                      ? 'border-[#172230] bg-[#0B0F14] text-[#E6EDF2]'
                      : 'border-[#172230]/60 bg-[#0B0F14]/40 text-[#7F8B95]'
                }`}
              >
                <span className="font-mono text-[11px]">{s.step}</span>
                <span className="hidden md:inline">{s.short}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Dynamic Stage Display */}
      <div className="relative w-full max-w-2xl mx-auto text-center my-auto px-4">
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-normal tracking-tight text-[#E6EDF2] font-sans transition-all duration-200">
          {activeStage.name}
        </h2>

        <p className="mt-4 text-sm sm:text-base text-[#7F8B95] max-w-lg mx-auto leading-relaxed font-sans">
          {activeStage.description}
        </p>
      </div>

      {/* Bottom Quiet Space */}
      <div className="pb-10 sm:pb-14 px-2 sm:px-8 text-center text-xs text-[#7F8B95]">
        <span>Automated inference pipeline</span>
      </div>
    </div>
  );
}
