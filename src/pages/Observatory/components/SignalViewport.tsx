import { useEffect, useRef, useState, useCallback } from 'react';
import type { ObservationData, ObservationStatus } from '../types.ts';
import { observatoryAudio } from '@/lib/audio-synth.ts';
import { Volume2, VolumeX, Maximize2, Minimize2, Eye, Grid, Sparkles } from 'lucide-react';

export interface SignalViewportProps {
  observation: ObservationData;
  status: ObservationStatus;
  isPaused: boolean;
  scanProgress: number; // 0.0 to 1.0 during ANALYZING
}

export function SignalViewport({
  observation,
  status,
  isPaused,
  scanProgress,
}: SignalViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Layer toggles
  const [showGrid, setShowGrid] = useState(true);
  const [showNoise, setShowNoise] = useState(true);
  const [showAnomalyOverlay, setShowAnomalyOverlay] = useState(true);
  const [zoomLevel, setZoomLevel] = useState<1 | 2>(1);
  const [isAudioActive, setIsAudioActive] = useState(false);

  // Hover coordinate readout state
  const [hoverCoord, setHoverCoord] = useState<{
    freqMHz: number;
    timeSec: number;
    powerDbm: number;
    x: number;
    y: number;
  } | null>(null);

  // References to keep in sync inside animation loop
  const stateRef = useRef({
    observation,
    status,
    isPaused,
    scanProgress,
    showGrid,
    showNoise,
    showAnomalyOverlay,
    zoomLevel,
  });

  useEffect(() => {
    stateRef.current = {
      observation,
      status,
      isPaused,
      scanProgress,
      showGrid,
      showNoise,
      showAnomalyOverlay,
      zoomLevel,
    };
  }, [
    observation,
    status,
    isPaused,
    scanProgress,
    showGrid,
    showNoise,
    showAnomalyOverlay,
    zoomLevel,
  ]);

  // Audio coupling
  const toggleAudio = useCallback(() => {
    const active = observatoryAudio.toggle();
    setIsAudioActive(active);
    if (active) {
      observatoryAudio.updateCarrierPresence(
        status === 'ANOMALY_DETECTED' || status === 'CANDIDATE_READY' ? 0.9 : 0.3,
        observation.driftRateHzPerSec
      );
    }
  }, [status, observation.driftRateHzPerSec]);

  // Update audio carrier if active
  useEffect(() => {
    if (isAudioActive) {
      const intensity = status === 'ANOMALY_DETECTED' || status === 'CANDIDATE_READY' ? 0.95 : 0.3;
      observatoryAudio.updateCarrierPresence(intensity, observation.driftRateHzPerSec);
    }
  }, [isAudioActive, status, observation.driftRateHzPerSec]);

  // Pre-generate noise field data matrix for efficiency
  const noiseMatrixRef = useRef<Float32Array | null>(null);
  const cols = 120;
  const rows = 48;

  useEffect(() => {
    const data = new Float32Array(cols * rows);
    for (let i = 0; i < cols * rows; i++) {
      data[i] = Math.random();
    }
    noiseMatrixRef.current = data;
  }, [observation.id]);

  // Main Canvas Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let animId: number;
    let width = 0;
    let height = 0;
    const startTime = performance.now();
    let lastTime = startTime;
    let internalTime = 0;

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

    const render = (now: number) => {
      const dt = (now - lastTime) * 0.001;
      lastTime = now;

      const current = stateRef.current;
      if (!current.isPaused) {
        internalTime += dt;
      }

      const t = internalTime;

      // Layout geometry
      const paddingLeft = 56; // Left frequency axis
      const paddingRight = 36;
      const paddingTop = 28;
      const paddingBottom = 48; // Bottom time axis + signal trace

      const plotW = Math.max(10, width - paddingLeft - paddingRight);
      const plotH = Math.max(10, height - paddingTop - paddingBottom);

      // 1. Clear background
      ctx.fillStyle = '#03060C';
      ctx.fillRect(0, 0, width, height);

      // Spectrogram area background
      ctx.fillStyle = '#050913';
      ctx.fillRect(paddingLeft, paddingTop, plotW, plotH);

      // 2. Render Spectrogram (Time-Frequency field)
      const matrix = noiseMatrixRef.current;
      if (matrix && plotW > 0 && plotH > 0) {
        const cellW = plotW / cols;
        const cellH = plotH / rows;

        // Carrier line parameters
        const driftSlope = current.observation.driftRateHzPerSec;

        for (let r = 0; r < rows; r++) {
          const normFreq = 1 - r / rows; // Top = high freq, bottom = low freq
          for (let c = 0; c < cols; c++) {
            const normTime = c / cols;
            const noiseVal = current.showNoise ? matrix[r * cols + c] * 0.22 : 0.04;

            // Compute distance to coherent carrier line
            // Carrier has Doppler drift across time
            const carrierRowNorm =
              0.52 + (normTime - 0.5) * (driftSlope * 0.45) * (current.zoomLevel === 2 ? 1.8 : 1);
            const distToCarrier = Math.abs(normFreq - carrierRowNorm);

            let intensity = noiseVal;

            // Carrier emergence
            if (distToCarrier < 0.035 * (current.zoomLevel === 2 ? 1.5 : 1)) {
              const carrierPower = 1 - distToCarrier / 0.035;
              const flicker = 0.8 + 0.2 * Math.sin(c * 0.4 - t * 4);
              intensity += carrierPower * 0.72 * flicker;
            }

            // Anomaly zone extra harmonic/signal density
            const isInsideAnomaly =
              normTime >= 0.35 &&
              normTime <= 0.78 &&
              normFreq >= 0.42 &&
              normFreq <= 0.62 &&
              (current.status === 'ANOMALY_DETECTED' || current.status === 'CANDIDATE_READY');

            if (isInsideAnomaly && distToCarrier < 0.055) {
              intensity += 0.28 * Math.sin(c * 0.6 + t * 6);
            }

            // Map intensity to Colormap: Deep Navy -> Cyan -> Bright Core
            if (intensity > 0.05) {
              const cl = Math.min(1, intensity);
              let cr: number;
              let cg: number;
              let cb: number;

              if (cl < 0.35) {
                // Navy blue
                cr = Math.floor(10 * cl);
                cg = Math.floor(40 * cl * 2.5);
                cb = Math.floor(110 * cl * 3);
              } else if (cl < 0.75) {
                // Vibrant Cyan / Teal
                const factor = (cl - 0.35) / 0.4;
                cr = Math.floor(14 + 40 * factor);
                cg = Math.floor(100 + 127 * factor);
                cb = Math.floor(160 + 95 * factor);
              } else {
                // Intense bright core
                const factor = (cl - 0.75) / 0.25;
                cr = Math.floor(102 + 153 * factor);
                cg = Math.floor(227 + 28 * factor);
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
      }

      // 3. Subtle Scientific Reticle Grid
      if (current.showGrid) {
        ctx.strokeStyle = 'rgba(23, 35, 56, 0.65)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);

        // Horizontal frequency grid lines (5 subdivisions)
        const freqSteps = 5;
        for (let i = 0; i <= freqSteps; i++) {
          const y = paddingTop + (plotH / freqSteps) * i;
          ctx.beginPath();
          ctx.moveTo(paddingLeft, y);
          ctx.lineTo(paddingLeft + plotW, y);
          ctx.stroke();
        }

        // Vertical time grid lines (6 subdivisions)
        const timeSteps = 6;
        for (let i = 0; i <= timeSteps; i++) {
          const x = paddingLeft + (plotW / timeSteps) * i;
          ctx.beginPath();
          ctx.moveTo(x, paddingTop);
          ctx.lineTo(x, paddingTop + plotH);
          ctx.stroke();
        }

        ctx.setLineDash([]);
      }

      // 4. Primary Coherent Signal Carrier Vector Trace
      ctx.save();
      ctx.strokeStyle = '#66E3FF';
      ctx.shadowColor = 'rgba(102, 227, 255, 0.45)';
      ctx.shadowBlur = 8;
      ctx.lineWidth = 1.3;

      ctx.beginPath();
      for (let x = 0; x <= plotW; x += 3) {
        const normX = x / plotW;
        const driftSlope = current.observation.driftRateHzPerSec;
        const carrierRowNorm =
          0.52 + (normX - 0.5) * (driftSlope * 0.45) * (current.zoomLevel === 2 ? 1.8 : 1);
        const driftY = paddingTop + (1 - carrierRowNorm) * plotH;
        const ripple = Math.sin(normX * 36 - t * 7) * 2;

        if (x === 0) ctx.moveTo(paddingLeft + x, driftY + ripple);
        else ctx.lineTo(paddingLeft + x, driftY + ripple);
      }
      ctx.stroke();
      ctx.restore();

      // 5. Analyzing Scanline / Laser Sweep (when in ANALYZING state)
      if (current.status === 'ANALYZING') {
        const scanX = paddingLeft + plotW * current.scanProgress;

        // Gradient laser curtain
        const grad = ctx.createLinearGradient(scanX - 30, 0, scanX, 0);
        grad.addColorStop(0, 'rgba(102, 227, 255, 0)');
        grad.addColorStop(1, 'rgba(102, 227, 255, 0.18)');
        ctx.fillStyle = grad;
        ctx.fillRect(scanX - 30, paddingTop, 30, plotH);

        // Core line
        ctx.strokeStyle = '#66E3FF';
        ctx.lineWidth = 1.5;
        ctx.shadowColor = '#66E3FF';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(scanX, paddingTop);
        ctx.lineTo(scanX, paddingTop + plotH);
        ctx.stroke();
        ctx.shadowBlur = 0;

        // Scan progress label
        ctx.fillStyle = '#5BD8F5';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(
          `Analyzing: ${Math.floor(current.scanProgress * 100)}%`,
          scanX - 8,
          paddingTop + 14
        );
      }

      // 6. Restrained Anomaly Highlight Region
      if (
        current.showAnomalyOverlay &&
        (current.status === 'ANOMALY_DETECTED' || current.status === 'CANDIDATE_READY')
      ) {
        // Anomaly bounding box: 38% to 75% time, 44% to 60% frequency
        const ax = paddingLeft + plotW * 0.38;
        const aw = plotW * 0.37;
        const ay = paddingTop + plotH * 0.39;
        const ah = plotH * 0.22;

        ctx.save();
        // Subtle tinted region
        ctx.fillStyle = 'rgba(91, 216, 245, 0.08)';
        ctx.fillRect(ax, ay, aw, ah);

        // Precision corner brackets (not heavy border)
        const cornerSize = 8;
        ctx.strokeStyle = '#5BD8F5';
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

        // Micro label
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = '#5BD8F5';
        ctx.textAlign = 'left';
        ctx.fillText('Candidate region (Δf = 3.8 Hz)', ax + 4, ay - 6);

        ctx.textAlign = 'right';
        ctx.fillText(
          `Drift: ${current.observation.driftRateHzPerSec.toFixed(2)} Hz/s`,
          ax + aw - 4,
          ay - 6
        );

        ctx.restore();
      }

      // 7. Outer Spectrogram Border
      ctx.strokeStyle = '#172338';
      ctx.lineWidth = 1;
      ctx.strokeRect(paddingLeft, paddingTop, plotW, plotH);

      // 8. Scientific Axis Labels and Tick Marks
      ctx.fillStyle = '#84929C';
      ctx.font = '9px "JetBrains Mono", monospace';

      // Left Frequency Axis Ticks
      const centerF = current.observation.frequencyMHz;
      const spanF = current.observation.bandwidthMHz;
      const freqLabels = [
        (centerF + spanF * 0.5).toFixed(2),
        (centerF + spanF * 0.25).toFixed(2),
        centerF.toFixed(4) + ' f₀',
        (centerF - spanF * 0.25).toFixed(2),
        (centerF - spanF * 0.5).toFixed(2),
      ];

      ctx.textAlign = 'right';
      freqLabels.forEach((label, idx) => {
        const y = paddingTop + (plotH / 4) * idx;
        ctx.fillText(label, paddingLeft - 8, y + 3);

        // Tick mark
        ctx.beginPath();
        ctx.moveTo(paddingLeft - 4, y);
        ctx.lineTo(paddingLeft, y);
        ctx.strokeStyle = '#475569';
        ctx.stroke();
      });

      // Frequency Axis Unit Tag
      ctx.save();
      ctx.translate(14, paddingTop + plotH * 0.5);
      ctx.rotate(-Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#64748B';
      ctx.fillText('FREQUENCY (MHz)', 0, 0);
      ctx.restore();

      // Bottom Time Axis Ticks
      const dur = current.observation.durationSeconds;
      const timeSteps = 5;
      ctx.textAlign = 'center';

      for (let i = 0; i <= timeSteps; i++) {
        const x = paddingLeft + (plotW / timeSteps) * i;
        const sec = Math.floor((dur / timeSteps) * i);
        const m = Math.floor(sec / 60);
        const s = sec % 60;
        const timeStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

        ctx.fillText(timeStr, x, paddingTop + plotH + 16);

        // Tick mark
        ctx.beginPath();
        ctx.moveTo(x, paddingTop + plotH);
        ctx.lineTo(x, paddingTop + plotH + 4);
        ctx.strokeStyle = '#475569';
        ctx.stroke();
      }

      // Time Axis Unit Tag
      ctx.fillStyle = '#64748B';
      ctx.textAlign = 'center';
      ctx.fillText(
        'INTEGRATION TIME (UTC ELAPSED)',
        paddingLeft + plotW * 0.5,
        paddingTop + plotH + 28
      );

      // 9. Overlay Dynamic Integrated Signal Trace Strip (AETHON Signal Language)
      // Visual: ────────╱╲────────────╱╲──────
      const traceY = paddingTop + plotH + 34;
      const traceH = 12;

      ctx.save();
      ctx.strokeStyle = '#38BDF8';
      ctx.lineWidth = 1.1;
      ctx.beginPath();

      for (let x = 0; x <= plotW; x += 2) {
        const normX = x / plotW;
        // Two characteristic peaks matching AETHON signal language
        const peak1 = Math.exp(-Math.pow((normX - 0.48) * 22, 2)) * 8;
        const peak2 = Math.exp(-Math.pow((normX - 0.72) * 28, 2)) * 6.5;
        const ripple = Math.sin(normX * 40 - t * 6) * 0.8;

        const y = traceY + traceH * 0.5 - peak1 - peak2 + ripple;
        if (x === 0) ctx.moveTo(paddingLeft + x, y);
        else ctx.lineTo(paddingLeft + x, y);
      }
      ctx.stroke();
      ctx.restore();

      // Top Header Overlays inside Canvas
      ctx.fillStyle = '#7F8B95';
      ctx.font = '9px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText(
        `Bandwidth: ${current.observation.bandwidthMHz.toFixed(1)} MHz`,
        paddingLeft,
        paddingTop - 10
      );

      ctx.textAlign = 'right';
      ctx.fillText(`Zoom: ${current.zoomLevel}x`, paddingLeft + plotW, paddingTop - 10);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  // Handle Mouse Hover Inspection
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const paddingLeft = 56;
    const paddingRight = 36;
    const paddingTop = 28;
    const paddingBottom = 48;

    const plotW = canvas.clientWidth - paddingLeft - paddingRight;
    const plotH = canvas.clientHeight - paddingTop - paddingBottom;

    if (
      x >= paddingLeft &&
      x <= paddingLeft + plotW &&
      y >= paddingTop &&
      y <= paddingTop + plotH
    ) {
      const normX = (x - paddingLeft) / plotW;
      const normY = 1 - (y - paddingTop) / plotH;

      const dur = observation.durationSeconds;
      const timeSec = normX * dur;

      const centerF = observation.frequencyMHz;
      const spanF = observation.bandwidthMHz;
      const freqMHz = centerF - spanF * 0.5 + normY * spanF;

      // Realistic mock power based on distance to carrier
      const carrierY =
        0.52 + (normX - 0.5) * (observation.driftRateHzPerSec * 0.45) * (zoomLevel === 2 ? 1.8 : 1);
      const dist = Math.abs(normY - carrierY);
      const powerDbm =
        dist < 0.04
          ? observation.signalPowerDbm
          : observation.noiseFloorDbm + (Math.random() * 4 - 2);

      setHoverCoord({
        freqMHz,
        timeSec,
        powerDbm,
        x,
        y,
      });
    } else {
      setHoverCoord(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverCoord(null);
  };

  return (
    <div className="relative flex flex-col rounded border border-[#1C2630] bg-[#06080B] overflow-hidden shadow-sm">
      {/* Top Instrumentation Tool Strip */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#1C2630] bg-[#0B0F14] px-3 py-2 text-xs select-none">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 font-medium text-[#E6EDF2]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5BD8F5]" />
            Spectrogram viewport
          </span>
          <span className="text-[#7F8B95] hidden sm:inline">•</span>
          <span className="text-[11px] text-[#7F8B95] hidden sm:inline">Simulated observation</span>
        </div>

        {/* Viewport Control Toggles */}
        <div className="flex items-center gap-1.5">
          {/* Audio Synthesizer Toggle */}
          <button
            type="button"
            onClick={toggleAudio}
            title={isAudioActive ? 'Mute audio' : 'Enable audio carrier'}
            className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs transition-colors ${
              isAudioActive
                ? 'border-[#5BD8F5] bg-[#5BD8F5]/10 text-[#5BD8F5]'
                : 'border-[#1C2630] bg-[#10161D] text-[#7F8B95] hover:text-[#E6EDF2]'
            }`}
          >
            {isAudioActive ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
            <span className="hidden sm:inline">Audio</span>
          </button>

          {/* Grid Toggle */}
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            title="Toggle grid"
            className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs transition-colors ${
              showGrid
                ? 'border-[#5BD8F5]/40 bg-[#5BD8F5]/10 text-[#5BD8F5]'
                : 'border-[#1C2630] bg-[#10161D] text-[#7F8B95]'
            }`}
          >
            <Grid className="h-3 w-3" />
            <span className="hidden md:inline">Grid</span>
          </button>

          {/* Noise Floor Toggle */}
          <button
            type="button"
            onClick={() => setShowNoise(!showNoise)}
            title="Toggle noise floor"
            className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs transition-colors ${
              showNoise
                ? 'border-[#5BD8F5]/40 bg-[#5BD8F5]/10 text-[#5BD8F5]'
                : 'border-[#1C2630] bg-[#10161D] text-[#7F8B95]'
            }`}
          >
            <Eye className="h-3 w-3" />
            <span className="hidden md:inline">Noise</span>
          </button>

          {/* Anomaly Overlay Toggle */}
          <button
            type="button"
            onClick={() => setShowAnomalyOverlay(!showAnomalyOverlay)}
            title="Toggle anomaly overlay"
            className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs transition-colors ${
              showAnomalyOverlay
                ? 'border-[#5BD8F5] bg-[#5BD8F5]/15 text-[#5BD8F5]'
                : 'border-[#1C2630] bg-[#10161D] text-[#7F8B95]'
            }`}
          >
            <Sparkles className="h-3 w-3" />
            <span className="hidden md:inline">Candidate</span>
          </button>

          {/* Zoom Toggle */}
          <button
            type="button"
            onClick={() => setZoomLevel(zoomLevel === 1 ? 2 : 1)}
            title="Toggle 2x zoom"
            className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-xs transition-colors ${
              zoomLevel === 2
                ? 'border-[#E8AE50] bg-[#E8AE50]/15 text-[#E8AE50]'
                : 'border-[#1C2630] bg-[#10161D] text-[#7F8B95]'
            }`}
          >
            {zoomLevel === 2 ? (
              <Minimize2 className="h-3 w-3" />
            ) : (
              <Maximize2 className="h-3 w-3" />
            )}
            <span>{zoomLevel}x</span>
          </button>
        </div>
      </div>

      {/* Primary Interactive Canvas Container */}
      <div
        ref={containerRef}
        className="relative h-[340px] sm:h-[400px] w-full bg-[#06080B] cursor-crosshair"
      >
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="h-full w-full select-none"
        />

        {/* Hover Crosshair Telemetry Tooltip */}
        {hoverCoord && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-12 rounded border border-[#1C2630] bg-[#10161D] px-2.5 py-1 font-mono text-[10px] text-[#E6EDF2] shadow-lg"
            style={{ left: hoverCoord.x, top: hoverCoord.y }}
          >
            <div className="flex items-center gap-2">
              <span className="text-[#5BD8F5]">{hoverCoord.freqMHz.toFixed(4)} MHz</span>
              <span className="text-[#7F8B95]">•</span>
              <span className="text-[#E6EDF2]">T+{hoverCoord.timeSec.toFixed(1)}s</span>
              <span className="text-[#7F8B95]">•</span>
              <span className="text-[#7F8B95]">{hoverCoord.powerDbm.toFixed(1)} dBm</span>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {status === 'LOADING' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#06080B]/85 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="flex items-center gap-2 text-[#5BD8F5] text-xs">
                <span className="inline-block animate-spin">◌</span>
                <span>Loading observation samples...</span>
              </div>
              <div className="h-1 w-48 overflow-hidden rounded-full bg-[#10161D] border border-[#1C2630]">
                <div className="h-full w-full bg-[#5BD8F5] animate-pulse" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
