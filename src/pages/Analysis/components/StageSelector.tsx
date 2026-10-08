import type { AnalysisStageId } from '../types.ts';
import { Radio, Cpu, GitCompare, Zap } from 'lucide-react';

export interface StageSelectorProps {
  activeStage: AnalysisStageId;
  onSelectStage: (stage: AnalysisStageId) => void;
}

export function StageSelector({ activeStage, onSelectStage }: StageSelectorProps) {
  const stages: {
    id: AnalysisStageId;
    num: string;
    label: string;
    question: string;
    icon: typeof Radio;
  }[] = [
    {
      id: 'observation',
      num: '01',
      label: 'Observation',
      question: 'What was observed?',
      icon: Radio,
    },
    {
      id: 'representation',
      num: '02',
      label: 'Representation',
      question: 'How is it encoded?',
      icon: Cpu,
    },
    {
      id: 'comparison',
      num: '03',
      label: 'Catalog comparison',
      question: 'How does it compare?',
      icon: GitCompare,
    },
    {
      id: 'anomaly',
      num: '04',
      label: 'Anomaly isolation',
      question: 'Why is it anomalous?',
      icon: Zap,
    },
  ];

  return (
    <div className="rounded-[2px] border border-[#242825] bg-[#141715] p-3 select-none">
      <div className="flex items-center justify-between border-b border-[#242825] pb-2 mb-2.5">
        <span className="text-xs font-medium text-[#E6E4DD]">Analytical sequence</span>
        <span className="text-[11px] text-[#9A9C96]">
          Select a stage to inspect specific evidence
        </span>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2"
        role="tablist"
        aria-label="Investigation stages"
      >
        {stages.map((st) => {
          const isSelected = activeStage === st.id;
          const Icon = st.icon;

          return (
            <button
              key={st.id}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => onSelectStage(st.id)}
              className={`relative flex flex-col items-start p-3 rounded-[2px] border text-left transition-all cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A] ${
                isSelected
                  ? 'border-[#D4864A]/60 bg-[#1A1E1B] text-[#E6E4DD]'
                  : 'border-[#242825] bg-[#101211] text-[#9A9C96] hover:border-[#2E332F] hover:bg-[#161917] hover:text-[#E6E4DD]'
              }`}
            >
              {isSelected && <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#D4864A]" />}

              <div className="flex w-full items-center justify-between">
                <span className="text-[10px] text-[#666963] font-mono">{st.num}</span>
                <Icon
                  className={`h-3.5 w-3.5 ${isSelected ? 'text-[#D4864A]' : 'text-[#666963]'}`}
                />
              </div>

              <span
                className={`mt-1.5 text-xs font-medium ${
                  isSelected ? 'text-[#D4864A]' : 'text-[#E6E4DD]'
                }`}
              >
                {st.label}
              </span>

              <span className="mt-0.5 text-[11px] text-[#9A9C96] leading-snug">{st.question}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
