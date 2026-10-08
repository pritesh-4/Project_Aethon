export function TheProblemSection() {
  return (
    <section id="the-problem" className="space-y-6 scroll-mt-24">
      {/* Chapter Number & Title */}
      <div className="space-y-1 border-b border-[#E4E1D9] pb-3">
        <div className="font-mono text-xs text-[#376A9B] font-semibold tracking-wider uppercase">
          03 / The Problem
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-normal text-[#17202A] tracking-tight">
          The Open-Set Dilemma in Observational Radio Astronomy
        </h2>
        <p className="text-xs text-[#7E8B96] font-mono">
          Why observational scale, non-stationary contamination, and uncatalogued morphology break
          closed-world classifiers.
        </p>
      </div>

      {/* Scientific Problem Exposition */}
      <div className="space-y-4 text-base text-[#56616A] leading-relaxed font-sans">
        <p>
          Observational radio astronomy operates in an era of unprecedented data throughput. Modern
          phased-array feeds, wideband digital backends, and interferometric arrays (such as the
          Green Bank Telescope, MeerKAT, and the upcoming Square Kilometre Array) capture millions
          of frequency bins across multi-gigahertz passbands at sub-second temporal cadences. Within
          this massive observational stream, three confounding factors make signal identification
          extraordinarily difficult:
        </p>

        <ul className="list-disc pl-5 space-y-2 text-[#56616A]">
          <li>
            <strong className="text-[#17202A]">Severe Anthropogenic Contamination:</strong>{' '}
            Low-Earth orbit (LEO) satellite constellations, airborne transponders, 5G cellular
            uplinks, and terrestrial radar emit non-stationary Radio-Frequency Interference (RFI)
            that enters telescopes through both primary beams and far sidelobes.
          </li>
          <li>
            <strong className="text-[#17202A]">Astrophysical Background Complexity:</strong> Cosmic
            microwave background fluctuations, interstellar scintillation, and galactic diffuse
            emission create dynamic, noisy baseline environments that vary dramatically across
            pointing azimuth and elevation.
          </li>
          <li>
            <strong className="text-[#17202A]">The Absence of Pre-Existing Labels:</strong> By
            definition, uncharacterized astrophysical transients, novel propagation phenomena, and
            potential non-terrestrial technosignatures have no pre-existing ground-truth training
            catalogues.
          </li>
        </ul>
      </div>

      {/* Conceptual Comparison: Closed World vs Open Set */}
      <div className="my-8 p-5 bg-[#FAF8F5] border border-[#D6D2C9] rounded-[3px] space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono border-b border-[#E4E1D9] pb-2.5">
          <span className="font-semibold text-[#17202A]">
            FIGURE 02 — Closed-World Classification vs Open-Ended Anomaly Discovery
          </span>
          <span className="px-2 py-0.5 rounded-[2px] bg-[#EAE7E0] text-[#56616A] text-[10px]">
            STATUS: CONCEPTUAL PARADIGM
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-4 pt-1">
          {/* Column A: Closed-World Classifier */}
          <div className="p-4 bg-[#F4F1EA] border border-[#E4E1D9] rounded-[2px] space-y-3">
            <div className="font-mono text-xs font-semibold text-[#B64B4B] uppercase tracking-wider">
              Conventional Supervised Classifier
            </div>
            <div className="text-xs text-[#17202A] font-serif italic border-l-2 border-[#B64B4B] pl-2.5">
              “Which of these known categories does this observation belong to?”
            </div>
            <p className="text-xs text-[#56616A] leading-relaxed">
              Forces all incoming energy into a discrete set of known classes (e.g., Pulsar, RFI,
              Noise, Fast Radio Burst). When an unprecedented signal appears with unfamiliar
              morphology, the model forces a forced-choice misattribution or dismisses the anomaly
              as unclassified noise.
            </p>
            <div className="font-mono text-[11px] text-[#7E8B96] bg-[#EAE7E0] p-2 rounded-[2px]">
              Assumes: P(C_known) = 1.0 (Closed universe assumption)
            </div>
          </div>

          {/* Column B: AETHON Discovery System */}
          <div className="p-4 bg-[#376A9B]/5 border border-[#376A9B]/30 rounded-[2px] space-y-3">
            <div className="font-mono text-xs font-semibold text-[#376A9B] uppercase tracking-wider">
              AETHON Normality-Based Discovery
            </div>
            <div className="text-xs text-[#17202A] font-serif italic border-l-2 border-[#376A9B] pl-2.5">
              “Does this observation depart significantly from the learned nominal population?”
            </div>
            <p className="text-xs text-[#56616A] leading-relaxed">
              Models the continuous manifold of expected baseline observation states. Unfamiliar
              morphologies receive high anomaly scores based on reconstruction residuals and low
              latent density, surfacing them for prioritized human investigation regardless of prior
              classification labels.
            </p>
            <div className="font-mono text-[11px] text-[#376A9B] bg-[#376A9B]/10 p-2 rounded-[2px]">
              Assumes: P(C_unknown) &gt; 0 (Open-set discovery paradigm)
            </div>
          </div>
        </div>

        <figcaption className="text-xs text-[#7E8B96] leading-relaxed pt-2 border-t border-[#E4E1D9]">
          <strong className="text-[#56616A]">Methodological Note:</strong> A high anomaly score does
          not assign a physical origin to a signal. Anomaly discovery merely establishes that an
          event warrants high-priority scrutiny by astronomers, filtering the overwhelming
          observational volume down to human-verifiable candidates.
        </figcaption>
      </div>
    </section>
  );
}
