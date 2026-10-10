export type DiscoveryStage = 'idle' | 'prepare' | 'represent' | 'search' | 'rank' | 'complete';

export type SearchSensitivity = 'standard' | 'high';

export type CandidatePriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface DiscoveryObservationMeta {
  id: string;
  name: string;
  format: 'FITS' | 'FIL' | 'SYNTHETIC' | string;
  samplesCount: number | null;
  durationString: string | null;
  bandwidthMHz: number | null;
  frequencyMHz: number | null;
  telescope: string | null;
  fileSizeBytes: number;
  coordinates: {
    ra: string | null;
    dec: string | null;
  };
}

export interface SearchConfig {
  sensitivity: SearchSensitivity;
  rejectTerrestrialRfi: boolean;
}

export interface DiscoveredCandidate {
  rank: number;
  localId: string;
  id: string;
  persistedCandidateId?: string | null;
  detectionId?: string | null;
  observationId: string;
  targetName: string;
  frequencyMHz: number | null;
  bandwidthKHz: number | null;
  snrDb: number | null;
  driftRateHzPerSec: number | null;
  anomalyIndex: number | null;
  persistence: number | null;
  knownSimilarity: number | null;
  rfiRisk: number | null;
  priority: CandidatePriority;
  targetRegion: {
    time_start: number;
    time_stop: number;
    freq_start: number;
    freq_stop: number;
  };
  physicalCoordinates?: {
    freq_center_hz?: number | null;
    bandwidth_hz?: number | null;
    time_center_s?: number | null;
    duration_s?: number | null;
  } | null;
  explanation: {
    latentResidualSigma: number | null;
    spatialRejectionScore: number | null;
    persistenceReason: string;
  };
}

export interface DiscoveryResultSummary {
  observationId: string;
  samplesAnalyzed: number | null;
  anomalousRegionsCount: number;
  highPriorityCandidatesCount: number;
  totalTimeElapsedSec: number;
  topCandidate: DiscoveredCandidate;
  candidates: DiscoveredCandidate[];
}
