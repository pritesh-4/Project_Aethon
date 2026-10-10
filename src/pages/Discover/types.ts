export type DiscoveryStage = 'idle' | 'prepare' | 'represent' | 'search' | 'rank' | 'complete';

export type SearchSensitivity = 'standard' | 'high';

export type CandidatePriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface DiscoveryObservationMeta {
  id: string;
  name: string;
  format: 'CSV' | 'JSON' | 'FITS' | 'H5' | 'FIL' | 'SYNTHETIC' | string;
  samplesCount: number;
  durationString: string;
  bandwidthMHz: number;
  frequencyMHz: number;
  telescope: string;
  fileSizeBytes: number;
  coordinates: {
    ra: string;
    dec: string;
  };
}

export interface SearchConfig {
  sensitivity: SearchSensitivity;
  rejectTerrestrialRfi: boolean;
}

export interface DiscoveredCandidate {
  rank: number;
  id: string;
  targetName: string;
  frequencyMHz: number;
  bandwidthKHz: number;
  snrDb: number;
  driftRateHzPerSec: number;
  anomalyIndex: number;
  persistence: number;
  knownSimilarity: number;
  rfiRisk: number;
  priority: CandidatePriority;
  explanation: {
    latentResidualSigma: number;
    spatialRejectionScore: number;
    persistenceReason: string;
  };
}

export interface DiscoveryResultSummary {
  observationId: string;
  samplesAnalyzed: number;
  anomalousRegionsCount: number;
  highPriorityCandidatesCount: number;
  totalTimeElapsedSec: number;
  topCandidate: DiscoveredCandidate;
  candidates: DiscoveredCandidate[];
}
