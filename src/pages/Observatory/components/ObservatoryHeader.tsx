import type { ObservationStatus } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import { Play, Pause, RotateCcw, Radio } from 'lucide-react';

export interface ObservatoryHeaderProps {
  observationId: string;
  status: ObservationStatus;
  targetName: string;
  frequencyMHz: number;
  observationList: { id: string; name: string }[];
  onSelectObservation: (id: string) => void;
  isPaused: boolean;
  onStartAnalysis: () => void;
  onTogglePause: () => void;
  onReset: () => void;
}

export function ObservatoryHeader({
  observationId,
  status,
  targetName,
  frequencyMHz,
  observationList,
  onSelectObservation,
  isPaused,
  onStartAnalysis,
  onTogglePause,
  onReset,
}: ObservatoryHeaderProps) {
  const isAnalyzing = status === 'ANALYZING' || status === 'LOADING';
  const hasResult = status === 'ANOMALY_DETECTED' || status === 'CANDIDATE_READY';

  const getStatusIndicator = (s: ObservationStatus) => {
    switch (s) {
      case 'IDLE':
        return { dot: 'bg-[#6B706A]', label: 'Standby', color: 'text-[#848780]' };
      case 'LOADING':
        return {
          dot: 'bg-[#D4864A] animate-pulse',
          label: 'Buffering stream',
          color: 'text-[#D4864A]',
        };
      case 'ANALYZING':
        return {
          dot: 'bg-[#D4864A] animate-pulse',
          label: 'Scanning baseline',
          color: 'text-[#D4864A]',
        };
      case 'ANOMALY_DETECTED':
        return { dot: 'bg-[#D4864A]', label: 'Anomaly detected', color: 'text-[#D4864A]' };
      case 'CANDIDATE_READY':
        return { dot: 'bg-[#529E72]', label: 'Candidate isolated', color: 'text-[#529E72]' };
    }
  };

  const statusInfo = getStatusIndicator(status);

  return (
    <header className="border-b border-[#242825] bg-[#0E100F] px-4 sm:px-6 py-6 sm:py-8 select-none font-sans">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Top: Page Identity & Description */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#767973] uppercase tracking-wider">
              <span>AETHON WORKSPACE</span>
              <span>/</span>
              <span>LIVE FEED</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-normal tracking-tight text-[#E6E4DD]">
              Observatory
            </h1>
            <p className="text-sm text-[#9A9C96] leading-relaxed max-w-xl">
              Real-time RF spectrogram ingestion, automated drift tracking, and live candidate event
              isolation.
            </p>
          </div>

          {/* Status Display */}
          <div className="flex items-center gap-2 self-start sm:self-end pb-1 font-mono text-xs">
            <span
              className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-[2px] border border-[#242825] bg-[#121413] ${statusInfo.color}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
              <span className="text-[11px] uppercase tracking-wider">{statusInfo.label}</span>
            </span>
          </div>
        </div>

        {/* 1. WHAT OBSERVATION IS ACTIVE + 4. WHAT CAN I DO? */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-4 border-t border-[#1F2321]">
          {/* Active Target Information */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <div className="flex items-center gap-2">
              <Radio className="h-3.5 w-3.5 text-[#D4864A]" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#767973]">
                Target:
              </span>
            </div>

            {/* Target Selector Control */}
            <div className="relative">
              <select
                aria-label="Load Observation Record"
                value={observationId}
                onChange={(e) => onSelectObservation(e.target.value)}
                disabled={isAnalyzing}
                className="h-8 rounded-[2px] border border-[#242825] bg-[#141715] px-2.5 pr-8 text-xs font-mono text-[#E6E4DD] focus:border-[#D4864A] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A] transition-colors cursor-pointer"
              >
                {observationList.map((obs) => (
                  <option key={obs.id} value={obs.id}>
                    {obs.id} — {obs.name}
                  </option>
                ))}
              </select>
            </div>

            <span className="text-[#363C38] hidden sm:inline">•</span>

            <span className="font-mono text-[#C9C8C0] text-xs">{frequencyMHz.toFixed(4)} MHz</span>

            <span className="text-[#363C38] hidden sm:inline">•</span>

            <span className="text-xs text-[#848780]">{targetName}</span>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 self-start lg:self-auto">
            {/* Reset */}
            {status !== 'IDLE' && (
              <button
                type="button"
                onClick={onReset}
                disabled={isAnalyzing}
                title="Reset observation"
                className="h-8 px-2.5 flex items-center gap-1.5 rounded-[2px] border border-[#242825] bg-[#141715] text-xs font-mono text-[#848780] hover:text-[#E6E4DD] hover:border-[#383E3A] transition-colors cursor-pointer disabled:opacity-40"
              >
                <RotateCcw className="h-3 w-3" />
                <span className="hidden sm:inline">RESET</span>
              </button>
            )}

            {/* Pause / Resume */}
            {status !== 'IDLE' && (
              <button
                type="button"
                onClick={onTogglePause}
                title={isPaused ? 'Resume playback' : 'Pause playback'}
                className="h-8 px-2.5 flex items-center gap-1.5 rounded-[2px] border border-[#242825] bg-[#141715] text-xs font-mono text-[#848780] hover:text-[#E6E4DD] hover:border-[#383E3A] transition-colors cursor-pointer"
              >
                {isPaused ? (
                  <Play className="h-3 w-3 text-[#529E72]" />
                ) : (
                  <Pause className="h-3 w-3" />
                )}
                <span className="hidden sm:inline">{isPaused ? 'RESUME' : 'PAUSE'}</span>
              </button>
            )}

            {/* Primary Action Button */}
            <Button
              variant="primary"
              size="md"
              onClick={onStartAnalysis}
              state={isAnalyzing ? 'loading' : 'idle'}
              loadingText="Scanning baseline..."
              disabled={isAnalyzing}
              className="text-xs font-medium px-4"
            >
              {hasResult ? 'Re-analyze observation' : 'Analyze observation'}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
