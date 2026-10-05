import type { PipelineStageId } from '../types.ts';
import { Radio, Filter, Waves, Cpu, Zap, Award } from 'lucide-react';

export interface AnalysisPipelineProps {
  activeStage: PipelineStageId;
  onSelectStage: (stage: PipelineStageId) => void;
}

export function AnalysisPipeline({ activeStage, onSelectStage }: AnalysisPipelineProps) {
  const stages: { id: PipelineStageId; index: string; label: string; icon: typeof Radio }[] = [
    { id: 'observation', index: '01', label: 'Observation', icon: Radio },
    { id: 'preprocessing', index: '02', label: 'Preprocessing', icon: Filter },
    { id: 'transform', index: '03', label: 'Time–frequency', icon: Waves },
    { id: 'representation', index: '04', label: 'Representation', icon: Cpu },
    { id: 'anomaly', index: '05', label: 'Anomaly analysis', icon: Zap },
    { id: 'candidate_score', index: '06', label: 'Candidate score', icon: Award },
  ];

  return (
    <div className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-3 font-mono select-none">
      <div className="flex items-center justify-between border-b border-[#1C2630] pb-2 mb-2.5">
        <span className="text-[10px] font-medium text-[#7F8B95]">Pipeline stages</span>
      </div>

      {/* Horizontal Interactive Stage Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {stages.map((st) => {
          const isSelected = activeStage === st.id;
          const Icon = st.icon;

          return (
            <button
              key={st.id}
              type="button"
              onClick={() => onSelectStage(st.id)}
              className={`flex flex-col items-start gap-1 rounded-[2px] border p-2 text-left transition-all cursor-pointer ${
                isSelected
                  ? 'border-[#5BD8F5] bg-[#5BD8F5]/10 text-[#E6EDF2]'
                  : 'border-[#1C2630] bg-[#06080B] text-[#7F8B95] hover:border-[#7F8B95] hover:text-[#E6EDF2]'
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-[9px] text-[#7F8B95] font-mono">{st.index}</span>
                <Icon className={`h-3 w-3 ${isSelected ? 'text-[#5BD8F5]' : 'text-[#7F8B95]'}`} />
              </div>

              <span
                className={`text-[11px] font-medium truncate w-full ${
                  isSelected ? 'text-[#5BD8F5]' : 'text-[#E6EDF2]'
                }`}
              >
                {st.label}
              </span>

              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className={`h-1 w-1 rounded-full ${isSelected ? 'bg-[#5BD8F5]' : 'bg-[#1C2630]'}`}
                />
                <span className="text-[9px] text-[#7F8B95] font-mono">Complete</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
