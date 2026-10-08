export type ImplementationCategory = 'implemented' | 'prototype' | 'target' | 'future';

export interface ImplementationItem {
  component: string;
  category: ImplementationCategory;
  categoryLabel: string;
  scope: string;
  evidence: string;
  notes: string;
}

export interface ArchitectureStage {
  id: string;
  number: string;
  name: string;
  layer: 'Observational' | 'Signal Processing' | 'Machine Learning' | 'Scientific Interface';
  input: string;
  operation: string;
  output: string;
  purpose: string;
  status:
    'Implemented (Frontend Prototype)' | 'Target Backend Architecture' | 'Planned Integration';
}

export interface CandidateLifecycleStage {
  step: string;
  title: string;
  description: string;
  criteria: string;
  outcome: string;
}

export interface DataFormatSpec {
  extension: string;
  name: string;
  role: string;
  status: 'Prototype Simulated' | 'Target Native Support' | 'Interchange Only';
  strengths: string;
  caveat: string;
}

export interface EvaluationBaseline {
  name: string;
  type: string;
  mechanism: string;
  roleInEvaluation: string;
}

export interface ReferenceItem {
  id: number;
  authors: string;
  year: number;
  title: string;
  venue: string;
  doiOrUrl?: string;
  relevance: string;
}

export interface TableOfContentsEntry {
  id: string;
  number: string;
  title: string;
  purpose: string;
}
