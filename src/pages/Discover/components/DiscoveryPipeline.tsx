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
      title: 'Preprocessing',
      subtitle: 'Polyphase filterbank channelization (4096 ch)',
      progress: stageProgress.preprocessing,
    },
    {
      key: 'transform',
      title: 'Time–frequency transform',
      subtitle: 'Complex STFT high-cadence matrix generation',
      progress: stageProgress.transform,
    },
    {
      key: 'representing',
      title: 'Representation learning',
      subtitle: 'Patch tokenization & latent transformer embeddings',
      progress: stageProgress.representing,
    },
    {
      key: 'searching',
      title: 'Anomaly search',
      subtitle: 'Variational latent reconstruction residual (Δ > 4.8σ)',
      progress: stageProgress.searching,
    },
    {
      key: 'ranking',
      title: 'Candidate ranking',
      subtitle: 'Topocentric Doppler drift & multi-beam spatial filter',
      progress: stageProgress.ranking,
    },
  ];

  return (
    <div className="rounded border border-[#1C2630] bg-[#0B0F14] p-4 select-none">
      <div className="flex items-center justify-between border-b border-[#1C2630] pb-2.5 mb-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-3.5 w-3.5 text-[#5BD8F5]" />
          <h4 className="text-xs font-semibold text-[#E6EDF2]">Discovery pipeline</h4>
        </div>
      </div>

      <div className="space-y-3.5">
        {stages.map((st, idx) => {
          const isComplete = st.progress >= 100;
          const isActive = st.progress > 0 && st.progress < 100;

          return (
            <div key={st.key} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#7F8B95] font-mono">0{idx + 1}</span>
                  <span
                    className={`font-medium ${
                      isComplete ? 'text-[#E6EDF2]' : isActive ? 'text-[#5BD8F5]' : 'text-[#7F8B95]'
                    }`}
                  >
                    {st.title}
                  </span>
                </div>

                <div className="text-[11px] font-mono">
                  {isComplete ? (
                    <span className="inline-flex items-center gap-1 text-[#5BD8F5] font-medium">
                      <CheckCircle2 className="h-3 w-3" />
                      Complete
                    </span>
                  ) : isActive ? (
                    <span className="text-[#5BD8F5] font-medium">{Math.floor(st.progress)}%</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[#7F8B95]">
                      <Clock className="h-3 w-3" />
                      Pending
                    </span>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#10161D] border border-[#1C2630]">
                <div
                  className={`h-full transition-all duration-150 ${
                    isComplete ? 'bg-[#5BD8F5]' : isActive ? 'bg-[#5BD8F5]' : 'bg-transparent'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, st.progress))}%` }}
                />
              </div>

              <div className="text-[11px] text-[#7F8B95] pl-5">{st.subtitle}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
