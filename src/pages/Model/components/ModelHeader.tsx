export function ModelHeader() {
  return (
    <div className="space-y-4 select-none">
      {/* Header Context */}
      <div className="flex items-center justify-between border-b border-[#242825] pb-3 text-xs text-[#9A9C96]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D4864A]" />
          <h1 className="text-xs font-medium text-[#E6E4DD] tracking-normal font-sans">
            Observation methodology
          </h1>
        </div>
        <span className="text-[11px] text-[#666963] hidden sm:inline">
          Unsupervised representation & deviation isolation
        </span>
      </div>

      {/* The Core Question & Editorial Prose */}
      <div className="space-y-3">
        <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-[#E6E4DD]">
          How AETHON looks for the unexpected
        </h2>

        <p className="text-sm text-[#9A9C96] leading-relaxed max-w-3xl">
          A standard classifier asks{' '}
          <strong className="text-[#E6E4DD] font-medium">“What is this?”</strong> and attempts to
          force uncataloged phenomena into predefined taxonomy. AETHON operates under a different
          assumption:{' '}
          <strong className="text-[#D4864A] font-medium">
            “Does this observation fit our baseline understanding?”
          </strong>
          — mapping the high-dimensional manifold of natural radio background and isolating
          observations that deviate significantly from expected distributions.
        </p>

        {/* 3 Core Philosophical Pillars: Clean Horizontal Rule Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-[#242825]">
          <div className="space-y-1.5">
            <span className="text-[10px] text-[#666963] font-mono block">
              01 · Standard classification
            </span>
            <span className="text-xs font-medium text-[#E6E4DD] block">“What is this?”</span>
            <p className="text-xs text-[#9A9C96] leading-relaxed">
              Constrained to pre-defined classes, existing catalogs, and historical training labels.
              Blind to novel morphology.
            </p>
          </div>

          <div className="space-y-1.5 md:border-l md:border-[#242825] md:pl-6">
            <span className="text-[10px] text-[#D4864A] font-mono block">
              02 · Anomaly isolation
            </span>
            <span className="text-xs font-medium text-[#D4864A] block">“Does this belong?”</span>
            <p className="text-xs text-[#9A9C96] leading-relaxed">
              Measures whether an observation departs from the learned manifold of natural
              astrophysical emissions.
            </p>
          </div>

          <div className="space-y-1.5 md:border-l md:border-[#242825] md:pl-6">
            <span className="text-[10px] text-[#666963] font-mono block">
              03 · Research hypothesis
            </span>
            <span className="text-xs font-medium text-[#E6E4DD] block">
              Investigating deviation
            </span>
            <p className="text-xs text-[#9A9C96] leading-relaxed">
              Surfaces coherent non-terrestrial signals that deviate from both cataloged emitters
              and local interference.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
