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
          <span className="inline-flex items-center gap-1.5 text-[#529E72] font-medium text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#529E72]" />
            Complete
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 text-[#D4864A] font-medium text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D4864A]" />
            Active
          </span>
        );
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1.5 text-[#9A9C96] font-medium text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full border border-[#9A9C96] bg-transparent" />
            Ready
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1.5 text-[#D4864A] font-medium text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D4864A]" />
            Warning
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1.5 text-[#C84A4A] font-medium text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C84A4A]" />
            Error
          </span>
        );
      case 'OFFLINE':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[#9A9C96] font-medium text-[11px]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#262C28]" />
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
    <div className="rounded-[2px] border border-[#262C28] bg-[#141715] p-4 select-none flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#262C28] pb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-[#D4864A]" />
            <h3 className="text-xs font-semibold text-[#E6E4DD]">Signal pipeline</h3>
          </div>
        </div>

        {/* Pipeline Stage Items */}
        <div className="mt-3 divide-y divide-[#262C28]">
          {stageList.map((item, idx) => {
            const currentStageStatus = stages[item.key];
            const isActive = currentStageStatus === 'ACTIVE';

            return (
              <div
                key={item.key}
                className={`py-2.5 transition-colors ${
                  isActive ? 'bg-[#D4864A]/5 px-2 -mx-2 rounded-[2px]' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#9A9C96] font-mono">0{idx + 1}</span>
                    <span className="text-xs font-medium text-[#E6E4DD]">{item.title}</span>
                  </div>
                  <div>{renderBadge(currentStageStatus)}</div>
                </div>
                <div className="mt-1 text-[11px] text-[#9A9C96] pl-5">{item.subtext}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
