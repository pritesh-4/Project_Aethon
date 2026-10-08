import { useEffect, useRef } from 'react';
import type { DiscoveryStage, DiscoveryObservationMeta } from '../types.ts';

export interface SignalAnalysisViewportProps {
  stage: DiscoveryStage;
  observation: DiscoveryObservationMeta;
}

export function SignalAnalysisViewport({ stage, observation }: SignalAnalysisViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const stateRef = useRef({ stage, observation });
  useEffect(() => {
    stateRef.current = { stage, observation };
  }, [stage, observation]);

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
    const cols = 80;
    const rows = 36;
    const noiseMatrix = new Float32Array(cols * rows);
    for (let i = 0; i < cols * rows; i++) {
      noiseMatrix[i] = Math.random();
    }

    const render = (now: number) => {
      const t = (now - startTime) * 0.001;
      const { stage: currentStage } = stateRef.current;

      const paddingLeft = 52;
      const paddingRight = 24;
      const paddingTop = 20;
      const paddingBottom = 28;

      const plotW = Math.max(10, width - paddingLeft - paddingRight);
      const plotH = Math.max(10, height - paddingTop - paddingBottom);
      const cy = paddingTop + plotH * 0.5;

      // 1. Instrument Background (#0D141A)
      ctx.fillStyle = '#0D141A';
      ctx.fillRect(0, 0, width, height);

      // Plot Area Fill (#111A22)
      ctx.fillStyle = '#111A22';
      ctx.fillRect(paddingLeft, paddingTop, plotW, plotH);

      // 2. Reticle Grid
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

      // 3. Stage Visual Progression
      const isPrepare = currentStage === 'prepare' || currentStage === 'idle';
      const isRepresent = currentStage === 'represent';
      const isSearch = currentStage === 'search';
      const isRankOrComplete = currentStage === 'rank' || currentStage === 'complete';

      // Waveform display during prepare (Observatory Blue)
      if (isPrepare) {
        ctx.save();
        ctx.strokeStyle = '#5C89B7';
        ctx.lineWidth = 1.4;

        ctx.beginPath();
        for (let x = 0; x <= plotW; x += 2) {
          const nx = x / plotW;
          const noise =
            Math.sin(x * 0.04 + t * 4) * 3 +
            Math.sin(x * 0.09 - t * 6) * 1.5 +
            (Math.random() - 0.5) * 2;
          const envelope = Math.exp(-Math.pow((nx - 0.5) * 4, 2));
          const carrier = Math.sin(x * 0.08 - t * 8) * 18 * envelope;

          const y = cy + noise + carrier;
          if (x === 0) ctx.moveTo(paddingLeft + x, y);
          else ctx.lineTo(paddingLeft + x, y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // Spectrogram display during represent, search, rank, complete
      if (isRepresent || isSearch || isRankOrComplete) {
        ctx.save();
        const cellW = plotW / cols;
        const cellH = plotH / rows;

        for (let r = 0; r < rows; r++) {
          const normFreq = 1 - r / rows;
          for (let c = 0; c < cols; c++) {
            const normTime = c / cols;
            const baseNoise = noiseMatrix[r * cols + c] * 0.16;

            // Carrier slope
            const carrierCenter = 0.54 + (normTime - 0.5) * -0.28;
            const dist = Math.abs(normFreq - carrierCenter);

            let intensity = baseNoise;
            if (dist < 0.045) {
              const strength = 1 - dist / 0.045;
              intensity += strength * (0.65 + Math.sin(c * 0.3 - t * 4) * 0.15);
            }

            if (intensity > 0.06) {
              const cl = Math.min(1, intensity);
              let cr: number;
              let cg: number;
              let cb: number;

              if (cl < 0.4) {
                // Dark midnight to observatory blue
                cr = Math.floor(13 + 30 * cl);
                cg = Math.floor(20 + 60 * cl);
                cb = Math.floor(26 + 100 * cl);
              } else if (cl < 0.8) {
                // Observatory blue to sky cyan
                const f = (cl - 0.4) / 0.4;
                cr = Math.floor(25 + 60 * f);
                cg = Math.floor(44 + 90 * f);
                cb = Math.floor(66 + 115 * f);
              } else {
                // Peak highlight to solar gold
                const f = (cl - 0.8) / 0.2;
                cr = Math.floor(85 + 110 * f);
                cg = Math.floor(134 + 60 * f);
                cb = Math.floor(181 - 70 * f);
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
        ctx.restore();
      }

      // Anomaly isolation bracket during search, rank, and complete (Solar Gold #C19348)
      if (isSearch || isRankOrComplete) {
        ctx.save();
        const bx = paddingLeft + plotW * 0.42;
        const bw = plotW * 0.34;
        const by = paddingTop + plotH * 0.32;
        const bh = plotH * 0.34;

        ctx.strokeStyle = '#C19348';
        ctx.lineWidth = 1.3;
        const cLen = 10;

        // Top-left
        ctx.beginPath();
        ctx.moveTo(bx, by + cLen);
        ctx.lineTo(bx, by);
        ctx.lineTo(bx + cLen, by);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(bx + bw - cLen, by);
        ctx.lineTo(bx + bw, by);
        ctx.lineTo(bx + bw, by + cLen);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(bx, by + bh - cLen);
        ctx.lineTo(bx, by + bh);
        ctx.lineTo(bx + cLen, by + bh);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(bx + bw - cLen, by + bh);
        ctx.lineTo(bx + bw, by + bh);
        ctx.lineTo(bx + bw, by + bh - cLen);
        ctx.stroke();

        // Drift line
        ctx.beginPath();
        ctx.moveTo(bx + 8, by + 12);
        ctx.lineTo(bx + bw - 8, by + bh - 12);
        ctx.stroke();

        // Clean label
        ctx.font = '500 11px "Source Sans 3", sans-serif';
        ctx.fillStyle = '#C19348';
        ctx.textAlign = 'left';
        ctx.fillText(
          isRankOrComplete ? 'Candidate signal isolated' : 'Anomaly detected',
          bx + 4,
          by - 6
        );

        ctx.restore();
      }

      // Outer Plot Border
      ctx.strokeStyle = '#213240';
      ctx.lineWidth = 1;
      ctx.strokeRect(paddingLeft, paddingTop, plotW, plotH);

      // Clean Scientific Axes
      ctx.fillStyle = '#7C8E9E';
      ctx.font = '10px "IBM Plex Mono", monospace';

      // Frequency axis (Y)
      const f0 = observation.frequencyMHz;
      const halfBw = (observation.bandwidthMHz / 2).toFixed(1);
      ctx.textAlign = 'right';
      ctx.fillText(`+${halfBw} MHz`, paddingLeft - 6, paddingTop + 8);
      ctx.fillText(`${f0.toFixed(2)} MHz`, paddingLeft - 6, cy + 3);
      ctx.fillText(`-${halfBw} MHz`, paddingLeft - 6, paddingTop + plotH - 2);

      // Time axis (X)
      ctx.textAlign = 'center';
      ctx.fillText('00:00', paddingLeft + 16, paddingTop + plotH + 16);
      ctx.fillText('Observation duration', paddingLeft + plotW * 0.5, paddingTop + plotH + 16);
      ctx.fillText(observation.durationString, paddingLeft + plotW - 16, paddingTop + plotH + 16);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [observation]);

  return (
    <div className="rounded-[3px] border border-[#213240] bg-[#0D141A] overflow-hidden select-none font-sans shadow-md">
      <div className="flex items-center justify-between border-b border-[#213240] bg-[#111A22] px-4 py-2.5 text-xs">
        <span className="font-semibold text-[#E3EBF2]">Time–frequency spectrogram</span>
        <span className="text-[11px] text-[#7C8E9E] font-mono">{observation.name}</span>
      </div>

      <div ref={containerRef} className="relative h-[220px] sm:h-[260px] w-full bg-[#0D141A]">
        <canvas ref={canvasRef} className="h-full w-full select-none" />
      </div>
    </div>
  );
}
