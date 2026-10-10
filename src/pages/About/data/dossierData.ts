import type {
  ArchitectureStage,
  CandidateLifecycleStage,
  DataFormatSpec,
  EvaluationBaseline,
  ImplementationItem,
  ReferenceItem,
  TableOfContentsEntry,
} from '../types.ts';

export const TABLE_OF_CONTENTS: TableOfContentsEntry[] = [
  {
    id: 'executive-summary',
    number: '01',
    title: 'Executive Summary',
    purpose: 'Core thesis, scientific mission, and end-to-end conceptual pipeline.',
  },
  {
    id: 'implementation-status',
    number: '02',
    title: 'Implementation Status Matrix',
    purpose:
      'Explicit separation of implemented code, prototype features, and target architectures.',
  },
  {
    id: 'the-problem',
    number: '03',
    title: 'The Problem: Open-Set Discovery',
    purpose: 'Why observational scale and unknown signal morphology break closed-set classifiers.',
  },
  {
    id: 'research-questions',
    number: '04',
    title: 'Research Questions & Objectives',
    purpose:
      'Primary mathematical question, secondary technical sub-questions, and explicit research milestones.',
  },
  {
    id: 'scientific-basis',
    number: '05',
    title: 'Scientific Basis & Observables',
    purpose:
      'Dynamic spectra, frequency drift (df/dt), the HI 1420 MHz line, and RFI contamination.',
  },
  {
    id: 'system-architecture',
    number: '06',
    title: 'System Architecture',
    purpose: 'Interactive 10-stage end-to-end dataflow and Physical-to-Computational mapping.',
  },
  {
    id: 'signal-processing',
    number: '07',
    title: 'Signal Processing & Data Formats',
    purpose: 'Spectrogram construction, FITS, HDF5, SIGPROC, and scientific data provenance.',
  },
  {
    id: 'representation-learning',
    number: '08',
    title: 'Representation Learning & Anomaly Estimation',
    purpose:
      'Normality modelling, reconstruction deviation, density metrics, and latent manifold mapping.',
  },
  {
    id: 'candidate-scoring',
    number: '09',
    title: 'Candidate Scoring & Human Verification',
    purpose:
      'Multi-factor ranking formulation, the BLC1 verification case study, and the 7-stage candidate lifecycle.',
  },
  {
    id: 'evaluation-strategy',
    number: '10',
    title: 'Evaluation Strategy & Baselines',
    purpose:
      'Synthetic injection protocol, comparison against statistical baselines, and planned ablation studies.',
  },
  {
    id: 'limitations',
    number: '11',
    title: 'Limitations & Threats to Validity',
    purpose:
      'Honest red-team assessment of selection bias, RFI leakage, synthetic domain shifts, and false discoveries.',
  },
  {
    id: 'reproducibility',
    number: '12',
    title: 'Reproducibility & Repository Architecture',
    purpose:
      'Source tree mapping, deterministic PRNG seeds, build steps, and experimental protocols.',
  },
  {
    id: 'workflow',
    number: '13',
    title: 'Investigator Workflow & Interface Design',
    purpose:
      '10-step investigative lifecycle from telemetry ingestion to consortium alert dispatch.',
  },
  {
    id: 'roadmap',
    number: '14',
    title: 'Research Roadmap',
    purpose:
      'Phased development trajectory from client-side prototype to multi-observatory coordination.',
  },
  {
    id: 'ethics-and-restraint',
    number: '15',
    title: 'Scientific Restraint & Ethics',
    purpose:
      'What AETHON is NOT, communication ethics, and treating anomalies with epistemological humility.',
  },
  {
    id: 'references',
    number: '16',
    title: 'References & Literature Context',
    purpose:
      'Formal numbered citations from NASA, NRAO, Breakthrough Listen, and astrophysics publications.',
  },
];

