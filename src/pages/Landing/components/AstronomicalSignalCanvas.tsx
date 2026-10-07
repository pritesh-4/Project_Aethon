import { useEffect, useRef } from 'react';
import { type MotionValue, useReducedMotion } from 'motion/react';
import { observatoryAudio } from '@/lib/audio-synth.ts';

interface AstronomicalSignalCanvasProps {
  scrollYProgress: MotionValue<number>;
}

export function AstronomicalSignalCanvas({ scrollYProgress }: AstronomicalSignalCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressRef = useRef(scrollYProgress.get());
  const shouldReduceMotion = useReducedMotion();

  // Subscribe to MotionValue changes without triggering any React re-renders
  useEffect(() => {
    const unsubscribe = scrollYProgress.on('change', (latest) => {
      progressRef.current = Math.max(0, Math.min(1, latest));
    });
    return () => unsubscribe();
  }, [scrollYProgress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;
    const startTime = performance.now();

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = canvas.parentElement?.clientWidth || window.innerWidth;
      height = canvas.parentElement?.clientHeight || window.innerHeight;

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Semantic color palette
    const COLOR_BG = '#06080B';
    const COLOR_GRID = 'rgba(23, 34, 48, 0.4)';
    const COLOR_TICK = 'rgba(127, 139, 149, 0.25)';
    const COLOR_SIGNAL = '#5BD8F5';
    const COLOR_NOISE = 'rgba(127, 139, 149, 0.2)';
    const COLOR_ANOMALY = '#E8AE50';

    const render = (now: number) => {
      const t = shouldReduceMotion ? 0 : (now - startTime) * 0.001;
      const p = Math.max(0, Math.min(1, progressRef.current));

      // Audio coupling - gentle carrier presence in middle stages
      if (p > 0.3 && p < 0.85) {
        observatoryAudio.updateCarrierPresence(Math.min(1, (p - 0.3) * 3), p > 0.45 ? -0.32 : 0);
      } else {
        observatoryAudio.updateCarrierPresence(0);
      }

      // 1. Clear background
      ctx.fillStyle = COLOR_BG;
      ctx.fillRect(0, 0, width, height);

      const centerY = height * 0.5;
      const centerX = width * 0.5;

      // 2. Ultra-subtle calibration baseline
      drawBaselineGrid(ctx, width, centerY);

      // 3. Evolving primary signal
      // Evolution: signal -> structure -> noise/complexity -> anomaly -> candidate
      if (p < 0.16) {
        // Stage 1: pure signal
        drawStageSignal(ctx, width, centerY, p / 0.16, t);
      } else if (p < 0.33) {
        // Stage 2: structure (harmonics & periodicity)
        drawStageStructure(ctx, width, centerY, (p - 0.16) / 0.17, t);
      } else if (p < 0.5) {
        // Stage 3: noise / complexity (overlapping fields)
        drawStageComplexity(ctx, width, centerY, (p - 0.33) / 0.17, t);
      } else if (p < 0.67) {
        // Stage 4: anomaly (Doppler drift coherence emerging)
        drawStageAnomaly(ctx, width, centerY, (p - 0.5) / 0.17, t);
      } else if (p < 0.83) {
        // Stage 5: looking closer (anomaly inspection & framing)
        drawStageLookingCloser(ctx, width, centerX, centerY, (p - 0.67) / 0.16, t);
      } else {
        // Stage 6: candidate (resolved, verified event)
        drawStageCandidate(ctx, width, centerX, centerY, (p - 0.83) / 0.17, t);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    function drawBaselineGrid(c: CanvasRenderingContext2D, w: number, cy: number) {
      c.save();
      c.strokeStyle = COLOR_GRID;
      c.lineWidth = 1;

      // Fine datum center line
      c.beginPath();
      c.moveTo(0, cy);
      c.lineTo(w, cy);
      c.stroke();

      // Small tick marks
      c.strokeStyle = COLOR_TICK;
      for (let x = 60; x < w; x += 120) {
        c.beginPath();
        c.moveTo(x, cy - 3);
        c.lineTo(x, cy + 3);
        c.stroke();
      }
      c.restore();
    }

    // STAGE 1: SIGNAL (Pure, delicate carrier trace)
    function drawStageSignal(
      c: CanvasRenderingContext2D,
      w: number,
      cy: number,
      subProg: number,
      t: number
    ) {
      c.save();
      const alpha = 0.3 + subProg * 0.45;
      const amp = 6 + subProg * 8;

      c.strokeStyle = COLOR_SIGNAL;
      c.lineWidth = 1.2;
      c.globalAlpha = alpha;

      c.beginPath();
      for (let x = 0; x <= w; x += 3) {
        const nx = x / w;
        const envelope = Math.exp(-Math.pow((nx - 0.5) * 3.5, 2));
        const noise = Math.sin(x * 0.02 + t * 2) * 1.2 + Math.cos(x * 0.06 - t * 3) * 0.8;
        const carrier = Math.sin(x * 0.045 - t * 5) * amp * envelope;

        const y = cy + noise + carrier;
        if (x === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
      c.restore();
    }

    // STAGE 2: STRUCTURE (Harmonics, periodic regularity)
    function drawStageStructure(
      c: CanvasRenderingContext2D,
      w: number,
      cy: number,
      subProg: number,
      t: number
    ) {
      c.save();

      // Periodic harmonic sidebands
      const harmonics = [-40, 40];
      harmonics.forEach((offset) => {
        c.strokeStyle = COLOR_NOISE;
        c.lineWidth = 1;
        c.globalAlpha = 0.25;

        c.beginPath();
        for (let x = 0; x <= w; x += 4) {
          const y = cy + offset + Math.sin(x * 0.035 + t * 4) * 6;
          if (x === 0) c.moveTo(x, y);
          else c.lineTo(x, y);
        }
        c.stroke();
      });

      // Primary structured waveform
      c.strokeStyle = COLOR_SIGNAL;
      c.lineWidth = 1.3;
      c.globalAlpha = 0.75 + subProg * 0.2;

      c.beginPath();
      for (let x = 0; x <= w; x += 3) {
        const nx = x / w;
        const pulse = Math.sin(nx * 12 - t * 3) * 4;
        const carrier = Math.sin(x * 0.05 - t * 6) * 14;
        const y = cy + carrier + pulse;
        if (x === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
      c.restore();
    }

    // STAGE 3: NOISE / COMPLEXITY (Multi-transmitter interference)
    function drawStageComplexity(
      c: CanvasRenderingContext2D,
      w: number,
      cy: number,
      subProg: number,
      t: number
    ) {
      c.save();

      // Ambient clutter traces
      const clutter = [
        { yOff: -70, amp: 14, freq: 0.03, speed: 5 },
        { yOff: -30, amp: 8, freq: 0.06, speed: -7 },
        { yOff: 30, amp: 12, freq: 0.04, speed: 4 },
        { yOff: 65, amp: 16, freq: 0.025, speed: -3 },
      ];

      clutter.forEach((cl) => {
        c.strokeStyle = COLOR_NOISE;
        c.lineWidth = 1;
        c.globalAlpha = 0.35 * (1 - subProg * 0.3);

        c.beginPath();
        for (let x = 0; x <= w; x += 3) {
          const y = cy + cl.yOff + Math.sin(x * cl.freq + t * cl.speed) * cl.amp;
          if (x === 0) c.moveTo(x, y);
          else c.lineTo(x, y);
        }
        c.stroke();
      });

      // Embedded carrier under complexity
      c.strokeStyle = COLOR_SIGNAL;
      c.lineWidth = 1.3;
      c.globalAlpha = 0.7;

      c.beginPath();
      for (let x = 0; x <= w; x += 3) {
        const y = cy + Math.sin(x * 0.045 - t * 6) * 16;
        if (x === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
      c.restore();
    }

    // STAGE 4: ANOMALY (Narrowband coherence, linear Doppler drift)
    function drawStageAnomaly(
      c: CanvasRenderingContext2D,
      w: number,
      cy: number,
      subProg: number,
      t: number
    ) {
      c.save();

      // Attenuated background noise
      c.strokeStyle = COLOR_NOISE;
      c.lineWidth = 1;
      c.globalAlpha = 0.15;
      c.beginPath();
      for (let x = 0; x <= w; x += 4) {
        const y = cy + Math.sin(x * 0.02 + t * 2) * 8;
        if (x === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();

      // The anomalous drifting signal
      const driftSlope = -0.055;
      const amp = 16 + subProg * 6;

      c.strokeStyle = COLOR_SIGNAL;
      c.lineWidth = 1.5;
      c.globalAlpha = 0.95;

      c.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const nx = x / w;
        const driftY = (x - w * 0.5) * driftSlope;
        const envelope = 0.8 + 0.2 * Math.sin(nx * Math.PI);
        const y = cy + driftY + Math.sin(x * 0.05 - t * 7) * amp * envelope;

        if (x === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();
      c.restore();
    }

    // STAGE 5: LOOKING CLOSER (High-resolution focus & amber bracket)
    function drawStageLookingCloser(
      c: CanvasRenderingContext2D,
      w: number,
      cx: number,
      cy: number,
      subProg: number,
      t: number
    ) {
      c.save();

      // Clean, sharp drifting carrier
      const driftSlope = -0.055;
      c.strokeStyle = COLOR_SIGNAL;
      c.lineWidth = 1.6;
      c.globalAlpha = 1;

      c.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const driftY = (x - cx) * driftSlope;
        const y = cy + driftY + Math.sin(x * 0.05 - t * 7) * 20;
        if (x === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();

      // Understated focus bracket in amber
      const boxW = Math.min(220, w * 0.35);
      const boxH = 64;
      const boxX = cx - boxW * 0.5;
      const boxY = cy - boxH * 0.5;
      const bLen = 10;

      c.strokeStyle = COLOR_ANOMALY;
      c.lineWidth = 1;
      c.globalAlpha = 0.6 + subProg * 0.3;

      // 4 minimal corner brackets
      // Top-left
      c.beginPath();
      c.moveTo(boxX, boxY + bLen);
      c.lineTo(boxX, boxY);
      c.lineTo(boxX + bLen, boxY);
      c.stroke();

      // Top-right
      c.beginPath();
      c.moveTo(boxX + boxW - bLen, boxY);
      c.lineTo(boxX + boxW, boxY);
      c.lineTo(boxX + boxW, boxY + bLen);
      c.stroke();

      // Bottom-left
      c.beginPath();
      c.moveTo(boxX, boxY + boxH - bLen);
      c.lineTo(boxX, boxY + boxH);
      c.lineTo(boxX + bLen, boxY + boxH);
      c.stroke();

      // Bottom-right
      c.beginPath();
      c.moveTo(boxX + boxW - bLen, boxY + boxH);
      c.lineTo(boxX + boxW, boxY + boxH);
      c.lineTo(boxX + boxW, boxY + boxH - bLen);
      c.stroke();

      c.restore();
    }

    // STAGE 6: CANDIDATE (Resolved, stable event)
    function drawStageCandidate(
      c: CanvasRenderingContext2D,
      w: number,
      cx: number,
      cy: number,
      subProg: number,
      t: number
    ) {
      c.save();

      // Stable, resolved sinusoidal carrier
      c.strokeStyle = COLOR_SIGNAL;
      c.lineWidth = 1.6;
      c.globalAlpha = 1;

      c.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const nx = x / w;
        const envelope = 0.85 + 0.15 * Math.sin(nx * Math.PI);
        const y = cy + Math.sin(x * 0.04 - t * 7) * 22 * envelope;
        if (x === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();

      // Fine reticle lock at center
      const r = 32 + subProg * 4;
      c.strokeStyle = 'rgba(91, 216, 245, 0.4)';
      c.lineWidth = 1;

      c.beginPath();
      c.arc(cx, cy, r, 0, Math.PI * 2);
      c.stroke();

      // Center crosshair
      c.beginPath();
      c.moveTo(cx - 8, cy);
      c.lineTo(cx + 8, cy);
      c.moveTo(cx, cy - 8);
      c.lineTo(cx, cy + 8);
      c.stroke();

      c.restore();
    }

    // Start animation loop
    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      observatoryAudio.updateCarrierPresence(0);
    };
  }, [shouldReduceMotion]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full pointer-events-none z-10"
      aria-hidden="true"
    />
  );
}
