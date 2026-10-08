import { useState } from 'react';
import type { ArchitectureStageId, ArchitectureStageData } from '../types.ts';
import { ARCHITECTURE_STAGES } from '../data/modelData.ts';
import {
  Radio,
  Cpu,
  Network,
  Zap,
  Award,
  ChevronDown,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';

export function ModelArchitecturePipeline() {
  const [activeStageId, setActiveStageId] = useState<ArchitectureStageId>('observation');
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  const activeStage =
    ARCHITECTURE_STAGES.find((s) => s.id === activeStageId) || ARCHITECTURE_STAGES[0];

  const getStageIcon = (id: ArchitectureStageId) => {
    switch (id) {
      case 'observation':
        return Radio;
      case 'representation':
        return Cpu;
      case 'latent_space':
        return Network;
      case 'anomaly_detection':
        return Zap;
      case 'candidate':
        return Award;
    }
  };

  const handleNextStage = () => {
    const currentIndex = ARCHITECTURE_STAGES.findIndex((s) => s.id === activeStageId);
    if (currentIndex < ARCHITECTURE_STAGES.length - 1) {
      setActiveStageId(ARCHITECTURE_STAGES[currentIndex + 1].id);
    } else {
      setActiveStageId(ARCHITECTURE_STAGES[0].id);
    }
  };

  return (
    <div className="rounded border border-[#1C2630] bg-[#0B0F14] p-5 select-none space-y-5">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1C2630] pb-3">
        <div>
          <h3 className="text-sm font-semibold text-[#E6EDF2]">
            The 5-Stage Intelligence Pipeline
          </h3>
          <p className="text-xs text-[#7F8B95]">
            One coherent flow from raw radio voltages to verified astronomical candidates
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-mono">
          <span className="text-[#5BD8F5]">Stage {activeStage.stepNumber}</span>
          <span className="text-[#7F8B95]">/</span>
          <span className="text-[#7F8B95]">05</span>
        </div>
      </div>

      {/* Coherent Pipeline Sequence Indicator */}
      <div className="hidden sm:flex items-center justify-between px-3 py-2 rounded border border-[#1C2630]/60 bg-[#06080B] text-[10px] font-mono">
        {ARCHITECTURE_STAGES.map((st, idx) => (
          <div key={st.id} className="flex items-center gap-2">
            <span
              className={`transition-colors ${
                activeStageId === st.id
                  ? 'text-[#5BD8F5] font-semibold'
                  : 'text-[#7F8B95] hover:text-[#E6EDF2]'
              }`}
            >
              {st.stepNumber}. {st.title}
            </span>
            {idx < ARCHITECTURE_STAGES.length - 1 && <span className="text-[#1C2630]">→</span>}
          </div>
        ))}
      </div>

      {/* 5-Stage Stepper Bar */}
      <div
        className="grid grid-cols-1 sm:grid-cols-5 gap-2"
        role="tablist"
        aria-label="Architecture Stages"
      >
        {ARCHITECTURE_STAGES.map((st: ArchitectureStageData) => {
          const isSelected = activeStageId === st.id;
          const Icon = getStageIcon(st.id);

          return (
            <button
              key={st.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setActiveStageId(st.id)}
              className={`relative flex flex-col items-start p-3 rounded border text-left transition-all cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5] ${
                isSelected
                  ? 'border-[#5BD8F5] bg-[#5BD8F5]/10 text-[#E6EDF2]'
                  : 'border-[#1C2630] bg-[#06080B] text-[#7F8B95] hover:border-[#1C2630]/80 hover:bg-[#10161D] hover:text-[#E6EDF2]'
              }`}
            >
              {isSelected && <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#5BD8F5]" />}

              <div className="flex w-full items-center justify-between">
                <span className="text-[10px] text-[#7F8B95] font-mono">{st.stepNumber}</span>
                <Icon
                  className={`h-3.5 w-3.5 ${isSelected ? 'text-[#5BD8F5]' : 'text-[#7F8B95]'}`}
                />
              </div>

              <span
                className={`mt-1.5 text-xs font-semibold tracking-wider ${
                  isSelected ? 'text-[#5BD8F5]' : 'text-[#E6EDF2]'
                }`}
              >
                {st.title}
              </span>

              <span className="mt-0.5 text-[10px] text-[#7F8B95] leading-snug line-clamp-1">
                {st.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      {/* Stage Detail Card: Simple Language First */}
      <div className="rounded border border-[#1C2630] bg-[#06080B] p-5 space-y-4">
        {/* Stage Title and Subtitle */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#1C2630] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-[#5BD8F5]">
                {activeStage.stepNumber}
              </span>
              <span className="text-[#7F8B95]">•</span>
              <h4 className="text-sm font-semibold text-[#E6EDF2] tracking-wide">
                {activeStage.title}
              </h4>
            </div>
            <p className="text-xs text-[#7F8B95] mt-0.5">{activeStage.subtitle}</p>
          </div>

          <button
            type="button"
            onClick={handleNextStage}
            className="flex items-center gap-1.5 text-xs text-[#5BD8F5] hover:underline cursor-pointer self-start sm:self-auto outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5] rounded px-1.5 py-0.5"
          >
            <span>Next stage</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* 1. Simple Language Explanation (For Any Reader / Non-Expert Judge) */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-[#5BD8F5] block">
            Plain language explanation
          </span>
          <p className="text-xs sm:text-sm text-[#E6EDF2] leading-relaxed">
            {activeStage.simpleExplanation}
          </p>
        </div>

        {/* 2. Progressively Disclosed Advanced Technical ML Details (For Technical Judge) */}
        <div className="border-t border-[#1C2630] pt-3">
          <button
            type="button"
            aria-expanded={showTechnicalDetails}
            aria-controls="technical-ml-specs"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="flex items-center gap-1.5 text-xs font-medium text-[#7F8B95] hover:text-[#5BD8F5] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5] rounded px-1 py-0.5"
          >
            {showTechnicalDetails ? (
              <ChevronDown className="h-3.5 w-3.5 text-[#5BD8F5]" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-[#7F8B95]" />
            )}
            <span>
              {showTechnicalDetails
                ? 'Hide technical machine learning specifications'
                : '▸ View technical machine learning specifications'}
            </span>
          </button>

          {showTechnicalDetails && (
            <div
              id="technical-ml-specs"
              className="mt-3 p-4 rounded border border-[#1C2630] bg-[#0B0F14] space-y-3 font-mono text-xs animate-in fade-in duration-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[11px] text-[#7F8B95] block">Input format</span>
                  <span className="text-xs text-[#E6EDF2] block">
                    {activeStage.technicalDetails.inputFormat}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-[#7F8B95] block">Output format</span>
                  <span className="text-xs text-[#5BD8F5] block">
                    {activeStage.technicalDetails.outputFormat}
                  </span>
                </div>
              </div>

              <div className="border-t border-[#1C2630] pt-2 space-y-1">
                <span className="text-[11px] text-[#7F8B95] block">Core mechanism</span>
                <span className="text-xs text-[#E6EDF2] block font-sans leading-relaxed">
                  {activeStage.technicalDetails.mechanism}
                </span>
              </div>

              <div className="border-t border-[#1C2630] pt-2 space-y-1">
                <span className="text-[11px] text-[#7F8B95] block">Algorithm summary</span>
                <p className="text-[11px] text-[#7F8B95] font-sans leading-relaxed">
                  {activeStage.technicalDetails.algorithmSummary}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
