import type { DiscoveryStage } from '../types.ts';
import { Check, Loader2, Circle } from 'lucide-react';

export interface DiscoveryPipelineProps {
  stage: DiscoveryStage;
}

export function DiscoveryPipeline({ stage }: DiscoveryPipelineProps) {
  const steps = [
    {
      id: 'prepare',
      name: 'Prepare',
      desc: 'Channelization & baseline calibration',
    },
    {
      id: 'represent',
      name: 'Represent',
      desc: 'Time–frequency latent representation',
    },
    {
      id: 'search',
      name: 'Search',
      desc: 'Narrowband anomaly screening',
    },
    {
      id: 'rank',
      name: 'Rank',
      desc: 'Doppler drift & candidate classification',
    },
  ];

  const getStepStatus = (stepId: string) => {
    const stageOrder = ['prepare', 'represent', 'search', 'rank', 'complete'];
    const currentIdx = stageOrder.indexOf(stage);
    const stepIdx = stageOrder.indexOf(stepId);

    if (currentIdx === -1) return 'pending';
    if (stage === 'complete' || currentIdx > stepIdx) return 'complete';
    if (currentIdx === stepIdx) return 'active';
    return 'pending';
  };

  return (
    <div className="select-none font-sans border-y border-[#242825] py-3.5 my-2">
      <div className="flex items-center justify-between pb-3 text-xs">
        <span className="font-mono text-[11px] uppercase tracking-wider text-[#9A9C96]">
          Execution Pipeline
        </span>
        <span className="text-[11px] font-mono text-[#767973]">
          {stage === 'complete'
            ? 'Execution completed'
            : stage === 'idle'
              ? 'Standby'
              : 'Pipeline active'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#242825]">
        {steps.map((step, idx) => {
          const status = getStepStatus(step.id);
          const isComplete = status === 'complete';
          const isActive = status === 'active';

          return (
            <div
              key={step.id}
              className={`py-2 sm:py-0 px-0 sm:px-4 first:sm:pl-0 last:sm:pr-0 flex flex-col justify-between transition-colors`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] text-[#666963] font-mono">0{idx + 1}</span>
                  {isComplete ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#529E72] font-mono">
                      <Check className="h-3 w-3" />
                      OK
                    </span>
                  ) : isActive ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[#D4864A] font-mono">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      RUN
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#666963] font-mono">
                      <Circle className="h-2 w-2" />
                      IDLE
                    </span>
                  )}
                </div>

                <div
                  className={`text-xs font-medium tracking-wide ${
                    isActive ? 'text-[#D4864A]' : isComplete ? 'text-[#E6E4DD]' : 'text-[#767973]'
                  }`}
                >
                  {step.name}
                </div>
              </div>

              <p className="mt-1 text-[11px] text-[#848780] leading-snug">{step.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
