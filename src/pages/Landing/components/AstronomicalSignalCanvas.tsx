import { useEffect, useRef } from 'react';
import { type MotionValue, useReducedMotion } from 'motion/react';
import { observatoryAudio } from '@/lib/audio-synth.ts';

interface AstronomicalSignalCanvasProps {
  scrollYProgress: MotionValue<number>;
}

// Hermite smoothstep interpolation for seamless C1 continuity between visual states
function smoothstep(min: number, max: number, value: number): number {
  if (min === max) return value >= min ? 1 : 0;
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

export function AstronomicalSignalCanvas({ scrollYProgress }: AstronomicalSignalCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressRef = useRef(scrollYProgress.get());
  const shouldReduceMotion = useReducedMotion();

  // Listen to MotionValue changes without triggering React re-renders
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
      width = Math.max(1, canvas.parentElement?.clientWidth || window.innerWidth);
      height = Math.max(1, canvas.parentElement?.clientHeight || window.innerHeight);

      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.resetTransform();
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    // Color definitions: Instrument deep midnight & observatory blue / gold palette
    const COLOR_BG = '#0D141A';
    const COLOR_GRID = 'rgba(106, 126, 143, 0.15)';
    const COLOR_TICK = 'rgba(106, 126, 143, 0.28)';
    const COLOR_SIGNAL = '#5C89B7';
    const COLOR_NOISE = 'rgba(106, 126, 143, 0.22)';
    const COLOR_AMBER = '#C19348';

    const render = (now: number) => {
      const t = shouldReduceMotion ? 0 : (now - startTime) * 0.001;
      const p = Math.max(0, Math.min(1, progressRef.current));

      // Sonification tracking
      observatoryAudio.updateNarrativeProgress(p);

      const centerX = width * 0.5;
      const centerY = height * 0.5;
      const isMobile = width < 640;

      // 1. Atmospheric Deep Void Background with subtle cosmic radial gradient
      ctx.fillStyle = COLOR_BG;
      ctx.fillRect(0, 0, width, height);

      const radGrad = ctx.createRadialGradient(
        centerX,
        centerY,
        0,
        centerX,
        centerY,
        Math.max(width, height) * 0.65
      );
      radGrad.addColorStop(0, 'rgba(17, 26, 34, 0.45)');
      radGrad.addColorStop(1, '#0D141A');
      ctx.fillStyle = radGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Continuous Baseline Datum & Calibration Axis
      drawBaseline(ctx, width, height, centerX, centerY, p, isMobile);

      // 3. Ambient Signal Field (Secondary known carriers + crowding clutter)
      drawSignalField(ctx, width, centerX, centerY, p, t, isMobile);

      // 4. The Protagonist Signal (Hero Carrier that separates, drifts, and becomes candidate)
      drawProtagonistCarrier(ctx, width, centerX, centerY, p, t);

      // 5. Analytical Investigation Reticle & Guides (Scene 5: 0.63 - 0.81)
      if (p > 0.61 && p < 0.84) {
        drawInvestigationFrame(ctx, width, centerX, centerY, p, isMobile);
      }

      // 6. Candidate Lock Reticle & Resolved Target (Scene 6: 0.81 - 1.00)
      if (p > 0.8) {
        drawCandidateLock(ctx, centerX, centerY, p, t, isMobile);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    // Baseline Datum and Reference Axis
    function drawBaseline(
      c: CanvasRenderingContext2D,
      w: number,
      h: number,
      cx: number,
      cy: number,
      prog: number,
      mobile: boolean
    ) {
      c.save();
      const baseAlpha = 0.15 + smoothstep(0.02, 0.15, prog) * 0.25;
      c.strokeStyle = COLOR_GRID;
      c.lineWidth = 1;
      c.globalAlpha = baseAlpha;

      // Primary horizontal frequency channel datum
      c.beginPath();
      c.moveTo(0, cy);
      c.lineTo(w, cy);
      c.stroke();

      // Calibration ticks along the baseline
      c.strokeStyle = COLOR_TICK;
      const tickStep = mobile ? 60 : 90;
      for (let x = cx % tickStep; x < w; x += tickStep) {
        c.beginPath();
        c.moveTo(x, cy - 3);
        c.lineTo(x, cy + 3);
        c.stroke();
      }

      // Subtle channel guide rails during investigation/candidate (prog > 0.62)
      if (prog > 0.62) {
        const railAlpha = smoothstep(0.62, 0.72, prog) * 0.18;
        c.strokeStyle = COLOR_GRID;
        c.setLineDash([4, 6]);
        c.globalAlpha = railAlpha;

        c.beginPath();
        c.moveTo(0, cy - 42);
        c.lineTo(w, cy - 42);
        c.moveTo(0, cy + 42);
        c.lineTo(w, cy + 42);
        c.stroke();
        c.setLineDash([]);
      }

      // Quiet technical telemetry label at bottom corner
      if (prog > 0.05) {
        c.font = '10px ui-monospace, SFMono-Regular, monospace';
        c.fillStyle = 'rgba(154, 156, 150, 0.4)';
        c.textAlign = 'left';
        c.fillText('FREQ: 1420.405 MHz // RECEIVER CHANNEL 01', 24, h - 24);
      }

      c.restore();
    }

    // Secondary known signals and multi-channel crowding field
    function drawSignalField(
      c: CanvasRenderingContext2D,
      w: number,
      cx: number,
      cy: number,
      prog: number,
      t: number,
      mobile: boolean
    ) {
      const fieldIn = smoothstep(0.12, 0.2, prog);
      const fieldOut = 1 - smoothstep(0.44, 0.58, prog);
      const fieldAlpha = fieldIn * fieldOut;

      if (fieldAlpha <= 0.005) return;

      c.save();

      // Known carriers configuration
      const knownCarriers = [
        { yOffset: -38, amp: 8, freq: 0.032, speed: 3.5, alpha: 0.32 },
        { yOffset: 42, amp: 10, freq: 0.026, speed: -3.0, alpha: 0.3 },
        { yOffset: -76, amp: 6, freq: 0.048, speed: 4.2, alpha: 0.22 },
        { yOffset: 80, amp: 9, freq: 0.022, speed: -2.5, alpha: 0.25 },
      ];

      // Crowding clutter configurations (only visible in Scene 3: prog 0.28 - 0.46)
      const crowdingFactor = smoothstep(0.28, 0.36, prog);
      const clutterCarriers = mobile
        ? []
        : [
            { yOffset: -115, amp: 7, freq: 0.04, speed: -5.0, alpha: 0.2 },
            { yOffset: 120, amp: 11, freq: 0.018, speed: 4.0, alpha: 0.22 },
            { yOffset: -20, amp: 5, freq: 0.07, speed: 6.0, alpha: 0.18 },
            { yOffset: 24, amp: 7, freq: 0.055, speed: -4.5, alpha: 0.2 },
          ];

      const allSecondary =
        crowdingFactor > 0.1 ? [...knownCarriers, ...clutterCarriers] : knownCarriers;

      // Draw secondary traces
      allSecondary.forEach((carrier) => {
        const traceAlpha =
          carrier.alpha *
          fieldAlpha *
          (carrier.yOffset < -50 || carrier.yOffset > 50 ? crowdingFactor : 1);
        if (traceAlpha <= 0.01) return;

        c.strokeStyle = COLOR_NOISE;
        c.lineWidth = 1;
        c.globalAlpha = traceAlpha;

        c.beginPath();
        const step = mobile ? 4 : 3;
        for (let x = 0; x <= w; x += step) {
          const nx = (x - cx) / (w * 0.5);
          const env = Math.exp(-Math.pow(nx, 4) * 2.5);
          const y =
            cy +
            carrier.yOffset +
            Math.sin(x * carrier.freq + t * carrier.speed) * carrier.amp * env;
          if (x === 0) c.moveTo(x, y);
          else c.lineTo(x, y);
        }
        c.stroke();
      });

      // Congested spectral FFT bin tick streaks during peak overwhelm (Scene 3)
      if (crowdingFactor > 0.2 && !mobile) {
        c.strokeStyle = 'rgba(212, 134, 74, 0.15)';
        c.globalAlpha = crowdingFactor * fieldAlpha * 0.4;
        c.lineWidth = 1;

        const streakOffsets = [-58, -14, 56, 96];
        streakOffsets.forEach((off, idx) => {
          const seed = idx * 137.5;
          const streakX = (cx + Math.sin(seed + t * 0.8) * (w * 0.35) + w) % w;
          const streakLen = 40 + Math.sin(seed * 2 + t) * 20;

          c.beginPath();
          c.moveTo(streakX - streakLen * 0.5, cy + off);
          c.lineTo(streakX + streakLen * 0.5, cy + off);
          c.stroke();
        });
      }

      c.restore();
    }

    // The Protagonist Carrier (Hero Signal)
    function drawProtagonistCarrier(
      c: CanvasRenderingContext2D,
      w: number,
      cx: number,
      cy: number,
      prog: number,
      t: number
    ) {
      c.save();

      const emergence = smoothstep(0.01, 0.08, prog);
      const isolationBoost = smoothstep(0.46, 0.6, prog);
      const carrierAlpha = Math.max(0.04, emergence * (0.8 + isolationBoost * 0.2));

      let targetAmp: number;
      if (prog < 0.12) {
        targetAmp = 2 + smoothstep(0.02, 0.12, prog) * 12;
      } else if (prog < 0.3) {
        targetAmp = 14;
      } else if (prog < 0.45) {
        targetAmp = 15;
      } else if (prog < 0.63) {
        targetAmp = 15 + smoothstep(0.45, 0.63, prog) * 4;
      } else if (prog < 0.81) {
        targetAmp = 19 + smoothstep(0.63, 0.72, prog) * 5;
      } else {
        targetAmp = 22 - smoothstep(0.81, 0.9, prog) * 2;
      }

      const overwhelmFactor = smoothstep(0.28, 0.38, prog) * (1 - smoothstep(0.44, 0.52, prog));
      const driftProgress = smoothstep(0.45, 0.62, prog);
      const driftSlope = -0.052 * driftProgress;
      const zoomFactor = smoothstep(0.63, 0.78, prog);
      const aperturePower = 2.2 + zoomFactor * 1.5;

      const baseFreq = 0.042;
      const phaseSpeed = 5.5;

      // Subtle ambient coherence shadow when drifting (Anomaly highlight in copper)
      if (isolationBoost > 0.1) {
        c.strokeStyle = COLOR_AMBER;
        c.lineWidth = 1;
        c.globalAlpha = isolationBoost * 0.4;

        c.beginPath();
        for (let x = 0; x <= w; x += 3) {
          const nx = (x - cx) / (w * 0.5);
          const env = Math.exp(-Math.pow(nx, aperturePower) * 2.2);
          const driftY = (x - cx) * driftSlope;
          const y =
            cy + driftY + 2 + Math.sin(x * baseFreq - t * phaseSpeed) * (targetAmp * 0.9) * env;
          if (x === 0) c.moveTo(x, y);
          else c.lineTo(x, y);
        }
        c.stroke();
      }

      // Soft copper envelope trace
      c.strokeStyle = COLOR_SIGNAL;
      c.lineWidth = 2.0;
      c.globalAlpha = carrierAlpha * 0.4;

      c.beginPath();
      for (let x = 0; x <= w; x += 3) {
        const nx = (x - cx) / (w * 0.5);
        const env = Math.exp(-Math.pow(nx, aperturePower) * 2.2);
        const driftY = (x - cx) * driftSlope;
        const noiseRipple =
          overwhelmFactor * (Math.sin(x * 0.12 + t * 8) * 3 + Math.cos(x * 0.05 - t * 4) * 2);
        const y =
          cy + driftY + (Math.sin(x * baseFreq - t * phaseSpeed) * targetAmp + noiseRipple) * env;

        if (x === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();

      // Crisp Core Carrier (Soft neutral white)
      c.strokeStyle = isolationBoost > 0.5 ? '#E6E4DD' : '#C9C8C0';
      c.lineWidth = 1.3;
      c.globalAlpha = carrierAlpha;

      c.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const nx = (x - cx) / (w * 0.5);
        const env = Math.exp(-Math.pow(nx, aperturePower) * 2.2);
        const driftY = (x - cx) * driftSlope;
        const noiseRipple =
          overwhelmFactor * (Math.sin(x * 0.12 + t * 8) * 3 + Math.cos(x * 0.05 - t * 4) * 2);
        const y =
          cy + driftY + (Math.sin(x * baseFreq - t * phaseSpeed) * targetAmp + noiseRipple) * env;

        if (x === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();

      c.restore();
    }

    // Analytical Investigation Frame (Scene 5: 0.63 - 0.81)
    function drawInvestigationFrame(
      c: CanvasRenderingContext2D,
      w: number,
      cx: number,
      cy: number,
      prog: number,
      mobile: boolean
    ) {
      c.save();
      const enterAlpha = smoothstep(0.63, 0.68, prog);
      const exitAlpha = 1 - smoothstep(0.79, 0.83, prog);
      const frameAlpha = enterAlpha * exitAlpha;

      if (frameAlpha <= 0.01) {
        c.restore();
        return;
      }

      const boxW = Math.min(mobile ? 220 : 340, w * 0.6);
      const boxH = mobile ? 64 : 84;
      const boxX = cx - boxW * 0.5;
      const boxY = cy - boxH * 0.5;
      const bLen = 12;

      c.strokeStyle = COLOR_AMBER;
      c.lineWidth = 1;
      c.globalAlpha = frameAlpha * 0.75;

      // 4 Precision corner brackets
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

      // Center fiducial indicator
      c.strokeStyle = COLOR_AMBER;
      c.globalAlpha = frameAlpha * 0.5;
      c.beginPath();
      c.moveTo(cx, boxY - 4);
      c.lineTo(cx, boxY + 4);
      c.moveTo(cx, boxY + boxH - 4);
      c.lineTo(cx, boxY + boxH + 4);
      c.stroke();

      // Telemetry readout
      c.font = '9px ui-monospace, SFMono-Regular, monospace';
      c.fillStyle = COLOR_AMBER;
      c.globalAlpha = frameAlpha * 0.85;
      c.textAlign = 'left';
      c.fillText('NARROWBAND COHERENCE LOCK', boxX, boxY - 8);

      c.textAlign = 'right';
      c.fillText('Δf/Δt: -0.32 Hz/s', boxX + boxW, boxY - 8);

      c.restore();
    }

    // Candidate Lock Reticle (Scene 6: 0.81 - 1.00)
    function drawCandidateLock(
      c: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      prog: number,
      t: number,
      mobile: boolean
    ) {
      c.save();
      const lockAlpha = smoothstep(0.81, 0.87, prog);
      if (lockAlpha <= 0.01) {
        c.restore();
        return;
      }

      const r1 = mobile ? 26 : 34;
      const r2 = r1 + (mobile ? 8 : 10);

      // Inner target circle in warm copper
      c.strokeStyle = COLOR_SIGNAL;
      c.lineWidth = 1;
      c.globalAlpha = lockAlpha * 0.7;

      c.beginPath();
      c.arc(cx, cy, r1, 0, Math.PI * 2);
      c.stroke();

      // Center crosshair ticks
      c.beginPath();
      c.moveTo(cx - 7, cy);
      c.lineTo(cx + 7, cy);
      c.moveTo(cx, cy - 7);
      c.lineTo(cx, cy + 7);
      c.stroke();

      // Outer calibration ring with notched perimeter
      const rotAngle = shouldReduceMotion ? 0 : t * 0.35;
      c.strokeStyle = 'rgba(212, 134, 74, 0.3)';
      c.setLineDash([3, 5]);

      c.beginPath();
      c.arc(cx, cy, r2, 0, Math.PI * 2);
      c.stroke();
      c.setLineDash([]);

      // 4 Cardinal tick marks extending outward
      c.strokeStyle = COLOR_AMBER;
      c.globalAlpha = lockAlpha * 0.65;
      for (let i = 0; i < 4; i++) {
        const ang = rotAngle + (i * Math.PI) / 2;
        const xStart = cx + Math.cos(ang) * (r2 + 2);
        const yStart = cy + Math.sin(ang) * (r2 + 2);
        const xEnd = cx + Math.cos(ang) * (r2 + 7);
        const yEnd = cy + Math.sin(ang) * (r2 + 7);

        c.beginPath();
        c.moveTo(xStart, yStart);
        c.lineTo(xEnd, yEnd);
        c.stroke();
      }

      // Candidate Tag below reticle
      c.font = '10px ui-monospace, SFMono-Regular, monospace';
      c.fillStyle = '#E6E4DD';
      c.globalAlpha = lockAlpha * 0.85;
      c.textAlign = 'center';
      c.fillText('CANDIDATE EVENT // RESOLVED', cx, cy + r2 + 22);

      c.restore();
    }

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      observatoryAudio.updateNarrativeProgress(0);
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
