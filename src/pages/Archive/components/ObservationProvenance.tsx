import type { ArchivedObservation } from '../types.ts';
import { Cpu, GitBranch } from 'lucide-react';

export interface ObservationProvenanceProps {
  observation: ArchivedObservation;
}

export function ObservationProvenance({ observation }: ObservationProvenanceProps) {
  return (
    <div className="font-mono text-xs select-none space-y-3">
      {/* 1. Model Versioning & Analytical Provenance */}
      <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] overflow-hidden">
        <div className="border-b border-[#1C2630] bg-[#0B0F14] px-3 py-1.5 text-[10px] text-[#7F8B95] font-medium flex items-center gap-1.5">
          <Cpu className="h-3 w-3 text-[#5BD8F5]" />
          <span>Model provenance</span>
        </div>

        <div className="grid grid-cols-3 divide-x divide-[#1C2630] p-2.5 text-[10px]">
          <div>
            <span className="block text-[8px] text-[#7F8B95]">Model</span>
            <span className="font-medium text-[#E6EDF2] text-[10px]">{observation.modelName}</span>
          </div>

          <div className="pl-3">
            <span className="block text-[8px] text-[#7F8B95]">Version</span>
            <span className="font-medium text-[#5BD8F5] text-[10px]">
              {observation.modelVersion}
            </span>
          </div>

          <div className="pl-3">
            <span className="block text-[8px] text-[#7F8B95]">Analysis mode</span>
            <span className="text-[#E6EDF2] text-[9px]">{observation.analysisMode}</span>
          </div>
        </div>
      </div>

      {/* 2. Observation Execution Provenance */}
      <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] overflow-hidden">
        <div className="border-b border-[#1C2630] bg-[#0B0F14] px-3 py-1.5 text-[10px] text-[#7F8B95] font-medium flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <GitBranch className="h-3 w-3 text-[#5BD8F5]" />
            <span>Execution provenance</span>
          </div>
        </div>

        <div className="p-2.5 space-y-1.5 text-[10px]">
          <div className="flex items-center justify-between">
            <span className="text-[#7F8B95] text-[9px]">Ingested</span>
            <span className="text-[#E6EDF2] tabular-nums font-mono">
              {observation.provenance.ingestedTime}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#7F8B95] text-[9px]">Preprocessed</span>
            <span className="text-[#E6EDF2] tabular-nums font-mono">
              {observation.provenance.preprocessedTime}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#7F8B95] text-[9px]">Analyzed</span>
            <span className="text-[#E6EDF2] tabular-nums font-mono">
              {observation.provenance.analyzedTime}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#7F8B95] text-[9px]">Candidates generated</span>
            <span className="text-[#5BD8F5] font-medium tabular-nums font-mono">
              {observation.provenance.candidatesGeneratedTime}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
