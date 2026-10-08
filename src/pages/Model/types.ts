export type ArchitectureStageId =
  'observation' | 'representation' | 'latent_space' | 'anomaly_detection' | 'candidate';

export interface ArchitectureStageData {
  id: ArchitectureStageId;
  stepNumber: string;
  title: string;
  subtitle: string;
  simpleExplanation: string;
  technicalDetails: {
    mechanism: string;
    inputFormat: string;
    outputFormat: string;
    algorithmSummary: string;
  };
}

export interface FalsePositiveSource {
  id: string;
  title: string;
  origin: string;
  description: string;
  mitigation: string;
}
