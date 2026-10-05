import { useEffect, useRef, useState, useCallback } from 'react';
import type { SignalAnalysisRecord, SignalViewMode } from '../types.ts';
import { observatoryAudio } from '@/lib/audio-synth.ts';
import { Volume2, VolumeX, Sparkles, Grid, RotateCcw } from 'lucide-react';

export interface SignalViewerProps {
  record: SignalAnalysisRecord;
}

export function SignalViewer({ record }: SignalViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [viewMode, setViewMode] = useState<SignalViewMode>('SPECTROGRAM');
  const [showAnomaly, setShowAnomaly] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [isAudioActive, setIsAudioActive] = useState(false);

  const [hoverData, setHoverData] = useState<{
    x: number;
    y: number;
    timeStr: string;
    freqMHz: number;
    intensityDbm: number;
  } | null>(null);

  const stateRef = useRef({ record, viewMode, showAnomaly, showGrid });
  useEffect(() => {
    stateRef.current = { record, viewMode, showAnomaly, showGrid };
  }, [record, viewMode, showAnomaly, showGrid]);

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
    const cols = 90;
    const rows = 40;
    const noiseMatrix = new Float32Array(cols * rows);
    for (let i = 0; i < cols * rows; i++) {
      noiseMatrix[i] = Math.random();
    }

    const render = (now: number) => {
      const t = (now - startTime) * 0.001;
      const { record: rec, viewMode: mode, showAnomaly: anom, showGrid: grid } = stateRef.current;

      const paddingLeft = 60;
      const paddingRight = 32;
      const paddingTop = 26;
      const paddingBottom = 42;

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
      if (grid) {
        ctx.strokeStyle = 'rgba(23, 35, 56, 0.65)';
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
      }

      // 3. Render Mode Specific Representation
      if (mode === 'SPECTROGRAM') {
        // Render 2D Waterfall Matrix
        const cellW = plotW / cols;
        const cellH = plotH / rows;
        const driftSlope = rec.driftRateHzPerSec;

        for (let r = 0; r < rows; r++) {
          const normFreq = 1 - r / rows;
          for (let c = 0; c < cols; c++) {
            const normTime = c / cols;
            const noise = noiseMatrix[r * cols + c] * 0.18;

            // Slanted Doppler carrier center
            const carrierCenter = 0.52 + (normTime - 0.5) * (driftSlope * 0.45);
            const dist = Math.abs(normFreq - carrierCenter);

            let intensity = noise;
            if (dist < 0.04) {
              const strength = 1 - dist / 0.04;
              intensity += strength * (0.68 + Math.sin(c * 0.35 - t * 5) * 0.14);
            }

            // Anomaly zone intensity burst
            if (normTime >= 0.4 && normTime <= 0.75 && dist < 0.05) {
              intensity += 0.22 * Math.sin(c * 0.5 + t * 6);
            }

            if (intensity > 0.05) {
              const cl = Math.min(1, intensity);
              let cr: number;
              let cg: number;
              let cb: number;

              if (cl < 0.35) {
                cr = Math.floor(10 * cl);
                cg = Math.floor(45 * cl * 2.2);
                cb = Math.floor(115 * cl * 2.8);
              } else if (cl < 0.75) {
                const f = (cl - 0.35) / 0.4;
                cr = Math.floor(14 + 40 * f);
                cg = Math.floor(105 + 122 * f);
                cb = Math.floor(165 + 90 * f);
              } else {
                const f = (cl - 0.75) / 0.25;
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

        // Overlaid Coherent Carrier Trace
        ctx.save();
        ctx.strokeStyle = '#5BD8F5';
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        for (let x = 0; x <= plotW; x += 3) {
          const normX = x / plotW;
          const carrierNorm = 0.52 + (normX - 0.5) * (driftSlope * 0.45);
          const driftY = paddingTop + (1 - carrierNorm) * plotH;
          const ripple = Math.sin(normX * 36 - t * 7) * 2;
          if (x === 0) ctx.moveTo(paddingLeft + x, driftY + ripple);
          else ctx.lineTo(paddingLeft + x, driftY + ripple);
        }
        ctx.stroke();
        ctx.restore();

        // Anomaly Bounding Region
        if (anom) {
          const ax = paddingLeft + plotW * 0.4;
          const aw = plotW * 0.35;
          const ay = paddingTop + plotH * 0.36;
          const ah = plotH * 0.32;

          ctx.save();
          ctx.fillStyle = 'rgba(91, 216, 245, 0.06)';
          ctx.fillRect(ax, ay, aw, ah);

          const cLen = 10;
          ctx.strokeStyle = rec.priority === 'HIGH' ? '#E8AE50' : '#5BD8F5';
          ctx.lineWidth = 1.3;

          // Corner marks
          ctx.beginPath();
          ctx.moveTo(ax, ay + cLen);
          ctx.lineTo(ax, ay);
          ctx.lineTo(ax + cLen, ay);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(ax + aw - cLen, ay);
          ctx.lineTo(ax + aw, ay);
          ctx.lineTo(ax + aw, ay + cLen);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(ax, ay + ah - cLen);
          ctx.lineTo(ax, ay + ah);
          ctx.lineTo(ax + cLen, ay + ah);
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(ax + aw - cLen, ay + ah);
          ctx.lineTo(ax + aw, ay + ah);
          ctx.lineTo(ax + aw, ay + ah - cLen);
          ctx.stroke();

          ctx.font = '9px "JetBrains Mono", monospace';
          ctx.fillStyle = rec.priority === 'HIGH' ? '#E8AE50' : '#5BD8F5';
          ctx.textAlign = 'left';
          ctx.fillText(`Candidate region · ${rec.bandwidthKHz} kHz`, ax + 4, ay - 6);

          ctx.textAlign = 'right';
          ctx.fillText(`df/dt = ${rec.driftRateHzPerSec.toFixed(2)} Hz/s`, ax + aw - 4, ay - 6);
          ctx.restore();
        }

        // Docked AETHON Baseline Trace at Bottom
        const traceY = paddingTop + plotH + 26;
        ctx.save();
        ctx.strokeStyle = '#5BD8F5';
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        for (let x = 0; x <= plotW; x += 2) {
          const normX = x / plotW;
          const p1 = Math.exp(-Math.pow((normX - 0.52) * 22, 2)) * 7;
          const ripple = Math.sin(normX * 40 - t * 6) * 0.7;
          const y = traceY - p1 + ripple;
          if (x === 0) ctx.moveTo(paddingLeft + x, y);
          else ctx.lineTo(paddingLeft + x, y);
        }
        ctx.stroke();
        ctx.restore();
      } else if (mode === 'WAVEFORM') {
        // Time-Domain Voltage Oscillogram
        ctx.save();
        ctx.strokeStyle = '#5BD8F5';
        ctx.lineWidth = 1.3;

        ctx.beginPath();
        for (let x = 0; x <= plotW; x += 2) {
          const normX = x / plotW;
          const noise = (Math.random() - 0.5) * 4;
          // Carrier packet centered at 55%
          const envelope = Math.exp(-Math.pow((normX - 0.55) * 5, 2));
          const carrier = Math.sin(x * 0.09 - t * 10) * 36 * envelope;
          const baseSine = Math.sin(x * 0.03 + t * 3) * 6;

          const y = cy + noise + carrier + baseSine;
          if (x === 0) ctx.moveTo(paddingLeft + x, y);
          else ctx.lineTo(paddingLeft + x, y);
        }
        ctx.stroke();

        ctx.fillStyle = '#5BD8F5';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText('Time-domain voltage amplitude', paddingLeft + 12, paddingTop + 20);
        ctx.restore();
      } else if (mode === 'INTENSITY') {
        // Power Spectral Density Profile (FFT Peak)
        ctx.save();
        ctx.strokeStyle = '#5BD8F5';
        ctx.fillStyle = 'rgba(91, 216, 245, 0.1)';
        ctx.lineWidth = 1.4;

        ctx.beginPath();
        ctx.moveTo(paddingLeft, paddingTop + plotH);

        for (let x = 0; x <= plotW; x += 3) {
          const normX = x / plotW;
          // Sharp Gaussian peak at center frequency
          const peak = Math.exp(-Math.pow((normX - 0.52) * 30, 2)) * (plotH * 0.75);
          const noiseFloor = Math.sin(x * 0.08 + t * 4) * 4 + 12;
          const y = paddingTop + plotH - peak - noiseFloor;

          ctx.lineTo(paddingLeft + x, y);
        }

        ctx.lineTo(paddingLeft + plotW, paddingTop + plotH);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Peak Label
        ctx.fillStyle = '#E8AE50';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(
          `Peak SNR +${rec.snrDb.toFixed(1)} dB (${rec.frequencyMHz.toFixed(2)} MHz)`,
          paddingLeft + plotW * 0.52,
          paddingTop + plotH * 0.2
        );
        ctx.restore();
      }

      // 4. Outer Border
      ctx.strokeStyle = '#1C2630';
      ctx.lineWidth = 1;
      ctx.strokeRect(paddingLeft, paddingTop, plotW, plotH);

      // 5. Scientific Axis Labels
      ctx.fillStyle = '#7F8B95';
      ctx.font = '9px "JetBrains Mono", monospace';

      // Left Frequency Axis
      const f0 = rec.frequencyMHz;
      const spanF = 6.25;
      ctx.textAlign = 'right';
      ctx.fillText(`+${spanF.toFixed(2)} MHz`, paddingLeft - 6, paddingTop + 6);
      ctx.fillText(`${f0.toFixed(2)} f₀`, paddingLeft - 6, cy + 3);
      ctx.fillText(`-${spanF.toFixed(2)} MHz`, paddingLeft - 6, paddingTop + plotH - 2);

      // Bottom Time Axis
      const durSec = rec.durationSeconds || 272;
      const endMins = Math.floor(durSec / 60);
      const endSecs = durSec % 60;
      const endTimeStr = `${endMins.toString().padStart(2, '0')}:${endSecs.toString().padStart(2, '0')}`;
      const midSec = Math.floor(durSec / 2);
      const midMins = Math.floor(midSec / 60);
      const midSecs = midSec % 60;
      const midTimeStr = `${midMins.toString().padStart(2, '0')}:${midSecs.toString().padStart(2, '0')}`;

      ctx.textAlign = 'center';
      ctx.fillText('00:00', paddingLeft + 12, paddingTop + plotH + 16);
      ctx.fillText(midTimeStr, paddingLeft + plotW * 0.5, paddingTop + plotH + 16);
      ctx.fillText(endTimeStr, paddingLeft + plotW - 12, paddingTop + plotH + 16);

      // Top Stage Header
      ctx.fillStyle = '#7F8B95';
      ctx.textAlign = 'left';
      ctx.fillText(`${mode.toLowerCase()} · 3.8 Hz/ch`, paddingLeft, paddingTop - 10);

      ctx.textAlign = 'right';
      ctx.fillText(
        `SNR: +${rec.snrDb} dB · Noise floor: ${rec.noiseFloorDbm} dBm`,
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
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const paddingLeft = 60;
    const paddingRight = 32;
    const paddingTop = 26;
    const paddingBottom = 42;

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

      const timeSec = normX * (record.durationSeconds || 272);
      const mins = Math.floor(timeSec / 60);
      const secs = (timeSec % 60).toFixed(3);
      const timeStr = `00:${mins.toString().padStart(2, '0')}:${secs.padStart(6, '0')}`;

      const freqMHz = record.frequencyMHz - 6.25 + normY * 12.5;
      const intensityDbm =
        Math.abs(normY - 0.52) < 0.05
          ? record.peakPowerDbm
          : record.noiseFloorDbm + (Math.random() * 3 - 1.5);

      setHoverData({
        x,
        y,
        timeStr,
        freqMHz,
        intensityDbm,
      });
    } else {
      setHoverData(null);
    }
  };

  const handleMouseLeave = () => {
    setHoverData(null);
  };

  return (
    <div className="relative flex flex-col rounded-[2px] border border-[#1C2630] bg-[#06080B] overflow-hidden select-none">
      {/* Top View Mode & Tool Strip */}
      <div className="flex flex-wrap items-center justify-between border-b border-[#1C2630] bg-[#0B0F14] px-3 py-1.5 font-mono text-[11px] text-[#7F8B95]">
        {/* Left: View Mode Segmented Switcher */}
        <div className="flex items-center gap-1">
          {(['SPECTROGRAM', 'WAVEFORM', 'INTENSITY'] as SignalViewMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
              className={`rounded-[1px] border px-2.5 py-0.5 text-[10px] font-mono font-medium transition-colors cursor-pointer ${
                viewMode === mode
                  ? 'border-[#5BD8F5] bg-[#5BD8F5]/10 text-[#5BD8F5]'
                  : 'border-[#1C2630] bg-[#10161D] text-[#7F8B95] hover:text-[#E6EDF2]'
              }`}
            >
              {mode === 'SPECTROGRAM'
                ? 'Spectrogram'
                : mode === 'WAVEFORM'
                  ? 'Waveform'
                  : 'Intensity'}
            </button>
          ))}
        </div>

        {/* Right: Inspection Toggles */}
        <div className="flex items-center gap-1.5">
          {/* Sonification Toggle */}
          <button
            type="button"
            onClick={toggleAudio}
            title={isAudioActive ? 'Mute audio' : 'Listen to signal'}
            className={`inline-flex items-center gap-1 rounded-[1px] border px-2 py-0.5 text-[10px] font-mono transition-colors cursor-pointer ${
              isAudioActive
                ? 'border-[#5BD8F5] bg-[#5BD8F5]/10 text-[#5BD8F5]'
                : 'border-[#1C2630] bg-[#10161D] text-[#7F8B95] hover:text-[#E6EDF2]'
            }`}
          >
            {isAudioActive ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
            <span className="hidden sm:inline">Audio</span>
          </button>

          {/* Anomaly Boundary Toggle */}
          <button
            type="button"
            onClick={() => setShowAnomaly(!showAnomaly)}
            className={`inline-flex items-center gap-1 rounded-[1px] border px-2 py-0.5 text-[10px] font-mono transition-colors cursor-pointer ${
              showAnomaly
                ? 'border-[#E8AE50] bg-[#E8AE50]/10 text-[#E8AE50]'
                : 'border-[#1C2630] bg-[#10161D] text-[#7F8B95]'
            }`}
          >
            <Sparkles className="h-3 w-3" />
            <span className="hidden md:inline">Region</span>
          </button>

          {/* Grid Toggle */}
          <button
            type="button"
            onClick={() => setShowGrid(!showGrid)}
            className={`inline-flex items-center gap-1 rounded-[1px] border px-2 py-0.5 text-[10px] font-mono transition-colors cursor-pointer ${
              showGrid
                ? 'border-[#5BD8F5] bg-[#5BD8F5]/10 text-[#5BD8F5]'
                : 'border-[#1C2630] bg-[#10161D] text-[#7F8B95]'
            }`}
          >
            <Grid className="h-3 w-3" />
            <span className="hidden md:inline">Grid</span>
          </button>

          {/* Reset Viewport */}
          <button
            type="button"
            onClick={() => {
              setViewMode('SPECTROGRAM');
              setShowAnomaly(true);
              setShowGrid(true);
            }}
            title="Reset Viewport"
            className="rounded-[1px] border border-[#1C2630] bg-[#10161D] p-1 text-[#7F8B95] hover:text-[#E6EDF2] transition-colors cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* Main Interactive Canvas */}
      <div
        ref={containerRef}
        className="relative h-[320px] sm:h-[380px] w-full bg-[#03060C] cursor-crosshair"
      >
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          className="h-full w-full select-none"
        />

        {/* Small Technical Hover Tooltip */}
        {hoverData && (
          <div
            className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-12 rounded-[2px] border border-[#1C2630] bg-[#0B0F14] px-2.5 py-1 font-mono text-[10px] text-[#E6EDF2] shadow-xl backdrop-blur-md"
            style={{ left: hoverData.x, top: hoverData.y }}
          >
            <div className="flex items-center gap-2">
              <span className="text-[#5BD8F5] font-medium">{hoverData.timeStr}</span>
              <span className="text-[#7F8B95]">•</span>
              <span className="text-[#E6EDF2]">{hoverData.freqMHz.toFixed(4)} MHz</span>
              <span className="text-[#7F8B95]">•</span>
              <span className="text-[#5BD8F5]">{hoverData.intensityDbm.toFixed(1)} dBm</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
