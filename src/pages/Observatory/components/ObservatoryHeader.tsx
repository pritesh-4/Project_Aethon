import type { ObservationStatus } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import { Sparkles, Play, Pause, RotateCcw } from 'lucide-react';

export interface ObservatoryHeaderProps {
  observationId: string;
  status: ObservationStatus;
  targetName: string;
  telescope: string;
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
  telescope,
  observationList,
  onSelectObservation,
  isPaused,
  onStartAnalysis,
  onTogglePause,
  onReset,
}: ObservatoryHeaderProps) {
  const isAnalyzing = status === 'ANALYZING' || status === 'LOADING';
  const hasResult = status === 'ANOMALY_DETECTED' || status === 'CANDIDATE_READY';

  const getStatusColor = (s: ObservationStatus) => {
    switch (s) {
      case 'IDLE':
        return 'text-[#7F8B95] border-[#1C2630] bg-[#10161D]';
      case 'LOADING':
      case 'ANALYZING':
      case 'CANDIDATE_READY':
        return 'text-[#5BD8F5] border-[#5BD8F5]/30 bg-[#0E1A22]';
      case 'ANOMALY_DETECTED':
        return 'text-[#E8AE50] border-[#E8AE50]/40 bg-[#1C160E]';
    }
  };

  const getStatusLabel = (s: ObservationStatus) => {
    switch (s) {
      case 'IDLE':
        return 'Standby';
      case 'LOADING':
        return 'Buffering';
      case 'ANALYZING':
        return 'Analyzing';
      case 'ANOMALY_DETECTED':
        return 'Anomaly detected';
      case 'CANDIDATE_READY':
        return 'Candidate ready';
    }
  };

  return (
    <header className="border-b border-[#1C2630] bg-[#0B0F14] px-4 py-3 select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Title, Observation Switcher & Status */}
        <div className="flex flex-wrap items-center gap-3 text-xs font-sans">
          <span className="text-sm font-semibold tracking-wide text-[#E6EDF2]">Observatory</span>

          <span className="text-[#1C2630] hidden sm:inline">|</span>

          {/* Observation Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#7F8B95]">Observation:</span>
            <select
              aria-label="Select Observation Record"
              value={observationId}
              onChange={(e) => onSelectObservation(e.target.value)}
              disabled={isAnalyzing}
              className="h-7 rounded-[4px] border border-[#1C2630] bg-[#10161D] px-2 text-xs font-mono text-[#5BD8F5] focus:border-[#5BD8F5] focus:outline-none transition-colors cursor-pointer"
            >
              {observationList.map((obs) => (
                <option key={obs.id} value={obs.id}>
                  {obs.id} — {obs.name}
                </option>
              ))}
            </select>
          </div>

          <span className="text-[#1C2630] hidden sm:inline">|</span>

          {/* Status Badge */}
          <div className="flex items-center gap-1.5">
            <span
              className={`rounded-[4px] border px-2 py-0.5 text-xs font-medium ${getStatusColor(
                status
              )}`}
            >
              {getStatusLabel(status)}
            </span>
          </div>

          {/* Target & Telescope Breadcrumb */}
          <span className="text-xs text-[#7F8B95] hidden lg:inline">
            {targetName} · {telescope}
          </span>
        </div>

        {/* Right: Primary Action & Playback Controls */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          {/* Reset button (visible when not idle) */}
          {status !== 'IDLE' && (
            <Button
              variant="ghost"
              size="sm"
              icon={<RotateCcw className="h-3.5 w-3.5" />}
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
              variant="outline"
              size="sm"
              icon={isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
              onClick={onTogglePause}
              title={isPaused ? 'Resume observation playback' : 'Pause observation playback'}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </Button>
          )}

          {/* PRIMARY ACTION */}
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
