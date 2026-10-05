import type { ObservationStatus, PipelineStageStatus } from '../types.ts';
import { GitCommit, Layers } from 'lucide-react';

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
          <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold text-[10px]">
            <span className="h-1.5 w-1.5 rounded-none bg-emerald-400" />
            COMPLETE
          </span>
        );
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 text-[#66E3FF] font-semibold text-[10px]">
            <span className="h-1.5 w-1.5 rounded-none bg-[#66E3FF] animate-ping" />
            ACTIVE
          </span>
        );
      case 'READY':
        return (
          <span className="inline-flex items-center gap-1.5 text-slate-500 font-medium text-[10px]">
            <span className="h-1.5 w-1.5 rounded-none border border-slate-600 bg-transparent" />
            READY
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1.5 text-[#FFB84D] font-semibold text-[10px]">
            <span className="h-1.5 w-1.5 rounded-none bg-[#FFB84D]" />
            WARNING
          </span>
        );
      case 'ERROR':
        return (
          <span className="inline-flex items-center gap-1.5 text-[#FF5E5E] font-semibold text-[10px]">
            <span className="h-1.5 w-1.5 rounded-none bg-[#FF5E5E]" />
            ERROR
          </span>
        );
      case 'OFFLINE':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-slate-600 font-medium text-[10px]">
            <span className="h-1.5 w-1.5 rounded-none bg-slate-700" />
            OFFLINE
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
      title: 'PREPROCESSING',
      subtext: 'Polyphase filterbank channelization (4096 ch)',
    },
    {
      key: 'representation',
      title: 'REPRESENTATION',
      subtext: 'Spectrogram patch tokenization & embeddings',
    },
    {
      key: 'anomalySearch',
      title: 'ANOMALY SEARCH',
      subtext: 'Variational latent reconstruction divergence',
    },
    {
      key: 'candidateRanking',
      title: 'CANDIDATE RANKING',
      subtext: 'Topocentric Doppler drift & RFI spatial rejection',
    },
  ];

  return (
    <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-4 font-mono select-none flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <Layers className="h-3.5 w-3.5 text-[#66E3FF]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#EAF4F7]">
              PROCESSING PIPELINE
            </h3>
          </div>
          <span className="text-[10px] text-[#84929C] uppercase tracking-wider">PIPELINE V2.4</span>
        </div>

        {/* Pipeline Stage Items */}
        <div className="mt-3 divide-y divide-slate-800/60">
          {stageList.map((item, idx) => {
            const currentStageStatus = stages[item.key];
            const isActive = currentStageStatus === 'ACTIVE';

            return (
              <div
                key={item.key}
                className={`py-2.5 transition-colors ${
                  isActive ? 'bg-[#06b6d4]/5 px-2 -mx-2 rounded-[2px]' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-500 font-semibold">0{idx + 1}</span>
                    <span className="text-xs font-semibold text-[#EAF4F7] tracking-wider uppercase">
                      {item.title}
                    </span>
                  </div>
                  <div>{renderBadge(currentStageStatus)}</div>
                </div>
                <div className="mt-1 text-[10px] text-[#84929C] pl-5">{item.subtext}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pipeline Throughput Footer */}
      <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-[#84929C]">
        <div className="flex items-center gap-1.5">
          <GitCommit className="h-3 w-3 text-emerald-400" />
          <span>LATENCY: 14.8 ms</span>
        </div>
        <span>BUFFER: 100% HEALTH</span>
      </div>
    </div>
  );
}
