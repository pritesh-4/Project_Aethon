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

      const paddingLeft = 40;
      const paddingRight = 14;
      const paddingTop = 16;
      const paddingBottom = 26;

      const plotW = Math.max(10, width - paddingLeft - paddingRight);
      const plotH = Math.max(10, height - paddingTop - paddingBottom);

      // Background
      ctx.fillStyle = '#06080B';
      ctx.fillRect(0, 0, width, height);

      // Plot Box
      ctx.fillStyle = '#0B0F14';
      ctx.fillRect(paddingLeft, paddingTop, plotW, plotH);

      // Grid
      ctx.strokeStyle = 'rgba(28, 38, 48, 0.6)';
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

            if (cl < 0.4) {
              cr = Math.floor(10 * cl);
              cg = Math.floor(45 * cl * 2.2);
              cb = Math.floor(115 * cl * 2.8);
            } else if (cl < 0.8) {
              const factor = (cl - 0.4) / 0.4;
              cr = Math.floor(14 + 40 * factor);
              cg = Math.floor(105 + 122 * factor);
              cb = Math.floor(165 + 90 * factor);
            } else {
              const factor = (cl - 0.8) / 0.2;
              cr = Math.floor(102 + 153 * factor);
              cg = Math.floor(227 + 28 * factor);
              cb = 255;
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
        ctx.fillStyle = 'rgba(91, 216, 245, 0.05)';
        ctx.fillRect(ax, ay, aw, ah);

        const cornerSize = 6;
        ctx.strokeStyle = current.status === 'review' ? '#E8AE50' : '#5BD8F5';
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
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.fillStyle = current.status === 'review' ? '#E8AE50' : '#5BD8F5';
        ctx.textAlign = 'left';
        ctx.fillText(`Anomalous region`, ax + 4, ay - 3);

        ctx.textAlign = 'right';
        ctx.fillText(`df/dt = ${driftSlope.toFixed(2)} Hz/s`, ax + aw - 4, ay - 3);
        ctx.restore();
      }

      // Outer Border
      ctx.strokeStyle = '#1C2630';
      ctx.lineWidth = 1;
      ctx.strokeRect(paddingLeft, paddingTop, plotW, plotH);

      // Axis Ticks
      ctx.fillStyle = '#7F8B95';
      ctx.font = '8px "JetBrains Mono", monospace';

      // Left Frequency Axis
      ctx.textAlign = 'right';
      ctx.fillText('+Δf', paddingLeft - 4, paddingTop + 6);
      ctx.fillText('f₀', paddingLeft - 4, paddingTop + plotH * 0.5 + 3);
      ctx.fillText('-Δf', paddingLeft - 4, paddingTop + plotH - 2);

      // Bottom Time Axis
      ctx.textAlign = 'center';
      ctx.fillText('T+00s', paddingLeft + 12, paddingTop + plotH + 11);
      ctx.fillText(`T+${current.duration}s`, paddingLeft + plotW - 14, paddingTop + plotH + 11);

      // Docked Signal Trace Line
      const traceY = paddingTop + plotH + 17;
      ctx.save();
      ctx.strokeStyle = hasAnomaly ? '#5BD8F5' : '#475569';
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
    <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] overflow-hidden select-none font-mono">
      {/* Viewport Header */}
      <div className="flex items-center justify-between border-b border-[#1C2630] bg-[#0B0F14] px-3 py-1.5 text-[10px] text-[#7F8B95]">
        <span className="flex items-center gap-1.5 font-medium text-slate-200">
          <Activity className="h-3 w-3 text-[#5BD8F5]" />
          Spectral morphology
        </span>

        <button
          type="button"
          aria-pressed={isAudioActive}
          onClick={toggleAudio}
          className={`inline-flex items-center gap-1 rounded-[1px] border px-1.5 py-0.5 text-[9px] font-mono transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5] ${
            isAudioActive
              ? 'border-[#5BD8F5] bg-[#5BD8F5]/15 text-[#5BD8F5]'
              : 'border-[#1C2630] bg-[#10161D] text-slate-400 hover:text-slate-200'
          }`}
        >
          {isAudioActive ? (
            <Volume2 className="h-2.5 w-2.5" />
          ) : (
            <VolumeX className="h-2.5 w-2.5" />
          )}
          <span>{isAudioActive ? 'Audio active' : 'Sonify'}</span>
        </button>
      </div>

      <div ref={containerRef} className="relative h-[150px] w-full bg-[#06080B]">
        <canvas ref={canvasRef} className="h-full w-full select-none" />
      </div>
    </div>
  );
}
