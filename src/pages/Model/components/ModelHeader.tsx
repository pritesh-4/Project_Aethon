export function ModelHeader() {
  return (
    <div className="space-y-6 select-none font-sans">
      {/* Role 1: Page Identity (32-40px) */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono text-[#767973] uppercase tracking-wider">
          <span>AETHON ARCHITECTURE</span>
          <span>/</span>
          <span>METHODOLOGY</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-[#E6E4DD]">
          Methodology
        </h1>
        <p className="text-sm text-[#9A9C96] leading-relaxed max-w-xl">
          Unsupervised representation, continuous manifold learning, and statistical deviation
          isolation in high-cadence radio astronomy.
        </p>
      </div>

      {/* The Core Question (Rule 27: THE QUESTION — 24-28px) */}
      <div className="pt-4 border-t border-[#242825] space-y-3">
        <h2 className="text-xl sm:text-2xl font-normal tracking-tight text-[#E6E4DD]">
          How do we detect something we do not know the shape of?
        </h2>

        <p className="text-sm text-[#9A9C96] leading-relaxed max-w-3xl">
          A standard classifier asks{' '}
          <strong className="text-[#E6E4DD] font-medium">“What is this?”</strong> and attempts to
          force uncataloged phenomena into predefined taxonomy. AETHON operates under a different
          assumption:{' '}
          <strong className="text-[#D4864A] font-medium">
            “Does this observation fit our baseline understanding?”
          </strong>
          — mapping the high-dimensional manifold of nominal cosmic background and isolating
          observations that deviate significantly from expected distributions.
        </p>

        {/* 3 Core Philosophical Pillars: Clean Horizontal Rule Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-5 border-t border-[#242825]">
          <div className="space-y-1.5">
            <span className="text-[10px] text-[#666963] font-mono block uppercase tracking-wider">
              01 · Standard Classification
            </span>
            <span className="text-sm font-medium text-[#E6E4DD] block">“What is this?”</span>
            <p className="text-xs text-[#9A9C96] leading-relaxed">
              Constrained to pre-defined classes, existing catalogs, and historical training labels.
              Blind to novel morphology.
            </p>
          </div>

          <div className="space-y-1.5 md:border-l md:border-[#242825] md:pl-6">
            <span className="text-[10px] text-[#D4864A] font-mono block uppercase tracking-wider">
              02 · Anomaly Isolation
            </span>
            <span className="text-sm font-medium text-[#D4864A] block">“Does this belong?”</span>
            <p className="text-xs text-[#9A9C96] leading-relaxed">
              Measures whether an observation departs from the learned manifold of natural
              astrophysical emissions.
            </p>
          </div>

          <div className="space-y-1.5 md:border-l md:border-[#242825] md:pl-6">
            <span className="text-[10px] text-[#666963] font-mono block uppercase tracking-wider">
              03 · Research Hypothesis
            </span>
            <span className="text-sm font-medium text-[#E6E4DD] block">
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
