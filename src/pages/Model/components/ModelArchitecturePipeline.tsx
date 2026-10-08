import { useState } from 'react';
import type { ArchitectureStageId } from '../types.ts';
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
    <div className="rounded-[2px] border border-[#242825] bg-[#141715] p-5 select-none space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#242825] pb-3">
        <div>
          <h3 className="text-sm font-medium text-[#E6E4DD]">Methodological sequence</h3>
          <p className="text-xs text-[#9A9C96]">
            Continuous scientific workflow from raw radio voltages to prioritized candidate records
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-[#D4864A]">Stage 0{activeStage.stepNumber}</span>
          <span className="text-[#666963]">/</span>
          <span className="text-[#9A9C96]">05</span>
        </div>
      </div>

      {/* Continuous Connected Flow Diagram */}
      <div className="space-y-2">
        <span className="text-[11px] text-[#666963] font-mono uppercase tracking-wider block">
          End-to-end signal processing flow
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-1.5">
          {ARCHITECTURE_STAGES.map((st, idx) => {
            const isSelected = activeStageId === st.id;
            const Icon = getStageIcon(st.id);

            return (
              <button
                key={st.id}
                type="button"
                role="tab"
                aria-selected={isSelected}
                onClick={() => setActiveStageId(st.id)}
                className={`relative flex flex-col items-start p-3 rounded-[2px] border text-left transition-all cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A] ${
                  isSelected
                    ? 'border-[#D4864A]/60 bg-[#1A1E1B] text-[#E6E4DD]'
                    : 'border-[#242825] bg-[#101211] text-[#9A9C96] hover:border-[#2E332F] hover:bg-[#161917] hover:text-[#E6E4DD]'
                }`}
              >
                {/* Active indicator top bar */}
                {isSelected && <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#D4864A]" />}

                <div className="flex w-full items-center justify-between">
                  <span className="text-[10px] text-[#666963] font-mono">0{st.stepNumber}</span>
                  <Icon
                    className={`h-3.5 w-3.5 ${isSelected ? 'text-[#D4864A]' : 'text-[#666963]'}`}
                  />
                </div>

                <span
                  className={`mt-2 text-xs font-medium ${
                    isSelected ? 'text-[#D4864A]' : 'text-[#E6E4DD]'
                  }`}
                >
                  {st.title}
                </span>

                <span className="mt-0.5 text-[10px] text-[#9A9C96] leading-snug line-clamp-1">
                  {st.subtitle}
                </span>

                {/* Subtle stage connector marker for desktop */}
                {idx < ARCHITECTURE_STAGES.length - 1 && (
                  <span className="hidden sm:block absolute -right-2 top-1/2 -translate-y-1/2 text-[10px] text-[#666963] z-10 font-mono">
                    →
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Stage Detail: Scientific Explanation */}
      <div className="rounded-[2px] border border-[#242825] bg-[#101211] p-5 space-y-4">
        {/* Stage Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#242825] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-medium text-[#D4864A]">
                Stage 0{activeStage.stepNumber}
              </span>
              <span className="text-[#666963]">•</span>
              <h4 className="text-sm font-medium text-[#E6E4DD]">{activeStage.title}</h4>
            </div>
            <p className="text-xs text-[#9A9C96] mt-0.5">{activeStage.subtitle}</p>
          </div>

          <button
            type="button"
            onClick={handleNextStage}
            className="flex items-center gap-1.5 text-xs text-[#D4864A] hover:underline cursor-pointer self-start sm:self-auto outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A] rounded-[2px] px-1.5 py-0.5"
          >
            <span>Proceed to next stage</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* 1. Plain Language Explanation */}
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-[#E6E4DD] block">
            Methodological description
          </span>
          <p className="text-xs sm:text-sm text-[#9A9C96] leading-relaxed">
            {activeStage.simpleExplanation}
          </p>
        </div>

        {/* 2. Advanced Technical ML Specifications */}
        <div className="border-t border-[#242825] pt-3">
          <button
            type="button"
            aria-expanded={showTechnicalDetails}
            aria-controls="technical-ml-specs"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="flex items-center gap-1.5 text-xs font-medium text-[#9A9C96] hover:text-[#E6E4DD] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A] rounded-[2px] px-1 py-0.5"
          >
            {showTechnicalDetails ? (
              <ChevronDown className="h-3.5 w-3.5 text-[#D4864A]" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-[#666963]" />
            )}
            <span>
              {showTechnicalDetails
                ? 'Hide mathematical and architectural specifications'
                : 'Inspect mathematical and architectural specifications'}
            </span>
          </button>

          {showTechnicalDetails && (
            <div
              id="technical-ml-specs"
              className="mt-3 p-4 rounded-[2px] border border-[#242825] bg-[#141715] space-y-3 text-xs animate-in fade-in duration-200"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <span className="text-[10px] text-[#666963] block">Input format</span>
                  <span className="text-xs font-mono text-[#E6E4DD] block">
                    {activeStage.technicalDetails.inputFormat}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-[#666963] block">Output format</span>
                  <span className="text-xs font-mono text-[#D4864A] block">
                    {activeStage.technicalDetails.outputFormat}
                  </span>
                </div>
              </div>

              <div className="border-t border-[#242825] pt-2 space-y-1">
                <span className="text-[10px] text-[#666963] block">Core mechanism</span>
                <span className="text-xs text-[#E6E4DD] block leading-relaxed">
                  {activeStage.technicalDetails.mechanism}
                </span>
              </div>

              <div className="border-t border-[#242825] pt-2 space-y-1">
                <span className="text-[10px] text-[#666963] block">Algorithm summary</span>
                <p className="text-xs text-[#9A9C96] leading-relaxed">
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
