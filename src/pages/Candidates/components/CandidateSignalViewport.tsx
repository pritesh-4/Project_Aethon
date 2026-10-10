import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { CandidateSignalData } from '../types.ts';
import type { SpectralSliceResponse } from '@/types/schemas.ts';
import { api } from '@/lib/api.ts';
import { observatoryAudio } from '@/lib/audio-synth.ts';
import { Volume2, VolumeX, AlertCircle, Loader2 } from 'lucide-react';

export interface CandidateSignalViewportProps {
  candidate: CandidateSignalData;
}

export function CandidateSignalViewport({ candidate }: CandidateSignalViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isAudioActive, setIsAudioActive] = useState(false);

  const [sliceData, setSliceData] = useState<SpectralSliceResponse | null>(null);
  const [isLoadingSlice, setIsLoadingSlice] = useState(false);
  const [sliceError, setSliceError] = useState<string | null>(null);

  // Fetch real candidate slice from backend
  useEffect(() => {
    let isCancelled = false;

    const fetchSlice = async () => {
      if (!candidate.observationId || candidate.observationId === 'OBS-UNKNOWN') {
        setSliceData(null);
        setSliceError('No associated observation found for this candidate.');
        return;
      }

      setIsLoadingSlice(true);
      setSliceError(null);

      try {
        const tr = candidate.targetRegion;
        const res = await api.getObservationSlice(candidate.observationId, {
          time_start: tr?.time_start ?? 0,
          time_stop: tr?.time_stop ?? 64,
          frequency_start: tr?.freq_start ?? 0,
          frequency_stop: tr?.freq_stop ?? 128,
        });

        if (!isCancelled) {
          if (res && res.values && res.values.length > 0) {
            setSliceData(res);
          } else {
            setSliceData(null);
            setSliceError('Observation slice returned empty matrix.');
          }
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setSliceData(null);
          const msg =
            (err as { message?: string })?.message ||
            'Spectral slice unavailable from backend service.';
          setSliceError(msg);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingSlice(false);
        }
      }
    };

    fetchSlice();

    return () => {
      isCancelled = true;
    };
  }, [candidate.id, candidate.observationId, candidate.targetRegion]);

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

  const toggleAudio = useCallback(() => {
    if (!sliceData) return;
    const active = observatoryAudio.toggle();
    setIsAudioActive(active);
    if (active) {
      observatoryAudio.updateCarrierPresence(0.85, candidate.driftRateHzPerSec ?? 0);
    }
  }, [sliceData, candidate.driftRateHzPerSec]);

  useEffect(() => {
    return () => {
      observatoryAudio.mute();
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !sliceData || !sliceStats) return;

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
      const paddingLeft = 46;
      const paddingRight = 16;
      const paddingTop = 14;
      const paddingBottom = 24;

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

      for (let i = 0; i <= 3; i++) {
        const y = paddingTop + (plotH / 3) * i;
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

      // Draw real spectral data
      const { min, max, n_time, n_freq } = sliceStats;
      const cellW = plotW / n_time;
      const cellH = plotH / n_freq;
      const range = max - min || 1;

      for (let t = 0; t < n_time; t++) {
        for (let f = 0; f < n_freq; f++) {
          const rawVal = sliceData.values[t]?.[f];
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

            const r = n_freq - 1 - f;
            ctx.fillStyle = `rgb(${cr}, ${cg}, ${cb})`;
            ctx.fillRect(paddingLeft + t * cellW, paddingTop + r * cellH, cellW + 0.6, cellH + 0.6);
          }
        }
      }

      // Outer Plot Border
      ctx.strokeStyle = '#213240';
      ctx.lineWidth = 1;
      ctx.strokeRect(paddingLeft, paddingTop, plotW, plotH);

      // Axes Labels
      ctx.fillStyle = '#7C8E9E';
      ctx.font = '9px "IBM Plex Mono", monospace';

      // Frequency Axis
      const freqCoords = sliceData.frequency_coordinates_hz;
      ctx.textAlign = 'right';
      if (freqCoords && freqCoords.length > 0) {
        const topF = freqCoords[freqCoords.length - 1] / 1e6;
        const botF = freqCoords[0] / 1e6;
        ctx.fillText(`${topF.toFixed(3)}`, paddingLeft - 4, paddingTop + 8);
        ctx.fillText(`${botF.toFixed(3)}`, paddingLeft - 4, paddingTop + plotH - 2);
      } else if (candidate.frequencyMHz != null) {
        ctx.fillText(
          `${candidate.frequencyMHz.toFixed(2)}`,
          paddingLeft - 4,
          paddingTop + plotH * 0.5 + 3
        );
      } else {
        ctx.fillText('—', paddingLeft - 4, paddingTop + plotH * 0.5 + 3);
      }

      // Time Axis
      ctx.textAlign = 'center';
      ctx.fillText('00:00', paddingLeft + 12, paddingTop + plotH + 14);
      ctx.fillText('Integration', paddingLeft + plotW * 0.5, paddingTop + plotH + 14);
      ctx.fillText(
        candidate.durationSeconds != null ? `${candidate.durationSeconds}s` : '—',
        paddingLeft + plotW - 12,
        paddingTop + plotH + 14
      );
    };

    const animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [sliceData, sliceStats, candidate]);

  return (
    <div className="rounded-[2px] border border-[#213240] bg-[#0D141A] overflow-hidden select-none">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#213240] bg-[#131E27] px-3 py-1.5 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#376A9B]" />
          <span className="font-medium text-[#E3EBF2] text-[11px]">Candidate Spectrogram</span>
          <span className="text-[#31495D]">|</span>
          <span className="text-[10px] text-[#A6B7C6] font-mono">
            {candidate.frequencyMHz != null
              ? `${candidate.frequencyMHz.toFixed(3)} MHz`
              : 'Unavailable'}
          </span>
        </div>

        {/* Audio Toggle */}
        <button
          type="button"
          aria-pressed={isAudioActive}
          disabled={!sliceData}
          onClick={toggleAudio}
          title={
            !sliceData
              ? 'Sonification unavailable (no spectral slice)'
              : isAudioActive
                ? 'Mute sonification'
                : 'Generated sonification (simulation)'
          }
          className={`inline-flex items-center gap-1 rounded-[2px] border px-2 py-0.5 text-[10px] transition-colors outline-none focus-visible:ring-1 focus-visible:ring-[#376A9B] ${
            !sliceData
              ? 'border-[#213240] bg-[#182632]/50 text-[#6A7E8F] cursor-not-allowed opacity-50'
              : isAudioActive
                ? 'border-[#376A9B] bg-[#376A9B]/15 text-[#5C89B7] cursor-pointer'
                : 'border-[#213240] bg-[#182632] text-[#A6B7C6] hover:text-[#E3EBF2] cursor-pointer'
          }`}
        >
          {isAudioActive ? (
            <Volume2 className="h-2.5 w-2.5" />
          ) : (
            <VolumeX className="h-2.5 w-2.5" />
          )}
          <span>{isAudioActive ? 'On' : 'Off'}</span>
        </button>
      </div>

      {/* Main Canvas Viewport */}
      <div ref={containerRef} className="relative h-[180px] w-full bg-[#0D141A]">
        <canvas ref={canvasRef} className="h-full w-full select-none" />

        {/* Loading Overlay */}
        {isLoadingSlice && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0D141A]/90">
            <div className="flex items-center gap-2 text-xs font-mono text-[#5C89B7]">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              <span>Buffering candidate spectral slice...</span>
            </div>
          </div>
        )}

        {/* Honest Unavailable State when slice is missing */}
        {!isLoadingSlice && (!sliceData || !sliceStats) && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0D141A]/95 px-4 text-center">
            <div className="max-w-xs space-y-1.5">
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] border border-[#213240] bg-[#131E27] text-[10px] font-mono text-[#A6B7C6]">
                <AlertCircle className="h-3 w-3 text-[#7E8B96]" />
                <span>SIGNAL VISUALIZATION UNAVAILABLE</span>
              </div>
              <p className="text-[11px] text-[#6A7E8F] leading-snug">
                {sliceError ||
                  'Spectral slice matrix is unavailable for this candidate. Synthetic signal traces are disabled in operational mode.'}
              </p>
              <div className="pt-1 text-[10px] font-mono text-[#4A6375]">
                Observation: {candidate.observationId}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
