import { useEffect, useRef, useState, useMemo } from 'react';
import type { DiscoveryStage, DiscoveryObservationMeta } from '../types.ts';
import { api } from '@/lib/api.ts';
import type { SpectralSliceResponse } from '@/types/schemas.ts';
import { Loader2, AlertCircle } from 'lucide-react';

export interface SignalAnalysisViewportProps {
  stage: DiscoveryStage;
  observation: DiscoveryObservationMeta;
}

export function SignalAnalysisViewport({ stage, observation }: SignalAnalysisViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [sliceData, setSliceData] = useState<SpectralSliceResponse | null>(null);
  const [isLoadingSlice, setIsLoadingSlice] = useState(false);
  const [sliceError, setSliceError] = useState<string | null>(null);

  // Fetch real spectral slice from backend
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
            setSliceError('Backend returned empty spectral matrix.');
          }
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setSliceData(null);
          const msg =
            (err as { message?: string })?.message || 'Spectral slice unavailable from backend.';
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

  // Compute stats from real slice data
  const sliceStats = useMemo(() => {
    if (!sliceData || !sliceData.values || sliceData.values.length === 0) return null;
    let min = Infinity;
    let max = -Infinity;
    const n_time = sliceData.values.length;
    const n_freq = sliceData.values[0]?.length || 0;

    for (let t = 0; t < n_time; t++) {
      const row = sliceData.values[t];
      if (!row) continue;
      for (let f = 0; f < row.length; f++) {
        const val = row[f];
        if (val !== null && val !== undefined && !Number.isNaN(val)) {
          if (val < min) min = val;
          if (val > max) max = val;
        }
      }
    }
    if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
    return { min, max, n_time, n_freq };
  }, [sliceData]);

  // Render real spectral slice onto canvas
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
      const paddingLeft = 60;
      const paddingRight = 24;
      const paddingTop = 20;
      const paddingBottom = 32;

      const plotW = Math.max(10, width - paddingLeft - paddingRight);
      const plotH = Math.max(10, height - paddingTop - paddingBottom);

      // Background
      ctx.fillStyle = '#0D141A';
      ctx.fillRect(0, 0, width, height);

      // Plot Area Fill
      ctx.fillStyle = '#111A22';
      ctx.fillRect(paddingLeft, paddingTop, plotW, plotH);

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
              cr = Math.floor(13 + 20 * cl);
              cg = Math.floor(20 + 35 * cl);
              cb = Math.floor(26 + 65 * cl);
            } else if (cl < 0.72) {
              const factor = (cl - 0.35) / 0.37;
              cr = Math.floor(35 + 155 * factor);
              cg = Math.floor(75 + 70 * factor);
              cb = Math.floor(125 - 55 * factor);
            } else {
              const factor = (cl - 0.72) / 0.28;
              cr = Math.floor(190 + 65 * factor);
              cg = Math.floor(145 + 110 * factor);
              cb = Math.floor(70 + 185 * factor);
            }

            // High frequency at top
            const r = n_freq - 1 - f;
            ctx.fillStyle = `rgb(${cr}, ${cg}, ${cb})`;
            ctx.fillRect(paddingLeft + t * cellW, paddingTop + r * cellH, cellW + 0.6, cellH + 0.6);
          }
        }
      }

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

      // Outer Plot Border
      ctx.strokeStyle = '#213240';
      ctx.lineWidth = 1;
      ctx.strokeRect(paddingLeft, paddingTop, plotW, plotH);

      // Axes labels
      ctx.fillStyle = '#7C8E9E';
      ctx.font = '10px "IBM Plex Mono", monospace';

      // Frequency axis (Y)
      const freqCoords = sliceData.frequency_coordinates_hz;
      ctx.textAlign = 'right';
      if (freqCoords && freqCoords.length > 0) {
        const topF = freqCoords[freqCoords.length - 1] / 1e6;
        const midF = freqCoords[Math.floor(freqCoords.length / 2)] / 1e6;
        const botF = freqCoords[0] / 1e6;
        ctx.fillText(`${topF.toFixed(3)} MHz`, paddingLeft - 6, paddingTop + 8);
        ctx.fillText(`${midF.toFixed(3)} MHz`, paddingLeft - 6, paddingTop + plotH * 0.5 + 3);
        ctx.fillText(`${botF.toFixed(3)} MHz`, paddingLeft - 6, paddingTop + plotH - 2);
      } else if (observation.frequencyMHz != null) {
        ctx.fillText(
          `${observation.frequencyMHz.toFixed(3)} MHz`,
          paddingLeft - 6,
          paddingTop + plotH * 0.5 + 3
        );
      } else {
        ctx.fillText('—', paddingLeft - 6, paddingTop + plotH * 0.5 + 3);
      }

      // Time axis (X)
      const timeCoords = sliceData.time_coordinates_seconds;
      ctx.textAlign = 'center';
      if (timeCoords && timeCoords.length > 0) {
        const t0 = timeCoords[0];
        const tEnd = timeCoords[timeCoords.length - 1];
        ctx.fillText(`+${t0.toFixed(1)}s`, paddingLeft + 16, paddingTop + plotH + 16);
        ctx.fillText('Observation duration', paddingLeft + plotW * 0.5, paddingTop + plotH + 16);
        ctx.fillText(`+${tEnd.toFixed(1)}s`, paddingLeft + plotW - 16, paddingTop + plotH + 16);
      } else {
        ctx.fillText('00:00', paddingLeft + 16, paddingTop + plotH + 16);
        ctx.fillText(
          observation.durationString || 'Duration',
          paddingLeft + plotW * 0.5,
          paddingTop + plotH + 16
        );
        ctx.fillText('—', paddingLeft + plotW - 16, paddingTop + plotH + 16);
      }
    };

    const animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [sliceData, sliceStats, observation]);

  return (
    <div className="rounded-[3px] border border-[#213240] bg-[#0D141A] overflow-hidden select-none font-sans shadow-md">
      <div className="flex items-center justify-between border-b border-[#213240] bg-[#111A22] px-4 py-2.5 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#376A9B]" />
          <span className="font-semibold text-[#E3EBF2]">Time–frequency spectrogram</span>
          <span className="text-[#31495D]">|</span>
          <span className="font-mono text-[11px] text-[#5C89B7] uppercase tracking-wider">
            Stage: {stage}
          </span>
        </div>
        <span className="text-[11px] text-[#7C8E9E] font-mono">{observation.name}</span>
      </div>

      <div ref={containerRef} className="relative h-[220px] sm:h-[260px] w-full bg-[#0D141A]">
        {/* Real Canvas */}
        <canvas ref={canvasRef} className="h-full w-full select-none" />

        {/* Loading Overlay */}
        {isLoadingSlice && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0D141A]/90">
            <div className="flex items-center gap-2 text-xs font-mono text-[#5C89B7]">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Buffering spectral slice from backend...</span>
            </div>
          </div>
        )}

        {/* Honest Unavailable State when slice is missing */}
        {!isLoadingSlice && (!sliceData || !sliceStats) && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0D141A]/95 px-6 text-center">
            <div className="max-w-md space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] border border-[#213240] bg-[#131E27] text-xs font-mono text-[#A6B7C6]">
                <AlertCircle className="h-3.5 w-3.5 text-[#7E8B96]" />
                <span>SPECTRAL SLICE UNAVAILABLE</span>
              </div>
              <p className="text-xs text-[#6A7E8F] leading-relaxed">
                {sliceError ||
                  'Raw spectral matrix data is not available for this observation from backend service. Procedural signal synthesis is disabled.'}
              </p>
              <div className="pt-2 text-[11px] font-mono text-[#4A6375] flex items-center justify-center gap-3">
                <span>Target: {observation.id}</span>
                <span>•</span>
                <span>
                  Frequency:{' '}
                  {observation.frequencyMHz != null
                    ? `${observation.frequencyMHz.toFixed(3)} MHz`
                    : 'Unavailable'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
