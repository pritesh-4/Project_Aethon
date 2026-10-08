export function ResearchQuestionsSection() {
  const OBJECTIVES = [
    {
      num: 'Obj 1',
      title: 'Spectrotemporal Data Representation',
      desc: 'Standardize incoming radio telemetry into calibrated, analysis-ready dynamic spectra matrices preserving time, frequency, and intensity coordinates.',
      status: 'Implemented in Prototype',
      statusClass: 'bg-[#3D7D54]/15 text-[#2E6040] border-[#3D7D54]/30',
    },
    {
      num: 'Obj 2',
      title: 'Baseline Normality Manifold Learning',
      desc: 'Formulate an unsupervised representation model that captures the typical statistical topology of cosmic background noise and nominal radio regimes.',
      status: 'Target Architecture',
      statusClass: 'bg-[#C19348]/15 text-[#916B2E] border-[#C19348]/30',
    },
    {
      num: 'Obj 3',
      title: 'Outlier Estimation & Scoring',
      desc: 'Quantify spectrotemporal deviations using dual metrics: reconstruction loss residual and latent density distance from nominal clusters.',
      status: 'Target Architecture',
      statusClass: 'bg-[#C19348]/15 text-[#916B2E] border-[#C19348]/30',
    },
    {
      num: 'Obj 4',
      title: 'Multi-Beam & Doppler Interference Discrimination',
      desc: 'Incorporate spatial coincidence screening and linear frequency drift constraints (df/dt) to penalize ground-based and sidelobe RFI.',
      status: 'Prototype Implemented',
      statusClass: 'bg-[#376A9B]/15 text-[#2B547C] border-[#376A9B]/30',
    },
    {
      num: 'Obj 5',
      title: 'Prioritized Human-Review Ledger',
      desc: 'Construct an intuitive, progressive-disclosure queue that ranks candidate events by anomalous significance for astrophysicist audit.',
      status: 'Implemented in Prototype',
      statusClass: 'bg-[#3D7D54]/15 text-[#2E6040] border-[#3D7D54]/30',
    },
    {
      num: 'Obj 6',
      title: 'Auditable Scientific Provenance',
      desc: 'Retain immutable metadata records linking every anomaly score back to raw observation timestamps, instrument pointings, and model configuration.',
      status: 'Implemented in Prototype',
      statusClass: 'bg-[#3D7D54]/15 text-[#2E6040] border-[#3D7D54]/30',
    },
  ];

  return (
    <section id="research-questions" className="space-y-6 scroll-mt-24">
      {/* Chapter Number & Title */}
      <div className="space-y-1 border-b border-[#E4E1D9] pb-3">
        <div className="font-mono text-xs text-[#376A9B] font-semibold tracking-wider uppercase">
          04 / Research Questions & Objectives
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-normal text-[#17202A] tracking-tight">
          Formulation of Inquiries & Project Objectives
        </h2>
        <p className="text-xs text-[#7E8B96] font-mono">
          Core methodological inquiry, five technical sub-questions, and explicit research
          milestones.
        </p>
      </div>

      {/* Primary Research Question */}
      <div className="p-5 bg-[#FAF8F5] border border-[#D6D2C9] rounded-[2px] space-y-3">
        <div className="font-mono text-[11px] font-semibold text-[#376A9B] uppercase tracking-wider">
          PRIMARY RESEARCH QUESTION
        </div>
        <p className="font-serif italic text-lg sm:text-xl text-[#17202A] leading-snug">
          “How can machine learning help surface previously unlabelled or poorly characterized
          radio-signal behaviour without requiring a complete catalogue of the unknown phenomena
          beforehand?”
        </p>
      </div>

      {/* Secondary Research Inquiries */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-mono font-semibold text-[#17202A] uppercase tracking-wider">
          Secondary Technical Inquiries
        </h3>
        <div className="grid sm:grid-cols-2 gap-3 text-xs text-[#56616A]">
          <div className="p-3 bg-[#FAF8F5] border border-[#E4E1D9] rounded-[2px] space-y-1">
            <span className="font-mono text-[10px] text-[#7E8B96] font-semibold block">
              Q1. REPRESENTATION
            </span>
            <p>
              How should dynamic spectra be structured so that temporal persistence, bandwidth, and
              morphology are preserved in compact low-dimensional representations?
            </p>
          </div>

          <div className="p-3 bg-[#FAF8F5] border border-[#E4E1D9] rounded-[2px] space-y-1">
            <span className="font-mono text-[10px] text-[#7E8B96] font-semibold block">
              Q2. UNUSUALNESS
            </span>
            <p>
              What constitutes a statistically meaningful "deviation" in spectrotemporal space
              without triggering massive false alarms on trivial thermal noise spikes?
            </p>
          </div>

          <div className="p-3 bg-[#FAF8F5] border border-[#E4E1D9] rounded-[2px] space-y-1">
            <span className="font-mono text-[10px] text-[#7E8B96] font-semibold block">
              Q3. RFI DISCRIMINATION
            </span>
            <p>
              How can terrestrial transmitters entering through telescope sidelobes be reliably
              differentiated from genuine celestial candidates without rejecting true astrophysical
              events?
            </p>
          </div>

          <div className="p-3 bg-[#FAF8F5] border border-[#E4E1D9] rounded-[2px] space-y-1">
            <span className="font-mono text-[10px] text-[#7E8B96] font-semibold block">
              Q4. WORKFLOW QUEUE
            </span>
            <p>
              How can raw statistical scores be translated into an actionable, interpretable review
              queue that maximizes human astronomer inspection bandwidth?
            </p>
          </div>
        </div>
      </div>

      {/* Explicit Research Objectives Matrix */}
      <div className="space-y-3 pt-3">
        <h3 className="text-sm font-mono font-semibold text-[#17202A] uppercase tracking-wider">
          Formal Research Objectives & Execution Status
        </h3>
        <div className="space-y-2">
          {OBJECTIVES.map((obj) => (
            <div
              key={obj.num}
              className="p-3 bg-[#FAF8F5] border border-[#D6D2C9] rounded-[2px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-[#376A9B] text-[11px]">
                    {obj.num}
                  </span>
                  <span className="font-semibold text-[#17202A] text-xs">{obj.title}</span>
                </div>
                <p className="text-[#56616A] text-xs leading-relaxed">{obj.desc}</p>
              </div>
              <div className="shrink-0 self-start sm:self-center">
                <span
                  className={`inline-block px-2 py-0.5 rounded-[2px] border text-[10.5px] font-mono whitespace-nowrap ${obj.statusClass}`}
                >
                  {obj.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
