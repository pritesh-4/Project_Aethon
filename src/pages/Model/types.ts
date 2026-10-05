export type ModelStageId =
  'observation' | 'preprocessing' | 'transform' | 'representation' | 'anomaly' | 'ranking';

export interface ArchitectureStage {
  id: ModelStageId;
  index: string;
  name: string;
  subtitle: string;
  description: string;
  inputFormat: string;
  outputFormat: string;
  operationalStatus: 'READY' | 'ACTIVE' | 'STANDBY';
  telemetry: {
    label: string;
    value: string;
  }[];
  algorithmDetails: string;
}

export interface FalsePositiveSource {
  id: string;
  name: string;
  origin: string;
  frequencyProfile: string;
  mitigationStrategy: string;
  riskFactor: 'CRITICAL' | 'ELEVATED' | 'NOMINAL';
}

export interface TechnicalDetailSection {
  id: string;
  title: string;
  tag: string;
  summary: string;
  formalDefinition: string;
  equations?: string[];
  parameters: {
    name: string;
    spec: string;
    description: string;
  }[];
}
