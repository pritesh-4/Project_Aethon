import type { ArchivedObservation } from '../types.ts';
import { Cpu, GitBranch } from 'lucide-react';

export interface ObservationProvenanceProps {
  observation: ArchivedObservation;
}

export function ObservationProvenance({ observation }: ObservationProvenanceProps) {
  return (
    <div className="text-xs select-none space-y-3">
      {/* 1. Model Versioning & Analytical Provenance */}
      <div className="rounded-[2px] border border-[#242825] bg-[#101211] overflow-hidden">
        <div className="border-b border-[#242825] bg-[#141715] px-3 py-1.5 text-[11px] text-[#9A9C96] font-medium flex items-center gap-1.5">
          <Cpu className="h-3 w-3 text-[#D4864A]" />
          <span>Model provenance</span>
        </div>

        <div className="grid grid-cols-3 divide-x divide-[#242825] p-2.5 text-[11px]">
          <div>
            <span className="block text-[10px] text-[#666963]">Model architecture</span>
            <span className="font-medium text-[#E6E4DD]">{observation.modelName}</span>
          </div>

          <div className="pl-3">
            <span className="block text-[10px] text-[#666963]">Version</span>
            <span className="font-mono text-[#D4864A]">{observation.modelVersion}</span>
          </div>

          <div className="pl-3">
            <span className="block text-[10px] text-[#666963]">Analysis mode</span>
            <span className="text-[#C9C8C0]">{observation.analysisMode}</span>
          </div>
        </div>
      </div>

      {/* 2. Observation Execution Provenance */}
      <div className="rounded-[2px] border border-[#242825] bg-[#101211] overflow-hidden">
        <div className="border-b border-[#242825] bg-[#141715] px-3 py-1.5 text-[11px] text-[#9A9C96] font-medium flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <GitBranch className="h-3 w-3 text-[#D4864A]" />
            <span>Execution timeline</span>
          </div>
        </div>

        <div className="p-2.5 space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="text-[#666963]">Ingested</span>
            <span className="text-[#E6E4DD] tabular-nums font-mono">
              {observation.provenance.ingestedTime}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#666963]">Preprocessed</span>
            <span className="text-[#E6E4DD] tabular-nums font-mono">
              {observation.provenance.preprocessedTime}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#666963]">Analyzed</span>
            <span className="text-[#E6E4DD] tabular-nums font-mono">
              {observation.provenance.analyzedTime}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#666963]">Candidates generated</span>
            <span className="text-[#D4864A] tabular-nums font-mono">
              {observation.provenance.candidatesGeneratedTime}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
