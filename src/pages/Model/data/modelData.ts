import type { ArchitectureStage, FalsePositiveSource, TechnicalDetailSection } from '../types.ts';

export const ARCHITECTURE_STAGES: ArchitectureStage[] = [
  {
    id: 'observation',
    index: '01',
    name: 'OBSERVATION',
    subtitle: 'Baseband Radio Ingestion',
    description:
      'Raw astronomical radio measurements enter the pipeline as high-cadence voltage streams from single-dish or interferometric radio apertures.',
    inputFormat: 'Raw Dual-Polarization Complex Voltages (I/Q)',
    outputFormat: 'Channelized Baseband Buffer (25.0 MSPS)',
    operationalStatus: 'READY',
    telemetry: [
      { label: 'BANDWIDTH', value: '12.5 MHz' },
      { label: 'SYSTEM TEMP', value: '18.4 K' },
      { label: 'POLARIZATION', value: 'Dual Circular (LCP/RCP)' },
      { label: 'BUFFER DEPTH', value: '4 × 68s Cadences' },
    ],
    algorithmDetails:
      'Direct digitized sampling across calibrated receiver sub-bands. Polyphase filterbanks split the high-speed Nyquist telemetry into individual fine analysis bins.',
  },
  {
    id: 'preprocessing',
    index: '02',
    name: 'PREPROCESSING',
    subtitle: 'Signal Conditioning & Normalization',
    description:
      'Signal conditioning prepares the observation for downstream representation and screening by mitigating stationary thermal noise and baseline spectral curvature.',
    inputFormat: 'Channelized Raw Voltage Arrays',
    outputFormat: 'Whitened, Zero-Mean Spectral Power Arrays',
    operationalStatus: 'READY',
    telemetry: [
      { label: 'NORMALIZATION', value: 'Running Median Subtraction' },
      { label: 'NOISE MODEL', value: 'Johnson-Nyquist Baseline' },
      { label: 'RFI MASKING', value: 'Dynamic Spectral Kurtosis' },
      { label: 'DYNAMIC RANGE', value: '64 dB Calibrated' },
    ],
    algorithmDetails:
      'Robust spectral whitening eliminates non-linear receiver bandpass shape without attenuating localized spectral narrowness.',
  },
  {
    id: 'transform',
    index: '03',
    name: 'TIME–FREQUENCY',
    subtitle: 'Spectrotemporal Decomposition',
    description:
      'The signal is represented across temporal and frequency dimensions simultaneously, ensuring that drift velocity, cadence transitions, and phase coherence become observable.',
    inputFormat: 'Conditioned Time-Domain Samples',
    outputFormat: 'Dynamic Spectrogram Waterfalls (Time × Freq × Intensity)',
    operationalStatus: 'READY',
    telemetry: [
      { label: 'TRANSFORM', value: 'Short-Time Fourier Transform (STFT)' },
      { label: 'WINDOW FUNCTION', value: 'Blackman-Harris 7-Term' },
      { label: 'FREQ RESOLUTION', value: '3.81 Hz / channel' },
      { label: 'TIME CADENCE', value: '0.262 s / integration' },
    ],
    algorithmDetails:
      '2D spectrotemporal representation exposes chirp patterns, linear Doppler drift slopes, and intermittent pulsed carriers that cannot be resolved in either time or frequency alone.',
  },
  {
    id: 'representation',
    index: '04',
    name: 'REPRESENTATION',
    subtitle: 'Feature Space Projection',
    description:
      'The observation is transformed into a compact numerical representation capturing structural, morphological, and temporal characteristics of the radio signature.',
    inputFormat: 'Spectrotemporal Waterfall Patches (N × M)',
    outputFormat: 'Dense Feature Embedding Vector z ∈ ℝ⁵¹²',
    operationalStatus: 'READY',
    telemetry: [
      { label: 'EMBEDDING DIM', value: '512 Dimensions' },
      { label: 'PROJECTION', value: 'Self-Supervised Spectral Encoder' },
      { label: 'METRIC SPACE', value: 'Unit Hypersphere (Cosine Metric)' },
      { label: 'INVARIANCE', value: 'Doppler Drift & Time Shift Invariant' },
    ],
    algorithmDetails:
      'Transforms unstructured high-dimensional spectrogram patches into a geometrically consistent latent manifold where pattern similarity correlates with morphological resonance.',
  },
  {
    id: 'anomaly',
    index: '05',
    name: 'ANOMALY ANALYSIS',
    subtitle: 'Deviation Evaluation',
    description:
      'The representation is evaluated for deviation from learned or expected structures. Anomaly scores quantify distance from nominal background noise and learned catalog profiles.',
    inputFormat: 'Latent Embedding Vector z',
    outputFormat: 'Anomaly Index α ∈ [0.0, 1.0] + Residual Divergence',
    operationalStatus: 'READY',
    telemetry: [
      { label: 'DISTANCE METRIC', value: 'Cosine & Mahalanobis Distance' },
      { label: 'BACKGROUND DISTRIBUTION', value: 'Astrophysical Noise Manifold' },
      { label: 'PRIMARY CANDIDATE', value: 'AET-04721 (Index 0.947)' },
      { label: 'REFERENCE DRIFT', value: '-0.32 Hz/s Coherence' },
    ],
    algorithmDetails:
      'Calculates reconstruction residuals and density divergence against reference clusters of known natural emissions (pulsars, masers, quasars) and common terrestrial RFI profiles.',
  },
  {
    id: 'ranking',
    index: '06',
    name: 'CANDIDATE RANKING',
    subtitle: 'Prioritization & Triage',
    description:
      'Anomalous observations are prioritized for subsequent investigation based on anomaly severity, temporal persistence across cadences, and low estimated interference risk.',
    inputFormat: 'Multi-Parameter Evidence Tensor',
    outputFormat: 'Triage Priority Rank (CRITICAL / HIGH / MEDIUM / LOW)',
    operationalStatus: 'READY',
    telemetry: [
      { label: 'PRIORITY FORMULA', value: 'Weighted Multi-Factor Fusion' },
      { label: 'ALERT QUEUE', value: 'Active Scientific Review Triage' },
      { label: 'GATEWAY', value: 'Human-in-the-Loop Gateway' },
      { label: 'PERSISTENCE WEIGHT', value: '0.25 × Persistence Factor' },
    ],
    algorithmDetails:
      'Surfaces only those high-divergence anomalies that maintain temporal coherence and lack correlating signatures in simultaneous off-target reference beams.',
  },
];

