import { useEffect, useRef, useState, useCallback } from 'react';
import type { CandidateSignalData } from '../types.ts';
import { observatoryAudio } from '@/lib/audio-synth.ts';
import { Volume2, VolumeX } from 'lucide-react';

export interface CandidateSignalPreviewProps {
  candidate: CandidateSignalData;
}

export function CandidateSignalPreview({ candidate }: CandidateSignalPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isAudioActive, setIsAudioActive] = useState(false);

  const candidateRef = useRef(candidate);
  useEffect(() => {
    candidateRef.current = candidate;
  }, [candidate]);

  const toggleAudio = useCallback(() => {
    const active = observatoryAudio.toggle();
    setIsAudioActive(active);
    if (active) {
      observatoryAudio.updateCarrierPresence(0.85, candidate.driftRateHzPerSec);
    }
  }, [candidate.driftRateHzPerSec]);

  useEffect(() => {
    if (isAudioActive) {
      observatoryAudio.updateCarrierPresence(0.85, candidate.driftRateHzPerSec);
    }
  }, [isAudioActive, candidate.driftRateHzPerSec]);

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
    const cols = 70;
    const rows = 32;
    const noiseMatrix = new Float32Array(cols * rows);
    for (let i = 0; i < cols * rows; i++) {
      noiseMatrix[i] = Math.random();
    }

    const render = (now: number) => {
      const t = (now - startTime) * 0.001;
      const current = candidateRef.current;

      const paddingLeft = 46;
      const paddingRight = 20;
      const paddingTop = 22;
      const paddingBottom = 34;

      const plotW = Math.max(10, width - paddingLeft - paddingRight);
      const plotH = Math.max(10, height - paddingTop - paddingBottom);

      // Background
      ctx.fillStyle = '#03060C';
      ctx.fillRect(0, 0, width, height);

      // Plot Box
      ctx.fillStyle = '#050913';
      ctx.fillRect(paddingLeft, paddingTop, plotW, plotH);

      // Grid
      ctx.strokeStyle = 'rgba(23, 35, 56, 0.6)';
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
      const driftSlope = current.driftRateHzPerSec;

      for (let r = 0; r < rows; r++) {
        const normFreq = 1 - r / rows;
        for (let c = 0; c < cols; c++) {
          const normTime = c / cols;
          const noise = noiseMatrix[r * cols + c] * 0.16;

          // Carrier with Doppler drift slope
          const carrierCenter = 0.52 + (normTime - 0.5) * (driftSlope * 0.5);
          const dist = Math.abs(normFreq - carrierCenter);

          let intensity = noise;
          if (dist < 0.04) {
            intensity += (1 - dist / 0.04) * (0.65 + Math.sin(c * 0.4 - t * 5) * 0.15);
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

      // Anomaly Bounding Bracket
      const ax = paddingLeft + plotW * 0.35;
      const aw = plotW * 0.42;
      const ay = paddingTop + plotH * 0.32;
      const ah = plotH * 0.36;

      ctx.save();
      ctx.fillStyle = 'rgba(6, 182, 212, 0.06)';
      ctx.fillRect(ax, ay, aw, ah);

      const cornerSize = 8;
      ctx.strokeStyle = current.priority === 'HIGH' ? '#FFB84D' : '#66E3FF';
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

      // Vector trace line
      ctx.beginPath();
      ctx.moveTo(ax + 8, ay + 10);
      ctx.lineTo(ax + aw - 8, ay + ah - 10);
      ctx.stroke();

      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillStyle = current.priority === 'HIGH' ? '#FFB84D' : '#66E3FF';
      ctx.textAlign = 'left';
      ctx.fillText(`ANOMALY REGION [${current.bandwidthKHz} kHz]`, ax + 4, ay - 4);

      ctx.textAlign = 'right';
      ctx.fillText(`df/dt = ${current.driftRateHzPerSec.toFixed(2)} Hz/s`, ax + aw - 4, ay - 4);
      ctx.restore();

      // Outer Border
      ctx.strokeStyle = '#172338';
      ctx.lineWidth = 1;
      ctx.strokeRect(paddingLeft, paddingTop, plotW, plotH);

      // Axis Ticks
      ctx.fillStyle = '#84929C';
      ctx.font = '8px "JetBrains Mono", monospace';

      // Left Frequency Axis
      ctx.textAlign = 'right';
      ctx.fillText('+25 kHz', paddingLeft - 4, paddingTop + 6);
      ctx.fillText('f₀', paddingLeft - 4, paddingTop + plotH * 0.5 + 3);
      ctx.fillText('-25 kHz', paddingLeft - 4, paddingTop + plotH - 2);

      // Bottom Time Axis
      ctx.textAlign = 'center';
      ctx.fillText('T+00s', paddingLeft + 12, paddingTop + plotH + 12);
      ctx.fillText(
        `T+${current.durationSeconds.toFixed(0)}s`,
        paddingLeft + plotW - 14,
        paddingTop + plotH + 12
      );

      // Docked Signal Trace Line: ────────╱╲────────────╱╲──────
      const traceY = paddingTop + plotH + 18;
      ctx.save();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      for (let x = 0; x <= plotW; x += 2) {
        const nx = x / plotW;
        const p1 = Math.exp(-Math.pow((nx - 0.52) * 20, 2)) * 6;
        const ripple = Math.sin(nx * 30 - t * 6) * 0.6;
        const y = traceY + 4 - p1 + ripple;
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
  }, [candidate]);

  return (
    <div className="relative rounded-[2px] border border-slate-800/80 bg-[#05070A] overflow-hidden select-none">
      {/* Viewport Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#0A0E13] px-3 py-1 font-mono text-[10px] text-[#84929C]">
        <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-slate-200">
          <span className="h-1.5 w-1.5 rounded-none bg-[#66E3FF]" />
          SPECTRAL MORPHOLOGY VIEWPORT
        </span>

        <button
          type="button"
          onClick={toggleAudio}
          className={`inline-flex items-center gap-1 rounded-[1px] border px-1.5 py-0.2 text-[9px] uppercase font-mono tracking-wider transition-colors cursor-pointer ${
            isAudioActive
              ? 'border-[#66E3FF] bg-[#66E3FF]/15 text-[#66E3FF]'
              : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200'
          }`}
        >
          {isAudioActive ? (
            <Volume2 className="h-2.5 w-2.5" />
          ) : (
            <VolumeX className="h-2.5 w-2.5" />
          )}
          <span>SONIFY</span>
        </button>
      </div>

      <div ref={containerRef} className="relative h-[180px] w-full bg-[#03060C]">
        <canvas ref={canvasRef} className="h-full w-full select-none" />
      </div>
    </div>
  );
}
