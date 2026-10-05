import { useEffect, useRef } from 'react';
import { observatoryAudio } from '@/lib/audio-synth.ts';

interface AstronomicalSignalCanvasProps {
  progress: number; // 0.0 to 1.0
}

export function AstronomicalSignalCanvas({ progress }: AstronomicalSignalCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const progressRef = useRef(progress);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

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

    // Color definitions adhering strictly to deep-space restraint
    const COLOR_BG = '#02040a';
    const COLOR_GRID = 'rgba(30, 41, 59, 0.45)';
    const COLOR_TICK = 'rgba(71, 85, 105, 0.6)';
    const COLOR_SIGNAL_CORE = 'rgba(56, 189, 248, 0.95)'; // Cyan / sky blue
    const COLOR_SIGNAL_GLOW = 'rgba(14, 165, 233, 0.25)';
    const COLOR_NOISE = 'rgba(100, 116, 139, 0.35)';
    const COLOR_ANOMALY = 'rgba(6, 182, 212, 0.9)';
    const COLOR_AMBER = 'rgba(245, 158, 11, 0.7)';

    // Pre-calculated synthetic spectrogram noise matrix for Section 3 & 4
    const specCols = 80;
    const specRows = 36;
    const specData: number[][] = [];
    for (let r = 0; r < specRows; r++) {
      specData[r] = [];
      for (let c = 0; c < specCols; c++) {
        specData[r][c] = Math.random() * 0.15;
      }
    }

    const render = (now: number) => {
      const t = (now - startTime) * 0.001;
      const p = Math.max(0, Math.min(1, progressRef.current));

      // Audio coupling
      if (p > 0.35 && p < 0.9) {
        observatoryAudio.updateCarrierPresence(Math.min(1, (p - 0.35) * 2.5), p > 0.45 ? -0.32 : 0);
      } else {
        observatoryAudio.updateCarrierPresence(0);
      }

      // 1. Clear background
      ctx.fillStyle = COLOR_BG;
      ctx.fillRect(0, 0, width, height);

      const centerY = height * 0.5;
      const centerX = width * 0.5;

      // 2. Subtle Astronomical Reticle Grid & Calibration Axes
      drawScientificGrid(ctx, width, centerY, p);

      // 3. Render Evolving Signal Based on Scroll Progress Stages
      // Section 1: 0.00 -> 0.18
      // Section 2: 0.18 -> 0.38
      // Section 3: 0.38 -> 0.58
      // Section 4: 0.58 -> 0.78
      // Section 5: 0.78 -> 0.90
      // Section 6: 0.90 -> 1.00

      if (p < 0.22) {
        // Stage 1: Ultra-thin, imperceptible signal evolving into defined trace
        drawStage1(ctx, width, centerY, p, t);
      } else if (p < 0.4) {
        // Stage 2: Complex field with multiple interfering signals & noise floor
        const st2Prog = (p - 0.2) / 0.2;
        drawStage2(ctx, width, centerY, st2Prog, t);
      } else if (p < 0.6) {
        // Stage 3: Time-Frequency Spectrogram emergence & isolated narrowband carrier
        const st3Prog = (p - 0.38) / 0.22;
        drawStage3(ctx, width, centerX, centerY, st3Prog, t, specData);
      } else if (p < 0.8) {
        // Stage 4: ML Intelligence Pipeline (STFT -> Latent -> Anomaly -> Candidate)
        const st4Prog = (p - 0.58) / 0.22;
        drawStage4(ctx, width, centerX, centerY, st4Prog, t);
      } else if (p < 0.92) {
        // Stage 5: The Discovery (Pure celestial carrier, coordinates, verification)
        drawStage5(ctx, width, centerX, centerY, t);
      } else {
        // Stage 6: Enter the Observatory (Signal docked into operational instrument)
        const st6Prog = (p - 0.9) / 0.1;
        drawStage6(ctx, width, height, centerX, centerY, st6Prog, t);
      }

      animationFrameId = requestAnimationFrame(render);
    };

    // Helper functions
    function drawScientificGrid(c: CanvasRenderingContext2D, w: number, cy: number, p: number) {
      c.save();
      const gridAlpha = Math.min(0.25, 0.05 + p * 0.15);
      c.globalAlpha = gridAlpha;
      c.strokeStyle = COLOR_GRID;
      c.lineWidth = 1;
      c.setLineDash([2, 6]);

      // Horizontal central frequency datum f0
      c.beginPath();
      c.moveTo(0, cy);
      c.lineTo(w, cy);
      c.stroke();

      // Top and bottom boundary lines
      c.beginPath();
      c.moveTo(0, cy - 120);
      c.lineTo(w, cy - 120);
      c.moveTo(0, cy + 120);
      c.lineTo(w, cy + 120);
      c.stroke();

      c.setLineDash([]);

      // Vertical time tick markers along bottom baseline
      const tickSpacing = 80;
      c.strokeStyle = COLOR_TICK;
      c.fillStyle = 'rgba(100, 116, 139, 0.7)';
      c.font = '9px "JetBrains Mono", monospace';

      for (let x = 40; x < w; x += tickSpacing) {
        c.beginPath();
        c.moveTo(x, cy - 4);
        c.lineTo(x, cy + 4);
        c.stroke();
      }

      // Frequency offset tick labels on left
      if (p > 0.08) {
        const fade = Math.min(1, (p - 0.08) * 5);
        c.globalAlpha = fade * 0.7;
        c.textAlign = 'left';
        c.fillText('+150 Hz [1420.40585 MHz]', 24, cy - 124);
        c.fillText('f₀ // 1420.40570 MHz', 24, cy - 6);
        c.fillText('-150 Hz [1420.40555 MHz]', 24, cy + 124);

        // Right side observatory telemetry indicator
        c.textAlign = 'right';
        c.fillText('CADENCE // 1.00s', w - 24, cy - 124);
        c.fillText('POL // DUAL CIRCULAR', w - 24, cy + 124);
      }

      c.restore();
    }

    // STAGE 1: THE UNKNOWN (Single faint trace, gradually defined)
    function drawStage1(c: CanvasRenderingContext2D, w: number, cy: number, p: number, t: number) {
      c.save();
      // Line opacity starts very low (~0.15) and builds to ~0.9
      const alpha = Math.min(0.95, 0.15 + (p / 0.18) * 0.8);
      const amp = 4 + (p / 0.18) * 14;

      c.strokeStyle = COLOR_SIGNAL_CORE;
      c.shadowColor = COLOR_SIGNAL_GLOW;
      c.shadowBlur = 6 + p * 12;
      c.lineWidth = 1.1;
      c.globalAlpha = alpha;

      c.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const nx = x / w;
        // Thermal Gaussian noise baseline
        const noise =
          Math.sin(x * 0.025 + t * 2.8) * 1.5 +
          Math.sin(x * 0.07 - t * 4.2) * 0.9 +
          Math.cos(x * 0.008 + t * 1.1) * 2.2 +
          Math.sin((x + t * 40) * 0.09) * 0.6;

        // Subtly emerging solitary packet in the center
        const envelope = Math.exp(-Math.pow((nx - 0.5) * 4.5, 2));
        const carrier = Math.sin(x * 0.06 - t * 6) * amp * envelope;

        const y = cy + noise + carrier;
        if (x === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();

      // Subtle reticle indicator gliding with the carrier packet
      if (p > 0.06) {
        const reticleX = w * 0.5 + Math.sin(t * 0.8) * (w * 0.1);
        const reticleY = cy + Math.sin(reticleX * 0.06 - t * 6) * amp * 0.8;

        c.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        c.lineWidth = 1;
        c.beginPath();
        c.arc(reticleX, reticleY, 14, 0, Math.PI * 2);
        c.stroke();

        c.fillStyle = 'rgba(148, 163, 184, 0.7)';
        c.font = '9px "JetBrains Mono", monospace';
        c.textAlign = 'center';
        c.fillText('SIG // UNRESOLVED', reticleX, reticleY - 20);
      }

      c.restore();
    }

    // STAGE 2: THE PROBLEM (Interference, Noise, Overwhelming Field, Candidate Separation)
    function drawStage2(
      c: CanvasRenderingContext2D,
      w: number,
      cy: number,
      p2: number, // 0 to 1
      t: number
    ) {
      c.save();

      // As p2 goes 0 -> 1:
      // Noise traces start dense and chaotic, then gradually attenuate & separate.
      const noiseDensity = 1 - p2 * 0.75; // Diminishes near end of section
      const candidateProminence = 0.5 + p2 * 0.5;

      // 1. Draw 6 secondary interfering signal traces (Terrestrial RFI, Satellite chirps, 50Hz hum)
      const traces = [
        {
          yOff: -110,
          amp: 22,
          freq: 0.04,
          speed: 8,
          label: 'RFI // L-BAND RADAR (TERRESTRIAL)',
          type: 'rfi',
        },
        {
          yOff: -65,
          amp: 14,
          freq: 0.08,
          speed: -12,
          label: 'LEO SATELLITE CHIRP (STARLINK)',
          type: 'leo',
        },
        { yOff: -30, amp: 8, freq: 0.02, speed: 3, label: 'IONOSPHERIC REFLECTION', type: 'iono' },
        {
          yOff: 40,
          amp: 18,
          freq: 0.05,
          speed: 7,
          label: 'TERRESTRIAL 50Hz HARMONIC',
          type: 'hum',
        },
        {
          yOff: 80,
          amp: 26,
          freq: 0.03,
          speed: -5,
          label: 'DEEP SPACE THERMAL (JOHNSON-NYQUIST)',
          type: 'thermal',
        },
        { yOff: 125, amp: 10, freq: 0.12, speed: 15, label: 'FM SIDEBAND SPILLOVER', type: 'fm' },
      ];

      traces.forEach((tr) => {
        c.strokeStyle = tr.type === 'rfi' ? 'rgba(239, 68, 68, 0.4)' : COLOR_NOISE;
        c.lineWidth = 1;
        c.globalAlpha = Math.max(0.04, noiseDensity * 0.55);

        c.beginPath();
        for (let x = 0; x <= w; x += 3) {
          const y =
            cy +
            tr.yOff +
            Math.sin(x * tr.freq + t * tr.speed) * tr.amp +
            (Math.random() - 0.5) * 4;
          if (x === 0) c.moveTo(x, y);
          else c.lineTo(x, y);
        }
        c.stroke();

        // Label for trace
        if (noiseDensity > 0.4) {
          c.fillStyle = 'rgba(100, 116, 139, 0.6)';
          c.font = '8px "JetBrains Mono", monospace';
          c.fillText(tr.label, 30, cy + tr.yOff - 8);
        }
      });

      // 2. The Primary Candidate Signal - Separating from the field
      c.strokeStyle = COLOR_SIGNAL_CORE;
      c.shadowColor = COLOR_SIGNAL_GLOW;
      c.shadowBlur = 12 * candidateProminence;
      c.lineWidth = 1.3;
      c.globalAlpha = 0.95;

      c.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const nx = x / w;
        // Thermal noise jitter decreases as candidate separates
        const jitter = (Math.random() - 0.5) * (4 * (1 - p2 * 0.7));
        const envelope = 0.7 + 0.3 * Math.sin(nx * Math.PI);
        const y = cy + Math.sin(x * 0.045 - t * 7) * (18 * candidateProminence) * envelope + jitter;

        if (x === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();

      // Separation indicator
      if (p2 > 0.4) {
        c.fillStyle = 'rgba(56, 189, 248, 0.9)';
        c.font = '10px "JetBrains Mono", monospace';
        c.textAlign = 'right';
        c.fillText('ISOLATING COHERENT COMPONENT...', w - 30, cy - 24);
      }

      c.restore();
    }

    // STAGE 3: THE SIGNAL (Time-Frequency Spectrogram Emergence & Anomaly Emergence)
    function drawStage3(
      c: CanvasRenderingContext2D,
      w: number,
      cx: number,
      cy: number,
      p3: number, // 0 to 1
      t: number,
      dataMatrix: number[][]
    ) {
      c.save();

      // 1. Draw 2D Spectrogram Density Field
      const specWidth = Math.min(w * 0.85, 960);
      const specHeight = 220;
      const specLeft = cx - specWidth * 0.5;
      const specTop = cy - specHeight * 0.5;

      const specAlpha = Math.min(0.85, p3 * 1.2);
      c.globalAlpha = specAlpha;

      // Outer bounding frame
      c.strokeStyle = 'rgba(30, 41, 59, 0.9)';
      c.lineWidth = 1;
      c.strokeRect(specLeft, specTop, specWidth, specHeight);

      // Render spectrogram matrix cells
      const cellW = specWidth / specCols;
      const cellH = specHeight / specRows;

      for (let r = 0; r < specRows; r++) {
        for (let col = 0; col < specCols; col++) {
          const baseNoise = dataMatrix[r][col];
          // Time drift
          const colTime = col / specCols;
          const rowFreq = r / specRows;

          // Candidate narrowband carrier with linear Doppler drift df/dt
          // A sloping line: freq changes linearly over time
          const carrierCenterRow = 0.45 + (colTime - 0.5) * 0.35; // slope = Doppler drift!
          const distToCarrier = Math.abs(rowFreq - carrierCenterRow);

          let intensity = baseNoise;
          if (distToCarrier < 0.04) {
            // Anomaly carrier strength
            intensity += (1 - distToCarrier / 0.04) * (0.55 + Math.sin(col * 0.3 - t * 4) * 0.15);
          }

          if (intensity > 0.08) {
            const heat = Math.min(1, intensity);
            // Colormap: Navy -> Teal -> Cyan -> White
            const rCol = Math.floor(heat * 180 * heat);
            const gCol = Math.floor(heat * 240);
            const bCol = Math.floor(160 + heat * 95);
            c.fillStyle = `rgba(${rCol}, ${gCol}, ${bCol}, ${heat * 0.85})`;
            c.fillRect(specLeft + col * cellW, specTop + r * cellH, cellW, cellH);
          }
        }
      }

      // 2. High-precision vector line following the Doppler drift carrier
      c.globalAlpha = 0.95;
      c.strokeStyle = COLOR_SIGNAL_CORE;
      c.shadowColor = COLOR_SIGNAL_GLOW;
      c.shadowBlur = 10;
      c.lineWidth = 1.4;

      c.beginPath();
      for (let x = 0; x <= specWidth; x += 4) {
        const normX = x / specWidth;
        const carrierRowNorm = 0.45 + (normX - 0.5) * 0.35;
        const driftY = specTop + carrierRowNorm * specHeight;
        const ripple = Math.sin(normX * 30 - t * 8) * 2.5;

        if (x === 0) c.moveTo(specLeft + x, driftY + ripple);
        else c.lineTo(specLeft + x, driftY + ripple);
      }
      c.stroke();

      // 3. Anomaly Tracking Reticle snapping onto the carrier at 70% width
      if (p3 > 0.35) {
        const lockX = specLeft + specWidth * 0.65;
        const lockY = specTop + (0.45 + (0.65 - 0.5) * 0.35) * specHeight;

        c.strokeStyle = COLOR_ANOMALY;
        c.lineWidth = 1;
        c.strokeRect(lockX - 16, lockY - 16, 32, 32);

        // Bracket corners
        c.beginPath();
        c.moveTo(lockX - 22, lockY);
        c.lineTo(lockX + 22, lockY);
        c.moveTo(lockX, lockY - 22);
        c.lineTo(lockX, lockY + 22);
        c.stroke();

        // Observation telemetry readout attached to reticle
        c.fillStyle = 'rgba(6, 182, 212, 0.95)';
        c.font = '9px "JetBrains Mono", monospace';
        c.textAlign = 'left';
        c.fillText('ANOMALOUS DRIFT: df/dt = -0.32 Hz/s', lockX + 26, lockY - 8);
        c.fillText('BANDWIDTH: 3.8 Hz [NON-NATURAL]', lockX + 26, lockY + 6);
        c.fillText('BARYCENTRIC RESIDUAL: DETECTED', lockX + 26, lockY + 20);
      }

      c.restore();
    }

    // STAGE 4: THE INTELLIGENCE (ML Pipeline: Observe -> Represent -> Compare -> Detect)
    function drawStage4(
      c: CanvasRenderingContext2D,
      w: number,
      cx: number,
      cy: number,
      p4: number, // 0 to 1
      t: number
    ) {
      c.save();

      // Four conceptual sub-stages:
      // 0.00 - 0.25: TIME-FREQUENCY REPRESENTATION
      // 0.25 - 0.50: LATENT REPRESENTATION
      // 0.50 - 0.75: ANOMALY ANALYSIS
      // 0.75 - 1.00: CANDIDATE GENERATION

      const pipelineStage = Math.min(3, Math.floor(p4 * 4));

      // Base Carrier Waveform passing through
      const boxW = Math.min(w * 0.88, 920);
      const boxH = 200;
      const left = cx - boxW * 0.5;
      const top = cy - boxH * 0.5;

      // Pipeline Boundary Frame
      c.strokeStyle = 'rgba(30, 41, 59, 0.8)';
      c.lineWidth = 1;
      c.strokeRect(left, top, boxW, boxH);

      // Sub-stage 1: TIME-FREQUENCY (Polyphase Filterbank channel columns)
      if (pipelineStage === 0 || pipelineStage === 1) {
        c.strokeStyle = 'rgba(14, 165, 233, 0.2)';
        c.lineWidth = 1;
        const cols = 24;
        for (let i = 1; i < cols; i++) {
          const colX = left + (boxW / cols) * i;
          c.beginPath();
          c.moveTo(colX, top);
          c.lineTo(colX, top + boxH);
          c.stroke();
        }
      }

      // Sub-stage 2: LATENT REPRESENTATION (Transformer Multi-Head Attention Arcs & Token Nodes)
      if (pipelineStage >= 1) {
        const tokens = 12;
        const nodeY = cy;
        const nodeCoords: { x: number; y: number }[] = [];

        for (let i = 0; i < tokens; i++) {
          const nx = left + (boxW / (tokens + 1)) * (i + 1);
          const ny = nodeY + Math.sin(i * 0.9 - t * 4) * 28;
          nodeCoords.push({ x: nx, y: ny });

          // Token point
          c.fillStyle =
            pipelineStage === 1 ? 'rgba(56, 189, 248, 0.9)' : 'rgba(100, 116, 139, 0.5)';
          c.beginPath();
          c.arc(nx, ny, 3.5, 0, Math.PI * 2);
          c.fill();
        }

        // Draw attention connection arcs between correlated tokens
        if (pipelineStage === 1) {
          c.strokeStyle = 'rgba(6, 182, 212, 0.35)';
          c.lineWidth = 1;
          for (let i = 0; i < nodeCoords.length - 2; i += 2) {
            const n1 = nodeCoords[i];
            const n2 = nodeCoords[i + 2];
            c.beginPath();
            c.moveTo(n1.x, n1.y);
            c.quadraticCurveTo((n1.x + n2.x) * 0.5, top + 15, n2.x, n2.y);
            c.stroke();
          }
        }
      }

      // Sub-stage 3: ANOMALY ANALYSIS (Residual Loss Heatmap & Divergence Metric)
      if (pipelineStage >= 2) {
        c.strokeStyle = COLOR_AMBER;
        c.lineWidth = 1.2;
        c.fillStyle = 'rgba(245, 158, 11, 0.08)';

        c.beginPath();
        for (let x = 0; x <= boxW; x += 4) {
          const nx = x / boxW;
          // Anomaly divergence spike in the middle
          const divergence = Math.exp(-Math.pow((nx - 0.52) * 8, 2)) * 42;
          const y = cy + 30 - divergence + Math.sin(x * 0.08 - t * 5) * 4;

          if (x === 0) c.moveTo(left + x, y);
          else c.lineTo(left + x, y);
        }
        c.stroke();

        // Anomaly threshold line
        c.strokeStyle = 'rgba(239, 68, 68, 0.4)';
        c.setLineDash([4, 4]);
        c.beginPath();
        c.moveTo(left, cy);
        c.lineTo(left + boxW, cy);
        c.stroke();
        c.setLineDash([]);

        c.fillStyle = 'rgba(245, 158, 11, 0.85)';
        c.font = '9px "JetBrains Mono", monospace';
        c.fillText('LATENT RECONSTRUCTION RESIDUAL Δ(x) > 4.8σ', left + 20, cy - 8);
      }

      // Sub-stage 4: CANDIDATE GENERATION (Candidate bounding box & topocentric verification)
      if (pipelineStage === 3) {
        const candX = left + boxW * 0.48;
        const candY = cy - 25;
        const candW = 120;
        const candH = 70;

        c.strokeStyle = 'rgba(16, 185, 129, 0.85)';
        c.lineWidth = 1.5;
        c.strokeRect(candX - candW * 0.5, candY - candH * 0.5, candW, candH);

        // Vector arrow for Doppler drift rate
        c.beginPath();
        c.moveTo(candX - 30, candY + 15);
        c.lineTo(candX + 30, candY - 15);
        c.stroke();

        c.fillStyle = 'rgba(16, 185, 129, 0.95)';
        c.font = '9px "JetBrains Mono", monospace';
        c.textAlign = 'center';
        c.fillText('CANDIDATE ISOLATED', candX, candY - candH * 0.5 - 10);
        c.fillText('SCORE: 0.942 [CRITICAL]', candX, candY + candH * 0.5 + 16);
      }

      // Draw primary carrier trace across the pipeline
      c.strokeStyle = COLOR_SIGNAL_CORE;
      c.lineWidth = 1.4;
      c.shadowColor = COLOR_SIGNAL_GLOW;
      c.shadowBlur = 8;

      c.beginPath();
      for (let x = 0; x <= boxW; x += 2) {
        const nx = x / boxW;
        const y = cy + Math.sin(x * 0.04 - t * 7) * 16 + Math.sin(nx * 10 - t * 2) * 4;
        if (x === 0) c.moveTo(left + x, y);
        else c.lineTo(left + x, y);
      }
      c.stroke();

      c.restore();
    }

    // STAGE 5: THE DISCOVERY (Pure, Confirmed Celestial Carrier & Verification)
    function drawStage5(c: CanvasRenderingContext2D, w: number, cx: number, cy: number, t: number) {
      c.save();

      // Noise is completely gone. Only pure, coherent astronomical signal.
      c.strokeStyle = COLOR_SIGNAL_CORE;
      c.shadowColor = COLOR_SIGNAL_CORE;
      c.shadowBlur = 16;
      c.lineWidth = 1.6;

      c.beginPath();
      for (let x = 0; x <= w; x += 2) {
        const nx = x / w;
        // Pure sinusoidal carrier with smooth amplitude envelope
        const envelope = 0.85 + 0.15 * Math.sin(nx * Math.PI);
        const y = cy + Math.sin(x * 0.035 - t * 8) * 26 * envelope;

        if (x === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.stroke();

      // Target Verification Lock Reticle
      c.strokeStyle = 'rgba(6, 182, 212, 0.85)';
      c.lineWidth = 1;

      const lockX = cx;
      const lockY = cy;
      const radius = 48;

      c.beginPath();
      c.arc(lockX, lockY, radius, 0, Math.PI * 2);
      c.stroke();

      // Rotating reticle ticks
      const ticks = 4;
      for (let i = 0; i < ticks; i++) {
        const angle = (i * Math.PI) / 2 + t * 0.2;
        const x1 = lockX + Math.cos(angle) * (radius - 8);
        const y1 = lockY + Math.sin(angle) * (radius - 8);
        const x2 = lockX + Math.cos(angle) * (radius + 8);
        const y2 = lockY + Math.sin(angle) * (radius + 8);

        c.beginPath();
        c.moveTo(x1, y1);
        c.lineTo(x2, y2);
        c.stroke();
      }

      // Discovery Telemetry Coordinates
      c.fillStyle = 'rgba(241, 245, 249, 0.9)';
      c.font = '10px "JetBrains Mono", monospace';
      c.textAlign = 'center';
      c.fillText('TARGET // PROXIMA CENTAURI [ALPHA CEN C]', cx, cy - 70);

      c.fillStyle = 'rgba(56, 189, 248, 0.95)';
      c.fillText('SIG-2026-089A // DRIFT -0.32 Hz/s // TOPOCENTRIC CONFIRMED', cx, cy + 80);

      c.restore();
    }

    // STAGE 6: ENTER THE OBSERVATORY (Signal Docks into Live Workstation Monitor)
    function drawStage6(
      c: CanvasRenderingContext2D,
      w: number,
      h: number,
      cx: number,
      cy: number,
      p6: number, // 0 to 1
      t: number
    ) {
      c.save();

      // Waveform scales and docks into a dedicated monitor panel at the bottom center
      const monitorW = Math.min(w * 0.85, 780);
      const monitorH = 110;
      const targetY = h - monitorH - 50;

      // Interpolate center position to monitor position
      const currY = cy + (targetY - cy) * Math.min(1, p6 * 1.4);
      const currW = w - (w - monitorW) * Math.min(1, p6 * 1.4);
      const left = cx - currW * 0.5;

      // Monitor oscilloscope container
      c.strokeStyle = 'rgba(14, 165, 233, 0.4)';
      c.lineWidth = 1;
      c.strokeRect(left, currY - monitorH * 0.5, currW, monitorH);

      // Oscilloscope background grid
      c.strokeStyle = 'rgba(15, 23, 42, 0.8)';
      for (let x = left + 40; x < left + currW; x += 40) {
        c.beginPath();
        c.moveTo(x, currY - monitorH * 0.5);
        c.lineTo(x, currY + monitorH * 0.5);
        c.stroke();
      }

      // Operational live streaming waveform
      c.strokeStyle = COLOR_SIGNAL_CORE;
      c.shadowColor = COLOR_SIGNAL_GLOW;
      c.shadowBlur = 10;
      c.lineWidth = 1.3;

      c.beginPath();
      for (let x = 0; x <= currW; x += 2) {
        const y = currY + Math.sin(x * 0.05 - t * 9) * 18 + Math.sin(x * 0.12 + t * 4) * 3;
        if (x === 0) c.moveTo(left + x, y);
        else c.lineTo(left + x, y);
      }
      c.stroke();

      // Monitor header bar
      c.fillStyle = 'rgba(6, 182, 212, 0.9)';
      c.font = '9px "JetBrains Mono", monospace';
      c.textAlign = 'left';
      c.fillText(
        'LIVE CHANNEL STREAM // GBT-100M APERTURE // FREQ 1420.4057 MHz',
        left + 12,
        currY - monitorH * 0.5 - 8
      );

      c.textAlign = 'right';
      c.fillText(
        'REALTIME BUFFER: NOMINAL [14.2ms]',
        left + currW - 12,
        currY - monitorH * 0.5 - 8
      );

      c.restore();
    }

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas ref={canvasRef} className="absolute inset-0 h-full w-full pointer-events-none z-0" />
  );
}
