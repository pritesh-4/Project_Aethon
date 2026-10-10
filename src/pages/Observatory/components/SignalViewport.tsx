import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { ObservationData, ObservationStatus } from '../types.ts';
import type { SpectralSliceResponse, DetectionResponse } from '@/types/schemas.ts';
import { observatoryAudio } from '@/lib/audio-synth.ts';
import { Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';

export interface SignalViewportProps {
  observation: ObservationData;
  status: ObservationStatus;
  isPaused: boolean;
  scanProgress: number; // 0.0 to 1.0 during ANALYZING
  sliceData?: SpectralSliceResponse | null;
  isLoadingSlice?: boolean;
  detectionData?: DetectionResponse | null;
  isDemoMode?: boolean;
}

export function SignalViewport({
  observation,
  status,
  isPaused,
  scanProgress,
  sliceData = null,
  isLoadingSlice = false,
  detectionData = null,
  isDemoMode = false,
}: SignalViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [zoomLevel, setZoomLevel] = useState<1 | 2>(1);
  const [isAudioActive, setIsAudioActive] = useState(false);

  const isEffectiveDemoMode = Boolean(isDemoMode || observation.isDemoMode);

  // Compute robust slice stats when real slice is available
  const sliceStats = useMemo(() => {
    if (!sliceData || !sliceData.values || sliceData.values.length === 0) return null;
    let min = Infinity;
    let max = -Infinity;
    const n_time = sliceData.values.length;
    const n_freq = sliceData.values[0]?.length || 0;
    if (n_freq === 0) return null;
    for (let t = 0; t < n_time; t++) {
      const row = sliceData.values[t];
      for (let f = 0; f < row.length; f++) {
        const v = row[f];
        if (typeof v === 'number' && !Number.isNaN(v)) {
          if (v < min) min = v;
          if (v > max) max = v;
        }
      }
    }
    return { min, max, n_time, n_freq };
  }, [sliceData]);

  // Hover coordinate readout state
  const [hoverCoord, setHoverCoord] = useState<{
    freqMHz: number | null;
    timeSec: number | null;
    powerVal: number | null;
    powerUnit: string;
    x: number;
    y: number;
  } | null>(null);

  const stateRef = useRef({
    observation,
    status,
    isPaused,
    scanProgress,
    zoomLevel,
    sliceData,
    sliceStats,
    detectionData,
    isDemoMode: isEffectiveDemoMode,
  });

  useEffect(() => {
    stateRef.current = {
      observation,
      status,
      isPaused,
      scanProgress,
      zoomLevel,
      sliceData,
      sliceStats,
      detectionData,
      isDemoMode: isEffectiveDemoMode,
    };
  }, [
    observation,
    status,
    isPaused,
    scanProgress,
    zoomLevel,
    sliceData,
    sliceStats,
    detectionData,
    isEffectiveDemoMode,
  ]);

  // Audio coupling
  const toggleAudio = useCallback(() => {
    if (!sliceData) {
      return;
    }
    const active = observatoryAudio.toggle();
    setIsAudioActive(active);
    if (active) {
      observatoryAudio.updateCarrierPresence(
        status === 'ANOMALY_DETECTED' || status === 'CANDIDATE_READY' ? 0.9 : 0.3,
        observation.driftRateHzPerSec ?? 0
      );
    }
  }, [status, observation.driftRateHzPerSec, sliceData]);

  useEffect(() => {
    if (isAudioActive && sliceData) {
      const intensity = status === 'ANOMALY_DETECTED' || status === 'CANDIDATE_READY' ? 0.95 : 0.3;
      observatoryAudio.updateCarrierPresence(intensity, observation.driftRateHzPerSec ?? 0);
    }
  }, [isAudioActive, status, observation.driftRateHzPerSec, sliceData]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
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
      const current = stateRef.current;

      // Layout geometry
      const paddingLeft = 60;
      const paddingRight = 24;
      const paddingTop = 20;
      const paddingBottom = 40;

      const plotW = Math.max(10, width - paddingLeft - paddingRight);
      const plotH = Math.max(10, height - paddingTop - paddingBottom);

      // 1. Background: Deep midnight instrument base
      ctx.fillStyle = '#0D141A';
      ctx.fillRect(0, 0, width, height);

      // Spectrogram plot area
      ctx.fillStyle = '#080D11';
      ctx.fillRect(paddingLeft, paddingTop, plotW, plotH);

      // 2. Render Spectrogram Matrix with rich scientific colormap (deep slate -> observatory blue -> solar gold -> white)
      if (current.sliceData && current.sliceStats && plotW > 0 && plotH > 0) {
        // Real numerical spectral matrix from backend
        const { min, max, n_time, n_freq } = current.sliceStats;
        const cellW = plotW / n_time;
        const cellH = plotH / n_freq;
        const range = max - min || 1;

        for (let t_idx = 0; t_idx < n_time; t_idx++) {
          for (let f_idx = 0; f_idx < n_freq; f_idx++) {
            const rawVal = current.sliceData.values[t_idx][f_idx];
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
      }

      // 3. Subtle Frequency / Time Reticle
      ctx.strokeStyle = '#1B2733';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);

      // 4 horizontal divisions
      for (let i = 1; i < 4; i++) {
        const y = paddingTop + (plotH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(paddingLeft + plotW, y);
        ctx.stroke();
      }

      // 5 vertical divisions
      for (let i = 1; i < 5; i++) {
        const x = paddingLeft + (plotW / 5) * i;
        ctx.beginPath();
        ctx.moveTo(x, paddingTop);
        ctx.lineTo(x, paddingTop + plotH);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // 5. Analyzing Scan Sweep (Observatory blue curtain)
      if (current.status === 'ANALYZING') {
        const scanX = paddingLeft + plotW * current.scanProgress;

        const grad = ctx.createLinearGradient(scanX - 40, 0, scanX, 0);
        grad.addColorStop(0, 'rgba(55, 106, 155, 0)');
        grad.addColorStop(1, 'rgba(55, 106, 155, 0.25)');
        ctx.fillStyle = grad;
        ctx.fillRect(scanX - 40, paddingTop, 40, plotH);

        ctx.strokeStyle = '#5C89B7';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(scanX, paddingTop);
        ctx.lineTo(scanX, paddingTop + plotH);
        ctx.stroke();
      }

      // 6. Anomaly Highlight Brackets (When detected - Muted Solar Gold)
      if (current.status === 'ANOMALY_DETECTED' || current.status === 'CANDIDATE_READY') {
        const ax = paddingLeft + plotW * 0.38;
        const aw = plotW * 0.37;
        const ay = paddingTop + plotH * 0.39;
        const ah = plotH * 0.22;
        const bLen = 10;

        ctx.save();
        ctx.fillStyle = 'rgba(193, 147, 72, 0.08)';
        ctx.fillRect(ax, ay, aw, ah);

        ctx.strokeStyle = '#C19348';
        ctx.lineWidth = 1;

        // Top-left
        ctx.beginPath();
        ctx.moveTo(ax, ay + bLen);
        ctx.lineTo(ax, ay);
        ctx.lineTo(ax + bLen, ay);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(ax + aw - bLen, ay);
        ctx.lineTo(ax + aw, ay);
        ctx.lineTo(ax + aw, ay + bLen);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(ax, ay + ah - bLen);
        ctx.lineTo(ax, ay + ah);
        ctx.lineTo(ax + bLen, ay + ah);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(ax + aw - bLen, ay + ah);
        ctx.lineTo(ax + aw, ay + ah);
        ctx.lineTo(ax + aw, ay + ah - bLen);
        ctx.stroke();

        ctx.restore();
      }

      // 7. Outer Spectrogram Border
      ctx.strokeStyle = '#213240';
      ctx.lineWidth = 1;
      ctx.strokeRect(paddingLeft, paddingTop, plotW, plotH);

      // 8. Axis Ticks & Numerical Labels
      ctx.fillStyle = '#6A7E8F';
      ctx.font = '9px "IBM Plex Mono", monospace';

      // Frequency Axis Ticks (Left)
      let freqLabels: string[];
      const coords = current.sliceData?.frequency_coordinates_hz;
      if (current.sliceData && coords && coords.length > 0) {
        const fMin = coords[0] / 1e6;
        const fMax = coords[coords.length - 1] / 1e6;
        freqLabels = [
          fMax.toFixed(4),
          ((fMax * 3 + fMin) / 4).toFixed(4),
          ((fMax + fMin) / 2).toFixed(4) + ' f₀',
          ((fMax + fMin * 3) / 4).toFixed(4),
          fMin.toFixed(4),
        ];
      } else if (
        current.observation.frequencyMHz != null &&
        current.observation.bandwidthMHz != null
      ) {
        const centerF = current.observation.frequencyMHz;
        const spanF = current.observation.bandwidthMHz;
        freqLabels = [
          (centerF + spanF * 0.5).toFixed(2),
          (centerF + spanF * 0.25).toFixed(2),
          centerF.toFixed(4) + ' f₀',
          (centerF - spanF * 0.25).toFixed(2),
          (centerF - spanF * 0.5).toFixed(2),
        ];
      } else if (current.observation.frequencyMHz != null) {
        freqLabels = ['—', '—', `${current.observation.frequencyMHz.toFixed(4)} f₀`, '—', '—'];
      } else {
        freqLabels = ['—', '—', 'Unavailable', '—', '—'];
      }

      ctx.textAlign = 'right';
      freqLabels.forEach((label, idx) => {
        const y = paddingTop + (plotH / 4) * idx;
        ctx.fillText(label, paddingLeft - 8, y + 3);

        ctx.beginPath();
        ctx.moveTo(paddingLeft - 4, y);
        ctx.lineTo(paddingLeft, y);
        ctx.strokeStyle = '#213240';
        ctx.stroke();
      });

      // Time Axis Ticks (Bottom)
      let tStart = 0;
      let tSpan = current.observation.durationSeconds;
      const tCoords = current.sliceData?.time_coordinates_seconds;
      if (current.sliceData && tCoords && tCoords.length > 0) {
        tStart = tCoords[0];
        tSpan = tCoords[tCoords.length - 1] - tStart || 1;
      }
      const timeSteps = 5;
      ctx.textAlign = 'center';

      for (let i = 0; i <= timeSteps; i++) {
        const x = paddingLeft + (plotW / timeSteps) * i;
        if (tSpan != null && tSpan > 0) {
          const sec = Math.floor(tStart + (tSpan / timeSteps) * i);
          const m = Math.floor(sec / 60);
          const s = sec % 60;
          const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
          ctx.fillText(timeStr, x, paddingTop + plotH + 16);
        } else {
          ctx.fillText('—', x, paddingTop + plotH + 16);
        }

        ctx.beginPath();
        ctx.moveTo(x, paddingTop + plotH);
        ctx.lineTo(x, paddingTop + plotH + 4);
        ctx.strokeStyle = '#213240';
        ctx.stroke();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      ro.disconnect();
      cancelAnimationFrame(animId);
      observatoryAudio.updateCarrierPresence(0);
    };
  }, []);

  // Hover coordinate tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const current = stateRef.current;
    // Without real slice data, do not display synthetic hover readout
    if (!current.sliceData || !current.sliceStats) {
      setHoverCoord(null);
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const paddingLeft = 60;
    const paddingRight = 24;
    const paddingTop = 20;
    const paddingBottom = 40;

    const plotW = canvas.clientWidth - paddingLeft - paddingRight;
    const plotH = canvas.clientHeight - paddingTop - paddingBottom;

    if (
      x >= paddingLeft &&
      x <= paddingLeft + plotW &&
      y >= paddingTop &&
      y <= paddingTop + plotH
    ) {
      const normX = (x - paddingLeft) / plotW;
      const normY = 1 - (y - paddingTop) / plotH;

      const t_idx = Math.max(
        0,
        Math.min(current.sliceStats.n_time - 1, Math.floor(normX * current.sliceStats.n_time))
      );
      const f_idx = Math.max(
        0,
        Math.min(current.sliceStats.n_freq - 1, Math.floor(normY * current.sliceStats.n_freq))
      );
      const freqMHz =
        current.sliceData.frequency_coordinates_hz &&
        current.sliceData.frequency_coordinates_hz[f_idx] != null
          ? current.sliceData.frequency_coordinates_hz[f_idx] / 1e6
          : null;
      const timeSec =
        current.sliceData.time_coordinates_seconds &&
        current.sliceData.time_coordinates_seconds[t_idx] != null
          ? current.sliceData.time_coordinates_seconds[t_idx]
          : null;
      const powerVal = current.sliceData.values[t_idx]?.[f_idx] ?? null;
      const powerUnit =
        current.sliceData.sample_value_unit ||
        (current.sliceData.sample_value_semantics === 'calibrated_dbm' ? 'dBm' : 'counts');

      setHoverCoord({
        freqMHz,
        timeSec,
        powerVal,
        powerUnit,
        x,
        y,
      });
    } else {
      setHoverCoord(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverCoord(null);
  };

  return (
    <div className="relative flex flex-col rounded-[2px] border border-[#213240] bg-[#0D141A] overflow-hidden select-none">
      {/* Viewport Header Bar */}
      <div className="flex items-center justify-between border-b border-[#213240] bg-[#131E27] px-4 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#376A9B]" />
          <span className="font-medium text-[#E3EBF2]">Spectrogram</span>
          <span className="text-[#31495D]">|</span>
          <span className="text-[11px] text-[#A6B7C6] font-mono">
            {observation.frequencyMHz != null
              ? `${observation.frequencyMHz.toFixed(4)} MHz`
              : 'Unavailable'}
          </span>
        </div>

        {/* Minimal Controls */}
        <div className="flex items-center gap-2">
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

          <button
            type="button"
            aria-pressed={zoomLevel === 2}
            onClick={() => setZoomLevel(zoomLevel === 1 ? 2 : 1)}
            title="Toggle zoom level"
            className={`inline-flex items-center gap-1 rounded-[2px] border px-2.5 py-1 text-xs transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#376A9B] min-h-[28px] ${
              zoomLevel === 2
                ? 'border-[#376A9B] bg-[#376A9B]/15 text-[#5C89B7]'
                : 'border-[#213240] bg-[#182632] text-[#A6B7C6] hover:text-[#E3EBF2]'
            }`}
          >
            {zoomLevel === 2 ? (
              <Minimize2 className="h-3 w-3" />
            ) : (
              <Maximize2 className="h-3 w-3" />
            )}
            <span className="text-[11px] font-mono">{zoomLevel}x</span>
          </button>
        </div>
      </div>

      {/* Spacious Interactive Canvas Container */}
      <div
        ref={containerRef}
        className="relative h-[440px] sm:h-[500px] lg:h-[560px] w-full bg-[#0D141A] cursor-crosshair"
      >
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="h-full w-full select-none"
        />

        {/* Quiet Hover Tooltip */}
        {hoverCoord && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-10 rounded-[2px] border border-[#213240] bg-[#131E27] px-2.5 py-1 font-mono text-[10px] text-[#E3EBF2] shadow-md"
            style={{ left: hoverCoord.x, top: hoverCoord.y }}
          >
            <span className="text-[#5C89B7]">
              {hoverCoord.freqMHz != null ? `${hoverCoord.freqMHz.toFixed(4)} MHz` : '—'}
            </span>
            <span className="text-[#6A7E8F] mx-1.5">·</span>
            <span>{hoverCoord.timeSec != null ? `T+${hoverCoord.timeSec.toFixed(1)}s` : '—'}</span>
            <span className="text-[#6A7E8F] mx-1.5">·</span>
            <span className="text-[#A6B7C6]">
              {hoverCoord.powerVal != null
                ? `${hoverCoord.powerVal.toFixed(1)} ${hoverCoord.powerUnit}`
                : 'Not calibrated'}
            </span>
          </div>
        )}

        {/* Loading Buffer Overlay */}
        {(status === 'LOADING' || isLoadingSlice) && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0D141A]/90">
            <div className="flex items-center gap-2 text-[#5C89B7] text-xs font-mono">
              <span className="inline-block animate-spin">◌</span>
              <span>
                {isLoadingSlice
                  ? 'Buffering scientific slice from backend...'
                  : 'Buffering observation data...'}
              </span>
            </div>
          </div>
        )}

        {/* Real Backend: Spectral Slice Unavailable Overlay */}
        {!isEffectiveDemoMode && !isLoadingSlice && !sliceData && status !== 'LOADING' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0D141A]/92 px-6 text-center">
            <div className="max-w-md space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] border border-[#213240] bg-[#131E27] text-xs font-mono text-[#A6B7C6]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#7E8B96]" />
                <span>SPECTRAL SLICE UNAVAILABLE</span>
              </div>
              <p className="text-xs text-[#6A7E8F] leading-relaxed">
                Raw spectral matrix data is not available for this observation from the backend
                service. Synthetic data generation is disabled in live mode.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
