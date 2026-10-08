import { useEffect, useRef, useState, useCallback } from 'react';
import type { ArchivedObservation } from '../types.ts';
import { observatoryAudio } from '@/lib/audio-synth.ts';
import { Volume2, VolumeX, Activity } from 'lucide-react';

export interface SignalPreviewProps {
  observation: ArchivedObservation;
}

export function SignalPreview({ observation }: SignalPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isAudioActive, setIsAudioActive] = useState(false);

  const obsRef = useRef(observation);
  useEffect(() => {
    obsRef.current = observation;
  }, [observation]);

  // Sonification toggle
  const toggleAudio = useCallback(() => {
    const active = observatoryAudio.toggle();
    setIsAudioActive(active);
    if (active) {
      const topCand = observation.candidates[0];
      const drift = topCand ? topCand.driftRateHzPerSec : -0.25;
      observatoryAudio.updateCarrierPresence(0.85, drift);
    }
  }, [observation]);

  useEffect(() => {
    if (isAudioActive) {
      const topCand = observation.candidates[0];
      const drift = topCand ? topCand.driftRateHzPerSec : -0.25;
      observatoryAudio.updateCarrierPresence(0.85, drift);
    }
  }, [isAudioActive, observation]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    const startTime = performance.now();

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

    // Pre-calculate synthetic matrix cells
    const cols = 64;
    const rows = 28;
    const noiseMatrix = new Float32Array(cols * rows);
    for (let i = 0; i < cols * rows; i++) {
      noiseMatrix[i] = Math.random();
    }

    const render = (now: number) => {
      const t = (now - startTime) * 0.001;
      const current = obsRef.current;
      const hasAnomaly = current.anomalousRegions > 0;
      const topCand = current.candidates[0];
      const driftSlope = topCand ? topCand.driftRateHzPerSec : -0.2;

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

      // Spectrogram Noise & Carrier
      const cellW = plotW / cols;
      const cellH = plotH / rows;

      for (let r = 0; r < rows; r++) {
        const normFreq = 1 - r / rows;
        for (let c = 0; c < cols; c++) {
          const normTime = c / cols;
          const noise = noiseMatrix[r * cols + c] * 0.15;

          let intensity = noise;

          if (hasAnomaly) {
            // Carrier with Doppler drift slope
            const carrierCenter = 0.52 + (normTime - 0.5) * (driftSlope * 0.5);
            const dist = Math.abs(normFreq - carrierCenter);

            if (dist < 0.05) {
              intensity += (1 - dist / 0.05) * (0.6 + Math.sin(c * 0.4 - t * 4) * 0.15);
            }
          }

          if (intensity > 0.06) {
            const cl = Math.min(1, intensity);
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

            ctx.fillStyle = `rgb(${cr}, ${cg}, ${cb})`;
            ctx.fillRect(paddingLeft + c * cellW, paddingTop + r * cellH, cellW + 0.5, cellH + 0.5);
          }
        }
      }

      // Anomaly Bounding Box if anomalous regions present
      if (hasAnomaly) {
        const ax = paddingLeft + plotW * 0.32;
        const aw = plotW * 0.44;
        const ay = paddingTop + plotH * 0.28;
        const ah = plotH * 0.42;

        ctx.save();
        ctx.fillStyle = 'rgba(193, 147, 72, 0.08)';
        ctx.fillRect(ax, ay, aw, ah);

        const cornerSize = 6;
        ctx.strokeStyle = '#C19348';
        ctx.lineWidth = 1.2;

        // Top-left
        ctx.beginPath();
        ctx.moveTo(ax, ay + cornerSize);
        ctx.lineTo(ax, ay);
        ctx.lineTo(ax + cornerSize, ay);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(ax + aw - cornerSize, ay);
        ctx.lineTo(ax + aw, ay);
        ctx.lineTo(ax + aw, ay + cornerSize);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(ax, ay + ah - cornerSize);
        ctx.lineTo(ax, ay + ah);
        ctx.lineTo(ax + cornerSize, ay + ah);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(ax + aw - cornerSize, ay + ah);
        ctx.lineTo(ax + aw, ay + ah);
        ctx.lineTo(ax + aw, ay + ah - cornerSize);
        ctx.stroke();

        // Anomaly Label
        ctx.font = '10px "Source Sans 3", sans-serif';
        ctx.fillStyle = '#C19348';
        ctx.textAlign = 'left';
        ctx.fillText(`Anomalous region`, ax + 4, ay - 4);

        ctx.textAlign = 'right';
        ctx.font = '9px "IBM Plex Mono", monospace';
        ctx.fillText(`df/dt = ${driftSlope.toFixed(2)} Hz/s`, ax + aw - 4, ay - 4);
        ctx.restore();
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
      ctx.fillText(`T+${current.duration}s`, paddingLeft + plotW - 14, paddingTop + plotH + 12);

      // Docked Signal Trace Line
      const traceY = paddingTop + plotH + 17;
      ctx.save();
      ctx.strokeStyle = hasAnomaly ? '#5C89B7' : '#2B557A';
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let x = 0; x <= plotW; x += 2) {
        const nx = x / plotW;
        const p1 = hasAnomaly ? Math.exp(-Math.pow((nx - 0.52) * 20, 2)) * 4.5 : 0;
        const ripple = Math.sin(nx * 24 - t * 4) * 0.5;
        const y = traceY + 3 - p1 + ripple;
        if (x === 0) ctx.moveTo(paddingLeft + x, y);
        else ctx.lineTo(paddingLeft + x, y);
      }
      ctx.stroke();
      ctx.restore();

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [observation]);

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
          onClick={toggleAudio}
          className={`inline-flex items-center gap-1.5 rounded-[2px] border px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#376A9B] ${
            isAudioActive
              ? 'border-[#376A9B] bg-[#376A9B]/20 text-[#5C89B7]'
              : 'border-[#213240] bg-[#1D2A37] text-[#7C8E9E] hover:text-[#E3EBF2]'
          }`}
        >
          {isAudioActive ? (
            <Volume2 className="h-3.5 w-3.5" />
          ) : (
            <VolumeX className="h-3.5 w-3.5" />
          )}
          <span>{isAudioActive ? 'Monitoring' : 'Audio feed'}</span>
        </button>
      </div>

      <div ref={containerRef} className="relative h-[150px] w-full bg-[#0D141A]">
        <canvas ref={canvasRef} className="h-full w-full select-none" />
      </div>
    </div>
  );
}
