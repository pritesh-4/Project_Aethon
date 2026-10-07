import type { ObservationStatus } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import { Sparkles, Play, Pause, RotateCcw } from 'lucide-react';

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
          dot: 'bg-[#7F8B95]',
          label: 'Standby',
          style: 'border-[#172230] text-[#7F8B95]',
        };
      case 'LOADING':
        return {
          dot: 'bg-[#5BD8F5]',
          label: 'Buffering',
          style: 'border-[#5BD8F5]/30 text-[#5BD8F5]',
        };
      case 'ANALYZING':
        return {
          dot: 'bg-[#5BD8F5]',
          label: 'Analyzing',
          style: 'border-[#5BD8F5]/30 text-[#5BD8F5]',
        };
      case 'ANOMALY_DETECTED':
        return {
          dot: 'bg-[#E8AE50]',
          label: 'Anomaly detected',
          style: 'border-[#E8AE50]/40 text-[#E8AE50]',
        };
      case 'CANDIDATE_READY':
        return {
          dot: 'bg-[#5BD8F5]',
          label: 'Candidate isolated',
          style: 'border-[#5BD8F5]/40 text-[#5BD8F5]',
        };
    }
  };

  const statusBadge = getStatusBadge(status);

  return (
    <header className="border-b border-[#172230] bg-[#0B0F14] px-4 py-3 select-none font-sans">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Title, Simulated Badge & Observation Context */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm tracking-wide text-[#E6EDF2]">Observatory</span>
            <span className="rounded-[3px] border border-[#172230] bg-[#10161D] px-2 py-0.5 text-[10px] font-mono text-[#7F8B95]">
              SIMULATED OBSERVATION
            </span>
          </div>

          <span className="text-[#172230] hidden sm:inline">|</span>

          {/* Target & Frequency Context */}
          <div className="flex items-center gap-2 text-[#7F8B95]">
            <span>Target:</span>
            <span className="text-[#E6EDF2] font-medium">{targetName}</span>
            <span>·</span>
            <span className="text-[#5BD8F5] font-mono">{frequencyMHz.toFixed(4)} MHz</span>
          </div>

          <span className="text-[#172230] hidden sm:inline">|</span>

          {/* Status Indicator */}
          <div
            className={`inline-flex items-center gap-1.5 rounded-[4px] border px-2 py-0.5 text-xs font-medium ${statusBadge.style}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${statusBadge.dot}`} />
            <span>{statusBadge.label}</span>
          </div>
        </div>

        {/* Right: Controls & Primary Action */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Secondary Action: Load Observation */}
          <div className="flex items-center gap-1.5">
            <label htmlFor="obs-selector" className="text-xs text-[#7F8B95]">
              Load:
            </label>
            <select
              id="obs-selector"
              aria-label="Load Observation Record"
              value={observationId}
              onChange={(e) => onSelectObservation(e.target.value)}
              disabled={isAnalyzing}
              className="h-7 rounded-[4px] border border-[#172230] bg-[#10161D] px-2 text-xs font-mono text-[#E6EDF2] focus:border-[#5BD8F5] focus:outline-none transition-colors cursor-pointer"
            >
              {observationList.map((obs) => (
                <option key={obs.id} value={obs.id}>
                  {obs.id} — {obs.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset button (visible when active) */}
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
            icon={<Sparkles className="h-3.5 w-3.5" />}
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