export const FALSE_POSITIVE_SOURCES: FalsePositiveSource[] = [
  {
    id: 'fp-1',
    name: 'RADIO-FREQUENCY INTERFERENCE (RFI)',
    origin: 'LEO Constellations, Geostationary Transponders, 5G Radar',
    frequencyProfile: 'Pervasive narrowband chirps, phase shifts, harmonic sidebands',
    mitigationStrategy:
      'Spatial beam differencing (ON/OFF target pointing) & topocentric Doppler acceleration filtering.',
    riskFactor: 'CRITICAL',
  },
  {
    id: 'fp-2',
    name: 'INSTRUMENTAL ARTEFACTS',
    origin: 'Receiver Non-Linearities, Mixer Inter-Modulation, Clock Jitter',
    frequencyProfile:
      'Fixed-frequency spur lines at local oscillator harmonics and digitizer intermodulation products',
    mitigationStrategy:
      'Automated cross-referencing against internal telescope hardware spur catalogues and periodic frequency combs.',
    riskFactor: 'ELEVATED',
  },
  {
    id: 'fp-3',
    name: 'STOCHASTIC NOISE PEAKS',
    origin: 'Thermal Johnson-Nyquist Noise & Cryogenic LNA Fluctuations',
    frequencyProfile:
      'Gaussian power distribution with occasional 4-sigma to 5-sigma statistical outliers',
    mitigationStrategy:
      'Multi-cadence temporal persistence testing; true signals must survive consecutive ON-target observation cycles.',
    riskFactor: 'ELEVATED',
  },
  {
    id: 'fp-4',
    name: 'TRANSIENT DISTURBANCES',
    origin: 'Solar Coronal Bursts, Lightning (Sferics), Ionospheric Scintillation',
    frequencyProfile: 'Broadband sweeps with steep frequency dispersion slopes',
    mitigationStrategy:
      'Dispersion measure (DM) curve analysis and cross-band bandwidth thresholds.',
    riskFactor: 'NOMINAL',
  },
  {
    id: 'fp-5',
    name: 'DATA QUALITY ISSUES',
    origin: 'Dropped UDP Network Packets, DMA Buffer Overflows, Buffer Underruns',
    frequencyProfile: 'Discontinuous phase gaps and periodic zero-amplitude spectral strips',
    mitigationStrategy:
      'Hardware packet-counter telemetry validation and automated zero-byte frame invalidation.',
    riskFactor: 'NOMINAL',
  },
];

