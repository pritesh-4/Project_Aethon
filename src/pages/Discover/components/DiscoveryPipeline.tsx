import type { DiscoveryStage } from '../types.ts';
import { Check, Loader2, Clock } from 'lucide-react';

export interface DiscoveryPipelineProps {
  stage: DiscoveryStage;
}

export function DiscoveryPipeline({ stage }: DiscoveryPipelineProps) {
  const steps = [
    {
      id: 'prepare',
      name: 'PREPARE',
      desc: 'Channelization & baseline calibration',
    },
    {
      id: 'represent',
      name: 'REPRESENT',
      desc: 'Time–frequency latent representation',
    },
    {
      id: 'search',
      name: 'SEARCH',
      desc: 'Narrowband anomaly screening',
    },
    {
      id: 'rank',
      name: 'RANK',
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
    <div className="rounded border border-[#1C2630] bg-[#0B0F14] p-4 select-none space-y-3">
      <div className="flex items-center justify-between border-b border-[#1C2630] pb-2">
        <span className="text-xs font-semibold text-[#E6EDF2]">Analysis procedure</span>
        <span className="text-[11px] text-[#7F8B95]">
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
              className={`flex flex-col justify-between p-3 rounded border transition-colors ${
                isActive
                  ? 'border-[#5BD8F5] bg-[#5BD8F5]/10'
                  : isComplete
                    ? 'border-[#1C2630] bg-[#10161D]'
                    : 'border-[#1C2630]/60 bg-[#06080B]/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#7F8B95] font-mono">0{idx + 1}</span>
                  {isComplete ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#5BD8F5]">
                      <Check className="h-3 w-3" />
                      Complete
                    </span>
                  ) : isActive ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#5BD8F5]">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      In progress
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#7F8B95]">
                      <Clock className="h-3 w-3" />
                      Pending
                    </span>
                  )}
                </div>

                <div
                  className={`mt-1.5 text-xs font-semibold tracking-wider ${
                    isActive ? 'text-[#5BD8F5]' : isComplete ? 'text-[#E6EDF2]' : 'text-[#7F8B95]'
                  }`}
                >
                  {step.name}
                </div>
              </div>

              <p className="mt-2 text-[11px] text-[#7F8B95] leading-normal">{step.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