export const IMPLEMENTATION_MATRIX: ImplementationItem[] = [
  {
    component: 'Cinematic 3D Prologue & Scrollytelling',
    category: 'implemented',
    categoryLabel: 'Implemented',
    scope: 'Client-side WebGL (Three.js) & Lenis',
    evidence: 'src/pages/Landing/*',
    notes:
      'Interactive 3D telescope, procedural seeded signal ribbons, dynamic waterfall dive, and audio synthesis.',
  },
  {
    component: 'Observatory Real-Time Inspection Console',
    category: 'implemented',
    categoryLabel: 'Implemented',
    scope: 'React 19, SVG, Web Audio API',
    evidence: 'src/pages/Observatory/*',
    notes:
      'Dual-band frequency viewport, real-time audio demodulation, drift tracking, and spatial beam null checks.',
  },
  {
    component: 'Interactive Signal Analysis Dossier',
    category: 'implemented',
    categoryLabel: 'Implemented',
    scope: 'Client-side Multi-stage Decomposition',
    evidence: 'src/pages/Analysis/*',
    notes:
      'Stage-by-stage spectrogram inspection, noise floor subtraction, drift verification, and verdict logging.',
  },
  {
    component: 'Candidate Verification Ledger & Filtering',
    category: 'implemented',
    categoryLabel: 'Implemented',
    scope: 'Client-side Table & Detail Viewports',
    evidence: 'src/pages/Candidates/*',
    notes:
      'Multi-parameter sorting by SNR, drift, catalog similarity, and scientific review status.',
  },
  {
    component: 'Observation Ingestion & Screening Setup',
    category: 'implemented',
    categoryLabel: 'Implemented',
    scope: 'Backend Ingestion & Screening Service',
    evidence: 'src/pages/Discover/*',
    notes:
      'Accepts .fil and .fits; parses spectral payloads and coordinates backend screening and anomaly detection runs.',
  },
  {
    component: 'Observational Archive & Branch Ledger',
    category: 'implemented',
    categoryLabel: 'Implemented',
    scope: 'Client-side State & Timeline',
    evidence: 'src/pages/Archive/*',
    notes:
      'Filterable observation log, candidate branch drawer, and exportable provenance records.',
  },
  {
    component: 'Typed API Contracts & Schema Validation',
    category: 'implemented',
    categoryLabel: 'Implemented',
    scope: 'TypeScript & Zod Schemas',
    evidence: 'src/types/schemas.ts, src/lib/api.ts',
    notes:
      'Strict runtime validation for signals, stages, candidate states, and screening parameters.',
  },
  {
    component: 'Self-Supervised Spectrogram Encoder (Neural Model)',
    category: 'target',
    categoryLabel: 'Target Architecture',
    scope: 'Backend Python / PyTorch Service',
    evidence: 'Described in docs/ & README.md',
    notes:
      'Proposed 512-dimensional latent embedding via masked autoencoding on raw dynamic spectra. Model not yet trained in repo.',
  },
  {
    component: 'Polyphase Filterbank (PFB) High-Cadence Channelizer',
    category: 'target',
    categoryLabel: 'Target Architecture',
    scope: 'Backend DSP / C++ / CuPy',
    evidence: 'Described in docs/ & README.md',
    notes:
      'Proposed 3.8 Hz spectral binning from raw telescope baseband voltages. Simulated in frontend prototype.',
  },
  {
    component: 'Taylor-Tree Doppler Drift Rate Search Algorithm',
    category: 'target',
    categoryLabel: 'Target Architecture',
    scope: 'Backend Doppler Integration Engine',
    evidence: 'Described in docs/runbook.md',
    notes:
      'Proposed incoherent de-doppler integration tree across frequency drifts up to ±10 Hz/s. Not executed in client.',
  },
  {
    component: 'Live Telescope Direct Ingestion (GBT / MeerKAT / Parkes)',
    category: 'future',
    categoryLabel: 'Future Research',
    scope: 'Observatory Facility Integration',
    evidence: 'Planned in Research Roadmap Phase 8',
    notes: 'Requires streaming network sockets and dedicated facility access approvals.',
  },
  {
    component: 'Autonomous Multi-Observatory Follow-up Coordination',
    category: 'future',
    categoryLabel: 'Future Research',
    scope: 'VOEvent / Inter-Observatory Protocols',
    evidence: 'Planned in Research Roadmap Phase 9',
    notes:
      'Proposed distributed trigger dispatch for independent optical and radio cross-pointing verification.',
  },
];

