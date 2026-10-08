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
    <div className="border-t border-[#242825] pt-6 select-none space-y-5 font-sans">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#242825] pb-2.5">
        <div>
          <h3 className="text-sm font-medium text-[#E6E4DD]">Methodological Sequence</h3>
          <p className="text-xs text-[#848780]">
            Continuous scientific workflow from raw radio voltages to prioritized candidate records
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-[#D4864A]">Stage 0{activeStage.stepNumber}</span>
          <span className="text-[#555852]">/</span>
          <span className="text-[#848780]">05</span>
        </div>
      </div>

      {/* Segmented Stepper */}
      <div className="grid grid-cols-1 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#242825] border border-[#242825] bg-[#101211] rounded-[2px] overflow-hidden">
        {ARCHITECTURE_STAGES.map((st) => {
          const isSelected = activeStageId === st.id;
          const Icon = getStageIcon(st.id);

          return (
            <button
              key={st.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setActiveStageId(st.id)}
              className={`relative flex flex-col items-start p-3 text-left transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A] ${
                isSelected
                  ? 'bg-[#1C1815] text-[#E6E4DD]'
                  : 'text-[#848780] hover:bg-[#141615] hover:text-[#C9C8C0]'
              }`}
            >
              {isSelected && <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#D4864A]" />}

              <div className="flex w-full items-center justify-between">
                <span className="text-[10px] text-[#666963] font-mono">0{st.stepNumber}</span>
                <Icon className={`h-3 w-3 ${isSelected ? 'text-[#D4864A]' : 'text-[#666963]'}`} />
              </div>

              <span
                className={`mt-2 text-xs font-medium ${
                  isSelected ? 'text-[#D4864A]' : 'text-[#C9C8C0]'
                }`}
              >
                {st.title}
              </span>

              <span className="mt-0.5 text-[10px] text-[#767973] leading-snug line-clamp-1 font-mono">
                {st.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      {/* Stage Detail: Scientific Explanation */}
      <div className="space-y-4 pt-1">
        {/* Stage Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#242825] pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-medium text-[#D4864A]">
              0{activeStage.stepNumber}
            </span>
            <span className="text-[#363C38]">•</span>
            <h4 className="text-sm font-medium text-[#E6E4DD]">{activeStage.title}</h4>
            <span className="text-[#363C38] hidden sm:inline">•</span>
            <span className="text-xs text-[#848780] hidden sm:inline">{activeStage.subtitle}</span>
          </div>

          <button
            type="button"
            onClick={handleNextStage}
            className="flex items-center gap-1.5 text-xs text-[#D4864A] hover:underline cursor-pointer self-start sm:self-auto outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A] font-mono"
          >
            <span>NEXT STAGE</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Methodological Description */}
        <div className="space-y-1">
          <p className="text-xs sm:text-sm text-[#9A9C96] leading-relaxed max-w-4xl">
            {activeStage.simpleExplanation}
          </p>
        </div>

        {/* Technical ML Specifications Accordion */}
        <div className="border-t border-[#242825] pt-3">
          <button
            type="button"
            aria-expanded={showTechnicalDetails}
            aria-controls="technical-ml-specs"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="flex items-center gap-1.5 text-xs font-mono text-[#848780] hover:text-[#E6E4DD] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A]"
          >
            {showTechnicalDetails ? (
              <ChevronDown className="h-3.5 w-3.5 text-[#D4864A]" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-[#767973]" />
            )}
            <span>
              {showTechnicalDetails
                ? 'HIDE MATHEMATICAL & ARCHITECTURAL SPECIFICATIONS'
                : 'INSPECT MATHEMATICAL & ARCHITECTURAL SPECIFICATIONS'}
            </span>
          </button>

          {showTechnicalDetails && (
            <div
              id="technical-ml-specs"
              className="mt-3 divide-y divide-[#1F2321] border border-[#242825] bg-[#0E100F] rounded-[2px] text-xs font-sans animate-in fade-in duration-150"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#1F2321] p-3 gap-3 sm:gap-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#767973] block">
                    Input format
                  </span>
                  <span className="text-xs font-mono text-[#E6E4DD] block">
                    {activeStage.technicalDetails.inputFormat}
                  </span>
                </div>

                <div className="space-y-0.5 sm:pl-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#767973] block">
                    Output format
                  </span>
                  <span className="text-xs font-mono text-[#D4864A] block">
                    {activeStage.technicalDetails.outputFormat}
                  </span>
                </div>
              </div>

              <div className="p-3 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#767973] block">
                  Core mechanism
                </span>
                <span className="text-xs text-[#C9C8C0] block leading-relaxed">
                  {activeStage.technicalDetails.mechanism}
                </span>
              </div>

              <div className="p-3 space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#767973] block">
                  Algorithm summary
                </span>
                <p className="text-xs text-[#848780] leading-relaxed">
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
