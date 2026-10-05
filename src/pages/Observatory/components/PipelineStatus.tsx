import type { ObservationStatus, PipelineStageStatus } from '../types.ts';
import { Layers } from 'lucide-react';

export interface PipelineStatusProps {
  status: ObservationStatus;
}

export function PipelineStatus({ status }: PipelineStatusProps) {
  const getStageStatuses = (): {
    preprocessing: PipelineStageStatus;
    representation: PipelineStageStatus;
    anomalySearch: PipelineStageStatus;
    candidateRanking: PipelineStageStatus;
  } => {
    switch (status) {
      case 'IDLE':
        return {
          preprocessing: 'READY',
          representation: 'READY',
          anomalySearch: 'READY',
          candidateRanking: 'READY',
        };
      case 'LOADING':
        return {
          preprocessing: 'ACTIVE',
          representation: 'READY',
          anomalySearch: 'READY',
          candidateRanking: 'READY',
        };
      case 'ANALYZING':
        return {
          preprocessing: 'COMPLETE',
          representation: 'COMPLETE',
          anomalySearch: 'ACTIVE',
          candidateRanking: 'READY',
        };
      case 'ANOMALY_DETECTED':
        return {
          preprocessing: 'COMPLETE',
          representation: 'COMPLETE',
          anomalySearch: 'COMPLETE',
          candidateRanking: 'ACTIVE',
        };
      case 'CANDIDATE_READY':
        return {
          preprocessing: 'COMPLETE',
          representation: 'COMPLETE',
          anomalySearch: 'COMPLETE',
          candidateRanking: 'COMPLETE',
        };
    }
  };

  const stages = getStageStatuses();

  const renderBadge = (stageStatus: PipelineStageStatus) => {
    switch (stageStatus) {
      case 'COMPLETE':
        return (
          <span className="inline-flex items-center gap-1.5 text-[#5BD8F5] font-medium text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5BD8F5]" />
            Complete
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 text-[#5BD8F5] font-medium text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5BD8F5]" />
            Active
          </span>
        );
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1.5 text-[#7F8B95] font-medium text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full border border-[#7F8B95] bg-transparent" />
            Ready
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1.5 text-[#E8AE50] font-medium text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E8AE50]" />
            Warning
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1.5 text-[#D95C5C] font-medium text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D95C5C]" />
            Error
          </span>
        );
      case 'OFFLINE':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[#7F8B95] font-medium text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1C2630]" />
            Idle
          </span>
        );
    }
  };

  const stageList: {
    key: keyof typeof stages;
    title: string;
    subtext: string;
  }[] = [
    {
      key: 'preprocessing',
      title: 'Preprocessing',
      subtext: 'Polyphase filterbank channelization (4096 ch)',
    },
    {
      key: 'representation',
      title: 'Representation',
      subtext: 'Spectrogram patch tokenization & embeddings',
    },
    {
      key: 'anomalySearch',
      title: 'Anomaly search',
      subtext: 'Variational latent reconstruction divergence',
    },
    {
      key: 'candidateRanking',
      title: 'Candidate ranking',
      subtext: 'Topocentric Doppler drift & RFI spatial rejection',
    },
  ];

  return (
    <div className="rounded border border-[#1C2630] bg-[#0B0F14] p-4 select-none flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1C2630] pb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-[#5BD8F5]" />
            <h3 className="text-xs font-semibold text-[#E6EDF2]">Signal pipeline</h3>
          </div>
        </div>

        {/* Pipeline Stage Items */}
        <div className="mt-3 divide-y divide-[#1C2630]">
          {stageList.map((item, idx) => {
            const currentStageStatus = stages[item.key];
            const isActive = currentStageStatus === 'ACTIVE';

            return (
              <div
                key={item.key}
                className={`py-2.5 transition-colors ${
                  isActive ? 'bg-[#5BD8F5]/5 px-2 -mx-2 rounded' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#7F8B95] font-mono">0{idx + 1}</span>
                    <span className="text-xs font-medium text-[#E6EDF2]">{item.title}</span>
                  </div>
                  <div>{renderBadge(currentStageStatus)}</div>
                </div>
                <div className="mt-1 text-[11px] text-[#7F8B95] pl-5">{item.subtext}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
