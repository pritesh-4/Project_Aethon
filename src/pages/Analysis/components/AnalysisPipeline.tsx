import type { PipelineStageId } from '../types.ts';
import { Radio, Filter, Waves, Cpu, Zap, Award } from 'lucide-react';

export interface AnalysisPipelineProps {
  activeStage: PipelineStageId;
  onSelectStage: (stage: PipelineStageId) => void;
}

export function AnalysisPipeline({ activeStage, onSelectStage }: AnalysisPipelineProps) {
  const stages: { id: PipelineStageId; index: string; label: string; icon: typeof Radio }[] = [
    { id: 'observation', index: '01', label: 'OBSERVATION', icon: Radio },
    { id: 'preprocessing', index: '02', label: 'PREPROCESSING', icon: Filter },
    { id: 'transform', index: '03', label: 'TIME–FREQUENCY', icon: Waves },
    { id: 'representation', index: '04', label: 'REPRESENTATION', icon: Cpu },
    { id: 'anomaly', index: '05', label: 'ANOMALY ANALYSIS', icon: Zap },
    { id: 'candidate_score', index: '06', label: 'CANDIDATE SCORE', icon: Award },
  ];

  return (
    <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-3 font-mono select-none">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
          ANALYTICAL PIPELINE TRACE
        </span>
        <span className="text-[9px] text-[#84929C]">
          SELECT STAGE TO INSPECT DIAGNOSTIC EVIDENCE
        </span>
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
                  ? 'border-[#66E3FF] bg-[#06b6d4]/10 shadow-[0_0_12px_rgba(102,227,255,0.15)] text-[#EAF4F7]'
                  : 'border-slate-800 bg-[#05070A]/70 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-[9px] font-semibold text-slate-500 font-mono">
                  {st.index}
                </span>
                <Icon className={`h-3 w-3 ${isSelected ? 'text-[#66E3FF]' : 'text-slate-500'}`} />
              </div>

              <span
                className={`text-[11px] font-bold tracking-wider uppercase truncate w-full ${
                  isSelected ? 'text-[#66E3FF]' : ''
                }`}
              >
                {st.label}
              </span>

              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className={`h-1 w-1 rounded-none ${
                    isSelected ? 'bg-emerald-400' : 'bg-slate-600'
                  }`}
                />
                <span className="text-[9px] text-slate-500 font-mono uppercase">COMPLETE</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
