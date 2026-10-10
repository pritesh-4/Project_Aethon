export type ObservationStatus =
  'IDLE' | 'LOADING' | 'ANALYZING' | 'ANOMALY_DETECTED' | 'CANDIDATE_READY';

export type PipelineStageStatus = 'OFFLINE' | 'READY' | 'ACTIVE' | 'COMPLETE' | 'WARNING' | 'ERROR';

export interface ObservationData {
  id: string;
  name: string;
  targetName: string;
  telescope: string;
  frequencyMHz: number | null;
  bandwidthMHz: number | null;
  windowDuration: string | null; // e.g. "00:04:32"
  durationSeconds: number | null;
  signalPowerDbm: number | null;
  noiseFloorDbm: number | null;
  snrDb: number | null;
  rfiRisk: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH' | null;
  driftRateHzPerSec: number | null;
  coordinates: {
    ra: string | null;
    dec: string | null;
  };
  anomaly: {
    indexPercent: number | null;
    knownPatternSimilarityPercent: number | null;
    interferenceProbabilityPercent: number | null;
    persistencePercent: number | null;
    region: {
      timeStartSec: number | null;
      timeEndSec: number | null;
      freqOffsetKHz: number | null;
      bandwidthKHz: number | null;
    } | null;
    classificationLabel: string | null;
  };
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  telemetryNotes: string;
  isDemoMode?: boolean;
}

export interface PipelineState {
  preprocessing: PipelineStageStatus;
  representation: PipelineStageStatus;
  anomalySearch: PipelineStageStatus;
  candidateRanking: PipelineStageStatus;
}
