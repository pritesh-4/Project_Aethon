import type { ObservationStatus, PipelineStageStatus } from '../types.ts';

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

  const getStatusIndicator = (stageStatus: PipelineStageStatus) => {
    switch (stageStatus) {
      case 'COMPLETE':
        return { dot: 'bg-[#529E72]', label: 'Complete', labelColor: 'text-[#529E72]' };
      case 'ACTIVE':
        return { dot: 'bg-[#D4864A]', label: 'Active', labelColor: 'text-[#D4864A]' };
      case 'READY':
        return {
          dot: 'border border-[#666963] bg-transparent',
          label: 'Ready',
          labelColor: 'text-[#9A9C96]',
        };
      case 'WARNING':
        return { dot: 'bg-[#D4864A]', label: 'Warning', labelColor: 'text-[#D4864A]' };
      case 'ERROR':
        return { dot: 'bg-[#C84A4A]', label: 'Error', labelColor: 'text-[#C84A4A]' };
      case 'OFFLINE':
      default:
        return { dot: 'bg-[#242825]', label: 'Idle', labelColor: 'text-[#9A9C96]' };
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
    <div className="select-none">
      <span className="text-[10px] uppercase tracking-widest text-[#666963] font-medium block mb-3">
        Signal pipeline
      </span>

      {/* Pipeline steps as connected vertical list */}
      <div className="space-y-0">
        {stageList.map((item, idx) => {
          const currentStageStatus = stages[item.key];
          const isActive = currentStageStatus === 'ACTIVE';
          const indicator = getStatusIndicator(currentStageStatus);

          return (
            <div
              key={item.key}
              className={`relative flex items-start gap-3 py-2.5 ${
                isActive ? 'bg-[#D4864A]/5 px-2.5 -mx-2.5 rounded-sm' : ''
              }`}
            >
              {/* Vertical connector line */}
              <div className="flex flex-col items-center shrink-0 pt-0.5">
                <span className={`h-2 w-2 rounded-full ${indicator.dot} shrink-0`} />
                {idx < stageList.length - 1 && (
                  <span className="w-px flex-1 min-h-[24px] bg-[#242825] mt-1" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#666963] font-mono">0{idx + 1}</span>
                    <span className="text-xs font-medium text-[#E6E4DD]">{item.title}</span>
                  </div>
                  <span className="text-[11px] text-[#9A9C96] mt-0.5 block">{item.subtext}</span>
                </div>
                <span className={`text-[11px] font-medium ${indicator.labelColor} shrink-0`}>
                  {indicator.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
