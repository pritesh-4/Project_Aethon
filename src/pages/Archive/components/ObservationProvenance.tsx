import type { ArchivedObservation } from '../types.ts';
import { Cpu, GitBranch } from 'lucide-react';

export interface ObservationProvenanceProps {
  observation: ArchivedObservation;
}

export function ObservationProvenance({ observation }: ObservationProvenanceProps) {
  return (
    <div className="font-mono text-xs select-none space-y-3">
      {/* 1. Model Versioning & Analytical Provenance */}
      <div className="rounded-[2px] border border-slate-800/80 bg-[#05070A] overflow-hidden">
        <div className="border-b border-slate-800/80 bg-[#0A0E13] px-3 py-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
          <Cpu className="h-3 w-3 text-[#66E3FF]" />
          <span>MODEL PROVENANCE</span>
        </div>

        <div className="grid grid-cols-3 divide-x divide-slate-800/60 p-2.5 text-[10px]">
          <div>
            <span className="block text-[8px] uppercase tracking-wider text-slate-500">MODEL</span>
            <span className="font-bold text-[#EAF4F7] tracking-wider text-[10px]">
              {observation.modelName}
            </span>
          </div>

          <div className="pl-3">
            <span className="block text-[8px] uppercase tracking-wider text-slate-500">
              VERSION
            </span>
            <span className="font-bold text-[#66E3FF] tracking-wider text-[10px]">
              {observation.modelVersion}
            </span>
          </div>

          <div className="pl-3">
            <span className="block text-[8px] uppercase tracking-wider text-slate-500">
              ANALYSIS MODE
            </span>
            <span className="text-[#EAF4F7] tracking-wider text-[9px]">
              {observation.analysisMode}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Observation Execution Provenance */}
      <div className="rounded-[2px] border border-slate-800/80 bg-[#05070A] overflow-hidden">
        <div className="border-b border-slate-800/80 bg-[#0A0E13] px-3 py-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <GitBranch className="h-3 w-3 text-[#66E3FF]" />
            <span>OBSERVATION PROVENANCE</span>
          </div>
          <span className="text-[8px] text-slate-600">// DEMO EXECUTION TIMING</span>
        </div>

        <div className="p-2.5 space-y-1.5 text-[10px]">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 uppercase text-[9px] tracking-wider">INGESTED</span>
            <span className="text-[#EAF4F7] tabular-nums font-mono">
              {observation.provenance.ingestedTime} UTC
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 uppercase text-[9px] tracking-wider">PREPROCESSED</span>
            <span className="text-[#EAF4F7] tabular-nums font-mono">
              {observation.provenance.preprocessedTime} UTC
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 uppercase text-[9px] tracking-wider">ANALYZED</span>
            <span className="text-[#EAF4F7] tabular-nums font-mono">
              {observation.provenance.analyzedTime} UTC
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-500 uppercase text-[9px] tracking-wider">
              CANDIDATES GENERATED
            </span>
            <span className="text-[#66E3FF] font-semibold tabular-nums font-mono">
              {observation.provenance.candidatesGeneratedTime} UTC
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
