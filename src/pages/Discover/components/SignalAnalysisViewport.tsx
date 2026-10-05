import { useEffect, useRef } from 'react';
import type { DiscoveryStage, DiscoveryObservationMeta } from '../types.ts';

export interface SignalAnalysisViewportProps {
  stage: DiscoveryStage;
  observation: DiscoveryObservationMeta;
  overallProgress: number; // 0 to 100
}

export function SignalAnalysisViewport({
  stage,
  observation,
  overallProgress,
}: SignalAnalysisViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const stateRef = useRef({ stage, observation, overallProgress });
  useEffect(() => {
    stateRef.current = { stage, observation, overallProgress };
  }, [stage, observation, overallProgress]);

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
      const { stage: currentStage, overallProgress: prog } = stateRef.current;

      const paddingLeft = 52;
      const paddingRight = 28;
      const paddingTop = 26;
      const paddingBottom = 34;

      const plotW = Math.max(10, width - paddingLeft - paddingRight);
      const plotH = Math.max(10, height - paddingTop - paddingBottom);
      const cy = paddingTop + plotH * 0.5;

      // 1. Clear Background
      ctx.fillStyle = '#03060C';
      ctx.fillRect(0, 0, width, height);

      // Plot Area Fill
      ctx.fillStyle = '#050913';
      ctx.fillRect(paddingLeft, paddingTop, plotW, plotH);

      // 2. Reticle Grid
      ctx.strokeStyle = 'rgba(23, 35, 56, 0.6)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 4]);

      for (let i = 0; i <= 4; i++) {
        const y = paddingTop + (plotH / 4) * i;
        ctx.beginPath();
        ctx.moveTo(paddingLeft, y);
        ctx.lineTo(paddingLeft + plotW, y);
        ctx.stroke();
      }

      for (let i = 0; i <= 5; i++) {
        const x = paddingLeft + (plotW / 5) * i;
        ctx.beginPath();
        ctx.moveTo(x, paddingTop);
        ctx.lineTo(x, paddingTop + plotH);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // 3. Evolving Single-Core Visualization based on Stage
      const pNorm = Math.min(1, Math.max(0, prog / 100));

      // STAGE A: RAW SIGNAL WAVEFORM (pNorm 0.0 to 0.25)
      if (pNorm < 0.35 || currentStage === 'idle' || currentStage === 'observation_loaded') {
        const waveAlpha = currentStage === 'preprocessing' ? 1 - (pNorm - 0.1) * 3 : 0.9;
        ctx.save();
        ctx.strokeStyle = '#38BDF8';
        ctx.shadowColor = 'rgba(56, 189, 248, 0.4)';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 1.3;
        ctx.globalAlpha = Math.max(0.15, Math.min(1, waveAlpha));

        ctx.beginPath();
        for (let x = 0; x <= plotW; x += 2) {
          const nx = x / plotW;
          const noise =
            Math.sin(x * 0.04 + t * 4) * 3 +
            Math.sin(x * 0.09 - t * 6) * 1.5 +
            (Math.random() - 0.5) * 3;
          const envelope = Math.exp(-Math.pow((nx - 0.52) * 4, 2));
          const carrier = Math.sin(x * 0.08 - t * 8) * 22 * envelope;

          const y = cy + noise + carrier;
          if (x === 0) ctx.moveTo(paddingLeft + x, y);
          else ctx.lineTo(paddingLeft + x, y);
        }
        ctx.stroke();
        ctx.restore();
      }

      // STAGE B: TIME-FREQUENCY SPECTROGRAM (emerges after pNorm > 0.15)
      if (pNorm > 0.15) {
        const specAlpha = Math.min(1, (pNorm - 0.15) * 3.5);
        ctx.save();
        ctx.globalAlpha = specAlpha * 0.85;

        const cellW = plotW / cols;
        const cellH = plotH / rows;

        for (let r = 0; r < rows; r++) {
          const normFreq = 1 - r / rows;
          for (let c = 0; c < cols; c++) {
            const normTime = c / cols;
            const baseNoise = noiseMatrix[r * cols + c] * 0.18;

            // Coherent Doppler carrier slope
            const carrierCenter = 0.54 + (normTime - 0.5) * -0.28;
            const dist = Math.abs(normFreq - carrierCenter);

            let intensity = baseNoise;
            if (dist < 0.045) {
              const strength = 1 - dist / 0.045;
              intensity += strength * (0.65 + Math.sin(c * 0.3 - t * 5) * 0.15);
            }

            if (intensity > 0.06) {
              const cl = Math.min(1, intensity);
              let cr: number;
              let cg: number;
              let cb: number;

              if (cl < 0.4) {
                cr = Math.floor(10 * cl);
                cg = Math.floor(50 * cl * 2);
                cb = Math.floor(120 * cl * 2.5);
              } else if (cl < 0.8) {
                const f = (cl - 0.4) / 0.4;
                cr = Math.floor(14 + 40 * f);
                cg = Math.floor(110 + 117 * f);
                cb = Math.floor(170 + 85 * f);
              } else {
                const f = (cl - 0.8) / 0.2;
                cr = Math.floor(102 + 153 * f);
                cg = Math.floor(227 + 28 * f);
                cb = 255;
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

      // STAGE C: REPRESENTATION LEARNING (Latent Token Nodes & Attention Connections)
      if (pNorm > 0.45) {
        const latentAlpha = Math.min(1, (pNorm - 0.45) * 3);
        ctx.save();
        ctx.globalAlpha = latentAlpha;

        const tokenCount = 10;
        const coords: { x: number; y: number }[] = [];

        for (let i = 0; i < tokenCount; i++) {
          const normX = 0.2 + (i / (tokenCount - 1)) * 0.6;
          const normY = 0.54 + (normX - 0.5) * -0.28;
          const tx = paddingLeft + normX * plotW;
          const ty = paddingTop + (1 - normY) * plotH + Math.sin(i * 1.2 + t * 3) * 4;
          coords.push({ x: tx, y: ty });

          // Token point
          ctx.fillStyle = '#66E3FF';
          ctx.shadowColor = '#66E3FF';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(tx, ty, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw sparse attention links between adjacent tokens
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
        ctx.lineWidth = 1;
        for (let i = 0; i < coords.length - 1; i++) {
          ctx.beginPath();
          ctx.moveTo(coords[i].x, coords[i].y);
          ctx.lineTo(coords[i + 1].x, coords[i + 1].y);
          ctx.stroke();
        }
        ctx.restore();
      }

      // STAGE D: ANOMALY SEARCH & CANDIDATE ISOLATION
      if (pNorm > 0.7 || currentStage === 'complete') {
        const anomAlpha = Math.min(1, (pNorm - 0.7) * 3.5);
        ctx.save();
        ctx.globalAlpha = anomAlpha;

        const bx = paddingLeft + plotW * 0.42;
        const bw = plotW * 0.34;
        const by = paddingTop + plotH * 0.32;
        const bh = plotH * 0.34;

        // Anomaly bounding brackets
        ctx.strokeStyle = currentStage === 'complete' ? '#10B981' : '#66E3FF';
        ctx.lineWidth = 1.3;
        const cLen = 12;

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

        // Doppler vector trajectory line
        ctx.strokeStyle = currentStage === 'complete' ? '#10B981' : '#66E3FF';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(bx + 10, by + 14);
        ctx.lineTo(bx + bw - 10, by + bh - 14);
        ctx.stroke();

        // Micro telemetry label
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = currentStage === 'complete' ? '#10B981' : '#66E3FF';
        ctx.textAlign = 'left';
        ctx.fillText(
          currentStage === 'complete' ? 'CANDIDATE EVENT ISOLATED' : 'ANOMALY RESIDUAL Δ > 4.8σ',
          bx + 4,
          by - 6
        );

        ctx.textAlign = 'right';
        ctx.fillText('df/dt = -0.32 Hz/s', bx + bw - 4, by - 6);

        ctx.restore();
      }

      // 4. Outer Border
      ctx.strokeStyle = '#172338';
      ctx.lineWidth = 1;
      ctx.strokeRect(paddingLeft, paddingTop, plotW, plotH);

      // 5. Scientific Axis Labels
      ctx.fillStyle = '#84929C';
      ctx.font = '9px "JetBrains Mono", monospace';

      // Left Frequency Axis
      const f0 = 1420.37;
      ctx.textAlign = 'right';
      ctx.fillText('+6.25 MHz', paddingLeft - 6, paddingTop + 8);
      ctx.fillText(`f₀ // ${f0.toFixed(2)}`, paddingLeft - 6, cy + 3);
      ctx.fillText('-6.25 MHz', paddingLeft - 6, paddingTop + plotH - 2);

      // Bottom Time Axis
      ctx.textAlign = 'center';
      ctx.fillText('00:00', paddingLeft + 16, paddingTop + plotH + 16);
      ctx.fillText('02:16', paddingLeft + plotW * 0.5, paddingTop + plotH + 16);
      ctx.fillText('04:32', paddingLeft + plotW - 16, paddingTop + plotH + 16);

      // Top Stage Header HUD
      ctx.fillStyle = '#64748B';
      ctx.textAlign = 'left';
      ctx.fillText(
        `PROCESS PHASE: ${currentStage.toUpperCase()} // CADENCE: 1.00s // POL: DUAL CIRCULAR`,
        paddingLeft,
        paddingTop - 10
      );

      ctx.textAlign = 'right';
      ctx.fillText(
        `APERTURE: ${observation.telescope.split(' ')[0]} // SAMPLES: ${observation.samplesCount.toLocaleString()}`,
        paddingLeft + plotW,
        paddingTop - 10
      );

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [observation]);

  return (
    <div className="relative flex flex-col rounded-[2px] border border-slate-800/80 bg-[#05070A] overflow-hidden shadow-2xl">
      {/* Viewport Top Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 bg-[#0A0E13] px-3 py-1.5 font-mono text-[11px] text-[#84929C] select-none">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-none bg-[#66E3FF] animate-pulse" />
          <span className="font-bold text-[#EAF4F7] uppercase tracking-wider">
            TRANSFORMATIONAL SIGNAL ANALYSIS CHAMBER
          </span>
        </div>

        <div className="flex items-center gap-2 text-[10px]">
          <span>TRANSFORMATION:</span>
          <span className="text-cyan-300 font-semibold uppercase">
            RAW → STFT → LATENT → ANOMALY
          </span>
        </div>
      </div>

      {/* Main Canvas Viewport */}
      <div ref={containerRef} className="relative h-[280px] sm:h-[340px] w-full bg-[#03060C]">
        <canvas ref={canvasRef} className="h-full w-full select-none" />
      </div>
    </div>
  );
}
