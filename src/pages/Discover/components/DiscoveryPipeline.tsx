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
      desc: 'Time–frequency moments & RFI assessment',
    },
    {
      id: 'search',
      name: 'Search',
      desc: 'Narrowband anomaly screening',
    },
    {
      id: 'rank',
      name: 'Rank',
      desc: 'Doppler drift trajectory fitting',
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
    <div className="select-none font-sans border border-[#D6D2C9] bg-[#FAF8F5] rounded-[3px] p-4 my-2 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-[#D6D2C9] text-xs">
        <span className="font-mono text-[11px] uppercase tracking-wider text-[#76828D]">
          Execution Pipeline
        </span>
        <span className="text-[11px] font-mono text-[#56616A]">
          {stage === 'complete'
            ? 'Execution completed'
            : stage === 'idle'
              ? 'Standby'
              : 'Pipeline active'}
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#D6D2C9] pt-3">
        {steps.map((step, idx) => {
          const status = getStepStatus(step.id);
          const isComplete = status === 'complete';
          const isActive = status === 'active';

          return (
            <div
              key={step.id}
              className="py-2 sm:py-0 px-0 sm:px-4 first:sm:pl-0 last:sm:pr-0 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] text-[#76828D] font-mono">0{idx + 1}</span>
                  {isComplete ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-medium text-[#3D7D54] font-mono">
                      <Check className="h-3 w-3" />
                      OK
                    </span>
                  ) : isActive ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#376A9B] font-mono">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      RUN
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[11px] text-[#76828D] font-mono">
                      <Circle className="h-2 w-2" />
                      IDLE
                    </span>
                  )}
                </div>

                <div
                  className={`text-xs font-semibold tracking-normal ${
                    isActive ? 'text-[#376A9B]' : isComplete ? 'text-[#17202A]' : 'text-[#76828D]'
                  }`}
                >
                  {step.name}
                </div>
              </div>

              <p className="mt-1 text-[11px] text-[#56616A] leading-snug">{step.desc}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
