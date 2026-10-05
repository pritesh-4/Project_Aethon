import type { DiscoveryStage } from '../types.ts';
import { Cpu, CheckCircle2, Clock } from 'lucide-react';

export interface DiscoveryPipelineProps {
  stage: DiscoveryStage;
  stageProgress: {
    preprocessing: number;
    transform: number;
    representing: number;
    searching: number;
    ranking: number;
  };
}

export function DiscoveryPipeline({ stageProgress }: DiscoveryPipelineProps) {
  const stages = [
    {
      key: 'preprocessing',
      title: 'PREPROCESSING',
      subtitle: 'Polyphase filterbank channelization (4096 ch)',
      progress: stageProgress.preprocessing,
    },
    {
      key: 'transform',
      title: 'TIME–FREQUENCY TRANSFORM',
      subtitle: 'Complex STFT high-cadence matrix generation',
      progress: stageProgress.transform,
    },
    {
      key: 'representing',
      title: 'REPRESENTATION LEARNING',
      subtitle: 'Patch tokenization & latent transformer embeddings',
      progress: stageProgress.representing,
    },
    {
      key: 'searching',
      title: 'ANOMALY SEARCH',
      subtitle: 'Variational latent reconstruction residual (Δ > 4.8σ)',
      progress: stageProgress.searching,
    },
    {
      key: 'ranking',
      title: 'CANDIDATE RANKING',
      subtitle: 'Topocentric Doppler drift & multi-beam spatial filter',
      progress: stageProgress.ranking,
    },
  ];

  return (
    <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-4 font-mono select-none">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-3.5 w-3.5 text-[#66E3FF]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#EAF4F7]">
            AETHON DISCOVERY ENGINE PIPELINE
          </h4>
        </div>
        <span className="text-[10px] text-cyan-400 uppercase tracking-wider font-semibold">
          ACTIVE INFERENCE
        </span>
      </div>

      <div className="space-y-3.5">
        {stages.map((st, idx) => {
          const isComplete = st.progress >= 100;
          const isActive = st.progress > 0 && st.progress < 100;

          return (
            <div key={st.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 font-semibold">0{idx + 1}</span>
                  <span
                    className={`font-semibold tracking-wider uppercase ${
                      isComplete ? 'text-[#EAF4F7]' : isActive ? 'text-[#66E3FF]' : 'text-slate-500'
                    }`}
                  >
                    {st.title}
                  </span>
                </div>

                <div className="text-[10px] font-mono">
                  {isComplete ? (
                    <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
                      <CheckCircle2 className="h-3 w-3" />
                      COMPLETE
                    </span>
                  ) : isActive ? (
                    <span className="text-[#66E3FF] font-semibold">{Math.floor(st.progress)}%</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-600">
                      <Clock className="h-3 w-3" />
                      WAITING
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar with Precision Segments */}
              <div className="h-1.5 w-full overflow-hidden rounded-none bg-slate-900 border border-slate-800/80">
                <div
                  className={`h-full transition-all duration-150 ${
                    isComplete
                      ? 'bg-emerald-500'
                      : isActive
                        ? 'bg-[#66E3FF] shadow-[0_0_8px_rgba(102,227,255,0.6)]'
                        : 'bg-transparent'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, st.progress))}%` }}
                />
              </div>

              <div className="text-[9px] text-[#84929C] pl-5">{st.subtitle}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