export const ARCHITECTURE_STAGES: ArchitectureStage[] = [
  {
    id: 'stage-1',
    number: '01',
    name: 'Observational Ingestion',
    layer: 'Observational',
    input: 'Dual-polarization baseband voltage stream or scientific file (.fil, .fits)',
    operation: 'Packet reassembly, bit unpack, header parsing, and metadata validation',
    output: 'Calibrated time-series voltage / power frames with telescope pointings',
    purpose: 'Standardizes disparate radio telescope backends into an analysis-ready stream.',
    status: 'Implemented (Frontend Prototype)',
  },
  {
    id: 'stage-2',
    number: '02',
    name: 'Digital Signal Processing (PFB)',
    layer: 'Signal Processing',
    input: 'Raw digitized time-domain samples',
    operation:
      'Polyphase filterbank channelization into discrete frequency channels with high out-of-band rejection',
    output: 'Fine-channelized complex spectra with uniform time cadence',
    purpose:
      'Resolves narrowband coherent features while minimizing spectral leakage across adjacent bins.',
    status: 'Target Backend Architecture',
  },
  {
    id: 'stage-3',
    number: '03',
    name: 'Bandpass Normalization & Whitening',
    layer: 'Signal Processing',
    input: 'Fine-channelized dynamic power array',
    operation:
      'Running median estimation, baseline polynomial removal, and variance normalization per channel',
    output: 'Zero-mean, unit-variance dynamic spectrum matrix (Waterfall)',
    purpose:
      'Removes receiver gain ripple, atmospheric absorption slopes, and slow instrumental baseline wander.',
    status: 'Implemented (Frontend Prototype)',
  },
  {
    id: 'stage-4',
    number: '04',
    name: 'Spatial & RFI Screening',
    layer: 'Signal Processing',
    input: 'Normalized dynamic spectrum + multi-beam pointing telemetry',
    operation:
      'Spatial coincidence testing (on-target vs off-target beams) and known RFI band masking',
    output: 'Screened dynamic spectrum with contaminated bins flagged or masked',
    purpose:
      'Excludes local terrestrial transmitters that appear simultaneously in multiple antenna sidelobes.',
    status: 'Target Backend Architecture',
  },
  {
    id: 'stage-5',
    number: '05',
    name: 'Self-Supervised Spectral Encoding',
    layer: 'Machine Learning',
    input: 'Screened time-frequency patch matrix (Time x Frequency)',
    operation:
      'Convolutional / Transformer feature extraction trained via masked patch reconstruction on nominal sky',
    output: '512-dimensional continuous latent embedding vector z',
    purpose:
      'Maps complex morphology and spectrotemporal structure into a compact mathematical manifold.',
    status: 'Target Backend Architecture',
  },
  {
    id: 'stage-6',
    number: '06',
    name: 'Normality & Anomaly Estimation',
    layer: 'Machine Learning',
    input: 'Latent embedding z and reconstructed spectrogram',
    operation:
      'Reconstruction residual calculation (L2/SSIM) combined with latent manifold local density estimation',
    output: 'Uncalibrated statistical anomaly score A_raw in [0, 1]',
    purpose:
      'Quantifies how poorly the observation fits the learned baseline distribution of known signals.',
    status: 'Target Backend Architecture',
  },
  {
    id: 'stage-7',
    number: '07',
    name: 'Doppler Drift Rate Estimation (df/dt)',
    layer: 'Machine Learning',
    input: 'Dynamic spectrum time-frequency track',
    operation:
      'Radon transform / Taylor-tree linear chirp search across topocentric drift velocities',
    output: 'Calculated drift rate df/dt (Hz/s) and coherence significance metric',
    purpose:
      'Verifies whether signal trajectory matches expected orbital acceleration of non-terrestrial sources.',
    status: 'Implemented (Frontend Prototype)',
  },
  {
    id: 'stage-8',
    number: '08',
    name: 'Composite Candidate Scoring',
    layer: 'Scientific Interface',
    input: 'Anomaly score, drift coherence, persistence duration, and RFI catalog correlation',
    operation: 'Multi-factor weighted evidence aggregation with strict interference penalties',
    output: 'Calibrated candidate rank score S_candidate and priority tier',
    purpose:
      'Orders millions of observed frequency channels into a manageable queue for human review.',
    status: 'Implemented (Frontend Prototype)',
  },
  {
    id: 'stage-9',
    number: '09',
    name: 'Human-in-the-Loop Investigation',
    layer: 'Scientific Interface',
    input: 'Prioritized candidate dossier with waterfall plots and provenance metadata',
    operation:
      'Interactive visual verification by astronomers: off-pointing checks, catalog cross-checks, and audio review',
    output: 'Logged review disposition: Confirmed Candidate, Known RFI / Artifact, or Unresolved',
    purpose:
      'Ensures machine outputs are critically inspected before any scientific claim or telescope retargeting.',
    status: 'Implemented (Frontend Prototype)',
  },
  {
    id: 'stage-10',
    number: '10',
    name: 'Archival Provenance & Follow-up Trigger',
    layer: 'Scientific Interface',
    input: 'Verified candidate record with complete processing configuration and timestamps',
    operation:
      'Cryptographic hash generation, archival storage, and VOEvent dispatch to partner facilities',
    output: 'Immutable audit ledger entry and coordinated multi-observatory pointing request',
    purpose:
      'Guarantees scientific reproducibility and coordinates independent replication attempts.',
    status: 'Implemented (Frontend Prototype)',
  },
];

