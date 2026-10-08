import type { ArchivedObservation } from '../types.ts';
import { Cpu, GitBranch } from 'lucide-react';

export interface ObservationProvenanceProps {
  observation: ArchivedObservation;
}

export function ObservationProvenance({ observation }: ObservationProvenanceProps) {
  return (
    <div className="text-xs select-none space-y-3 font-sans">
      {/* 1. Model Versioning & Analytical Provenance */}
      <div className="rounded-[3px] border border-[#D6D2C9] bg-[#FAF8F5] overflow-hidden shadow-xs">
        <div className="border-b border-[#D6D2C9] bg-[#EAE7E0] px-3.5 py-2 text-[11px] text-[#17202A] font-semibold flex items-center gap-1.5">
          <Cpu className="h-3.5 w-3.5 text-[#376A9B]" />
          <span>Model provenance</span>
        </div>

        <div className="grid grid-cols-3 divide-x divide-[#D6D2C9] p-3 text-xs">
          <div>
            <span className="block text-[11px] text-[#56616A]">Model architecture</span>
            <span className="font-semibold text-[#17202A]">{observation.modelName}</span>
          </div>

          <div className="pl-3">
            <span className="block text-[11px] text-[#56616A]">Version</span>
            <span className="font-mono text-[#376A9B] font-semibold">
              {observation.modelVersion}
            </span>
          </div>

          <div className="pl-3">
            <span className="block text-[11px] text-[#56616A]">Analysis mode</span>
            <span className="text-[#17202A]">{observation.analysisMode}</span>
          </div>
        </div>
      </div>

      {/* 2. Observation Execution Provenance */}
      <div className="rounded-[3px] border border-[#D6D2C9] bg-[#FAF8F5] overflow-hidden shadow-xs">
        <div className="border-b border-[#D6D2C9] bg-[#EAE7E0] px-3.5 py-2 text-[11px] text-[#17202A] font-semibold flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <GitBranch className="h-3.5 w-3.5 text-[#376A9B]" />
            <span>Execution timeline</span>
          </div>
        </div>

        <div className="p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#56616A]">Ingested</span>
            <span className="text-[#17202A] tabular-nums font-mono">
              {observation.provenance.ingestedTime}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#56616A]">Preprocessed</span>
            <span className="text-[#17202A] tabular-nums font-mono">
              {observation.provenance.preprocessedTime}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#56616A]">Analyzed</span>
            <span className="text-[#17202A] tabular-nums font-mono">
              {observation.provenance.analyzedTime}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[#56616A]">Candidates generated</span>
            <span className="text-[#376A9B] tabular-nums font-mono font-semibold">
              {observation.provenance.candidatesGeneratedTime}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
