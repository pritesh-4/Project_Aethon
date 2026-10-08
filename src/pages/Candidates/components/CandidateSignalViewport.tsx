import { useEffect, useRef, useState, useCallback } from 'react';
import type { CandidateSignalData } from '../types.ts';
import { observatoryAudio } from '@/lib/audio-synth.ts';
import { Volume2, VolumeX } from 'lucide-react';

export interface CandidateSignalViewportProps {
  candidate: CandidateSignalData;
}

export function CandidateSignalViewport({ candidate }: CandidateSignalViewportProps) {
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

    const cols = 64;
    const rows = 28;
    const noiseMatrix = new Float32Array(cols * rows);
    for (let i = 0; i < cols * rows; i++) {
      noiseMatrix[i] = Math.random();
    }

    const render = (now: number) => {
      const t = (now - startTime) * 0.001;
      const current = candidateRef.current;

      const paddingLeft = 40;
      const paddingRight = 16;
      const paddingTop = 14;
      const paddingBottom = 24;

      const plotW = Math.max(10, width - paddingLeft - paddingRight);
      const plotH = Math.max(10, height - paddingTop - paddingBottom);

      // Background
      ctx.fillStyle = '#06080B';
      ctx.fillRect(0, 0, width, height);

      // Plot Area Fill
      ctx.fillStyle = '#0B0F14';
      ctx.fillRect(paddingLeft, paddingTop, plotW, plotH);

      // Reticle Grid
      ctx.strokeStyle = 'rgba(23, 34, 48, 0.7)';
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

          // Carrier with Doppler slope
          const carrierCenter = 0.52 + (normTime - 0.5) * (driftSlope * 0.45);
          const dist = Math.abs(normFreq - carrierCenter);

          let intensity = noise;
          if (dist < 0.045) {
            intensity += (1 - dist / 0.045) * (0.68 + Math.sin(c * 0.4 - t * 4) * 0.14);
          }

          if (intensity > 0.06) {
            const cl = Math.min(1, intensity);
            let cr: number;
            let cg: number;
            let cb: number;

            if (cl < 0.4) {
              cr = Math.floor(10 * cl);
              cg = Math.floor(45 * cl * 2);
              cb = Math.floor(110 * cl * 2.5);
            } else if (cl < 0.8) {
              const factor = (cl - 0.4) / 0.4;
              cr = Math.floor(14 + 35 * factor);
              cg = Math.floor(95 + 110 * factor);
              cb = Math.floor(155 + 85 * factor);
            } else {
              const factor = (cl - 0.8) / 0.2;
              cr = Math.floor(95 + 130 * factor);
              cg = Math.floor(215 + 25 * factor);
              cb = 245;
            }

            ctx.fillStyle = `rgb(${cr}, ${cg}, ${cb})`;
            ctx.fillRect(paddingLeft + c * cellW, paddingTop + r * cellH, cellW + 0.5, cellH + 0.5);
          }
        }
      }

      // Outer Plot Border
      ctx.strokeStyle = '#1C2630';
      ctx.lineWidth = 1;
      ctx.strokeRect(paddingLeft, paddingTop, plotW, plotH);

      // Clean Axis Ticks
      ctx.fillStyle = '#7F8B95';
      ctx.font = '9px Inter, sans-serif';

      // Left Frequency Axis
      ctx.textAlign = 'right';
      ctx.fillText('+20 kHz', paddingLeft - 4, paddingTop + 6);
      ctx.fillText('f₀', paddingLeft - 4, paddingTop + plotH * 0.5 + 3);
      ctx.fillText('-20 kHz', paddingLeft - 4, paddingTop + plotH - 2);

      // Bottom Time Axis
      ctx.textAlign = 'center';
      ctx.fillText('0s', paddingLeft + 10, paddingTop + plotH + 14);
      ctx.fillText(
        `${current.durationSeconds.toFixed(0)}s`,
        paddingLeft + plotW - 10,
        paddingTop + plotH + 14
      );

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [candidate]);

  return (
    <div className="rounded border border-[#1C2630] bg-[#06080B] overflow-hidden select-none">
      <div className="flex items-center justify-between border-b border-[#1C2630] bg-[#0B0F14] px-3 py-1.5 text-xs text-[#7F8B95]">
        <span className="font-medium text-[#E6EDF2]">Signal spectrogram</span>

        <button
          type="button"
          aria-pressed={isAudioActive}
          onClick={toggleAudio}
          className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5] ${
            isAudioActive
              ? 'border-[#5BD8F5] bg-[#5BD8F5]/10 text-[#5BD8F5]'
              : 'border-[#1C2630] bg-[#10161D] text-[#7F8B95] hover:text-[#E6EDF2]'
          }`}
        >
          {isAudioActive ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
          <span>{isAudioActive ? 'Mute' : 'Audio'}</span>
        </button>
      </div>

      <div ref={containerRef} className="relative h-[160px] sm:h-[180px] w-full bg-[#06080B]">
        <canvas ref={canvasRef} className="h-full w-full select-none" />
      </div>
    </div>
  );
}
