export function WorkflowSection() {
  const WORKFLOW_STEPS = [
    {
      step: '01',
      title: 'Select or Ingest Observation',
      route: '/discover or /archive',
      action:
        'Load calibrated radio telemetry file (.fil, .h5, .fits) or select an active telescope session.',
    },
    {
      step: '02',
      title: 'Inspect Baseline Signal Quality',
      route: '/observatory',
      action:
        'Examine dual-band frequency waterfall, ambient background SNR, and receiver lock indicators.',
    },
    {
      step: '03',
      title: 'Configure Screening Parameters',
      route: '/discover',
      action:
        'Set minimum persistence threshold, maximum drift rate search bound (df/dt), and RFI mask tier.',
    },
    {
      step: '04',
      title: 'Execute Anomaly Discovery Run',
      route: '/discover',
      action:
        'Run pipeline to evaluate reconstruction residuals and latent manifold density across all channels.',
    },
    {
      step: '05',
      title: 'Review Candidate Ledger',
      route: '/candidates',
      action:
        'Filter high-priority candidate outliers by composite score, signal-to-noise ratio, and review state.',
    },
    {
      step: '06',
      title: 'Open Candidate Dossier',
      route: '/analysis/:id',
      action: 'Examine detailed multi-stage decomposition of the anomalous candidate signal.',
    },
    {
      step: '07',
      title: 'Evaluate Scientific Evidence',
      route: '/analysis/:id',
      action:
        'Inspect high-resolution waterfall spectrogram, cross-sectional spectral slice, and demodulated audio.',
    },
    {
      step: '08',
      title: 'Audit Technical Parameters',
      route: '/analysis/:id',
      action:
        'Examine topocentric drift trajectory, multi-beam spatial null status, and catalog cross-matches.',
    },
    {
      step: '09',
      title: 'Record Scientific Review Verdict',
      route: '/analysis/:id',
      action:
        'Log disposition: Confirmed Candidate (requires follow-up), Known RFI / Artifact, or Inconclusive.',
    },
    {
      step: '10',
      title: 'Preserve Cryptographic Provenance',
      route: '/archive',
      action:
        'Commit candidate ledger state with timestamp, reviewer sign-off, and exportable JSON/FITS metadata.',
    },
  ];

  return (
    <section id="workflow" className="space-y-6 scroll-mt-24">
      {/* Chapter Number & Title */}
      <div className="space-y-1 border-b border-[#E4E1D9] pb-3">
        <div className="font-mono text-xs text-[#376A9B] font-semibold tracking-wider uppercase">
          13 / Investigator Workflow & Interface Design
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-normal text-[#17202A] tracking-tight">
          Ten-Step Scientific Investigation Lifecycle
        </h2>
        <p className="text-xs text-[#7E8B96] font-mono">
          How the AETHON interface translates computational anomaly metrics into structured
          astronomer actions.
        </p>
      </div>

      {/* Interface Philosophy */}
      <div className="space-y-4 text-base text-[#56616A] leading-relaxed font-sans">
        <p>
          The AETHON workstation is intentionally engineered around{' '}
          <strong className="text-[#17202A]">progressive scientific disclosure</strong> rather than
          traditional dashboard monitoring. A researcher is never presented with an opaque
          "percentage confidence" score; instead, every metric is directly tethered to verifiable
          spectrotemporal evidence, allowing astronomers to audit each stage of the computational
          pipeline.
        </p>
      </div>

      {/* 10-Step Workflow Matrix */}
      <div className="space-y-2.5 pt-2">
        {WORKFLOW_STEPS.map((s) => (
          <div
            key={s.step}
            className="p-3 bg-[#FAF8F5] border border-[#D6D2C9] rounded-[2px] flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 text-xs"
          >
            <div className="flex items-baseline gap-3 flex-1">
              <span className="font-mono text-xs font-semibold text-[#376A9B] shrink-0">
                STEP {s.step}
              </span>
              <div className="space-y-0.5">
                <span className="font-semibold text-[#17202A] text-xs font-sans">{s.title}</span>
                <p className="text-[#56616A] text-[11.5px] leading-relaxed font-sans">{s.action}</p>
              </div>
            </div>

            <div className="shrink-0 self-start sm:self-baseline">
              <span className="inline-block px-2 py-0.5 rounded-[2px] bg-[#EAE7E0] font-mono text-[10px] text-[#56616A] border border-[#D6D2C9]">
                {s.route}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
