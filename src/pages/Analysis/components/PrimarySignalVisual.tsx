import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { SignalAnalysisRecord, AnalysisStageId } from '../types.ts';
import type { SpectralSliceResponse } from '@/types/schemas.ts';
import { observatoryAudio } from '@/lib/audio-synth.ts';
import { Volume2, VolumeX, AlertCircle, Info } from 'lucide-react';

export interface PrimarySignalVisualProps {
  record: SignalAnalysisRecord;
  activeStage: AnalysisStageId;
  sliceData?: SpectralSliceResponse | null;
}

export function PrimarySignalVisual({ record, activeStage, sliceData }: PrimarySignalVisualProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isAudioActive, setIsAudioActive] = useState(false);

  const sliceStats = useMemo(() => {
    if (!sliceData || !sliceData.values || sliceData.values.length === 0) return null;
    let min = Infinity;
    let max = -Infinity;
    const n_time = sliceData.values.length;
    const n_freq = sliceData.values[0]?.length || 0;
    if (n_freq === 0) return null;
    for (let t = 0; t < n_time; t++) {
      const row = sliceData.values[t];
      if (!row) continue;
      for (let f = 0; f < row.length; f++) {
        const v = row[f];
        if (typeof v === 'number' && !Number.isNaN(v)) {
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }
    }
    if (!Number.isFinite(min)) min = 0;
    if (!Number.isFinite(max)) max = 1;
    return { min, max, n_time, n_freq };
  }, [sliceData]);

  const stateRef = useRef({ record, activeStage, sliceData, sliceStats });
  useEffect(() => {
    stateRef.current = { record, activeStage, sliceData, sliceStats };
  }, [record, activeStage, sliceData, sliceStats]);

  const toggleAudio = useCallback(() => {
    if (!sliceData) return;
    const active = observatoryAudio.toggle();
    setIsAudioActive(active);
    if (active) {
      observatoryAudio.updateCarrierPresence(0.9, record.driftRateHzPerSec ?? 0);
    }
  }, [sliceData, record.driftRateHzPerSec]);

  useEffect(() => {
    if (isAudioActive && sliceData) {
      observatoryAudio.updateCarrierPresence(0.9, record.driftRateHzPerSec ?? 0);
    }
  }, [isAudioActive, record.driftRateHzPerSec, sliceData]);

  useEffect(() => {
    return () => {
      observatoryAudio.mute();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = 0;
    let height = 0;

    const handleResize = () => {
      const container = containerRef.current;
      if (!container) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = container.clientWidth;
      height = container.clientHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    };

    handleResize();
    const ro = new ResizeObserver(handleResize);
    if (containerRef.current) ro.observe(containerRef.current);

    const render = () => {
      const {
        record: rec,
        activeStage: stage,
        sliceData: currentSlice,
        sliceStats: currentStats,
      } = stateRef.current;

      const paddingLeft = 60;
      const paddingRight = 28;
      const paddingTop = 24;
      const paddingBottom = 38;

      const plotW = Math.max(10, width - paddingLeft - paddingRight);
      const plotH = Math.max(10, height - paddingTop - paddingBottom);

      // Instrument Background (#0D141A)
      ctx.fillStyle = '#0D141A';
      ctx.fillRect(0, 0, width, height);

      // Plot Area Fill (#111A22)
      ctx.fillStyle = '#111A22';
      ctx.fillRect(paddingLeft, paddingTop, plotW, plotH);

      // Reticle Grid
      ctx.strokeStyle = '#1D2A37';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);

      for (let i = 0; i <= 4; i++) {
        const y = paddingTop + (plotH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(paddingLeft + plotW, y);
        ctx.stroke();
      }

      for (let i = 0; i <= 4; i++) {
        const x = paddingLeft + (plotW / 4) * i;
        ctx.beginPath();
        ctx.moveTo(x, paddingTop);
        ctx.lineTo(x, paddingTop + plotH);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // ========================================================
      // STAGE RENDERING: REAL DATA OR CLEAR UNAVAILABLE MESSAGE
      // ========================================================
      if (stage === 'observation' || stage === 'anomaly') {
        if (currentSlice && currentStats && plotW > 0 && plotH > 0) {
          const { min, max, n_time, n_freq } = currentStats;
          const cellW = plotW / n_time;
          const cellH = plotH / n_freq;
          const range = max - min || 1;

          for (let t_idx = 0; t_idx < n_time; t_idx++) {
            for (let f_idx = 0; f_idx < n_freq; f_idx++) {
              const rawVal = currentSlice.values[t_idx]?.[f_idx];
              if (rawVal === null || rawVal === undefined || Number.isNaN(rawVal)) continue;
              const cl = Math.max(0, Math.min(1, (rawVal - min) / range));

              if (cl > 0.02) {
                let cr: number;
                let cg: number;
                let cb: number;

                if (cl < 0.35) {
                  const factor = cl / 0.35;
                  cr = Math.floor(13 + 30 * factor);
                  cg = Math.floor(20 + 60 * factor);
                  cb = Math.floor(26 + 100 * factor);
                } else if (cl < 0.75) {
                  const factor = (cl - 0.35) / 0.4;
                  cr = Math.floor(25 + 60 * factor);
                  cg = Math.floor(44 + 90 * factor);
                  cb = Math.floor(66 + 115 * factor);
                } else {
                  const factor = (cl - 0.75) / 0.25;
                  cr = Math.floor(85 + 120 * factor);
                  cg = Math.floor(134 + 60 * factor);
                  cb = Math.floor(181 - 70 * factor);
                }

                const r = n_freq - 1 - f_idx;
                ctx.fillStyle = `rgb(${cr}, ${cg}, ${cb})`;
                ctx.fillRect(
                  paddingLeft + t_idx * cellW,
                  paddingTop + r * cellH,
                  cellW + 0.6,
                  cellH + 0.6
                );
              }
            }
          }

          // If in anomaly stage, draw fitted drift trajectory line over real data
          if (stage === 'anomaly' && rec.driftRateHzPerSec != null) {
            ctx.save();
            ctx.strokeStyle = '#C19348';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([4, 3]);

            const drift = rec.driftRateHzPerSec;
            ctx.beginPath();
            const y1 = paddingTop + plotH * 0.7;
            const y2 = paddingTop + plotH * 0.3 - (drift > 0 ? 20 : -20);
            ctx.moveTo(paddingLeft + plotW * 0.1, y1);
            ctx.lineTo(paddingLeft + plotW * 0.9, y2);
            ctx.stroke();

            ctx.font = '500 11px "IBM Plex Mono", monospace';
            ctx.fillStyle = '#C19348';
            ctx.fillText(
              `Fitted drift: ${drift > 0 ? '+' : ''}${drift.toFixed(2)} Hz/s`,
              paddingLeft + 16,
              paddingTop + 24
            );
            ctx.restore();
          }
        }
      }

      // Outer Plot Border
      ctx.strokeStyle = '#213240';
      ctx.lineWidth = 1;
      ctx.strokeRect(paddingLeft, paddingTop, plotW, plotH);

      // Axes Labels
      ctx.fillStyle = '#7C8E9E';
      ctx.font = '10px "IBM Plex Mono", monospace';

      // Frequency Axis (Y)
      const freqCoords = currentSlice?.frequency_coordinates_hz;
      ctx.textAlign = 'right';
      if (freqCoords && freqCoords.length > 0) {
        const topF = freqCoords[freqCoords.length - 1] / 1e6;
        const midF = freqCoords[Math.floor(freqCoords.length / 2)] / 1e6;
        const botF = freqCoords[0] / 1e6;
        ctx.fillText(`${topF.toFixed(3)} MHz`, paddingLeft - 6, paddingTop + 8);
        ctx.fillText(`${midF.toFixed(3)} MHz`, paddingLeft - 6, paddingTop + plotH * 0.5 + 3);
        ctx.fillText(`${botF.toFixed(3)} MHz`, paddingLeft - 6, paddingTop + plotH - 2);
      } else if (rec.frequencyMHz != null) {
        ctx.fillText(
          `${rec.frequencyMHz.toFixed(3)} MHz`,
          paddingLeft - 6,
          paddingTop + plotH * 0.5 + 3
        );
      } else {
        ctx.fillText('—', paddingLeft - 6, paddingTop + plotH * 0.5 + 3);
      }

      // Time Axis (X)
      const timeCoords = currentSlice?.time_coordinates_seconds;
      ctx.textAlign = 'center';
      if (timeCoords && timeCoords.length > 0) {
        const t0 = timeCoords[0];
        const tEnd = timeCoords[timeCoords.length - 1];
        ctx.fillText(`+${t0.toFixed(1)}s`, paddingLeft + 16, paddingTop + plotH + 16);
        ctx.fillText('Candidate time window', paddingLeft + plotW * 0.5, paddingTop + plotH + 16);
        ctx.fillText(`+${tEnd.toFixed(1)}s`, paddingLeft + plotW - 16, paddingTop + plotH + 16);
      } else if (rec.durationSeconds != null) {
        ctx.fillText('00:00', paddingLeft + 16, paddingTop + plotH + 16);
        ctx.fillText(
          `Duration: ${rec.durationSeconds.toFixed(1)}s`,
          paddingLeft + plotW * 0.5,
          paddingTop + plotH + 16
        );
        ctx.fillText(
          `${rec.durationSeconds.toFixed(1)}s`,
          paddingLeft + plotW - 16,
          paddingTop + plotH + 16
        );
      } else {
        ctx.fillText('00:00', paddingLeft + 16, paddingTop + plotH + 16);
        ctx.fillText('Time window', paddingLeft + plotW * 0.5, paddingTop + plotH + 16);
        ctx.fillText('—', paddingLeft + plotW - 16, paddingTop + plotH + 16);
      }
    };

    const animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="relative flex flex-col rounded-[2px] border border-[#213240] bg-[#0D141A] overflow-hidden select-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#213240] bg-[#131E27] px-4 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#376A9B]" />
          <span className="font-medium text-[#E3EBF2]">
            {activeStage === 'observation' && 'Raw Observation Matrix'}
            {activeStage === 'representation' && 'Statistical Representation Stage'}
            {activeStage === 'comparison' && 'Catalog Population Comparison'}
            {activeStage === 'anomaly' && 'Isolation & Doppler Regression'}
          </span>
          <span className="text-[#31495D]">|</span>
          <span className="text-[11px] text-[#A6B7C6] font-mono">
            {record.frequencyMHz != null ? `${record.frequencyMHz.toFixed(3)} MHz` : 'Unavailable'}
          </span>
        </div>

        {/* Minimal Audio Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-pressed={isAudioActive}
            disabled={!sliceData}
            onClick={toggleAudio}
            title={
              !sliceData
                ? 'Sonification unavailable (requires spectral slice)'
                : isAudioActive
                  ? 'Mute sonification'
                  : 'Generated sonification (simulation)'
            }
            className={`inline-flex items-center gap-1.5 rounded-[2px] border px-2.5 py-1 text-xs transition-colors outline-none focus-visible:ring-1 focus-visible:ring-[#376A9B] min-h-[28px] ${
              !sliceData
                ? 'border-[#213240] bg-[#182632]/50 text-[#6A7E8F] cursor-not-allowed opacity-50'
                : isAudioActive
                  ? 'border-[#376A9B] bg-[#376A9B]/15 text-[#5C89B7] cursor-pointer'
                  : 'border-[#213240] bg-[#182632] text-[#A6B7C6] hover:text-[#E3EBF2] cursor-pointer'
            }`}
          >
            {isAudioActive ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
            <span className="text-[11px]">
              {isAudioActive ? 'Sonification on' : 'Sonification off'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Canvas / Visual Container */}
      <div
        ref={containerRef}
        className="relative h-[340px] sm:h-[400px] lg:h-[440px] w-full bg-[#0D141A]"
      >
        <canvas ref={canvasRef} className="h-full w-full select-none" />

        {/* Stage 1 / Stage 4: Overlay when spectral slice is missing */}
        {(activeStage === 'observation' || activeStage === 'anomaly') && !sliceData && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0D141A]/95 px-6 text-center">
            <div className="max-w-md space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] border border-[#213240] bg-[#131E27] text-xs font-mono text-[#A6B7C6]">
                <AlertCircle className="h-3.5 w-3.5 text-[#7E8B96]" />
                <span>SPECTRAL SLICE UNAVAILABLE</span>
              </div>
              <p className="text-xs text-[#6A7E8F] leading-relaxed">
                Raw spectral matrix data is not available for candidate {record.candidateId}.
                Synthetic noise and procedural signal graphics are disabled in live operational
                mode.
              </p>
              <div className="pt-2 text-[11px] font-mono text-[#4A6375] flex items-center justify-center gap-3">
                <span>Observation: {record.observationId}</span>
                <span>•</span>
                <span>
                  Frequency:{' '}
                  {record.frequencyMHz != null
                    ? `${record.frequencyMHz.toFixed(3)} MHz`
                    : 'Unavailable'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Stage 2: Representation Explanation Card (no fake attention tokens) */}
        {activeStage === 'representation' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0D141A]/95 px-6 text-center">
            <div className="max-w-lg space-y-3 p-6 rounded-[3px] border border-[#213240] bg-[#111A22] text-left">
              <div className="flex items-center gap-2 text-xs font-mono text-[#5C89B7] uppercase tracking-wider">
                <Info className="h-4 w-4" />
                <span>Operational Representation Method</span>
              </div>
              <h3 className="text-sm font-semibold text-[#E3EBF2]">
                Windowed Moments & RFI Masking
              </h3>
              <p className="text-xs text-[#8BA0B2] leading-relaxed">
                The operational screening pipeline characterises candidate regions using windowed
                statistical moments (mean, variance, skewness, and kurtosis) combined with adaptive
                primary and secondary RFI flags.
              </p>
              <div className="p-3 rounded-[2px] border border-[#1E2E3C] bg-[#0D141A] text-xs font-mono space-y-1.5 text-[#A6B7C6]">
                <div className="flex justify-between">
                  <span className="text-[#6A7E8F]">Extraction Method:</span>
                  <span>Time–frequency moment statistics</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6A7E8F]">Learned Latent Space:</span>
                  <span className="text-[#C19348]">Not evaluated (offline research track)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6A7E8F]">Attention Weights:</span>
                  <span className="text-[#6A7E8F]">Not implemented in baseline</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stage 3: Catalog Comparison Explanation Card (no fake cosine distance) */}
        {activeStage === 'comparison' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0D141A]/95 px-6 text-center">
            <div className="max-w-lg space-y-3 p-6 rounded-[3px] border border-[#213240] bg-[#111A22] text-left">
              <div className="flex items-center gap-2 text-xs font-mono text-[#5C89B7] uppercase tracking-wider">
                <Info className="h-4 w-4" />
                <span>Catalog Cross-Matching Status</span>
              </div>
              <h3 className="text-sm font-semibold text-[#E3EBF2]">
                Catalog Comparison Not Evaluated
              </h3>
              <p className="text-xs text-[#8BA0B2] leading-relaxed">
                The current backend service does not perform cross-catalog matching against pulsar
                catalogues (ATNF), transient registries, or satellite orbital ephemerides.
              </p>
              <div className="p-3 rounded-[2px] border border-[#1E2E3C] bg-[#0D141A] text-xs font-mono space-y-1.5 text-[#A6B7C6]">
                <div className="flex justify-between">
                  <span className="text-[#6A7E8F]">Pulsar Cross-Match:</span>
                  <span className="text-[#C19348]">Not evaluated</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6A7E8F]">Cosine Distance:</span>
                  <span className="text-[#6A7E8F]">Not evaluated</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#6A7E8F]">RFI Flagged Fraction:</span>
                  <span>
                    {record.interferenceProbability != null
                      ? `${(record.interferenceProbability * 100).toFixed(1)}%`
                      : 'Not evaluated'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
