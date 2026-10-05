export type CandidatePriority = 'HIGH' | 'MEDIUM' | 'LOW';

export type CandidateStatus = 'REVIEW' | 'INVESTIGATING' | 'CONFIRMED' | 'FLAGGED_RFI' | 'REJECTED';

export interface CandidateSignalData {
  id: string;
  observationId: string;
  targetName: string;
  frequencyMHz: number;
  bandwidthKHz: number;
  durationSeconds: number;
  peakPowerDbm: number;
  snrDb: number;
  driftRateHzPerSec: number;
  firstDetectedTime: string;
  coordinates: {
    ra: string;
    dec: string;
  };
  anomalyIndex: number; // 0.000 to 1.000
  persistence: number; // 0.000 to 1.000
  knownPatternSimilarity: number; // 0.000 to 1.000
  interferenceProbability: number; // 0.000 to 1.000
  priority: CandidatePriority;
  status: CandidateStatus;
  morphology: {
    observedType: string;
    nearestKnownType: string;
    divergenceDegree: 'HIGH' | 'MODERATE' | 'LOW';
    cosineDistance: number;
  };
  evidenceFactors: {
    anomalousStructure: { state: 'HIGH' | 'ELEVATED' | 'NOMINAL'; sigma: number };
    temporalPersistence: { state: 'ELEVATED' | 'NOMINAL' | 'TRANSIENT'; cycles: string };
    knownSimilarity: { state: 'LOW' | 'MODERATE' | 'HIGH'; catalogRef: string };
    rfiEstimate: { state: 'LOW' | 'ELEVATED' | 'HIGH'; probPercent: number };
    frequencyCoherence: { state: 'STABLE' | 'DRIFTING' | 'DISPERSED'; bandwidthStr: string };
  };
  latentCoordinates: {
    x: number; // Normalized -1 to 1 in 2D latent projection
    y: number;
  };
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
