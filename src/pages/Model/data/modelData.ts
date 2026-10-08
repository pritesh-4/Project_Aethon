import type { ArchitectureStageData, FalsePositiveSource } from '../types.ts';

export const ARCHITECTURE_STAGES: ArchitectureStageData[] = [
  {
    id: 'observation',
    stepNumber: '01',
    title: 'Observation',
    subtitle: 'Baseband radio ingestion',
    simpleExplanation:
      'Radio telescopes point at stars and record continuous streams of electromagnetic waves across wide frequency bands. At this stage, the data is raw electrical measurements (voltages) containing faint astronomical signals buried in cosmic background noise.',
    technicalDetails: {
      mechanism:
        'Dual-polarization I/Q voltage sampling and polyphase filterbank (PFB) channelization.',
      inputFormat: 'High-speed analog-to-digital voltage streams (~25.0 MSPS).',
      outputFormat:
        'Channelized frequency bins across calibrated observing bands (e.g., L-band 1420 MHz).',
      algorithmSummary:
        'Polyphase filterbanks decompose the broad incoming bandwidth into fine frequency channels while suppressing spectral leakage between adjacent bins, maintaining 3.8 Hz channel resolution.',
    },
  },
  {
    id: 'representation',
    stepNumber: '02',
    title: 'Representation',
    subtitle: 'From voltages to spectrotemporal features',
    simpleExplanation:
      'Instead of guessing what specific signal shapes to look for, the system translates the continuous radio recording into time-and-frequency snapshots and breaks them into digital tokens that an AI model can analyze mathematically.',
    technicalDetails: {
      mechanism:
        'Short-Time Fourier Transform (STFT) patch decomposition with Blackman-Harris windowing.',
      inputFormat: 'Whitened time-domain channelized power arrays.',
      outputFormat: '2D spectrotemporal patches tokenized into self-supervised embedding vectors.',
      algorithmSummary:
        'Spectral patches are mapped through linear projection and self-attention layers, encoding carrier slope, bandwidth, and temporal continuity into dense vector representations.',
    },
  },
  {
    id: 'latent_space',
    stepNumber: '03',
    title: 'Learned Signal Space',
    subtitle: 'Mapping what the natural sky sounds like',
    simpleExplanation:
      "By training on millions of hours of nominal sky surveys, the AI learns what 'normal' space sounds like. Natural background noise, known pulsars, interstellar clouds, and familiar satellites form recognizable clusters in a mathematical landscape.",
    technicalDetails: {
      mechanism: 'Unsupervised representation manifold in 768-dimensional latent embedding space.',
      inputFormat: 'Patch token embedding vectors.',
      outputFormat: 'Latent coordinates within learned Gaussian mixture background distributions.',
      algorithmSummary:
        'Deep autoencoders learn compact manifolds of natural radio phenomena. Signals sharing spectrotemporal morphology cluster closely, while atypical structures occupy unpopulated regions.',
    },
  },
  {
    id: 'anomaly_detection',
    stepNumber: '04',
    title: 'Anomaly Detection',
    subtitle: 'Spotting what does not fit the background',
    simpleExplanation:
      'When new data arrives, the AI tests how well it can explain the signal using the natural patterns it already knows. If a signal cannot be reconstructed from known natural distributions, it produces a high error score — signaling that something does not fit.',
    technicalDetails: {
      mechanism: 'Reconstruction residual calculation and geodesic latent distance evaluation.',
      inputFormat: 'Target latent vector z ∈ ℝ⁷⁶⁸ and observation patch.',
      outputFormat:
        'Scalar anomaly index α ∈ [0, 1] and statistical deviance metric (+σ residual).',
      algorithmSummary:
        'Anomaly scoring combines variational reconstruction loss (Δ > 4.8σ above thermal noise) with Mahalanobis distance from nearest cataloged natural clusters.',
    },
  },
  {
    id: 'candidate',
    stepNumber: '05',
    title: 'Candidate',
    subtitle: 'Screening and prioritizing for astronomers',
    simpleExplanation:
      'A mathematical outlier is not automatically a discovery. AETHON checks whether the anomaly persists across multiple telescope pointings, verifies whether it exhibits Doppler drift from celestial motion, and packages surviving signals for astronomer investigation.',
    technicalDetails: {
      mechanism: 'Multi-beam spatial screening and topocentric Doppler drift consistency.',
      inputFormat: 'Surviving persistent anomaly detections.',
      outputFormat:
        'Prioritized candidate profile with spatial rejection scores and triage metadata.',
      algorithmSummary:
        'Comparing simultaneous on-target and off-target beams eliminates terrestrial interference. Surviving signals exhibiting linear Doppler drift consistent with celestial acceleration are queued for astronomer triage.',
    },
  },
];

export const FALSE_POSITIVE_SOURCES: FalsePositiveSource[] = [
  {
    id: 'interference',
    title: 'Terrestrial & Orbital Interference (RFI)',
    origin: 'Low-Earth orbit satellites (Starlink, GPS) and ground communication towers.',
    description:
      'Human telecommunications are billions of times stronger than cosmic signals. They often produce narrow, coherent frequency spikes that look artificial because they are artificial.',
    mitigation:
      'Spatial multi-beam differencing (signals present in both on-target and off-target beams are rejected) and cross-matching against satellite orbital tracking databases.',
  },
  {
    id: 'instrumentation',
    title: 'Instrumentation Artifacts',
    origin: 'Cryogenic receiver electronics, local oscillator drift, and digitizer bit-slips.',
    description:
      'Extreme sensitivity means receiver hardware itself can generate momentary frequency glitches, thermal calibration jumps, or internal amplifier resonances.',
    mitigation:
      'Periodic noise-diode calibration, hardware health telemetry cross-checks, and dual-polarization consistency validation.',
  },
  {
    id: 'stochastic',
    title: 'Stochastic Thermal Fluctuations',
    origin:
      'Random Gaussian noise generated by the cosmic microwave background and telescope preamplifiers.',
    description:
      'When observing petabytes of random noise over billions of channels, extreme statistical outliers occasionally line up by pure chance, mimicking faint spectral peaks.',
    mitigation:
      'Cadence persistence screening: astronomical candidates must maintain phase coherence across multiple consecutive observation pointings.',
  },
  {
    id: 'unusual_events',
    title: 'Unusual Natural Astronomical Events',
    origin: 'Solar flare bursts, stellar coronal ejections, and ionospheric scintillation.',
    description:
      'Uncommon natural events can deviate dramatically from nominal baselines without representing technological signals.',
    mitigation:
      'Cross-referencing real-time solar monitors and verifying spectral dispersion against interstellar medium electron density models.',
  },
];
