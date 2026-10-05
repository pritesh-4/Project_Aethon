export type ObservationStatus =
  'IDLE' | 'LOADING' | 'ANALYZING' | 'ANOMALY_DETECTED' | 'CANDIDATE_READY';

export type PipelineStageStatus = 'OFFLINE' | 'READY' | 'ACTIVE' | 'COMPLETE' | 'WARNING' | 'ERROR';

export interface ObservationData {
  id: string;
  name: string;
  targetName: string;
  telescope: string;
  frequencyMHz: number;
  bandwidthMHz: number;
  windowDuration: string; // e.g. "00:04:32"
  durationSeconds: number;
  signalPowerDbm: number;
  noiseFloorDbm: number;
  snrDb: number;
  rfiRisk: 'LOW' | 'MODERATE' | 'ELEVATED' | 'HIGH';
  driftRateHzPerSec: number;
  coordinates: {
    ra: string;
    dec: string;
  };
  anomaly: {
    indexPercent: number;
    knownPatternSimilarityPercent: number;
    interferenceProbabilityPercent: number;
    persistencePercent: number;
    region: {
      timeStartSec: number;
      timeEndSec: number;
      freqOffsetKHz: number;
      bandwidthKHz: number;
    };
    classificationLabel: string;
  };
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  telemetryNotes: string;
}

export interface PipelineState {
  preprocessing: PipelineStageStatus;
  representation: PipelineStageStatus;
  anomalySearch: PipelineStageStatus;
  candidateRanking: PipelineStageStatus;
}