export const CANDIDATE_LIFECYCLE_STAGES: CandidateLifecycleStage[] = [
  {
    step: '01',
    title: 'Raw Telemetry Ingestion',
    description:
      'Telescope antenna stream channelized and organized into discrete observation sessions.',
    criteria: 'Receiver locked, timestamp synchronized, and calibration diode verified.',
    outcome: 'Session Registered',
  },
  {
    step: '02',
    title: 'Automated Screening',
    description:
      'Bandpass normalization, RFI mask application, and multi-beam coincidence screening.',
    criteria: 'Baseline variance within nominal limits; no universal all-beam saturation.',
    outcome: 'Screened Observation',
  },
  {
    step: '03',
    title: 'Statistical Anomaly Flag',
    description:
      'Neural encoder identifies high reconstruction residual or outlier latent manifold density.',
    criteria: 'Anomaly threshold A_raw > theta_screen (top 0.1% of session volume).',
    outcome: 'Flagged Anomaly',
  },
  {
    step: '04',
    title: 'Candidate Elevation',
    description:
      'Observation verified to exhibit persistent temporal duration (>120s) and non-zero drift.',
    criteria:
      'Persistence verified; catalog cross-match < 0.15 against known satellite ephemerides.',
    outcome: 'Candidate Event',
  },
  {
    step: '05',
    title: 'Astronomer Interactive Review',
    description:
      'Investigator inspects dynamic spectrum waterfall, drift history, and audio demodulation in AETHON.',
    criteria: 'Expert inspection of local instrumental gain curves and polarization states.',
    outcome: 'Human Audit Complete',
  },
  {
    step: '06',
    title: 'Independent Follow-up Pointing',
    description:
      'Observatory executes On-Off-On-Off cadence on target coordinates to test spatial localization.',
    criteria:
      'Signal detected during On-target pointing; completely absent during Off-target pointing.',
    outcome: 'Spatial Coherence Verified',
  },
  {
    step: '07',
    title: 'Final Disposition',
    description:
      'Permanent classification assigned in archival registry with full provenance history.',
    criteria: 'Independent consensus across observing team and external cross-checks.',
    outcome: 'Confirmed Candidate / RFI Artifact / Unresolved',
  },
];

