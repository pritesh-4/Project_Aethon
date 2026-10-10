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
  frequencyMHz: number | null;
  bandwidthKHz: number | null;
  durationSeconds: number | null;
  snrDb: number | null;
  peakPowerDbm: number | null;
  noiseFloorDbm: number | null;
  samplesCount: number | null;
  driftRateHzPerSec: number | null;
  firstDetectedTime: string;
  anomalyStartSec: number | null;
  anomalyEndSec: number | null;
  coordinates: {
    ra: string | null;
    dec: string | null;
  };
  telescope: string | null;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  anomalyIndex: number | null;
  knownPatternSimilarity: number | null;
  interferenceProbability: number | null;
  persistence: number | null;
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
    cosineDistance: number | null;
    divergenceDegree: 'HIGH' | 'MODERATE' | 'LOW' | 'Not evaluated';
  } | null;
  timelineEvents: {
    timeSec: number;
    label: string;
    description: string;
    intensityDbm?: number | null;
  }[];
  flaggedReasons: {
    id: string;
    title: string;
    description: string;
    metric: string;
  }[];
}
