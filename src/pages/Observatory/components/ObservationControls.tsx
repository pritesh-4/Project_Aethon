import type { ObservationData, ObservationStatus } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import { Play, Pause, RotateCcw, Sparkles, FolderOpen } from 'lucide-react';

export interface ObservationControlsProps {
  observation: ObservationData;
  status: ObservationStatus;
  isPaused: boolean;
  onLoadObservation: () => void;
  onStartAnalysis: () => void;
  onTogglePause: () => void;
  onReset: () => void;
}

export function ObservationControls({
  observation,
  status,
  isPaused,
  onLoadObservation,
  onStartAnalysis,
  onTogglePause,
  onReset,
}: ObservationControlsProps) {
  const isAnalyzing = status === 'ANALYZING' || status === 'LOADING';
  const hasResult = status === 'ANOMALY_DETECTED' || status === 'CANDIDATE_READY';

  return (
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded border border-[#1C2630] bg-[#0B0F14] p-3 text-xs select-none">
      {/* Observation Metadata Readouts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 border-b md:border-b-0 md:border-r border-[#1C2630] pb-3 md:pb-0 md:pr-6">
        <div>
          <span className="block text-[11px] text-[#7F8B95]">Observation</span>
          <span className="text-xs font-medium text-[#E6EDF2] font-mono">{observation.id}</span>
        </div>

        <div>
          <span className="block text-[11px] text-[#7F8B95]">Center frequency</span>
          <span className="text-xs font-medium text-[#5BD8F5] font-mono">
            {observation.frequencyMHz.toFixed(2)} MHz
          </span>
        </div>

        <div>
          <span className="block text-[11px] text-[#7F8B95]">Duration</span>
          <span className="text-xs font-medium text-[#E6EDF2] font-mono">
            {observation.windowDuration}
          </span>
        </div>

        <div>
          <span className="block text-[11px] text-[#7F8B95]">Bandwidth</span>
          <span className="text-xs font-medium text-[#E6EDF2] font-mono">
            {observation.bandwidthMHz.toFixed(1)} MHz
          </span>
        </div>
      </div>

      {/* Action Controls using Existing AETHON Button Component */}
      <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
        <Button
          variant="secondary"
          size="sm"
          icon={<FolderOpen className="h-3.5 w-3.5" />}
          onClick={onLoadObservation}
          disabled={isAnalyzing}
          title="Reload observation"
        >
          Load observation
        </Button>

        <Button
          variant="primary"
          size="sm"
          icon={<Sparkles className="h-3.5 w-3.5 text-[#5BD8F5]" />}
          onClick={onStartAnalysis}
          state={isAnalyzing ? 'loading' : 'idle'}
          loadingText="Analyzing..."
          disabled={isAnalyzing}
          title="Initiate anomaly detection pipeline"
        >
          {hasResult ? 'Re-analyze' : 'Analyze'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          icon={isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          onClick={onTogglePause}
          disabled={status === 'IDLE'}
          title={isPaused ? 'Resume observation playback' : 'Pause observation playback'}
        >
          {isPaused ? 'Resume' : 'Pause'}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          icon={<RotateCcw className="h-3.5 w-3.5" />}
          onClick={onReset}
          disabled={status === 'IDLE' && !isPaused}
          title="Reset to initial state"
        >
          Reset
        </Button>
      </div>
    </div>
  );
}
