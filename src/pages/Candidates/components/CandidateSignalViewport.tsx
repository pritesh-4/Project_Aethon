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

      const paddingLeft = 46;
      const paddingRight = 16;
      const paddingTop = 14;
      const paddingBottom = 22;

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

      // Spectrogram Noise & Carrier (Deep midnight to observatory blue to solar gold highlight)
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

      // Outer Plot Border
      ctx.strokeStyle = '#213240';
      ctx.lineWidth = 1;
      ctx.strokeRect(paddingLeft, paddingTop, plotW, plotH);

      // Clean Axis Ticks
      ctx.fillStyle = '#7C8E9E';
      ctx.font = '10px "IBM Plex Mono", monospace';

      // Left Frequency Axis
      ctx.textAlign = 'right';
      ctx.fillText('+20k', paddingLeft - 5, paddingTop + 8);
      ctx.fillText('f₀', paddingLeft - 5, paddingTop + plotH * 0.5 + 3);
      ctx.fillText('-20k', paddingLeft - 5, paddingTop + plotH - 2);

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
    <div className="rounded-[3px] border border-[#213240] bg-[#0D141A] overflow-hidden select-none">
      <div className="flex items-center justify-between border-b border-[#213240] bg-[#111A22] px-3.5 py-2 text-xs text-[#7C8E9E]">
        <span className="font-semibold text-[#E3EBF2]">Spectrogram slice</span>

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

      <div ref={containerRef} className="relative h-[160px] sm:h-[180px] w-full bg-[#0D141A]">
        <canvas ref={canvasRef} className="h-full w-full select-none" />
      </div>
    </div>
  );
}
