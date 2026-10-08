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

  const getStatusBadge = (s: ObservationStatus) => {
    switch (s) {
      case 'IDLE':
        return {
          dot: 'bg-[#6B706A]',
          label: 'Standby',
          style: 'border-[#262C28] text-[#9A9C96]',
        };
      case 'LOADING':
        return {
          dot: 'bg-[#D4864A]',
          label: 'Buffering',
          style: 'border-[#D4864A]/30 text-[#D4864A]',
        };
      case 'ANALYZING':
        return {
          dot: 'bg-[#D4864A]',
          label: 'Analyzing',
          style: 'border-[#D4864A]/30 text-[#D4864A]',
        };
      case 'ANOMALY_DETECTED':
        return {
          dot: 'bg-[#D4864A]',
          label: 'Anomaly detected',
          style: 'border-[#D4864A]/40 text-[#D4864A]',
        };
      case 'CANDIDATE_READY':
        return {
          dot: 'bg-[#529E72]',
          label: 'Candidate isolated',
          style: 'border-[#529E72]/40 text-[#529E72]',
        };
    }
  };

  const statusBadge = getStatusBadge(status);

  return (
    <header className="border-b border-[#262C28] bg-[#141715] px-4 py-3 select-none font-sans">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Title, Simulated Badge & Observation Context */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-tight text-[#E6E4DD]">Observatory</span>
            <span className="rounded-[2px] border border-[#262C28] bg-[#1A1E1B] px-2 py-0.5 text-[11px] text-[#9A9C96]">
              Simulated observation
            </span>
          </div>

          {/* Target & Frequency Context */}
          <div className="flex items-center gap-2 text-[#9A9C96]">
            <span>Target:</span>
            <span className="text-[#E6E4DD] font-medium">{targetName}</span>
            <span>·</span>
            <span className="text-[#E6E4DD] font-mono">{frequencyMHz.toFixed(4)} MHz</span>
          </div>

          {/* Status Indicator */}
          <div
            className={`inline-flex items-center gap-1.5 rounded-[2px] border px-2 py-0.5 text-xs font-medium ${statusBadge.style}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusBadge.dot}`} />
            <span>{statusBadge.label}</span>
          </div>
        </div>

        {/* Right: Controls & Primary Action */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Load Observation Record */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="obs-selector" className="text-xs text-[#9A9C96]">
              Record:
            </label>
            <select
              id="obs-selector"
              aria-label="Load Observation Record"
              value={observationId}
              onChange={(e) => onSelectObservation(e.target.value)}
              disabled={isAnalyzing}
              className="h-7.5 rounded-[2px] border border-[#262C28] bg-[#1A1E1B] px-2 text-xs font-mono text-[#E6E4DD] focus:border-[#D4864A] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A] transition-colors cursor-pointer"
            >
              {observationList.map((obs) => (
                <option key={obs.id} value={obs.id}>
                  {obs.id} — {obs.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset button */}
          {status !== 'IDLE' && (
            <Button
              variant="tertiary"
              size="sm"
              icon={<RotateCcw className="h-3 w-3" />}
              onClick={onReset}
              disabled={isAnalyzing}
              title="Reset observation"
            >
              Reset
            </Button>
          )}

          {/* Pause / Resume button */}
          {status !== 'IDLE' && (
            <Button
              variant="tertiary"
              size="sm"
              icon={isPaused ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
              onClick={onTogglePause}
              title={isPaused ? 'Resume playback' : 'Pause playback'}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
          )}

          {/* PRIMARY ACTION: ANALYZE */}
          <Button
            variant="primary"
            size="sm"
            onClick={onStartAnalysis}
            state={isAnalyzing ? 'loading' : 'idle'}
            loadingText="Analyzing..."
            disabled={isAnalyzing}
          >
            {hasResult ? 'Re-analyze' : 'Analyze observation'}
          </Button>
        </div>
      </div>
    </header>
  );
}
