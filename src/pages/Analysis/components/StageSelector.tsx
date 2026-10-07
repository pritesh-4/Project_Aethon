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
      label: 'OBSERVATION',
      question: 'What is the signal?',
      icon: Radio,
    },
    {
      id: 'representation',
      num: '02',
      label: 'REPRESENTATION',
      question: 'How was it represented?',
      icon: Cpu,
    },
    {
      id: 'comparison',
      num: '03',
      label: 'PATTERN COMPARISON',
      question: 'How does it compare?',
      icon: GitCompare,
    },
    {
      id: 'anomaly',
      num: '04',
      label: 'ANOMALY',
      question: 'Why is it anomalous?',
      icon: Zap,
    },
  ];

  return (
    <div className="rounded border border-[#1C2630] bg-[#0B0F14] p-3 select-none">
      <div className="flex items-center justify-between border-b border-[#1C2630] pb-2 mb-2.5">
        <span className="text-xs font-semibold text-[#E6EDF2]">Investigation stages</span>
        <span className="text-[11px] text-[#7F8B95]">Inspect one analytical stage at a time</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
        {stages.map((st) => {
          const isSelected = activeStage === st.id;
          const Icon = st.icon;

          return (
            <button
              key={st.id}
              type="button"
              onClick={() => onSelectStage(st.id)}
              className={`relative flex flex-col items-start p-3 rounded border text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#5BD8F5] bg-[#5BD8F5]/10 text-[#E6EDF2]'
                  : 'border-[#1C2630] bg-[#06080B] text-[#7F8B95] hover:border-[#1C2630]/80 hover:bg-[#10161D] hover:text-[#E6EDF2]'
              }`}
            >
              {/* Thin cyan indicator line for active state */}
              {isSelected && <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#5BD8F5]" />}

              <div className="flex w-full items-center justify-between">
                <span className="text-[10px] text-[#7F8B95] font-mono">{st.num}</span>
                <Icon
                  className={`h-3.5 w-3.5 ${isSelected ? 'text-[#5BD8F5]' : 'text-[#7F8B95]'}`}
                />
              </div>

              <span
                className={`mt-1.5 text-xs font-semibold tracking-wider ${
                  isSelected ? 'text-[#5BD8F5]' : 'text-[#E6EDF2]'
                }`}
              >
                {st.label}
              </span>

              <span className="mt-0.5 text-[11px] text-[#7F8B95] leading-snug">{st.question}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
