import { useEffect, useRef, useState, useCallback } from 'react';
import type { ObservationData, ObservationStatus } from '../types.ts';
import { observatoryAudio } from '@/lib/audio-synth.ts';
import { Volume2, VolumeX, Maximize2, Minimize2 } from 'lucide-react';

export interface SignalViewportProps {
  observation: ObservationData;
  status: ObservationStatus;
  isPaused: boolean;
  scanProgress: number; // 0.0 to 1.0 during ANALYZING
}

export function SignalViewport({
  observation,
  status,
  isPaused,
  scanProgress,
}: SignalViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [zoomLevel, setZoomLevel] = useState<1 | 2>(1);
  const [isAudioActive, setIsAudioActive] = useState(false);

  // Hover coordinate readout state
  const [hoverCoord, setHoverCoord] = useState<{
    freqMHz: number;
    timeSec: number;
    powerDbm: number;
    x: number;
    y: number;
  } | null>(null);

  const stateRef = useRef({
    observation,
    status,
    isPaused,
    scanProgress,
    zoomLevel,
  });

  useEffect(() => {
    stateRef.current = {
      observation,
      status,
      isPaused,
      scanProgress,
      zoomLevel,
    };
  }, [observation, status, isPaused, scanProgress, zoomLevel]);

  // Audio coupling
  const toggleAudio = useCallback(() => {
    const active = observatoryAudio.toggle();
    setIsAudioActive(active);
    if (active) {
      observatoryAudio.updateCarrierPresence(
        status === 'ANOMALY_DETECTED' || status === 'CANDIDATE_READY' ? 0.9 : 0.3,
        observation.driftRateHzPerSec
      );
    }
  }, [status, observation.driftRateHzPerSec]);

  useEffect(() => {
    if (isAudioActive) {
      const intensity = status === 'ANOMALY_DETECTED' || status === 'CANDIDATE_READY' ? 0.95 : 0.3;
      observatoryAudio.updateCarrierPresence(intensity, observation.driftRateHzPerSec);
    }
  }, [isAudioActive, status, observation.driftRateHzPerSec]);

  // Noise matrix pre-generation
  const noiseMatrixRef = useRef<Float32Array | null>(null);
  const cols = 120;
  const rows = 48;

  useEffect(() => {
    const data = new Float32Array(cols * rows);
    for (let i = 0; i < cols * rows; i++) {
      data[i] = Math.random();
    }
    noiseMatrixRef.current = data;
  }, [observation.id]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    const startTime = performance.now();
    let lastTime = startTime;
    let internalTime = 0;

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

    const render = (now: number) => {
      const dt = (now - lastTime) * 0.001;
      lastTime = now;

      const current = stateRef.current;
      if (!current.isPaused) {
        internalTime += dt;
      }
      const t = internalTime;

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
      const matrix = noiseMatrixRef.current;
      if (matrix && plotW > 0 && plotH > 0) {
        const cellW = plotW / cols;
        const cellH = plotH / rows;
        const driftSlope = current.observation.driftRateHzPerSec;

        for (let r = 0; r < rows; r++) {
          const normFreq = 1 - r / rows;
          for (let c = 0; c < cols; c++) {
            const normTime = c / cols;
            const noiseVal = matrix[r * cols + c] * 0.18;

            // Carrier row with Doppler drift
            const carrierRowNorm =
              0.52 + (normTime - 0.5) * (driftSlope * 0.45) * (current.zoomLevel === 2 ? 1.8 : 1);
            const distToCarrier = Math.abs(normFreq - carrierRowNorm);

            let intensity = noiseVal;

            if (distToCarrier < 0.035 * (current.zoomLevel === 2 ? 1.5 : 1)) {
              const carrierPower = 1 - distToCarrier / 0.035;
              const flicker = 0.85 + 0.15 * Math.sin(c * 0.4 - t * 4);
              intensity += carrierPower * 0.75 * flicker;
            }

            // Anomaly zone intensity boost
            const isInsideAnomaly =
              normTime >= 0.35 &&
              normTime <= 0.78 &&
              normFreq >= 0.42 &&
              normFreq <= 0.62 &&
              (current.status === 'ANOMALY_DETECTED' || current.status === 'CANDIDATE_READY');

            if (isInsideAnomaly && distToCarrier < 0.055) {
              intensity += 0.22 * Math.sin(c * 0.6 + t * 5);
            }

            if (intensity > 0.04) {
              const cl = Math.min(1, intensity);
              let cr: number;
              let cg: number;
              let cb: number;

              if (cl < 0.35) {
                // Quiet deep midnight/ink noise floor
                cr = Math.floor(13 + 20 * cl);
                cg = Math.floor(20 + 35 * cl);
                cb = Math.floor(26 + 65 * cl);
              } else if (cl < 0.72) {
                // Transition into observatory blue to warm gold
                const factor = (cl - 0.35) / 0.37;
                cr = Math.floor(35 + 155 * factor);
                cg = Math.floor(75 + 70 * factor);
                cb = Math.floor(125 - 55 * factor);
              } else {
                // High-power core: solar gold to brilliant white
                const factor = (cl - 0.72) / 0.28;
                cr = Math.floor(190 + 65 * factor);
                cg = Math.floor(145 + 110 * factor);
                cb = Math.floor(70 + 185 * factor);
              }

              ctx.fillStyle = `rgb(${cr}, ${cg}, ${cb})`;
              ctx.fillRect(
                paddingLeft + c * cellW,
                paddingTop + r * cellH,
                cellW + 0.5,
                cellH + 0.5
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

      // 4. Primary Coherent Carrier Line in observatory blue
      ctx.save();
      ctx.strokeStyle = '#5C89B7';
      ctx.shadowColor = 'rgba(92, 137, 183, 0.3)';
      ctx.shadowBlur = 3;
      ctx.lineWidth = 1.3;

      ctx.beginPath();
      for (let x = 0; x <= plotW; x += 3) {
        const normX = x / plotW;
        const driftSlope = current.observation.driftRateHzPerSec;
        const carrierRowNorm =
          0.52 + (normX - 0.5) * (driftSlope * 0.45) * (current.zoomLevel === 2 ? 1.8 : 1);
        const driftY = paddingTop + (1 - carrierRowNorm) * plotH;
        const ripple = Math.sin(normX * 36 - t * 6) * 1.2;

        if (x === 0) ctx.moveTo(paddingLeft + x, driftY + ripple);
        else ctx.lineTo(paddingLeft + x, driftY + ripple);
      }
      ctx.stroke();
      ctx.restore();

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
      const centerF = current.observation.frequencyMHz;
      const spanF = current.observation.bandwidthMHz;
      const freqLabels = [
        (centerF + spanF * 0.5).toFixed(2),
        (centerF + spanF * 0.25).toFixed(2),
        centerF.toFixed(4) + ' f₀',
        (centerF - spanF * 0.25).toFixed(2),
        (centerF - spanF * 0.5).toFixed(2),
      ];

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
      const dur = current.observation.durationSeconds;
      const timeSteps = 5;
      ctx.textAlign = 'center';

      for (let i = 0; i <= timeSteps; i++) {
        const x = paddingLeft + (plotW / timeSteps) * i;
        const sec = Math.floor((dur / timeSteps) * i);
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        ctx.fillText(timeStr, x, paddingTop + plotH + 16);

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

      const timeSec = normX * observation.durationSeconds;
      const centerF = observation.frequencyMHz;
      const spanF = observation.bandwidthMHz;
      const freqMHz = centerF - spanF * 0.5 + normY * spanF;

      const carrierY =
        0.52 + (normX - 0.5) * (observation.driftRateHzPerSec * 0.45) * (zoomLevel === 2 ? 1.8 : 1);
      const dist = Math.abs(normY - carrierY);
      const powerDbm = dist < 0.04 ? observation.signalPowerDbm : observation.noiseFloorDbm;

      setHoverCoord({
        freqMHz,
        timeSec,
        powerDbm,
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
            {observation.frequencyMHz.toFixed(4)} MHz
          </span>
        </div>

        {/* Minimal Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-pressed={isAudioActive}
            onClick={toggleAudio}
            title={isAudioActive ? 'Mute audio' : 'Enable audio carrier'}
            className={`inline-flex items-center gap-1.5 rounded-[2px] border px-2.5 py-1 text-xs transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#376A9B] min-h-[28px] ${
              isAudioActive
                ? 'border-[#376A9B] bg-[#376A9B]/15 text-[#5C89B7]'
                : 'border-[#213240] bg-[#182632] text-[#A6B7C6] hover:text-[#E3EBF2]'
            }`}
          >
            {isAudioActive ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
            <span className="text-[11px]">{isAudioActive ? 'Audio on' : 'Audio off'}</span>
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
            <span className="text-[#5C89B7]">{hoverCoord.freqMHz.toFixed(4)} MHz</span>
            <span className="text-[#6A7E8F] mx-1.5">·</span>
            <span>T+{hoverCoord.timeSec.toFixed(1)}s</span>
            <span className="text-[#6A7E8F] mx-1.5">·</span>
            <span className="text-[#A6B7C6]">{hoverCoord.powerDbm.toFixed(1)} dBm</span>
          </div>
        )}

        {/* Loading Buffer Overlay */}
        {status === 'LOADING' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0D141A]/90">
            <div className="flex items-center gap-2 text-[#5C89B7] text-xs font-mono">
              <span className="inline-block animate-spin">◌</span>
              <span>Buffering observation data...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
