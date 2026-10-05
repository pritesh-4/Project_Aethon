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
    <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-3 font-mono text-xs select-none">
      {/* Observation Metadata Readouts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 border-b md:border-b-0 md:border-r border-slate-800/80 pb-3 md:pb-0 md:pr-6">
        <div>
          <span className="block text-[10px] text-[#84929C] uppercase tracking-wider">
            OBSERVATION
          </span>
          <span className="text-xs font-semibold text-[#EAF4F7] tracking-wider">
            {observation.id}
          </span>
        </div>

        <div>
          <span className="block text-[10px] text-[#84929C] uppercase tracking-wider">
            FREQUENCY
          </span>
          <span className="text-xs font-semibold text-[#66E3FF] tracking-wider">
            {observation.frequencyMHz.toFixed(2)} MHz
          </span>
        </div>

        <div>
          <span className="block text-[10px] text-[#84929C] uppercase tracking-wider">WINDOW</span>
          <span className="text-xs font-semibold text-[#EAF4F7] tracking-wider">
            {observation.windowDuration}
          </span>
        </div>

        <div>
          <span className="block text-[10px] text-[#84929C] uppercase tracking-wider">
            BANDWIDTH
          </span>
          <span className="text-xs font-semibold text-[#EAF4F7] tracking-wider">
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
          title="Reload observation buffer"
        >
          LOAD OBSERVATION
        </Button>

        <Button
          variant="primary"
          size="sm"
          icon={<Sparkles className="h-3.5 w-3.5 text-[#66E3FF]" />}
          onClick={onStartAnalysis}
          state={isAnalyzing ? 'loading' : 'idle'}
          loadingText="ANALYZING..."
          disabled={isAnalyzing}
          title="Initiate ML anomaly detection pipeline"
        >
          {hasResult ? 'RE-ANALYZE' : 'ANALYZE'}
        </Button>

        <Button
          variant="outline"
          size="sm"
          icon={isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
          onClick={onTogglePause}
          disabled={status === 'IDLE'}
          title={isPaused ? 'Resume observation playback' : 'Pause observation playback'}
        >
          {isPaused ? 'RESUME' : 'PAUSE'}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          icon={<RotateCcw className="h-3.5 w-3.5" />}
          onClick={onReset}
          disabled={status === 'IDLE' && !isPaused}
          title="Reset to initial state"
        >
          RESET
        </Button>
      </div>
    </div>
  );
}
