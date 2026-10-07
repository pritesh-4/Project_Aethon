export type SignalViewMode = 'SPECTROGRAM' | 'WAVEFORM' | 'INTENSITY';

export type AnalysisStageId = 'observation' | 'representation' | 'comparison' | 'anomaly';

export type PipelineStageId =
  'observation' | 'preprocessing' | 'transform' | 'representation' | 'anomaly' | 'candidate_score';

export type InvestigationState =
  'unreviewed' | 'investigating' | 'verified_anomaly' | 'flagged_rfi';

export interface SignalAnalysisRecord {
  candidateId: string;
  observationId: string;
  targetName: string;
  frequencyMHz: number;
  bandwidthKHz: number;
  durationSeconds: number;
  snrDb: number;
  peakPowerDbm: number;
  noiseFloorDbm: number;
  samplesCount: number;
  driftRateHzPerSec: number;
  firstDetectedTime: string;
  anomalyStartSec: number;
  anomalyEndSec: number;
  coordinates: {
    ra: string;
    dec: string;
  };
  telescope: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  anomalyIndex: number;
  knownPatternSimilarity: number;
  interferenceProbability: number;
  persistence: number;
  classificationTaxonomy: string;
  morphology: {
    temporalCoherence: 'HIGH' | 'MODERATE' | 'LOW';
    frequencyStability: 'HIGH' | 'MODERATE' | 'DRIFTING';
    bandwidthCategory: 'NARROWBAND' | 'MODERATE' | 'BROADBAND';
    persistenceState: 'HIGH' | 'MODERATE' | 'TRANSIENT';
    morphologicalDeviation: 'HIGH' | 'MODERATE' | 'LOW';
    description: string;
  };
  comparison: {
    observedSignature: string;
    nearestKnownPattern: string;
    catalogReference: string;
    cosineDistance: number;
    divergenceDegree: 'HIGH' | 'MODERATE' | 'LOW';
  };
  timelineEvents: {
    timeSec: number;
    label: string;
    description: string;
    intensityDbm: number;
  }[];
  flaggedReasons: {
    id: string;
    title: string;
    description: string;
    metric: string;
  }[];
}
