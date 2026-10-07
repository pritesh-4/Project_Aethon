import { useEffect, useRef, useState, useCallback } from 'react';
import type { SignalAnalysisRecord, AnalysisStageId } from '../types.ts';
import { observatoryAudio } from '@/lib/audio-synth.ts';
import { Volume2, VolumeX } from 'lucide-react';

export interface PrimarySignalVisualProps {
  record: SignalAnalysisRecord;
  activeStage: AnalysisStageId;
}

export function PrimarySignalVisual({ record, activeStage }: PrimarySignalVisualProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isAudioActive, setIsAudioActive] = useState(false);

  const stateRef = useRef({ record, activeStage });
  useEffect(() => {
    stateRef.current = { record, activeStage };
  }, [record, activeStage]);

  const toggleAudio = useCallback(() => {
    const active = observatoryAudio.toggle();
    setIsAudioActive(active);
    if (active) {
      observatoryAudio.updateCarrierPresence(0.9, record.driftRateHzPerSec);
    }
  }, [record.driftRateHzPerSec]);

  useEffect(() => {
    if (isAudioActive) {
      observatoryAudio.updateCarrierPresence(0.9, record.driftRateHzPerSec);
    }
  }, [isAudioActive, record.driftRateHzPerSec]);

  useEffect(() => {
    return () => {
      observatoryAudio.mute();
    };
  }, []);

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
    const cols = 84;
    const rows = 38;
    const noiseMatrix = new Float32Array(cols * rows);
    for (let i = 0; i < cols * rows; i++) {
      noiseMatrix[i] = Math.random();
    }

    const render = (now: number) => {
      const t = (now - startTime) * 0.001;
      const { record: rec, activeStage: stage } = stateRef.current;

      const paddingLeft = 52;
      const paddingRight = 28;
      const paddingTop = 24;
      const paddingBottom = 38;

      const plotW = Math.max(10, width - paddingLeft - paddingRight);
      const plotH = Math.max(10, height - paddingTop - paddingBottom);
      const cy = paddingTop + plotH * 0.5;

      // 1. Clear Background
      ctx.fillStyle = '#06080B';
      ctx.fillRect(0, 0, width, height);

      // Plot Area Fill
      ctx.fillStyle = '#0B0F14';
      ctx.fillRect(paddingLeft, paddingTop, plotW, plotH);

      // 2. Reticle Grid
      ctx.strokeStyle = 'rgba(23, 34, 48, 0.7)';
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

      // 3. Stage-Specific Visualizations

      // ========================================================
      // STAGE 1: OBSERVATION (Raw Time-Frequency Spectrogram)
      // ========================================================
      if (stage === 'observation') {
        const cellW = plotW / cols;
        const cellH = plotH / rows;
        const driftSlope = rec.driftRateHzPerSec;

        for (let r = 0; r < rows; r++) {
          const normFreq = 1 - r / rows;
          for (let c = 0; c < cols; c++) {
            const normTime = c / cols;
            const noise = noiseMatrix[r * cols + c] * 0.18;

            const carrierCenter = 0.52 + (normTime - 0.5) * (driftSlope * 0.45);
            const dist = Math.abs(normFreq - carrierCenter);

            let intensity = noise;
            if (dist < 0.045) {
              intensity += (1 - dist / 0.045) * (0.65 + Math.sin(c * 0.4 - t * 4) * 0.15);
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

      // ========================================================
      // STAGE 2: REPRESENTATION (Latent Patch Tokens & Attention)
      // ========================================================
      if (stage === 'representation') {
        // Base spectrogram faint background
        const cellW = plotW / cols;
        const cellH = plotH / rows;
        for (let r = 0; r < rows; r += 2) {
          for (let c = 0; c < cols; c += 2) {
            const n = noiseMatrix[r * cols + c] * 0.08;
            ctx.fillStyle = `rgba(91, 216, 245, ${n})`;
            ctx.fillRect(paddingLeft + c * cellW, paddingTop + r * cellH, cellW * 2, cellH * 2);
          }
        }

        // Draw Latent Transformer Patch Tokens along the carrier
        const tokenCount = 12;
        const tokenCoords: { x: number; y: number }[] = [];

        for (let i = 0; i < tokenCount; i++) {
          const normX = 0.15 + (i / (tokenCount - 1)) * 0.7;
          const normY = 0.52 + (normX - 0.5) * (rec.driftRateHzPerSec * 0.45);
          const tx = paddingLeft + normX * plotW;
          const ty = paddingTop + (1 - normY) * plotH + Math.sin(i * 1.5 + t * 3) * 3;
          tokenCoords.push({ x: tx, y: ty });

          // Patch bounding box
          ctx.strokeStyle = 'rgba(91, 216, 245, 0.4)';
          ctx.strokeRect(tx - 12, ty - 12, 24, 24);

          // Token centroid node
          ctx.fillStyle = '#5BD8F5';
          ctx.beginPath();
          ctx.arc(tx, ty, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // Attention Links between tokens
        ctx.strokeStyle = 'rgba(91, 216, 245, 0.35)';
        ctx.lineWidth = 1;
        for (let i = 0; i < tokenCoords.length - 1; i++) {
          ctx.beginPath();
          ctx.moveTo(tokenCoords[i].x, tokenCoords[i].y);
          ctx.lineTo(tokenCoords[i + 1].x, tokenCoords[i + 1].y);
          ctx.stroke();

          // Sparse cross-attention skips
          if (i % 2 === 0 && i + 2 < tokenCoords.length) {
            ctx.beginPath();
            ctx.moveTo(tokenCoords[i].x, tokenCoords[i].y);
            ctx.quadraticCurveTo(
              (tokenCoords[i].x + tokenCoords[i + 2].x) * 0.5,
              tokenCoords[i].y - 18,
              tokenCoords[i + 2].x,
              tokenCoords[i + 2].y
            );
            ctx.stroke();
          }
        }
      }

      // ========================================================
      // STAGE 3: PATTERN COMPARISON (Observed vs Nearest Known Catalog)
      // ========================================================
      if (stage === 'comparison') {
        // Upper half: Observed Candidate Carrier
        ctx.save();
        ctx.strokeStyle = '#5BD8F5';
        ctx.lineWidth = 2;
        ctx.beginPath();

        const driftSlope = rec.driftRateHzPerSec;
        for (let x = 0; x <= plotW; x += 4) {
          const nx = x / plotW;
          const ny = 0.55 + (nx - 0.5) * (driftSlope * 0.45);
          const y = paddingTop + (1 - ny) * plotH + Math.sin(nx * 20 - t * 4) * 2;
          if (x === 0) ctx.moveTo(paddingLeft + x, y);
          else ctx.lineTo(paddingLeft + x, y);
        }
        ctx.stroke();

        // Label Candidate
        ctx.font = '11px Inter, sans-serif';
        ctx.fillStyle = '#5BD8F5';
        ctx.fillText(
          `Observed: ${rec.candidateId} (Continuous monochromatic carrier)`,
          paddingLeft + 12,
          paddingTop + 20
        );

        // Lower: Nearest Known Catalog (e.g. Pulsar harmonic periodic bursts)
        ctx.strokeStyle = '#E8AE50';
        ctx.setLineDash([4, 4]);
        ctx.lineWidth = 1.5;
        ctx.beginPath();

        for (let x = 0; x <= plotW; x += 3) {
          const nx = x / plotW;
          // Pulsed harmonic bursts (natural emitter profile)
          const burst = Math.sin(nx * 32) > 0.6 ? 24 : 0;
          const y = cy + 28 + burst + Math.sin(nx * 10) * 4;
          if (x === 0) ctx.moveTo(paddingLeft + x, y);
          else ctx.lineTo(paddingLeft + x, y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Label Nearest Known Pattern
        ctx.fillStyle = '#E8AE50';
        ctx.fillText(
          `Nearest Catalog: ${rec.comparison.nearestKnownPattern} (Cosine distance: ${rec.comparison.cosineDistance.toFixed(3)})`,
          paddingLeft + 12,
          paddingTop + plotH - 16
        );
        ctx.restore();
      }

      // ========================================================
      // STAGE 4: ANOMALY (Residual Divergence & Doppler Drift)
      // ========================================================
      if (stage === 'anomaly') {
        const cellW = plotW / cols;
        const cellH = plotH / rows;
        const driftSlope = rec.driftRateHzPerSec;

        // Spectrogram
        for (let r = 0; r < rows; r++) {
          const normFreq = 1 - r / rows;
          for (let c = 0; c < cols; c++) {
            const normTime = c / cols;
            const noise = noiseMatrix[r * cols + c] * 0.16;

            const carrierCenter = 0.52 + (normTime - 0.5) * (driftSlope * 0.45);
            const dist = Math.abs(normFreq - carrierCenter);

            let intensity = noise;
            if (dist < 0.045) {
              intensity += (1 - dist / 0.045) * 0.75;
            }

            if (intensity > 0.06) {
              const cl = Math.min(1, intensity);
              ctx.fillStyle = `rgba(91, 216, 245, ${cl * 0.9})`;
              ctx.fillRect(
                paddingLeft + c * cellW,
                paddingTop + r * cellH,
                cellW + 0.5,
                cellH + 0.5
              );
            }
          }
        }

        // Anomaly Bounding Bracket & Vector
        const ax = paddingLeft + plotW * 0.35;
        const aw = plotW * 0.42;
        const ay = paddingTop + plotH * 0.28;
        const ah = plotH * 0.42;

        ctx.strokeStyle = '#5BD8F5';
        ctx.lineWidth = 1.3;
        const cLen = 12;

        // Top-left
        ctx.beginPath();
        ctx.moveTo(ax, ay + cLen);
        ctx.lineTo(ax, ay);
        ctx.lineTo(ax + cLen, ay);
        ctx.stroke();

        // Top-right
        ctx.beginPath();
        ctx.moveTo(ax + aw - cLen, ay);
        ctx.lineTo(ax + aw, ay);
        ctx.lineTo(ax + aw, ay + cLen);
        ctx.stroke();

        // Bottom-left
        ctx.beginPath();
        ctx.moveTo(ax, ay + ah - cLen);
        ctx.lineTo(ax, ay + ah);
        ctx.lineTo(ax + cLen, ay + ah);
        ctx.stroke();

        // Bottom-right
        ctx.beginPath();
        ctx.moveTo(ax + aw - cLen, ay + ah);
        ctx.lineTo(ax + aw, ay + ah);
        ctx.lineTo(ax + aw, ay + ah - cLen);
        ctx.stroke();

        // Drift trajectory line
        ctx.beginPath();
        ctx.moveTo(ax + 8, ay + 12);
        ctx.lineTo(ax + aw - 8, ay + ah - 12);
        ctx.stroke();

        // Anomaly callout text
        ctx.font = '11px Inter, sans-serif';
        ctx.fillStyle = '#5BD8F5';
        ctx.textAlign = 'left';
        ctx.fillText(`Anomaly residual: +4.8σ divergence from baseline`, ax + 4, ay - 8);

        ctx.textAlign = 'right';
        ctx.fillText(`Drift: ${rec.driftRateHzPerSec.toFixed(2)} Hz/s`, ax + aw - 4, ay - 8);
      }

      // 4. Outer Border
      ctx.strokeStyle = '#1C2630';
      ctx.lineWidth = 1;
      ctx.strokeRect(paddingLeft, paddingTop, plotW, plotH);

      // 5. Scientific Axis Labels
      ctx.fillStyle = '#7F8B95';
      ctx.font = '10px Inter, sans-serif';

      // Left Frequency Axis
      const f0 = rec.frequencyMHz;
      ctx.textAlign = 'right';
      ctx.fillText('+20 kHz', paddingLeft - 6, paddingTop + 8);
      ctx.fillText(`${f0.toFixed(2)} MHz`, paddingLeft - 6, cy + 3);
      ctx.fillText('-20 kHz', paddingLeft - 6, paddingTop + plotH - 2);

      // Bottom Time Axis
      ctx.textAlign = 'center';
      ctx.fillText('0s', paddingLeft + 12, paddingTop + plotH + 16);
      ctx.fillText(`Midpoint`, paddingLeft + plotW * 0.5, paddingTop + plotH + 16);
      ctx.fillText(
        `${rec.durationSeconds.toFixed(1)}s`,
        paddingLeft + plotW - 14,
        paddingTop + plotH + 16
      );

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [record]);

  const stageTitles: Record<AnalysisStageId, string> = {
    observation: 'Raw observation time–frequency spectrogram',
    representation: 'Latent embedding patches and attention representation',
    comparison: 'Morphological comparison against catalog baseline',
    anomaly: 'Isolated anomaly residual and Doppler drift trajectory',
  };

  return (
    <div className="rounded border border-[#1C2630] bg-[#06080B] overflow-hidden select-none shadow-sm">
      {/* Viewport Top Bar */}
      <div className="flex items-center justify-between border-b border-[#1C2630] bg-[#0B0F14] px-4 py-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#5BD8F5]" />
          <span className="font-medium text-[#E6EDF2]">{stageTitles[activeStage]}</span>
        </div>

        <button
          type="button"
          onClick={toggleAudio}
          className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] font-medium transition-colors cursor-pointer ${
            isAudioActive
              ? 'border-[#5BD8F5] bg-[#5BD8F5]/10 text-[#5BD8F5]'
              : 'border-[#1C2630] bg-[#10161D] text-[#7F8B95] hover:text-[#E6EDF2]'
          }`}
        >
          {isAudioActive ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
          <span>{isAudioActive ? 'Mute' : 'Audio'}</span>
        </button>
      </div>

      {/* Large Dominant Viewport Canvas */}
      <div
        ref={containerRef}
        className="relative h-[380px] sm:h-[460px] lg:h-[500px] w-full bg-[#06080B]"
      >
        <canvas ref={canvasRef} className="h-full w-full select-none" />
      </div>
    </div>
  );
}
