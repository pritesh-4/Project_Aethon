import type { ObservationStatus } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import { Play, Pause, RotateCcw } from 'lucide-react';

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
        return { dot: 'bg-[#6B706A]', label: 'Standby', color: 'text-[#9A9C96]' };
      case 'LOADING':
        return { dot: 'bg-[#D4864A]', label: 'Buffering', color: 'text-[#D4864A]' };
      case 'ANALYZING':
        return { dot: 'bg-[#D4864A]', label: 'Analyzing', color: 'text-[#D4864A]' };
      case 'ANOMALY_DETECTED':
        return { dot: 'bg-[#D4864A]', label: 'Anomaly detected', color: 'text-[#D4864A]' };
      case 'CANDIDATE_READY':
        return { dot: 'bg-[#529E72]', label: 'Candidate isolated', color: 'text-[#529E72]' };
    }
  };

  const statusInfo = getStatusIndicator(status);

  return (
    <header className="border-b border-[#242825] bg-[#0F1110] px-4 sm:px-6 py-2.5 select-none font-sans">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
        {/* Left: Identity + Status */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs min-w-0">
          <h1 className="text-sm font-medium tracking-tight text-[#E6E4DD] shrink-0">
            Observatory
          </h1>
          <span className="text-[10px] text-[#666963] uppercase tracking-wider shrink-0">
            Simulated
          </span>
          <span className="text-[#242825] hidden sm:inline">·</span>
          <span className="text-[#9A9C96] hidden sm:inline">{targetName}</span>
          <span className="text-[#242825] hidden sm:inline">·</span>
          <span className="text-[#E6E4DD] font-mono hidden sm:inline">
            {frequencyMHz.toFixed(4)} MHz
          </span>
          <span className="text-[#242825] hidden sm:inline">·</span>

          {/* Status — inline dot + label, not a bordered badge */}
          <span className={`inline-flex items-center gap-1.5 ${statusInfo.color}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${statusInfo.dot}`} />
            <span className="text-xs font-medium">{statusInfo.label}</span>
          </span>
        </div>

        {/* Right: Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Record selector */}
          <select
            aria-label="Load Observation Record"
            value={observationId}
            onChange={(e) => onSelectObservation(e.target.value)}
            disabled={isAnalyzing}
            className="h-7 rounded-sm border border-[#242825] bg-[#141715] px-2 text-xs font-mono text-[#E6E4DD] focus:border-[#D4864A] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A] transition-colors cursor-pointer"
          >
            {observationList.map((obs) => (
              <option key={obs.id} value={obs.id}>
                {obs.id} — {obs.name}
              </option>
            ))}
          </select>

          {/* Reset */}
          {status !== 'IDLE' && (
            <button
              type="button"
              onClick={onReset}
              disabled={isAnalyzing}
              title="Reset observation"
              className="h-7 w-7 flex items-center justify-center rounded-sm text-[#666963] hover:text-[#E6E4DD] hover:bg-[#141715] transition-colors cursor-pointer disabled:opacity-40"
            >
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          )}

          {/* Pause / Resume */}
          {status !== 'IDLE' && (
            <button
              type="button"
              onClick={onTogglePause}
              title={isPaused ? 'Resume playback' : 'Pause playback'}
              className="h-7 w-7 flex items-center justify-center rounded-sm text-[#666963] hover:text-[#E6E4DD] hover:bg-[#141715] transition-colors cursor-pointer"
            >
              {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            </button>
          )}

          {/* PRIMARY ACTION */}
          <Button
            variant="primary"
            size="sm"
            onClick={onStartAnalysis}
            state={isAnalyzing ? 'loading' : 'idle'}
            loadingText="Analyzing..."
            disabled={isAnalyzing}
          >
            {hasResult ? 'Re-analyze' : 'Analyze'}
          </Button>
        </div>
      </div>
    </header>
  );
}
