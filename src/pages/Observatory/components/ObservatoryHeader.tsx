import type { ObservationStatus } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import { Play, Pause, RotateCcw, Radio, Upload } from 'lucide-react';

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
  onOpenUpload?: () => void;
  isDemoMode?: boolean;
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
  onOpenUpload,
  isDemoMode = false,
}: ObservatoryHeaderProps) {
  const isAnalyzing = status === 'ANALYZING' || status === 'LOADING';
  const hasResult = status === 'ANOMALY_DETECTED' || status === 'CANDIDATE_READY';

  const getStatusIndicator = (s: ObservationStatus) => {
    switch (s) {
      case 'IDLE':
        return {
          dot: 'bg-[#7E8B96]',
          label: 'Standby',
          color: 'text-[#56616A] bg-[#EAE7E0] border-[#D6D2C9]',
        };
      case 'LOADING':
        return {
          dot: 'bg-[#376A9B] animate-pulse',
          label: 'Buffering stream',
          color: 'text-[#376A9B] bg-[#EAF1F8] border-[#B6CDE2]',
        };
      case 'ANALYZING':
        return {
          dot: 'bg-[#376A9B] animate-pulse',
          label: 'Scanning baseline',
          color: 'text-[#376A9B] bg-[#EAF1F8] border-[#B6CDE2]',
        };
      case 'ANOMALY_DETECTED':
        return {
          dot: 'bg-[#C19348]',
          label: 'Anomaly detected',
          color: 'text-[#C19348] bg-[#FDF8EE] border-[#E8D2A3]',
        };
      case 'CANDIDATE_READY':
        return {
          dot: 'bg-[#3D7D54]',
          label: 'Candidate isolated',
          color: 'text-[#3D7D54] bg-[#EFF7F2] border-[#B2D8C0]',
        };
    }
  };

  const statusInfo = getStatusIndicator(status);

  return (
    <header className="border-b border-[#D6D2C9] bg-[#FAF8F5] px-4 sm:px-6 py-5 sm:py-6 select-none font-sans">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Top: Page Identity & Description */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono text-[#7E8B96] uppercase tracking-wider">
              <span>AETHON WORKSPACE</span>
              <span>/</span>
              <span>LIVE OBSERVATION</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#17202A]">
              Observatory
            </h1>
            <p className="text-sm text-[#56616A] leading-relaxed max-w-xl">
              Real-time RF spectrogram ingestion, automated drift tracking, and live candidate event
              isolation.
            </p>
          </div>

          {/* Status Display */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-end pb-1 font-mono text-xs">
            {isDemoMode && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[3px] border border-[#E8CFA0] bg-[#FDF6E9] text-[10px] font-mono text-[#9E6E20] font-semibold">
                DEMO MODE: Synthetic Data
              </span>
            )}
            <span
              className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-[3px] border ${statusInfo.color}`}
            >
              <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
              <span className="text-[11px] font-sans font-medium uppercase tracking-wider">
                {statusInfo.label}
              </span>
            </span>
          </div>
        </div>

        {/* 1. WHAT OBSERVATION IS ACTIVE + 4. WHAT CAN I DO? */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-4 border-t border-[#D6D2C9]">
          {/* Active Target Information */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
            <div className="flex items-center gap-2">
              <Radio className="h-3.5 w-3.5 text-[#376A9B]" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-[#7E8B96]">
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
                className="h-8 rounded-[3px] border border-[#D6D2C9] bg-[#FFFFFF] px-2.5 pr-8 text-xs font-mono text-[#17202A] focus:border-[#376A9B] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#376A9B] transition-colors cursor-pointer"
              >
                {observationList.map((obs) => (
                  <option key={obs.id} value={obs.id}>
                    {obs.id} — {obs.name}
                  </option>
                ))}
              </select>
            </div>

            {onOpenUpload && (
              <button
                type="button"
                onClick={onOpenUpload}
                disabled={isAnalyzing}
                title="Ingest new astronomical observation file (.fil, .fits)"
                className="h-8 px-2.5 flex items-center gap-1.5 rounded-[3px] border border-[#B6CDE2] bg-[#EAF1F8] text-xs font-mono text-[#376A9B] hover:bg-[#D8E6F3] transition-colors cursor-pointer disabled:opacity-40"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>INGEST FILE</span>
              </button>
            )}

            <span className="text-[#D6D2C9] hidden sm:inline">•</span>

            <span className="font-mono text-[#17202A] text-xs font-medium">
              {frequencyMHz.toFixed(4)} MHz
            </span>

            <span className="text-[#D6D2C9] hidden sm:inline">•</span>

            <span className="text-xs text-[#56616A]">{targetName}</span>
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
                className="h-8 px-2.5 flex items-center gap-1.5 rounded-[3px] border border-[#D6D2C9] bg-[#FAF8F5] text-xs font-mono text-[#56616A] hover:text-[#17202A] hover:border-[#BCB6A8] hover:bg-[#EAE7E0] transition-colors cursor-pointer disabled:opacity-40"
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
                className="h-8 px-2.5 flex items-center gap-1.5 rounded-[3px] border border-[#D6D2C9] bg-[#FAF8F5] text-xs font-mono text-[#56616A] hover:text-[#17202A] hover:border-[#BCB6A8] hover:bg-[#EAE7E0] transition-colors cursor-pointer"
              >
                {isPaused ? (
                  <Play className="h-3 w-3 text-[#3D7D54]" />
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
