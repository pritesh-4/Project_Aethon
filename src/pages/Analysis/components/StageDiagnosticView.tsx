import type { PipelineStageId, SignalAnalysisRecord } from '../types.ts';
import { Radio, Filter, Waves, Cpu, Zap, Award } from 'lucide-react';

export interface StageDiagnosticViewProps {
  activeStage: PipelineStageId;
  record: SignalAnalysisRecord;
}

export function StageDiagnosticView({ activeStage, record }: StageDiagnosticViewProps) {
  return (
    <div className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-4 font-mono select-none">
      {/* STAGE 01 — OBSERVATION */}
      {activeStage === 'observation' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#1C2630] pb-2">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-[#5BD8F5]" />
              <h4 className="text-xs font-medium text-[#E6EDF2]">Stage 1: Observation</h4>
            </div>
            <span className="text-[10px] text-[#7F8B95]">Ingestion complete</span>
          </div>

          <p className="text-xs text-[#7F8B95] font-sans leading-relaxed max-w-3xl">
            Complex voltage measurements acquired across a defined temporal and frequency window.
            Receiver calibrated to rest frame HI emission with systemic noise temperature normalized
            at 18.4 K.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
            <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-2">
              <span className="block text-[9px] text-[#7F8B95]">Sampling rate</span>
              <span className="text-xs font-medium text-[#E6EDF2]">25.0 MSps</span>
            </div>
            <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-2">
              <span className="block text-[9px] text-[#7F8B95]">System temp</span>
              <span className="text-xs font-medium text-[#5BD8F5]">18.4 K</span>
            </div>
            <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-2">
              <span className="block text-[9px] text-[#7F8B95]">Polarization</span>
              <span className="text-xs font-medium text-[#E6EDF2]">Dual circular (LCP/RCP)</span>
            </div>
            <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-2">
              <span className="block text-[9px] text-[#7F8B95]">Cadence</span>
              <span className="text-xs font-medium text-[#5BD8F5]">4 × 68.0s (ON/OFF)</span>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 02 — PREPROCESSING */}
      {activeStage === 'preprocessing' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#1C2630] pb-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#5BD8F5]" />
              <h4 className="text-xs font-medium text-[#E6EDF2]">Stage 2: Preprocessing</h4>
            </div>
            <span className="text-[10px] text-[#5BD8F5] font-medium">Filtered</span>
          </div>

          <p className="text-xs text-[#7F8B95] font-sans leading-relaxed max-w-3xl">
            Polyphase filterbank channelization and baseline noise normalization prepare raw voltage
            data for representation learning and anomaly detection.
          </p>

          {/* Before / After Scientific Diagnostic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#7F8B95] font-medium">Raw spectrum</span>
                <span className="text-[#E8AE50] font-mono">Interference present</span>
              </div>
              <div className="h-8 w-full bg-[#06080B] border border-[#1C2630] flex items-center justify-center font-mono text-[9px] text-[#7F8B95] tracking-wider">
                ░░░▒▒▓▓████▓▓▒▒░░░░░▒▒▓▓░░░
              </div>
              <span className="block text-[9px] text-[#7F8B95]">
                Harmonics and sideband spikes present
              </span>
            </div>

            <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#5BD8F5] font-medium">Filtered candidate</span>
                <span className="text-[#5BD8F5] font-mono">Baseline normalized</span>
              </div>
              <div className="h-8 w-full bg-[#06080B] border border-[#1C2630] flex items-center justify-center font-mono text-[9px] text-[#5BD8F5] tracking-wider">
                ░░░░░░░░░████░░░░░░░░░░░░░░
              </div>
              <span className="block text-[9px] text-[#7F8B95]">
                Noise floor flattened, candidate isolated
              </span>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 03 — TIME-FREQUENCY TRANSFORM */}
      {activeStage === 'transform' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#1C2630] pb-2">
            <div className="flex items-center gap-2">
              <Waves className="h-4 w-4 text-[#5BD8F5]" />
              <h4 className="text-xs font-medium text-[#E6EDF2]">
                Stage 3: Time–frequency transform
              </h4>
            </div>
            <span className="text-[10px] text-[#5BD8F5] font-medium">Spectrogram generated</span>
          </div>

          <p className="text-xs text-[#7F8B95] font-sans leading-relaxed max-w-3xl">
            Short-Time Fourier Transformation converts continuous 1D time-domain signals into a 2D
            spectrotemporal representation:
          </p>

          <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-3 flex flex-wrap items-center justify-around gap-4 text-center">
            <div>
              <span className="block text-[9px] text-[#7F8B95]">Cadence</span>
              <span className="text-xs font-medium text-[#E6EDF2]">1.00s</span>
            </div>
            <span className="text-[#7F8B95] font-medium">×</span>
            <div>
              <span className="block text-[9px] text-[#7F8B95]">Spectral channels</span>
              <span className="text-xs font-medium text-[#5BD8F5]">4096</span>
            </div>
            <span className="text-[#7F8B95] font-medium">↓</span>
            <div>
              <span className="block text-[9px] text-[#7F8B95]">Resolution</span>
              <span className="text-xs font-medium text-[#5BD8F5]">3.8 Hz / ch</span>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 04 — REPRESENTATION LEARNING */}
      {activeStage === 'representation' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#1C2630] pb-2">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[#5BD8F5]" />
              <h4 className="text-xs font-medium text-[#E6EDF2]">Stage 4: Representation space</h4>
            </div>
            <span className="text-[10px] text-[#E8AE50] font-medium">Simulated representation</span>
          </div>

          <p className="text-xs text-[#7F8B95] font-sans leading-relaxed max-w-3xl">
            Spectrogram patches are encoded into a compact 512-dimensional latent embedding space
            that captures structural features independent of amplitude fluctuations:
          </p>

          <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-2.5 text-[11px] text-[#7F8B95] flex items-center justify-between">
            <span className="text-[#E6EDF2]">
              Candidate <strong className="text-[#5BD8F5]">{record.candidateId}</strong> occupies an
              isolated coordinate outside known signal clusters.
            </span>
            <span className="text-[9px] text-[#7F8B95] font-mono">Simulated demonstration</span>
          </div>
        </div>
      )}

      {/* STAGE 05 — ANOMALY ASSESSMENT */}
      {activeStage === 'anomaly' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#1C2630] pb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#5BD8F5]" />
              <h4 className="text-xs font-medium text-[#E6EDF2]">Stage 5: Anomaly assessment</h4>
            </div>
            <span className="text-[10px] text-[#E8AE50] font-medium">+4.8σ divergence</span>
          </div>

          <p className="text-xs text-[#7F8B95] font-sans leading-relaxed max-w-3xl">
            The candidate exhibits measurable deviation from learned background distributions while
            maintaining temporal coherence across consecutive observational pointings.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-2">
              <span className="block text-[9px] text-[#7F8B95]">Anomaly index</span>
              <span className="text-xs font-medium text-[#E8AE50]">
                {record.anomalyIndex.toFixed(3)}
              </span>
            </div>
            <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-2">
              <span className="block text-[9px] text-[#7F8B95]">Known similarity</span>
              <span className="text-xs font-medium text-[#E6EDF2]">
                {(record.knownPatternSimilarity * 100).toFixed(1)}%
              </span>
            </div>
            <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-2">
              <span className="block text-[9px] text-[#7F8B95]">Interference estimate</span>
              <span className="text-xs font-medium text-[#5BD8F5]">
                {(record.interferenceProbability * 100).toFixed(1)}%
              </span>
            </div>
            <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-2">
              <span className="block text-[9px] text-[#7F8B95]">Persistence</span>
              <span className="text-xs font-medium text-[#5BD8F5]">
                {(record.persistence * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 06 — CANDIDATE SCORE */}
      {activeStage === 'candidate_score' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-[#1C2630] pb-2">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-[#E8AE50]" />
              <h4 className="text-xs font-medium text-[#E6EDF2]">Stage 6: Candidate scoring</h4>
            </div>
            <span className="text-[10px] text-[#E8AE50] font-medium">
              High investigation priority
            </span>
          </div>

          <p className="text-xs text-[#7F8B95] font-sans leading-relaxed max-w-3xl">
            Candidate scored against background distribution and drift rate thresholds. Queued for
            scientific review.
          </p>

          <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E8AE50]" />
              <span className="font-medium text-[#E8AE50]">Ready for independent verification</span>
            </div>
            <span className="text-[10px] text-[#7F8B95]">Simulated candidate</span>
          </div>
        </div>
      )}
    </div>
  );
}
