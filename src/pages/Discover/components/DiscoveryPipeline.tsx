import type { DiscoveryStage } from '../types.ts';
import { Check, Loader2, Clock } from 'lucide-react';

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
    <div className="rounded-[2px] border border-[#262C28] bg-[#141715] p-4 select-none space-y-3 font-sans">
      <div className="flex items-center justify-between border-b border-[#262C28] pb-2">
        <span className="text-xs font-semibold text-[#E6E4DD]">Analysis procedure</span>
        <span className="text-[11px] text-[#9A9C96]">
          {stage === 'complete'
            ? 'Procedure finished'
            : stage === 'idle'
              ? 'Ready to initiate'
              : 'Autonomous execution in progress'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
        {steps.map((step, idx) => {
          const status = getStepStatus(step.id);
          const isComplete = status === 'complete';
          const isActive = status === 'active';

          return (
            <div
              key={step.id}
              className={`flex flex-col justify-between p-3 rounded-[2px] border transition-colors ${
                isActive
                  ? 'border-[#D4864A] bg-[#241A14]'
                  : isComplete
                    ? 'border-[#262C28] bg-[#141F18]'
                    : 'border-[#262C28] bg-[#101311]'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#9A9C96] font-mono">0{idx + 1}</span>
                  {isComplete ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#529E72]">
                      <Check className="h-3 w-3" />
                      Complete
                    </span>
                  ) : isActive ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#D4864A]">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      In progress
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#9A9C96]">
                      <Clock className="h-3 w-3" />
                      Pending
                    </span>
                  )}
                </div>

                <div
                  className={`mt-1.5 text-xs font-semibold tracking-wider ${
                    isActive ? 'text-[#D4864A]' : isComplete ? 'text-[#E6E4DD]' : 'text-[#9A9C96]'
                  }`}
                >
                  {step.name}
                </div>
              </div>

              <p className="mt-2 text-[11px] text-[#9A9C96] leading-normal">{step.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
