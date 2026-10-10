export type CandidatePriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type CandidateStatus = 'REVIEW' | 'INVESTIGATING' | 'CONFIRMED' | 'FLAGGED_RFI' | 'REJECTED';

export interface CandidateSignalData {
  id: string;
  observationId: string;
  targetName: string;
  frequencyMHz: number | null;
  bandwidthKHz: number | null;
  durationSeconds: number | null;
  peakPowerDbm: number | null;
  snrDb: number | null;
  driftRateHzPerSec: number | null;
  firstDetectedTime: string;
  coordinates: {
    ra: string | null;
    dec: string | null;
  };
  targetRegion?: {
    time_start: number;
    time_stop: number;
    freq_start: number;
    freq_stop: number;
  } | null;
  anomalyIndex: number | null; // 0.000 to 1.000
  persistence: number | null; // 0.000 to 1.000
  knownPatternSimilarity: number | null; // 0.000 to 1.000
  interferenceProbability: number | null; // 0.000 to 1.000
  priority: CandidatePriority;
  status: CandidateStatus;
  morphology: {
    observedType: string;
    nearestKnownType: string;
    divergenceDegree: 'HIGH' | 'MODERATE' | 'LOW';
    cosineDistance: number | null;
  };
  evidenceFactors: {
    anomalousStructure: { state: 'HIGH' | 'ELEVATED' | 'NOMINAL'; sigma: number | null };
    temporalPersistence: { state: 'ELEVATED' | 'NOMINAL' | 'TRANSIENT'; cycles: string };
    knownSimilarity: { state: 'LOW' | 'MODERATE' | 'HIGH'; catalogRef: string };
    rfiEstimate: { state: 'LOW' | 'ELEVATED' | 'HIGH'; probPercent: number | null };
    frequencyCoherence: { state: 'STABLE' | 'DRIFTING' | 'DISPERSED'; bandwidthStr: string };
  };
  latentCoordinates: {
    x: number; // Normalized -1 to 1 in 2D latent projection
    y: number;
  } | null;
  notes: string;
}

export interface CandidateObservationSummary {
  observationId: string;
  targetName: string;
  samplesCount: number;
  anomalousRegionsCount: number;
  highPriorityCount: number;
  mediumPriorityCount: number;
  lowPriorityCount: number;
  durationString: string;
  centerFrequencyMHz: number;
  bandwidthMHz: number;
  telescope: string;
}

export interface CandidateFilterState {
  searchQuery: string;
  priorityFilter: 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW';
  sortBy: 'priority' | 'anomalyIndex' | 'snr' | 'frequency' | 'persistence';
  rfiFilter: 'ALL' | 'LOW' | 'MODERATE';
}