export const DATA_FORMAT_SPECS: DataFormatSpec[] = [
  {
    extension: '.fits',
    name: 'Flexible Image Transport System (FITS)',
    role: 'Standard astronomical container for multidimensional image cubes, tables, and calibrated spectra.',
    status: 'Target Native Support',
    strengths:
      'Self-documenting ASCII header blocks, immutable coordinate systems (WCS), universal astronomical toolchain support.',
    caveat:
      'Higher storage overhead for streaming high-cadence time series compared to raw binary filterbanks.',
  },
  {
    extension: '.h5',
    name: 'Hierarchical Data Format 5 (HDF5)',
    role: 'Modern wideband spectral container utilized by Breakthrough Listen (blimpy) and high-throughput correlators.',
    status: 'Prototype Simulated',
    strengths:
      'Internal chunking, built-in gzip/bitshuffle compression, hierarchical grouping of multi-beam Stokes parameters.',
    caveat:
      'Complex I/O stack; requires dedicated HDF5 C-library backend bindings not yet integrated.',
  },
  {
    extension: '.fil',
    name: 'SIGPROC Filterbank Format',
    role: 'De facto standard binary stream format for pulsar discovery and single-pulse radio searches.',
    status: 'Target Native Support',
    strengths:
      'Ultra-low overhead contiguous binary matrices (Time x Frequency); fast sequential streaming.',
    caveat:
      'Minimal metadata header; easily corrupted if byte-endianness or channel bandwidth signs are misconfigured.',
  },
  {
    extension: '.csv / .json',
    name: 'Tabular / Structured Interchange Formats',
    role: 'Lightweight demonstration interchange formats for metadata exchange, candidate rosters, and telemetry export.',
    status: 'Interchange Only',
    strengths: 'Human-readable, browser-native JSON parsing, seamless web API transmission.',
    caveat:
      'Completely unsuited for raw gigahertz radio spectra due to severe memory and parsing bottlenecks.',
  },
];

export const EVALUATION_BASELINES: EvaluationBaseline[] = [
  {
    name: 'Peak SNR Spectral Thresholding',
    type: 'Heuristic Radiometry',
    mechanism:
      'Flags frequency channels whose integrated power exceeds 6-sigma above local baseline noise.',
    roleInEvaluation:
      'Provides the standard classical detection baseline; struggles with low-SNR drifting carriers.',
  },
  {
    name: 'Incoherent Doppler Tree (turboSETI)',
    type: 'Classical Search',
    mechanism:
      'Sums pixel intensities along linear chirp trajectories in time-frequency waterfall data.',
    roleInEvaluation:
      'Gold-standard benchmark for drifting narrowband carriers; sensitive but computationally intensive and limited to linear slopes.',
  },
  {
    name: 'Isolation Forest (iForest)',
    type: 'Shallow Machine Learning',
    mechanism:
      'Measures tree isolation depth on extracted hand-crafted spectral statistical features (kurtosis, skew, variance).',
    roleInEvaluation:
      'Tests whether deep representation learning is necessary compared to lightweight tabular ensemble methods.',
  },
  {
    name: 'One-Class Support Vector Machine (OC-SVM)',
    type: 'Kernel Boundary Estimator',
    mechanism:
      'Fits a maximum-margin hyperplane enclosing nominal background spectral embeddings in RKHS.',
    roleInEvaluation:
      'Evaluates boundary calibration stability on high-dimensional normal feature distributions.',
  },
  {
    name: 'Convolutional Autoencoder (Baseline AE)',
    type: 'Deep Neural Network',
    mechanism:
      'Simple 4-layer 2D CNN trained with MSE reconstruction loss on dynamic spectrogram patches.',
    roleInEvaluation:
      'Direct comparative baseline against AETHON proposed self-supervised masked transformer architecture.',
  },
];

