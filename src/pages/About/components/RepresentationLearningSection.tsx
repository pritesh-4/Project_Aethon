export function RepresentationLearningSection() {
  return (
    <section id="representation-learning" className="space-y-6 scroll-mt-24">
      {/* Chapter Number & Title */}
      <div className="space-y-1 border-b border-[#E4E1D9] pb-3">
        <div className="font-mono text-xs text-[#376A9B] font-semibold tracking-wider uppercase">
          08 / Representation Learning & Anomaly Estimation
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-normal text-[#17202A] tracking-tight">
          Normality Manifolds & Latent Embedding Space
        </h2>
        <p className="text-xs text-[#7E8B96] font-mono">
          Self-supervised masked autoencoding, reconstruction residuals, and latent density metrics.
        </p>
      </div>

      {/* Target ML Architecture Exposition */}
      <div className="space-y-4 text-base text-[#56616A] leading-relaxed font-sans">
        <p>
          High-dimensional dynamic spectrograms are computationally expensive to compare directly in
          pixel space due to arbitrary time offsets, noise speckles, and drift angle variations.
          AETHON's target backend architecture employs{' '}
          <strong className="text-[#17202A]">Self-Supervised Representation Learning</strong> to
          project spectrotemporal patches into a continuous 512-dimensional latent manifold{' '}
          <span className="font-mono text-sm text-[#17202A]">𝒵 ⊂ ℝ⁵¹²</span>.
        </p>

        <p>
          The proposed neural encoder is trained using a masked autoencoding objective on extensive
          archives of nominal cosmic survey data. By masking random time-frequency patches and
          forcing the network to reconstruct the missing spectral structure, the model learns the
          intrinsic physics of normal cosmic observations—interstellar dispersion curves, galactic
          thermal noise distributions, and common satellite downlink harmonics.
        </p>

        <div className="p-3.5 bg-[#FAF8F5] border-l-2 border-[#C19348] border border-[#D6D2C9] rounded-r-[2px] text-xs text-[#56616A] leading-relaxed">
          <strong className="font-mono text-[10.5px] text-[#C19348] uppercase block mb-1">
            RESEARCH INTEGRITY DECLARATION:
          </strong>
          The 512-dimensional masked spectral encoder described here represents the targeted
          research architecture. The current repository contains the typed contract definitions,
          data structures, and frontend visualization pipelines; it does <em>not</em> bundle trained
          model checkpoints or empirical neural benchmarks. Performance metrics must be established
          through rigorous future training on standardized telescope datasets.
        </div>
      </div>

      {/* Anomaly Metrics Mathematical Formulation */}
      <div className="grid md:grid-cols-2 gap-4 pt-2">
        <div className="p-4 bg-[#FAF8F5] border border-[#D6D2C9] rounded-[2px] space-y-2.5">
          <div className="font-mono text-xs font-semibold text-[#376A9B] uppercase tracking-wider">
            1. Reconstruction Residual Metric
          </div>
          <div className="p-2.5 bg-[#F4F1EA] rounded-[2px] font-mono text-xs text-[#17202A] border border-[#E4E1D9]">
            {'L_recon(x, x̂) = || x - f_dec(f_enc(x)) ||_2²'}
          </div>
          <p className="text-xs text-[#56616A] leading-relaxed">
            Measures the inability of the decoder network to reconstruct unfamiliar spectral
            structures. Because the model was trained exclusively on nominal background regimes, an
            unprecedented signal morphology produces a large reconstruction error.
          </p>
        </div>

        <div className="p-4 bg-[#FAF8F5] border border-[#D6D2C9] rounded-[2px] space-y-2.5">
          <div className="font-mono text-xs font-semibold text-[#376A9B] uppercase tracking-wider">
            2. Latent Density Outlier Distance
          </div>
          <div className="p-2.5 bg-[#F4F1EA] rounded-[2px] font-mono text-xs text-[#17202A] border border-[#E4E1D9]">
            {'d_k(z) = (1 / k) · Σ_{i=1}^k || z - z_(i) ||_2'}
          </div>
          <p className="text-xs text-[#56616A] leading-relaxed">
            Measures Euclidean distance from the projected embedding $z$ to its $k$-nearest
            neighbors in the nominal reference archive. Outliers located in sparse, unpopulated
            regions of the manifold receive high novelty indices.
          </p>
        </div>
      </div>

      {/* Figure 04: Conceptual Latent Space Manifold */}
      <figure className="my-6 p-5 bg-[#FAF8F5] border border-[#D6D2C9] rounded-[3px] space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono border-b border-[#E4E1D9] pb-2.5">
          <span className="font-semibold text-[#17202A]">
            FIGURE 04 — Conceptual Latent-Space Manifold Projection
          </span>
          <span className="px-2 py-0.5 rounded-[2px] bg-[#EAE7E0] text-[#56616A] text-[10px]">
            STATUS: CONCEPTUAL / SYNTHETIC VISUALIZATION
          </span>
        </div>

        <div className="p-6 bg-[#0D141A] rounded-[2px] border border-[#213240] text-center space-y-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-mono">
            <div className="flex items-center gap-2 text-[#6A7E8F]">
              <span className="h-3 w-3 rounded-full bg-[#376A9B]/40 border border-[#5C89B7]" />
              <span>Nominal Sky Background</span>
            </div>
            <div className="flex items-center gap-2 text-[#6A7E8F]">
              <span className="h-3 w-3 rounded-full bg-[#56616A]/40 border border-[#7E8B96]" />
              <span>Known Anthropogenic RFI</span>
            </div>
            <div className="flex items-center gap-2 text-[#D4A359]">
              <span className="h-3 w-3 rounded-full bg-[#D4A359]/30 border border-[#D4A359] animate-pulse" />
              <span>Anomalous Candidate Outlier</span>
            </div>
          </div>

          <div className="relative h-44 w-full max-w-lg mx-auto border border-[#213240] rounded-[2px] bg-[#070B10] flex items-center justify-center p-4">
            {/* Cluster 1: Background Noise */}
            <div className="absolute left-12 top-10 h-16 w-24 rounded-full bg-[#376A9B]/10 border border-[#376A9B]/30 flex items-center justify-center text-[10px] font-mono text-[#5C89B7]">
              Cosmic Noise
            </div>
            {/* Cluster 2: Known RFI */}
            <div className="absolute right-14 top-14 h-16 w-24 rounded-full bg-[#56616A]/10 border border-[#56616A]/30 flex items-center justify-center text-[10px] font-mono text-[#7E8B96]">
              Satellite RFI
            </div>
            {/* Outlier: Anomalous Candidate */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
              <span className="h-4 w-4 rounded-full bg-[#D4A359] border-2 border-white shadow-[0_0_12px_#D4A359]" />
              <span className="text-[10px] font-mono text-[#D4A359] font-semibold bg-[#131E27] px-2 py-0.5 rounded-[2px] border border-[#213240]">
                CANDIDATE OUTLIER (d_k &gt; threshold)
              </span>
            </div>
          </div>
        </div>

        <figcaption className="text-xs text-[#7E8B96] leading-relaxed pt-2 border-t border-[#E4E1D9]">
          <strong className="text-[#56616A]">Interpretation:</strong> Nominal background telemetry
          and repetitive RFI cluster tightly within high-density manifolds. Statistically rare
          observations lie isolated in low-density coordinates, prompting the system to flag them
          for manual review.
        </figcaption>
      </figure>
    </section>
  );
}
