import type { PipelineStageId, SignalAnalysisRecord } from '../types.ts';
import { Radio, Filter, Waves, Cpu, Zap, Award } from 'lucide-react';

export interface StageDiagnosticViewProps {
  activeStage: PipelineStageId;
  record: SignalAnalysisRecord;
}

export function StageDiagnosticView({ activeStage, record }: StageDiagnosticViewProps) {
  return (
    <div className="rounded-[2px] border border-cyan-800/60 bg-[#0A0E13] p-4 font-mono select-none">
      {/* STAGE 01 — OBSERVATION */}
      {activeStage === 'observation' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-[#66E3FF]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#EAF4F7]">
                STAGE 01 — RAW RADIO OBSERVATION
              </h4>
            </div>
            <span className="text-[10px] text-slate-500 uppercase">
              APERTURE INGESTION COMPLETE
            </span>
          </div>

          <p className="text-xs text-slate-300 font-sans leading-relaxed max-w-3xl">
            High-dimensional complex voltage measurements ($I/Q$) acquired across a defined temporal
            and frequency window. Receiver calibrated to rest frame HI emission with systemic noise
            temperature normalized at 18.4 K.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
            <div className="rounded-[2px] border border-slate-800 bg-[#05070A]/80 p-2">
              <span className="block text-[9px] text-[#84929C] uppercase">SAMPLING RATE</span>
              <span className="text-xs font-semibold text-[#EAF4F7]">25.0 MSPS (COMPLEX)</span>
            </div>
            <div className="rounded-[2px] border border-slate-800 bg-[#05070A]/80 p-2">
              <span className="block text-[9px] text-[#84929C] uppercase">SYSTEM TEMP</span>
              <span className="text-xs font-semibold text-cyan-300">18.4 K</span>
            </div>
            <div className="rounded-[2px] border border-slate-800 bg-[#05070A]/80 p-2">
              <span className="block text-[9px] text-[#84929C] uppercase">POLARIZATION</span>
              <span className="text-xs font-semibold text-[#EAF4F7]">DUAL CIRCULAR (LCP/RCP)</span>
            </div>
            <div className="rounded-[2px] border border-slate-800 bg-[#05070A]/80 p-2">
              <span className="block text-[9px] text-[#84929C] uppercase">CADENCE WINDOW</span>
              <span className="text-xs font-semibold text-[#66E3FF]">4 × 68.0s (ON/OFF)</span>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 02 — PREPROCESSING */}
      {activeStage === 'preprocessing' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-[#66E3FF]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#EAF4F7]">
                STAGE 02 — PREPROCESSING & SIGNAL CONDITIONING
              </h4>
            </div>
            <span className="text-[10px] text-emerald-400 uppercase font-semibold">
              PFB NORMALIZED
            </span>
          </div>

          <p className="text-xs text-slate-300 font-sans leading-relaxed max-w-3xl">
            Normalization, polyphase filterbank (PFB) channelization, and automated RFI threshold
            conditioning prepare raw voltage data for downstream representation learning and anomaly
            detection.
          </p>

          {/* Before / After Scientific Diagnostic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="rounded-[2px] border border-slate-800 bg-[#05070A] p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-slate-400 font-semibold uppercase">
                  RAW UNFILTERED SPECTRUM
                </span>
                <span className="text-amber-400 font-mono">TERRESTRIAL RFI PRESENT</span>
              </div>
              <div className="h-8 w-full bg-slate-950/80 border border-slate-800 flex items-center justify-center font-mono text-[9px] text-slate-500 tracking-wider">
                ░░░▒▒▓▓████▓▓▒▒░░░░░▒▒▓▓░░░
              </div>
              <span className="block text-[9px] text-slate-500">
                Contains 50Hz harmonics and radar sideband spikes
              </span>
            </div>

            <div className="rounded-[2px] border border-cyan-800/60 bg-[#05070A] p-2.5 space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-cyan-300 font-semibold uppercase">
                  CONDITIONED CARRIER ISOLATE
                </span>
                <span className="text-emerald-400 font-mono">CLEAN NOISE BASELINE</span>
              </div>
              <div className="h-8 w-full bg-slate-950/80 border border-slate-800 flex items-center justify-center font-mono text-[9px] text-[#66E3FF] tracking-wider">
                ░░░░░░░░░████░░░░░░░░░░░░░░
              </div>
              <span className="block text-[9px] text-slate-500">
                Gaussian white noise normalized, continuous carrier isolated
              </span>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 03 — TIME-FREQUENCY TRANSFORM */}
      {activeStage === 'transform' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Waves className="h-4 w-4 text-[#66E3FF]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#EAF4F7]">
                STAGE 03 — TIME–FREQUENCY REPRESENTATION
              </h4>
            </div>
            <span className="text-[10px] text-cyan-300 uppercase font-semibold">
              STFT TRANSFORMED
            </span>
          </div>

          <p className="text-xs text-slate-300 font-sans leading-relaxed max-w-3xl">
            Short-Time Fourier Transformation converts continuous 1D time-domain signals into a 2D
            spectrotemporal representation:
          </p>

          <div className="rounded-[2px] border border-slate-800 bg-[#05070A] p-3 flex flex-wrap items-center justify-around gap-4 text-center">
            <div>
              <span className="block text-[9px] text-[#84929C] uppercase">TEMPORAL EVOLUTION</span>
              <span className="text-xs font-bold text-slate-200">1.00s Cadence</span>
            </div>
            <span className="text-slate-600 font-bold">×</span>
            <div>
              <span className="block text-[9px] text-[#84929C] uppercase">FREQUENCY STRUCTURE</span>
              <span className="text-xs font-bold text-[#66E3FF]">4096 Spectral Channels</span>
            </div>
            <span className="text-slate-600 font-bold">↓</span>
            <div>
              <span className="block text-[9px] text-[#84929C] uppercase">
                SPECTROTEMPORAL MATRIX
              </span>
              <span className="text-xs font-bold text-emerald-400">3.8 Hz Resolution / Ch</span>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 04 — REPRESENTATION LEARNING */}
      {activeStage === 'representation' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-[#66E3FF]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#EAF4F7]">
                STAGE 04 — REPRESENTATION SPACE
              </h4>
            </div>
            <span className="text-[10px] text-amber-400 uppercase font-semibold">
              DEMONSTRATION EMBEDDING
            </span>
          </div>

          <p className="text-xs text-slate-300 font-sans leading-relaxed max-w-3xl">
            The spectrogram patch tokens are encoded into a compact 512-dimensional latent embedding
            space that captures structural features independent of amplitude fluctuations:
          </p>

          <div className="rounded-[2px] border border-slate-800 bg-[#05070A] p-2.5 text-[11px] text-[#84929C] flex items-center justify-between">
            <span className="text-slate-300">
              Candidate <strong className="text-[#66E3FF]">{record.candidateId}</strong> occupies an
              isolated coordinate outside dense natural astrophysical clusters.
            </span>
            <span className="text-[9px] text-slate-500 font-mono">
              [DEMONSTRATION REPRESENTATION ONLY]
            </span>
          </div>
        </div>
      )}

      {/* STAGE 05 — ANOMALY ASSESSMENT */}
      {activeStage === 'anomaly' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#66E3FF]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#EAF4F7]">
                STAGE 05 — ANOMALY ASSESSMENT
              </h4>
            </div>
            <span className="text-[10px] text-amber-400 uppercase font-semibold">
              Δ = +4.8σ DIVERGENCE
            </span>
          </div>

          <p className="text-xs text-slate-300 font-sans leading-relaxed max-w-3xl">
            The candidate exhibits substantial deviation from the learned background signal
            distribution while maintaining measurable temporal coherence across consecutive
            observational pointings.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="rounded-[2px] border border-slate-800 bg-[#05070A] p-2">
              <span className="block text-[9px] text-[#84929C] uppercase">ANOMALY INDEX</span>
              <span className="text-xs font-bold text-[#FFB84D]">
                {record.anomalyIndex.toFixed(3)}
              </span>
            </div>
            <div className="rounded-[2px] border border-slate-800 bg-[#05070A] p-2">
              <span className="block text-[9px] text-[#84929C] uppercase">KNOWN SIMILARITY</span>
              <span className="text-xs font-bold text-slate-300">
                {(record.knownPatternSimilarity * 100).toFixed(1)}%
              </span>
            </div>
            <div className="rounded-[2px] border border-slate-800 bg-[#05070A] p-2">
              <span className="block text-[9px] text-[#84929C] uppercase">RFI PROBABILITY</span>
              <span className="text-xs font-bold text-emerald-400">
                {(record.interferenceProbability * 100).toFixed(1)}%
              </span>
            </div>
            <div className="rounded-[2px] border border-slate-800 bg-[#05070A] p-2">
              <span className="block text-[9px] text-[#84929C] uppercase">PERSISTENCE</span>
              <span className="text-xs font-bold text-emerald-400">
                {(record.persistence * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* STAGE 06 — CANDIDATE SCORE */}
      {activeStage === 'candidate_score' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center gap-2">
              <Award className="h-4 w-4 text-[#FFB84D]" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#EAF4F7]">
                STAGE 06 — CANDIDATE RANKING & ACTION
              </h4>
            </div>
            <span className="text-[10px] text-amber-400 uppercase font-semibold">
              HIGH INVESTIGATION PRIORITY
            </span>
          </div>

          <p className="text-xs text-slate-300 font-sans leading-relaxed max-w-3xl">
            Candidate verified through spatial rejection filters and topocentric barycentric
            acceleration matching. Autonomously queued for independent scientific verification.
          </p>

          <div className="rounded-[2px] border border-amber-600/60 bg-amber-950/30 p-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-none bg-[#FFB84D]" />
              <span className="font-bold text-[#FFB84D] uppercase">
                STATUS: READY FOR MULTI-TELESCOPE FOLLOW-UP
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              DISPATCHED TO SETI/BREAKTHROUGH QUEUE
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
