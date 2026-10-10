import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { ArchivedObservation } from '../types.ts';
import type { SpectralSliceResponse } from '@/types/schemas.ts';
import { api } from '@/lib/api.ts';
import { observatoryAudio } from '@/lib/audio-synth.ts';
import { Volume2, VolumeX, Activity, AlertCircle, Loader2 } from 'lucide-react';

export interface SignalPreviewProps {
  observation: ArchivedObservation;
}

export function SignalPreview({ observation }: SignalPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isAudioActive, setIsAudioActive] = useState(false);

  const [sliceData, setSliceData] = useState<SpectralSliceResponse | null>(null);
  const [isLoadingSlice, setIsLoadingSlice] = useState(false);
  const [sliceError, setSliceError] = useState<string | null>(null);

  // Fetch real observation slice from backend
  useEffect(() => {
    let isCancelled = false;

    const fetchSlice = async () => {
      setIsLoadingSlice(true);
      setSliceError(null);

      try {
        const res = await api.getObservationSlice(observation.id, {
          time_start: 0,
          time_stop: 64,
          frequency_start: 0,
          frequency_stop: 128,
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
  }, [observation.id]);

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

  // Sonification toggle (simulation based on real presence)
  const toggleAudio = useCallback(() => {
    if (!sliceData) return;
    const active = observatoryAudio.toggle();
    setIsAudioActive(active);
    if (active) {
      const topCand = observation.candidates[0];
      const drift = topCand?.driftRateHzPerSec ?? 0;
      observatoryAudio.updateCarrierPresence(0.85, drift);
    }
  }, [sliceData, observation]);

  useEffect(() => {
    if (isAudioActive && sliceData) {
      const topCand = observation.candidates[0];
      const drift = topCand?.driftRateHzPerSec ?? 0;
      observatoryAudio.updateCarrierPresence(0.85, drift);
    }
  }, [isAudioActive, sliceData, observation]);

  // Canvas rendering of genuine time-frequency data
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
      draw();
    };

    const draw = () => {
      if (width === 0 || height === 0) return;

      const paddingLeft = 44;
      const paddingRight = 14;
      const paddingTop = 16;
      const paddingBottom = 26;

      const plotW = Math.max(10, width - paddingLeft - paddingRight);
      const plotH = Math.max(10, height - paddingTop - paddingBottom);

      // Instrument Background (#0D141A)
      ctx.fillStyle = '#0D141A';
      ctx.fillRect(0, 0, width, height);

      // Plot Box (#111A22)
      ctx.fillStyle = '#111A22';
      ctx.fillRect(paddingLeft, paddingTop, plotW, plotH);

      // Render actual time-frequency cells
      const { min, max, n_time, n_freq } = sliceStats;
      const cellW = plotW / n_time;
      const cellH = plotH / n_freq;
      const range = max - min || 1;

      for (let t = 0; t < n_time; t++) {
        const row = sliceData.values[t];
        if (!row) continue;
        for (let f = 0; f < n_freq; f++) {
          const val = row[f] ?? min;
          const norm = Math.max(0, Math.min(1, (val - min) / range));

          let cr: number;
          let cg: number;
          let cb: number;

          if (norm < 0.35) {
            const factor = norm / 0.35;
            cr = Math.floor(13 + 30 * factor);
            cg = Math.floor(20 + 60 * factor);
            cb = Math.floor(26 + 100 * factor);
          } else if (norm < 0.75) {
            const factor = (norm - 0.35) / 0.4;
            cr = Math.floor(25 + 60 * factor);
            cg = Math.floor(44 + 90 * factor);
            cb = Math.floor(66 + 115 * factor);
          } else {
            const factor = (norm - 0.75) / 0.25;
            cr = Math.floor(85 + 120 * factor);
            cg = Math.floor(134 + 60 * factor);
            cb = Math.floor(181 - 70 * factor);
          }

          ctx.fillStyle = `rgb(${cr}, ${cg}, ${cb})`;
          // Draw frequency inverted so highest frequency is at the top
          const y = paddingTop + (n_freq - 1 - f) * cellH;
          ctx.fillRect(paddingLeft + t * cellW, y, cellW + 0.5, cellH + 0.5);
        }
      }

      // Outer Border
      ctx.strokeStyle = '#213240';
      ctx.lineWidth = 1;
      ctx.strokeRect(paddingLeft, paddingTop, plotW, plotH);

      // Axis Ticks
      ctx.fillStyle = '#7C8E9E';
      ctx.font = '10px "IBM Plex Mono", monospace';

      // Left Frequency Axis
      ctx.textAlign = 'right';
      ctx.fillText('+Δf', paddingLeft - 4, paddingTop + 6);
      ctx.fillText('f₀', paddingLeft - 4, paddingTop + plotH * 0.5 + 3);
      ctx.fillText('-Δf', paddingLeft - 4, paddingTop + plotH - 2);

      // Bottom Time Axis
      ctx.textAlign = 'center';
      ctx.fillText('T+00s', paddingLeft + 12, paddingTop + plotH + 12);
      ctx.fillText(
        observation.duration != null ? `T+${observation.duration}s` : 'T_end',
        paddingLeft + plotW - 14,
        paddingTop + plotH + 12
      );
    };

    handleResize();
    const ro = new ResizeObserver(handleResize);
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
    };
  }, [sliceData, sliceStats, observation.duration]);

  return (
    <div className="rounded-[3px] border border-[#213240] bg-[#0D141A] overflow-hidden select-none shadow-xs">
      {/* Viewport Header */}
      <div className="flex items-center justify-between border-b border-[#213240] bg-[#111A22] px-3.5 py-2 text-xs text-[#7C8E9E]">
        <span className="flex items-center gap-1.5 font-semibold text-[#E3EBF2]">
          <Activity className="h-3.5 w-3.5 text-[#376A9B]" />
          Spectral morphology
        </span>

        <button
          type="button"
          aria-pressed={isAudioActive}
          disabled={!sliceData}
          onClick={toggleAudio}
          className={`inline-flex items-center gap-1.5 rounded-[2px] border px-2 py-0.5 text-[11px] font-medium transition-colors outline-none focus-visible:ring-1 focus-visible:ring-[#376A9B] ${
            !sliceData
              ? 'border-[#213240] bg-[#1D2A37]/50 text-[#7C8E9E]/40 cursor-not-allowed'
              : isAudioActive
                ? 'border-[#376A9B] bg-[#376A9B]/20 text-[#5C89B7] cursor-pointer'
                : 'border-[#213240] bg-[#1D2A37] text-[#7C8E9E] hover:text-[#E3EBF2] cursor-pointer'
          }`}
        >
          {isAudioActive ? (
            <Volume2 className="h-3.5 w-3.5" />
          ) : (
            <VolumeX className="h-3.5 w-3.5" />
          )}
          <span>
            {isAudioActive
              ? 'Sonification active'
              : !sliceData
                ? 'Audio unavailable'
                : 'Sonification (sim)'}
          </span>
        </button>
      </div>

      <div ref={containerRef} className="relative h-[150px] w-full bg-[#0D141A]">
        {isLoadingSlice ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs font-mono text-[#7C8E9E]">
            <Loader2 className="h-4 w-4 animate-spin text-[#376A9B]" />
            <span>Loading spectral slice...</span>
          </div>
        ) : sliceError || !sliceData ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-xs font-mono text-[#7C8E9E]">
            <AlertCircle className="h-4 w-4 text-[#C19348]" />
            <span>{sliceError || 'Spectral slice unavailable for this observation.'}</span>
          </div>
        ) : (
          <canvas ref={canvasRef} className="h-full w-full select-none" />
        )}
      </div>
    </div>
  );
}
