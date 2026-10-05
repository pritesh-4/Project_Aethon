export type DiscoveryStage =
  | 'idle'
  | 'observation_loaded'
  | 'preprocessing'
  | 'transform'
  | 'representing'
  | 'searching'
  | 'ranking'
  | 'complete';

export type SearchMode = 'standard' | 'deep';

export type CandidatePriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface DiscoveryObservationMeta {
  id: string;
  name: string;
  format: 'CSV' | 'JSON' | 'FITS' | 'H5';
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
  searchMode: SearchMode;
  freqRangeMinMHz: number;
  freqRangeMaxMHz: number;
  minPersistencePercent: number;
  rfiFilterEnabled: boolean;
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
