import type { ArchitectureStageData, FalsePositiveSource } from '../types.ts';

export const ARCHITECTURE_STAGES: ArchitectureStageData[] = [
  {
    id: 'observation',
    stepNumber: '01',
    title: 'Observation',
    subtitle: 'Baseband radio ingestion',
    simpleExplanation:
      'Radio telescopes point at celestial coordinates and record continuous streams of electromagnetic radiation. Ingested observations are parsed from standard astronomical filterbank (.fil) or FITS (.fits) formats, calibrating frequency reference channels and time integration steps.',
    technicalDetails: {
      mechanism:
        'Astronomical container parsing and channelization (SIGPROC Filterbank / FITS).',
      inputFormat: 'High-cadence calibrated observational data files (.fil, .fits).',
      outputFormat:
        'Time-frequency power spectral density matrices with verified physical axes.',
      algorithmSummary:
        'Decomposes incoming spectrum into discrete frequency channels and time integration bins with verified start timestamps and channel frequency spacing.',
    },
  },
  {
    id: 'representation',
    stepNumber: '02',
    title: 'Representation',
    subtitle: 'From raw matrices to spectrotemporal features',
    simpleExplanation:
      'Rather than relying on rigid heuristic templates, the system segments the calibrated time-frequency array into bounded analysis windows and computes statistical moment profiles (mean, variance, robust sigma) alongside RFI indicator flags.',
    technicalDetails: {
      mechanism:
        'Bounded sliding window decomposition with robust statistical moment profiling.',
      inputFormat: 'Bounded 2D spectral slice arrays [Time &times; Frequency].',
      outputFormat: 'Extracted statistical feature vectors (median, MAD, skewness, kurtosis, RFI flags).',
      algorithmSummary:
        'Calculates global and local window statistical moments while applying spectral and temporal difference masking to isolate anomalous candidate power.',
    },
  },
  {
    id: 'latent_space',
    stepNumber: '03',
    title: 'Statistical Feature Domain',
    subtitle: 'Characterizing nominal sky background',
    simpleExplanation:
      'Nominal sky observations form a dense statistical baseline governed by thermal receiver noise and cosmic microwave background. Operational anomaly detection measures the statistical distance of each window from this baseline.',
    technicalDetails: {
      mechanism: 'Radiometric noise modeling and feature space distribution analysis.',
      inputFormat: 'Statistical feature vectors extracted from analysis windows.',
      outputFormat: 'Distribution baseline parameters and detector decision thresholds.',
      algorithmSummary:
        'Establishes nominal background distributions using robust estimators resistant to outliers. Note: Planned high-dimensional learned latent manifolds remain a future research track.',
    },
  },
  {
    id: 'anomaly_detection',
    stepNumber: '04',
    title: 'Anomaly Detection',
    subtitle: 'Isolating significant spectral deviations',
    simpleExplanation:
      'Windows that deviate significantly from nominal background distributions produce high anomaly scores. The operational pipeline combines classical radiometric sigma thresholds with an Isolation Forest ensemble.',
    technicalDetails: {
      mechanism: 'Dual-method evaluation: Radiometric statistical thresholding + Isolation Forest.',
      inputFormat: 'Extracted window feature vectors.',
      outputFormat:
        'Bounded anomalous regions with anomaly score &alpha; &in; [0, 1] and detector evidence.',
      algorithmSummary:
        'Flags spectral windows whose power exceeds local thermal baseline thresholds or whose tree isolation depth indicates structural deviation from background statistics.',
    },
  },
  {
    id: 'candidate',
    stepNumber: '05',
    title: 'Candidate Screening',
    subtitle: 'Doppler drift estimation and triage',
    simpleExplanation:
      'An anomaly is not automatically an extraterrestrial discovery. Surviving persistent detections undergo linear Doppler drift rate regression to assess celestial motion consistency, producing prioritized candidates for researcher verification.',
    technicalDetails: {
      mechanism: 'Linear Doppler drift OLS regression and temporal persistence characterization.',
      inputFormat: 'Surviving persistent anomalous spectral regions.',
      outputFormat:
        'Candidate record with fitted drift rate (Hz/s), uncertainty, SNR, and review audit trail.',
      algorithmSummary:
        'Fits frequency trajectory points via ordinary least-squares regression to measure drift rate df/dt. Verifies physical consistency against planetary and orbital acceleration bounds.',
    },
  },
];

export const FALSE_POSITIVE_SOURCES: FalsePositiveSource[] = [
  {
    id: 'interference',
    title: 'Terrestrial & Orbital Interference (RFI)',
    origin: 'Low-Earth orbit satellites (Starlink, GPS) and ground communication towers.',
    description:
      'Human telecommunications are billions of times stronger than cosmic signals. They often produce narrow, coherent frequency spikes that mimic artificial extraterrestrial carriers.',
    mitigation:
      'Statistical spectral indicator masks, flagged channel fractions, and Doppler drift rate boundary checks.',
  },
  {
    id: 'instrumentation',
    title: 'Instrumentation Artifacts',
    origin: 'Cryogenic receiver electronics, local oscillator drift, and digitizer bit-slips.',
    description:
      'Extreme sensitivity means receiver hardware itself can generate momentary frequency glitches, thermal calibration jumps, or internal amplifier resonances.',
    mitigation:
      'Robust MAD baseline normalization, non-finite sample masks, and data quality validation checks.',
  },
  {
    id: 'stochastic',
    title: 'Stochastic Thermal Fluctuations',
    origin:
      'Random Gaussian noise generated by the cosmic microwave background and telescope preamplifiers.',
    description:
      'When observing wide bandwidths over millions of channels, extreme statistical outliers occasionally line up by pure chance, mimicking faint spectral peaks.',
    mitigation:
      'Temporal persistence screening: candidate emissions must maintain coherence across multiple analysis windows rather than isolated transient spikes.',
  },
  {
    id: 'unusual_events',
    title: 'Unusual Natural Astronomical Events',
    origin: 'Solar flare bursts, stellar coronal ejections, and ionospheric scintillation.',
    description:
      'Uncommon natural events can deviate dramatically from nominal baselines without representing technological signals.',
    mitigation:
      'Verifying spectral bandwidth and linear frequency drift consistency against known astrophysical continuum profiles.',
  },
];
