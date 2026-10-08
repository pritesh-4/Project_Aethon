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
    <div className="border-t border-[#D6D2C9] pt-6 select-none space-y-5 font-sans">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D6D2C9] pb-2.5">
        <div>
          <h3 className="text-sm font-semibold text-[#17202A]">Methodological Sequence</h3>
          <p className="text-xs text-[#56616A]">
            Continuous scientific workflow from raw radio voltages to prioritized candidate records
          </p>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono">
          <span className="text-[#376A9B] font-semibold">Stage 0{activeStage.stepNumber}</span>
          <span className="text-[#D6D2C9]">/</span>
          <span className="text-[#56616A]">05</span>
        </div>
      </div>

      {/* Segmented Stepper */}
      <div className="grid grid-cols-1 sm:grid-cols-5 divide-y sm:divide-y-0 sm:divide-x divide-[#D6D2C9] border border-[#D6D2C9] bg-[#FAF8F5] rounded-[3px] overflow-hidden shadow-xs">
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
              className={`relative flex flex-col items-start p-3.5 text-left transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#376A9B] ${
                isSelected
                  ? 'bg-[#EAE7E0] text-[#17202A]'
                  : 'text-[#56616A] hover:bg-[#F4F1EA] hover:text-[#17202A]'
              }`}
            >
              {isSelected && <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#376A9B]" />}

              <div className="flex w-full items-center justify-between">
                <span className="text-[11px] text-[#76828D] font-mono">0{st.stepNumber}</span>
                <Icon
                  className={`h-3.5 w-3.5 ${isSelected ? 'text-[#376A9B]' : 'text-[#76828D]'}`}
                />
              </div>

              <span
                className={`mt-2 text-xs font-semibold ${
                  isSelected ? 'text-[#376A9B]' : 'text-[#17202A]'
                }`}
              >
                {st.title}
              </span>

              <span className="mt-0.5 text-[11px] text-[#56616A] leading-snug line-clamp-1 font-mono">
                {st.subtitle}
              </span>
            </button>
          );
        })}
      </div>

      {/* Stage Detail: Scientific Explanation */}
      <div className="space-y-4 pt-1">
        {/* Stage Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D6D2C9] pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-semibold text-[#376A9B]">
              0{activeStage.stepNumber}
            </span>
            <span className="text-[#D6D2C9]">•</span>
            <h4 className="text-sm font-semibold text-[#17202A]">{activeStage.title}</h4>
            <span className="text-[#D6D2C9] hidden sm:inline">•</span>
            <span className="text-xs text-[#56616A] hidden sm:inline">{activeStage.subtitle}</span>
          </div>

          <button
            type="button"
            onClick={handleNextStage}
            className="flex items-center gap-1.5 text-xs text-[#376A9B] hover:underline cursor-pointer self-start sm:self-auto outline-none focus-visible:ring-1 focus-visible:ring-[#376A9B] font-mono font-semibold"
          >
            <span>NEXT STAGE</span>
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>

        {/* Methodological Description */}
        <div className="space-y-1">
          <p className="text-sm text-[#56616A] leading-relaxed max-w-4xl">
            {activeStage.simpleExplanation}
          </p>
        </div>

        {/* Technical ML Specifications Accordion */}
        <div className="border-t border-[#D6D2C9] pt-3">
          <button
            type="button"
            aria-expanded={showTechnicalDetails}
            aria-controls="technical-ml-specs"
            onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
            className="flex items-center gap-1.5 text-xs font-mono text-[#56616A] hover:text-[#17202A] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#376A9B]"
          >
            {showTechnicalDetails ? (
              <ChevronDown className="h-3.5 w-3.5 text-[#376A9B]" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-[#76828D]" />
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
              className="mt-3 divide-y divide-[#D6D2C9] border border-[#D6D2C9] bg-[#EAE7E0] rounded-[3px] text-xs font-sans animate-in fade-in duration-150"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-[#D6D2C9] p-3 gap-3 sm:gap-4">
                <div className="space-y-0.5">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#76828D] block">
                    Input format
                  </span>
                  <span className="text-xs font-mono text-[#17202A] block font-medium">
                    {activeStage.technicalDetails.inputFormat}
                  </span>
                </div>

                <div className="space-y-0.5 sm:pl-4">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-[#76828D] block">
                    Output format
                  </span>
                  <span className="text-xs font-mono text-[#376A9B] block font-medium">
                    {activeStage.technicalDetails.outputFormat}
                  </span>
                </div>
              </div>

              <div className="p-3 space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#76828D] block">
                  Core mechanism
                </span>
                <span className="text-xs text-[#17202A] block leading-relaxed font-medium">
                  {activeStage.technicalDetails.mechanism}
                </span>
              </div>

              <div className="p-3 space-y-1">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#76828D] block">
                  Algorithm summary
                </span>
                <p className="text-xs text-[#56616A] leading-relaxed">
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