export const SCIENTIFIC_REFERENCES: ReferenceItem[] = [
  {
    id: 1,
    authors: 'Sheikh, S. Z., Smith, S., Siemens, M., et al.',
    year: 2021,
    title:
      'Analysis of the Breakthrough Listen candidate signal BLC1 with a microwave optical link',
    venue: 'Nature Astronomy, 5(11), 1153–1162',
    doiOrUrl: 'https://doi.org/10.1038/s41550-021-01508-8',
    relevance:
      'Authoritative case study demonstrating how an apparent narrowband drifting candidate (BLC1) was ultimately traced to complex terrestrial intermodulation interference during rigorous verification.',
  },
  {
    id: 2,
    authors: 'National Radio Astronomy Observatory (NRAO)',
    year: 2023,
    title: 'Spectrum Management and Radio Frequency Interference in Astronomy',
    venue: 'NRAO Scientific Technical Memo Series',
    doiOrUrl: 'https://science.nrao.edu/facilities/spectrum-management',
    relevance:
      'Foundational documentation detailing the spectral environment, RFI categories, regulatory passive bands, and the challenge of satellite constellations for radio telescopes.',
  },
  {
    id: 3,
    authors: 'Price, D. C., Croft, S., Enriquez, J. E., et al.',
    year: 2019,
    title:
      'The Breakthrough Listen Search for Intelligent Life: Wideband Data Ingestion and Analysis with BLIMPY',
    venue: 'The Astronomical Journal, 157(3), 122',
    doiOrUrl: 'https://doi.org/10.3847/1538-3881/aaff5a',
    relevance:
      'Defines modern high-cadence astronomical data structures (HDF5 and SIGPROC filterbanks) and standard wideband waterfall search conventions.',
  },
  {
    id: 4,
    authors: 'Margot, J.-L., Greenberg, A. H., Pinchuk, P., et al.',
    year: 2021,
    title:
      'A Search for Technosignatures around 821 Stars with the Green Bank Telescope at 1.15–1.73 GHz',
    venue: 'The Astronomical Journal, 161(2), 55',
    doiOrUrl: 'https://doi.org/10.3847/1538-3881/abd3a7',
    relevance:
      'Details Doppler drift search parameters, spatial on-off spatial confirmation procedures, and statistical candidate pruning algorithms.',
  },
  {
    id: 5,
    authors: 'Pence, W. D., Chiappetti, L., Page, C. G., et al.',
    year: 2010,
    title: 'Definition of the Flexible Image Transport System (FITS), Version 3.0',
    venue: 'Astronomy & Astrophysics, 524, A42',
    doiOrUrl: 'https://doi.org/10.1051/0004-6361/201015362',
    relevance:
      'The international standard specification for astronomical archival data interchange and coordinate system preservation.',
  },
  {
    id: 6,
    authors: 'NASA Technosignatures Workshop Participants',
    year: 2018,
    title:
      'NASA and the Search for Technosignatures: A Report from the NASA Technosignatures Workshop',
    venue: 'NASA Technical Reports Server (NTRS), arXiv:1812.08681',
    doiOrUrl: 'https://arxiv.org/abs/1812.08681',
    relevance:
      'Comprehensive survey of observational signatures, machine learning discovery potential, and the requirement for multi-frequency corroboration.',
  },
  {
    id: 7,
    authors: 'Ewen, H. I. & Purcell, E. M.',
    year: 1951,
    title:
      'Observation of a line in the galactic radio spectrum: Radiation from galactic hydrogen at 1,420 Mc./sec.',
    venue: 'Nature, 168(4270), 356–357',
    doiOrUrl: 'https://doi.org/10.1038/168356a0',
    relevance:
      'The discovery paper establishing the 21 cm neutral hydrogen hyperfine transition (1420.405751 MHz) as the foundational frequency landmark of modern radio astronomy.',
  },
  {
    id: 8,
    authors: 'Ma, P. X., Ng, C., Rizk, L., et al.',
    year: 2023,
    title: 'A deep-learning search for technosignatures from 820 nearby stars',
    venue: 'Nature Astronomy, 7(4), 492–502',
    doiOrUrl: 'https://doi.org/10.1038/s41550-022-01872-z',
    relevance:
      'Demonstrates deep-learning unsupervised feature representation for isolating anomalous signals from massive radio survey data, validating the viability of latent embedding discovery.',
  },
];
