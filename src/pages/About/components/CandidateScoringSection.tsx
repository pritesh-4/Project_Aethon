import { CANDIDATE_LIFECYCLE_STAGES } from '../data/dossierData.ts';
import { AlertTriangle } from 'lucide-react';

export function CandidateScoringSection() {
  return (
    <section id="candidate-scoring" className="space-y-6 scroll-mt-24">
      {/* Chapter Number & Title */}
      <div className="space-y-1 border-b border-[#E4E1D9] pb-3">
        <div className="font-mono text-xs text-[#376A9B] font-semibold tracking-wider uppercase">
          09 / Candidate Scoring & Human Verification
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-normal text-[#17202A] tracking-tight">
          Evidence Formulation & The BLC1 Case Study
        </h2>
        <p className="text-xs text-[#7E8B96] font-mono">
          Composite score formulation, why machine ranking requires human review, and lessons from
          the BLC1 verification.
        </p>
      </div>

      {/* Conceptual Candidate Scoring Formula */}
      <div className="space-y-4 text-base text-[#56616A] leading-relaxed font-sans">
        <p>
          A raw anomaly score alone cannot prioritize observations effectively: high-energy radar
          bursts and satellite flybys produce massive mathematical reconstruction errors despite
          being terrestrial contaminants. AETHON aggregates multiple physical indicators into a{' '}
          <strong className="text-[#17202A]">Composite Candidate Score</strong>:
        </p>

        {/* Math Callout Box */}
        <div className="p-4 bg-[#FAF8F5] border border-[#D6D2C9] rounded-[2px] font-mono text-xs text-[#17202A] space-y-2 my-3">
          <div className="text-[10px] text-[#7E8B96]">CONCEPTUAL EVIDENCE WEIGHTING FORMULA:</div>
          <div className="text-sm font-semibold text-[#376A9B] py-1">
            S_candidate = w_1 · A_anomaly + w_2 · D_drift + w_3 · P_persist - λ_RFI · C_catalog
          </div>
          <div className="grid sm:grid-cols-2 gap-2 pt-2 border-t border-[#E4E1D9] text-[11px] text-[#56616A]">
            <div>
              <strong>A_anomaly:</strong> Unsupervised novelty metric in [0, 1]
            </div>
            <div>
              <strong>D_drift:</strong> Consistency with celestial Doppler acceleration
            </div>
            <div>
              <strong>P_persist:</strong> Temporal continuity across scan duration
            </div>
            <div>
              <strong>C_catalog:</strong> Correlation against known satellite ephemerides
            </div>
          </div>
        </div>

        <p className="text-xs text-[#7E8B96] italic font-sans">
          Note: In the current prototype, weights (w₁, w₂, w₃, λ_RFI) are configured as operational
          heuristics for the demonstration interface. Future research requires empirical calibration
          against verified synthetic injection benchmarks.
        </p>
      </div>

      {/* The BLC1 Verification Case Study */}
      <div className="p-5 bg-[#FAF8F5] border-l-3 border-[#376A9B] border border-[#D6D2C9] rounded-r-[2px] space-y-3 my-6">
        <div className="flex items-center gap-2 font-mono text-xs font-semibold text-[#17202A] uppercase tracking-wider">
          <AlertTriangle className="h-4 w-4 text-[#376A9B]" />
          <span>Case Study in Scientific Verification: Breakthrough Listen BLC1</span>
        </div>
        <p className="text-xs sm:text-sm text-[#56616A] leading-relaxed">
          In 2020, Breakthrough Listen detected <strong className="text-[#17202A]">BLC1</strong>, a
          narrowband 982 MHz signal exhibiting continuous Doppler drift that appeared only when the
          Parkes radio telescope was pointed toward Proxima Centauri. The signal passed all initial
          automated threshold screens and seemed to be an exceptional extraterrestrial candidate.
        </p>
        <p className="text-xs sm:text-sm text-[#56616A] leading-relaxed">
          Subsequent exhaustive investigation by Sheikh et al. (2021) revealed that BLC1 was not
          extraterrestrial. By analyzing wideband archives across hundreds of hours, researchers
          discovered a family of identical drifting signals spaced at arithmetic intervals, traced
          to an uncatalogued local ground electronic device whose oscillators suffered
          intermodulation distortion.
        </p>
        <div className="p-2.5 bg-[#EAE7E0]/60 rounded-[2px] text-xs text-[#17202A] font-medium font-serif italic">
          “The BLC1 investigation demonstrates why an automated anomaly flag is the beginning of a
          scientific inquiry, never its conclusion. Independent pointings, intermodulation checks,
          and human discernment are non-negotiable.”
        </div>
      </div>

      {/* Figure 05: 7-Stage Candidate Lifecycle */}
      <figure className="my-6 p-5 bg-[#FAF8F5] border border-[#D6D2C9] rounded-[3px] space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono border-b border-[#E4E1D9] pb-2.5">
          <span className="font-semibold text-[#17202A]">
            FIGURE 05 — The 7-Stage Candidate Lifecycle & Disposition
          </span>
          <span className="px-2 py-0.5 rounded-[2px] bg-[#EAE7E0] text-[#56616A] text-[10px]">
            STATUS: SCIENTIFIC PROTOCOL
          </span>
        </div>

        <div className="space-y-2">
          {CANDIDATE_LIFECYCLE_STAGES.map((stg) => (
            <div
              key={stg.step}
              className="p-3 bg-[#F4F1EA] border border-[#E4E1D9] rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
            >
              <div className="space-y-0.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[#376A9B] font-semibold text-[11px]">
                    STAGE {stg.step}
                  </span>
                  <span className="font-semibold text-[#17202A] text-xs">{stg.title}</span>
                </div>
                <p className="text-[#56616A] text-[11.5px] leading-relaxed">{stg.description}</p>
                <div className="text-[10.5px] text-[#7E8B96] font-mono">
                  Gate Criteria: {stg.criteria}
                </div>
              </div>

              <div className="shrink-0 self-start sm:self-center">
                <span className="inline-block px-2 py-0.5 rounded-[2px] bg-[#EAE7E0] text-[#17202A] font-mono text-[10px] border border-[#D6D2C9]">
                  {stg.outcome}
                </span>
              </div>
            </div>
          ))}
        </div>

        <figcaption className="text-xs text-[#7E8B96] leading-relaxed pt-2 border-t border-[#E4E1D9]">
          <strong className="text-[#56616A]">Lifecycle Rule:</strong> System terminal states are
          strictly confined to <em>Confirmed / Supported</em>, <em>Rejected / RFI Artifact</em>, or{' '}
          <em>Unresolved</em>. AETHON will never assign autonomous labels such as "Confirmed
          Technosignature" without independent consortium confirmation.
        </figcaption>
      </figure>
    </section>
  );
}