export const TECHNICAL_SECTIONS: TechnicalDetailSection[] = [
  {
    id: 'tech-1',
    title: 'Data Representation & Calibration',
    tag: 'SPECTRAL TELEMETRY',
    summary:
      'Mathematical transformation of complex baseband receiver voltages into calibrated spectrotemporal density matrices.',
    formalDefinition:
      'Given an antenna voltage time series x(t) = I(t) + jQ(t), the discrete Short-Time Fourier Transform (STFT) with temporal window w(m) is computed as X(m, k) = ∑_{n=0}^{N-1} x(mR + n) w(n) e^{-j 2π n k / N}, where R is the hop size and N is the channelization order.',
    equations: [
      'X(m, k) = \\sum_{n=0}^{N-1} x(mR + n) w(n) e^{-j 2\\pi n k / N}',
      'S(m, k) = |X(m, k)|^2 / (\\text{Median}_{m}[|X(m, k)|^2])',
    ],
    parameters: [
      {
        name: 'Channel Resolution',
        spec: '3.81 Hz',
        description: 'Fine spectral bin width for resolving monochromatic coherent carriers',
      },
      {
        name: 'Window Function',
        spec: 'Blackman-Harris 7-Term',
        description: 'Maximizes sidelobe suppression to -92 dB, minimizing spectral leakage',
      },
      {
        name: 'Integration Period',
        spec: '0.262 seconds',
        description: 'Balances temporal resolution against thermal SNR accumulation',
      },
    ],
  },
  {
    id: 'tech-2',
    title: 'Feature Space & Embedding Manifold',
    tag: 'LATENT ENCODING',
    summary:
      'Unsupervised projection of spectrogram patches into a 512-dimensional hyperspherical latent space.',
    formalDefinition:
      'The encoder network f_θ maps a spectrotemporal patch S ∈ ℝ^{T × F} to a normalized latent vector z = f_θ(S) / ||f_θ(S)||_2 ∈ 𝕊^{D-1}. The latent geometry preserves spatial relationships such that cosine similarity cos(z_i, z_j) = z_i^T z_j correlates with structural morphologic congruence.',
    equations: [
      'z = \\frac{f_\\theta(S)}{\\|f_\\theta(S)\\|_2} \\in \\mathbb{S}^{511}',
      'd_{\\text{cosine}}(z_i, z_j) = 1 - z_i^T z_j',
    ],
    parameters: [
      {
        name: 'Latent Dimension',
        spec: '512 floats',
        description: 'Sufficient capacity to encode harmonic structure, bandwidth, and drift slope',
      },
      {
        name: 'Invariance Formulation',
        spec: 'Doppler-invariant kernel',
        description: 'Signal representations remain stable across linear Doppler drifts',
      },
      {
        name: 'Projection Topology',
        spec: 'Normalized Hypersphere',
        description: 'Enforces bounded distances and prevents energy-based magnitude distortion',
      },
    ],
  },
  {
    id: 'tech-3',
    title: 'Anomaly Formulation & Divergence Calculation',
    tag: 'ANOMALY DETECTOR',
    summary:
      'Quantitative measurement of structural deviation from the learned background distribution of astrophysical noise.',
    formalDefinition:
      'The anomaly index α(z) combines minimum cosine distance to the nearest known astrophysical cluster centroid μ_c with density-based local outlier factor (LOF): α(z) = w_1 (1 - \\max_c z^T μ_c) + w_2 (\\text{LOF}(z) / \\text{LOF}_{\\text{ref}}). High α signifies both structural divergence and isolated manifold location.',
    equations: [
      '\\alpha(z) = \\lambda_1 (1 - \\max_c z^T \\mu_c) + \\lambda_2 \\text{Residual}(z)',
      '\\text{Residual}(z) = \\|z - g_\\phi(f_\\theta(z))\\|_2^2',
    ],
    parameters: [
      {
        name: 'Divergence Threshold',
        spec: '0.750',
        description: 'Points exceeding this index are routed to the candidate triage queue',
      },
      {
        name: 'Reference Clusters',
        spec: '24 cataloged classes',
        description: 'Natural pulsars, masers, flare stars, fast radio bursts, and known RFI',
      },
      {
        name: 'Persistence Gate',
        spec: '≥ 3 / 4 ON-cycles',
        description: 'Observation must persist across independent pointing beam cycles',
      },
    ],
  },
  {
    id: 'tech-4',
    title: 'Candidate Prioritization & Ranking Engine',
    tag: 'TRIAGE PROTOCOL',
    summary:
      'Composite multi-factor ranking algorithm prioritizing candidate signals for human scientific follow-up.',
    formalDefinition:
      'Priority score P = w_α α + w_p P_{\\text{persist}} + w_s \\min(1.0, \\text{SNR} / 25) + w_{\\text{RFI}} (1 - P_{\\text{RFI}}), where weights w = [0.35, 0.25, 0.25, 0.15] enforce that high priority requires both unusual structure and physical observational persistence.',
    equations: [
      'P = 0.35 \\alpha + 0.25 P_{\\text{persist}} + 0.25 \\min(1.0, \\text{SNR}/25) + 0.15(1 - P_{\\text{RFI}})',
    ],
    parameters: [
      {
        name: 'CRITICAL Priority',
        spec: 'P ≥ 0.850',
        description: 'Immediate alert trigger for secondary telescope verification queue',
      },
      {
        name: 'HIGH Priority',
        spec: '0.700 ≤ P < 0.850',
        description: 'Candidate prioritized for detailed human researcher review',
      },
      {
        name: 'MEDIUM Priority',
        spec: '0.500 ≤ P < 0.700',
        description: 'Candidate archived with observational flags for batch retrospective analysis',
      },
    ],
  },
];
