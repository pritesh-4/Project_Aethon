import { useEffect, useRef, useState, useMemo } from 'react';
import type { DiscoveryStage, DiscoveryObservationMeta } from '../types.ts';
import { api } from '@/lib/api.ts';
import type { SpectralSliceResponse } from '@/types/schemas.ts';
import {
  Loader2,
  AlertCircle,
  Activity,
  BarChart2,
  Clock,
  Maximize2,
  Minimize2,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';

export interface SignalAnalysisViewportProps {
  stage: DiscoveryStage;
  observation: DiscoveryObservationMeta;
}

export type SpectralPlotView = 'waterfall' | 'frequency' | 'time';

interface SliceBounds {
  timeStart: number;
  timeStop: number;
  freqStart: number;
  freqStop: number;
}

export function SignalAnalysisViewport({ stage, observation }: SignalAnalysisViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Active View Mode
  const [activePlot, setActivePlot] = useState<SpectralPlotView>('waterfall');
  const [isExpanded, setIsExpanded] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Slice Boundaries State
  const [bounds, setBounds] = useState<SliceBounds>({
    timeStart: 0,
    timeStop: 64,
    freqStart: 0,
    freqStop: 128,
  });

  const [sliceData, setSliceData] = useState<SpectralSliceResponse | null>(null);
  const [isLoadingSlice, setIsLoadingSlice] = useState(false);
  const [sliceError, setSliceError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch real spectral slice from backend
  useEffect(() => {
    let isCancelled = false;

    const loadSlice = async () => {
      setIsLoadingSlice(true);
      setSliceError(null);

      try {
        const res = await api.getObservationSlice(observation.id, {
          time_start: bounds.timeStart,
          time_stop: bounds.timeStop,
          frequency_start: bounds.freqStart,
          frequency_stop: bounds.freqStop,
        });

        if (!isCancelled) {
          if (res && res.values && res.values.length > 0) {
            setSliceData(res);
          } else {
            setSliceData(null);
            setSliceError('Backend returned empty spectral matrix.');
          }
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setSliceData(null);
          const msg =
            (err as { message?: string })?.message ||
            'Spectral slice unavailable from backend service.';
          setSliceError(msg);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingSlice(false);
        }
      }
    };

    void loadSlice();

    return () => {
      isCancelled = true;
    };
  }, [
    observation.id,
    bounds.timeStart,
    bounds.timeStop,
    bounds.freqStart,
    bounds.freqStop,
    refreshTrigger,
  ]);

  // Compute 2D stats for Waterfall heatmap
  const sliceStats = useMemo(() => {
    if (!sliceData || !sliceData.values || sliceData.values.length === 0) return null;
    let min = Infinity;
    let max = -Infinity;
    let finiteCount = 0;
    const n_time = sliceData.values.length;
    const n_freq = sliceData.values[0]?.length || 0;
    const totalSamples = n_time * n_freq;

    for (let t = 0; t < n_time; t++) {
      const row = sliceData.values[t];
      if (!row) continue;
      for (let f = 0; f < row.length; f++) {
        const val = row[f];
        if (val !== null && val !== undefined && !Number.isNaN(val) && Number.isFinite(val)) {
          finiteCount++;
          if (val < min) min = val;
          if (val > max) max = val;
        }
      }
    }

    if (!Number.isFinite(min) || !Number.isFinite(max) || finiteCount === 0) return null;
    const validFraction = totalSamples > 0 ? finiteCount / totalSamples : 0;
    return { min, max, n_time, n_freq, finiteCount, totalSamples, validFraction };
  }, [sliceData]);

  // Compute 1D Frequency Spectrum Profile (mean power per frequency channel across all time samples)
  const frequencyProfile = useMemo(() => {
    if (!sliceData || !sliceData.values || sliceData.values.length === 0) return [];
    const n_time = sliceData.values.length;
    const n_freq = sliceData.values[0]?.length || 0;
    if (n_freq === 0) return [];

    const points: Array<{
      channelIndex: number;
      freqDisplay: number;
      freqLabel: string;
      power: number | null;
      validSamples: number;
    }> = [];

    const freqCoords = sliceData.frequency_coordinates_hz;

    for (let f = 0; f < n_freq; f++) {
      let sum = 0;
      let count = 0;
      for (let t = 0; t < n_time; t++) {
        const v = sliceData.values[t]?.[f];
        if (typeof v === 'number' && !Number.isNaN(v) && Number.isFinite(v)) {
          sum += v;
          count++;
        }
      }

      let freqVal: number;
      let label: string;

      if (freqCoords && freqCoords[f] != null) {
        freqVal = Number((freqCoords[f] / 1e6).toFixed(4));
        label = `${freqVal.toFixed(3)} MHz`;
      } else if (observation.frequencyMHz != null) {
        freqVal = f;
        label = `Ch #${f}`;
      } else {
        freqVal = f;
        label = `Ch #${f}`;
      }

      points.push({
        channelIndex: f,
        freqDisplay: freqVal,
        freqLabel: label,
        power: count > 0 ? Number((sum / count).toFixed(3)) : null,
        validSamples: count,
      });
    }

    return points;
  }, [sliceData, observation.frequencyMHz]);

  // Compute 1D Time Profile (mean power per time sample across all frequency channels)
  const timeProfile = useMemo(() => {
    if (!sliceData || !sliceData.values || sliceData.values.length === 0) return [];
    const n_time = sliceData.values.length;
    const n_freq = sliceData.values[0]?.length || 0;
    if (n_time === 0) return [];

    const points: Array<{
      timeIndex: number;
      timeDisplay: number;
      timeLabel: string;
      power: number | null;
      validSamples: number;
    }> = [];

    const timeCoords = sliceData.time_coordinates_seconds;

    for (let t = 0; t < n_time; t++) {
      let sum = 0;
      let count = 0;
      const row = sliceData.values[t];
      if (row) {
        for (let f = 0; f < n_freq; f++) {
          const v = row[f];
          if (typeof v === 'number' && !Number.isNaN(v) && Number.isFinite(v)) {
            sum += v;
            count++;
          }
        }
      }

      let timeVal: number;
      let label: string;

      if (timeCoords && timeCoords[t] != null) {
        timeVal = Number(timeCoords[t].toFixed(2));
        label = `+${timeVal.toFixed(1)}s`;
      } else {
        timeVal = t;
        label = `Sample #${t}`;
      }

      points.push({
        timeIndex: t,
        timeDisplay: timeVal,
        timeLabel: label,
        power: count > 0 ? Number((sum / count).toFixed(3)) : null,
        validSamples: count,
      });
    }

    return points;
  }, [sliceData]);

  // Sample power unit label (preserving raw detector count semantics, avoiding false dBm)
  const powerUnit =
    sliceData?.sample_value_unit ||
    (sliceData?.sample_value_semantics === 'calibrated_dbm'
      ? 'dBm'
      : 'counts (relative detector power)');

  // Render Waterfall Spectrogram on Canvas
  useEffect(() => {
    if (activePlot !== 'waterfall') return;

    const canvas = canvasRef.current;
    if (!canvas || !sliceData || !sliceStats) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let width = 0;
    let height = 0;

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

    const render = () => {
      const paddingLeft = 68;
      const paddingRight = 24;
      const paddingTop = 20;
      const paddingBottom = 32;

      const plotW = Math.max(10, width - paddingLeft - paddingRight);
      const plotH = Math.max(10, height - paddingTop - paddingBottom);

      // Deep dark background
      ctx.fillStyle = '#0D141A';
      ctx.fillRect(0, 0, width, height);

      // Plot Area Fill
      ctx.fillStyle = '#111A22';
      ctx.fillRect(paddingLeft, paddingTop, plotW, plotH);

      // Draw real spectral data
      const { min, max, n_time, n_freq } = sliceStats;
      const cellW = plotW / n_time;
      const cellH = plotH / n_freq;
      const range = max - min || 1;

      for (let t = 0; t < n_time; t++) {
        for (let f = 0; f < n_freq; f++) {
          const rawVal = sliceData.values[t]?.[f];
          // Preserve missing / non-finite data as background: do NOT paint false zero power
          if (rawVal === null || rawVal === undefined || !Number.isFinite(rawVal)) continue;

          const cl = Math.max(0, Math.min(1, (rawVal - min) / range));

          if (cl > 0.02) {
            let cr: number;
            let cg: number;
            let cb: number;

            if (cl < 0.35) {
              cr = Math.floor(13 + 20 * cl);
              cg = Math.floor(20 + 35 * cl);
              cb = Math.floor(26 + 65 * cl);
            } else if (cl < 0.72) {
              const factor = (cl - 0.35) / 0.37;
              cr = Math.floor(35 + 155 * factor);
              cg = Math.floor(75 + 70 * factor);
              cb = Math.floor(125 - 55 * factor);
            } else {
              const factor = (cl - 0.72) / 0.28;
              cr = Math.floor(190 + 65 * factor);
              cg = Math.floor(145 + 110 * factor);
              cb = Math.floor(70 + 185 * factor);
            }

            // High frequency at top
            const r = n_freq - 1 - f;
            ctx.fillStyle = `rgb(${cr}, ${cg}, ${cb})`;
            ctx.fillRect(paddingLeft + t * cellW, paddingTop + r * cellH, cellW + 0.6, cellH + 0.6);
          }
        }
      }

      // Reticle Grid
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

      // Outer Plot Border
      ctx.strokeStyle = '#213240';
      ctx.lineWidth = 1;
      ctx.strokeRect(paddingLeft, paddingTop, plotW, plotH);

      // Axes labels
      ctx.fillStyle = '#7C8E9E';
      ctx.font = '10px "IBM Plex Mono", monospace';

      // Frequency axis (Y)
      const freqCoords = sliceData.frequency_coordinates_hz;
      ctx.textAlign = 'right';
      if (freqCoords && freqCoords.length > 0) {
        const topF = freqCoords[freqCoords.length - 1] / 1e6;
        const midF = freqCoords[Math.floor(freqCoords.length / 2)] / 1e6;
        const botF = freqCoords[0] / 1e6;
        ctx.fillText(`${topF.toFixed(3)} MHz`, paddingLeft - 6, paddingTop + 8);
        ctx.fillText(`${midF.toFixed(3)} MHz`, paddingLeft - 6, paddingTop + plotH * 0.5 + 3);
        ctx.fillText(`${botF.toFixed(3)} MHz`, paddingLeft - 6, paddingTop + plotH - 2);
      } else {
        ctx.fillText(`Ch #${n_freq - 1}`, paddingLeft - 6, paddingTop + 8);
        ctx.fillText(
          `Ch #${Math.floor(n_freq / 2)}`,
          paddingLeft - 6,
          paddingTop + plotH * 0.5 + 3
        );
        ctx.fillText('Ch #0', paddingLeft - 6, paddingTop + plotH - 2);
      }

      // Time axis (X)
      const timeCoords = sliceData.time_coordinates_seconds;
      ctx.textAlign = 'center';
      if (timeCoords && timeCoords.length > 0) {
        const t0 = timeCoords[0];
        const tEnd = timeCoords[timeCoords.length - 1];
        ctx.fillText(`+${t0.toFixed(1)}s`, paddingLeft + 16, paddingTop + plotH + 16);
        ctx.fillText('Observation timeline', paddingLeft + plotW * 0.5, paddingTop + plotH + 16);
        ctx.fillText(`+${tEnd.toFixed(1)}s`, paddingLeft + plotW - 16, paddingTop + plotH + 16);
      } else {
        ctx.fillText('Sample 0', paddingLeft + 24, paddingTop + plotH + 16);
        ctx.fillText(
          'Time Integration Samples',
          paddingLeft + plotW * 0.5,
          paddingTop + plotH + 16
        );
        ctx.fillText(`Sample ${n_time - 1}`, paddingLeft + plotW - 24, paddingTop + plotH + 16);
      }
    };

    const animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, [activePlot, sliceData, sliceStats, observation]);

  const viewportHeight = isExpanded ? 'h-[460px] sm:h-[500px]' : 'h-[250px] sm:h-[280px]';

  const hasPhysicalFreq = !!(
    sliceData?.frequency_coordinates_hz && sliceData.frequency_coordinates_hz.length > 0
  );
  const hasPhysicalTime = !!(
    sliceData?.time_coordinates_seconds && sliceData.time_coordinates_seconds.length > 0
  );

  return (
    <div className="rounded-[4px] border border-[#213240] bg-[#0D141A] overflow-hidden select-none font-sans shadow-md">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#213240] bg-[#111A22] px-4 py-2.5 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#376A9B] animate-pulse" />
          <span className="font-semibold text-[#E3EBF2]">Spectral Analysis Viewport</span>
          <span className="text-[#31495D]">|</span>
          <span className="font-mono text-[11px] text-[#5C89B7] uppercase tracking-wider">
            Stage: {stage}
          </span>
          {observation.provenanceSource && (
            <span className="hidden md:inline-block text-[10px] font-mono text-[#7C8E9E] bg-[#172533] px-1.5 py-0.2 rounded border border-[#213240]">
              {observation.provenanceSource}
            </span>
          )}
        </div>

        {/* View Switcher Tabs & View Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Plot Type Tabs */}
          <div className="flex items-center rounded-[3px] border border-[#213240] bg-[#0D141A] p-0.5 text-[11px] font-mono">
            <button
              type="button"
              onClick={() => setActivePlot('waterfall')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] transition-colors cursor-pointer ${
                activePlot === 'waterfall'
                  ? 'bg-[#376A9B] text-white font-semibold'
                  : 'text-[#7C8E9E] hover:text-[#E3EBF2]'
              }`}
              title="2D Waterfall Spectrogram"
            >
              <Activity className="h-3 w-3" />
              <span>Waterfall</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePlot('frequency')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] transition-colors cursor-pointer ${
                activePlot === 'frequency'
                  ? 'bg-[#376A9B] text-white font-semibold'
                  : 'text-[#7C8E9E] hover:text-[#E3EBF2]'
              }`}
              title="1D Frequency Power Spectrum"
            >
              <BarChart2 className="h-3 w-3" />
              <span>Spectrum</span>
            </button>

            <button
              type="button"
              onClick={() => setActivePlot('time')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] transition-colors cursor-pointer ${
                activePlot === 'time'
                  ? 'bg-[#376A9B] text-white font-semibold'
                  : 'text-[#7C8E9E] hover:text-[#E3EBF2]'
              }`}
              title="1D Time Integration Profile"
            >
              <Clock className="h-3 w-3" />
              <span>Time Profile</span>
            </button>
          </div>

          {/* Slice Boundary Controls Toggle */}
          <button
            type="button"
            onClick={() => setShowControls((prev) => !prev)}
            className={`p-1.5 rounded-[2px] border transition-colors cursor-pointer ${
              showControls
                ? 'border-[#376A9B] bg-[#172533] text-[#5C89B7]'
                : 'border-[#213240] bg-[#0D141A] text-[#7C8E9E] hover:text-[#E3EBF2]'
            }`}
            title="Adjust slice range bounds"
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </button>

          {/* Refresh Slice */}
          <button
            type="button"
            onClick={() => setRefreshTrigger((k) => k + 1)}
            disabled={isLoadingSlice}
            className="p-1.5 rounded-[2px] border border-[#213240] bg-[#0D141A] text-[#7C8E9E] hover:text-[#E3EBF2] transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh spectral slice"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoadingSlice ? 'animate-spin' : ''}`} />
          </button>

          {/* Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 rounded-[2px] border border-[#213240] bg-[#0D141A] text-[#7C8E9E] hover:text-[#E3EBF2] transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse view' : 'Expand view'}
          >
            {isExpanded ? (
              <Minimize2 className="h-3.5 w-3.5" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Slice Boundary Controls Drawer */}
      {showControls && (
        <div className="border-b border-[#213240] bg-[#111A22] px-4 py-2.5 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
          <div>
            <label className="block text-[10px] text-[#7C8E9E] uppercase mb-0.5">Time Start</label>
            <input
              type="number"
              min="0"
              value={bounds.timeStart}
              onChange={(e) =>
                setBounds((b) => ({ ...b, timeStart: Math.max(0, Number(e.target.value)) }))
              }
              className="w-full px-2 py-1 bg-[#0D141A] border border-[#213240] rounded-[2px] text-[#E3EBF2] text-xs focus:outline-none focus:border-[#376A9B]"
            />
          </div>
          <div>
            <label className="block text-[10px] text-[#7C8E9E] uppercase mb-0.5">Time Stop</label>
            <input
              type="number"
              min="1"
              value={bounds.timeStop}
              onChange={(e) =>
                setBounds((b) => ({
                  ...b,
                  timeStop: Math.max(b.timeStart + 1, Number(e.target.value)),
                }))
              }
              className="w-full px-2 py-1 bg-[#0D141A] border border-[#213240] rounded-[2px] text-[#E3EBF2] text-xs focus:outline-none focus:border-[#376A9B]"
            />
          </div>
          <div>
            <label className="block text-[10px] text-[#7C8E9E] uppercase mb-0.5">Freq Start</label>
            <input
              type="number"
              min="0"
              value={bounds.freqStart}
              onChange={(e) =>
                setBounds((b) => ({ ...b, freqStart: Math.max(0, Number(e.target.value)) }))
              }
              className="w-full px-2 py-1 bg-[#0D141A] border border-[#213240] rounded-[2px] text-[#E3EBF2] text-xs focus:outline-none focus:border-[#376A9B]"
            />
          </div>
          <div>
            <label className="block text-[10px] text-[#7C8E9E] uppercase mb-0.5">Freq Stop</label>
            <input
              type="number"
              min="1"
              value={bounds.freqStop}
              onChange={(e) =>
                setBounds((b) => ({
                  ...b,
                  freqStop: Math.max(b.freqStart + 1, Number(e.target.value)),
                }))
              }
              className="w-full px-2 py-1 bg-[#0D141A] border border-[#213240] rounded-[2px] text-[#E3EBF2] text-xs focus:outline-none focus:border-[#376A9B]"
            />
          </div>
          <div className="col-span-2 sm:col-span-1 flex items-end">
            <button
              type="button"
              onClick={() => setRefreshTrigger((k) => k + 1)}
              disabled={isLoadingSlice}
              className="w-full py-1 px-2.5 rounded-[2px] border border-[#376A9B] bg-[#376A9B] hover:bg-[#2A547C] text-white text-xs font-semibold cursor-pointer disabled:opacity-50"
            >
              Update Slice
            </button>
          </div>
        </div>
      )}

      {/* Main Plot Area */}
      <div ref={containerRef} className={`relative ${viewportHeight} w-full bg-[#0D141A]`}>
        {/* VIEW 1: WATERFALL SPECTROGRAM */}
        {activePlot === 'waterfall' && (
          <canvas ref={canvasRef} className="h-full w-full select-none" />
        )}

        {/* VIEW 2: FREQUENCY POWER SPECTRUM */}
        {activePlot === 'frequency' && (
          <div className="h-full w-full p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#7C8E9E] px-2 mb-1">
              <span>Mean Power across {sliceStats?.n_time ?? 0} time integrations</span>
              <span>
                Axis: {hasPhysicalFreq ? 'Calibrated Frequency (MHz)' : 'Channel Index'} · Value:{' '}
                {powerUnit}
              </span>
            </div>

            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={frequencyProfile}
                  margin={{ top: 10, right: 24, left: 24, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="freqGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#376A9B" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#376A9B" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1D2A37" strokeDasharray="2 4" vertical={false} />
                  <XAxis
                    dataKey="freqDisplay"
                    stroke="#7C8E9E"
                    tick={{ fill: '#7C8E9E', fontSize: 10, fontFamily: 'monospace' }}
                    unit={hasPhysicalFreq ? ' MHz' : ''}
                    name={hasPhysicalFreq ? 'Frequency (MHz)' : 'Channel Index'}
                  />
                  <YAxis
                    stroke="#7C8E9E"
                    tick={{ fill: '#7C8E9E', fontSize: 10, fontFamily: 'monospace' }}
                    name="Mean Power"
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111A22',
                      borderColor: '#213240',
                      borderRadius: '3px',
                      color: '#E3EBF2',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                    }}
                    labelFormatter={(_label, payload) => {
                      const item = payload[0]?.payload as { freqLabel?: string } | undefined;
                      return item?.freqLabel || String(_label);
                    }}
                    formatter={(val: unknown) => [
                      typeof val === 'number' ? `${val} ${powerUnit}` : 'Missing/NaN',
                      'Mean Power',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="power"
                    stroke="#5C89B7"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#freqGradient)"
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* VIEW 3: TIME PROFILE LIGHTCURVE */}
        {activePlot === 'time' && (
          <div className="h-full w-full p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#7C8E9E] px-2 mb-1">
              <span>Mean Power across {sliceStats?.n_freq ?? 0} frequency channels</span>
              <span>
                Axis: {hasPhysicalTime ? 'Time Offset (s)' : 'Sample Index'} · Value: {powerUnit}
              </span>
            </div>

            <div className="flex-1 w-full min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={timeProfile} margin={{ top: 10, right: 24, left: 24, bottom: 20 }}>
                  <defs>
                    <linearGradient id="timeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2A547C" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#2A547C" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#1D2A37" strokeDasharray="2 4" vertical={false} />
                  <XAxis
                    dataKey="timeDisplay"
                    stroke="#7C8E9E"
                    tick={{ fill: '#7C8E9E', fontSize: 10, fontFamily: 'monospace' }}
                    unit={hasPhysicalTime ? ' s' : ''}
                    name={hasPhysicalTime ? 'Time (s)' : 'Sample Index'}
                  />
                  <YAxis
                    stroke="#7C8E9E"
                    tick={{ fill: '#7C8E9E', fontSize: 10, fontFamily: 'monospace' }}
                    name="Mean Power"
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#111A22',
                      borderColor: '#213240',
                      borderRadius: '3px',
                      color: '#E3EBF2',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                    }}
                    labelFormatter={(_label, payload) => {
                      const item = payload[0]?.payload as { timeLabel?: string } | undefined;
                      return item?.timeLabel || String(_label);
                    }}
                    formatter={(val: unknown) => [
                      typeof val === 'number' ? `${val} ${powerUnit}` : 'Missing/NaN',
                      'Mean Power',
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="power"
                    stroke="#5C89B7"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#timeGradient)"
                    connectNulls={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Loading Overlay */}
        {isLoadingSlice && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0D141A]/90">
            <div className="flex items-center gap-2 text-xs font-mono text-[#5C89B7]">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Buffering real spectral slice from backend...</span>
            </div>
          </div>
        )}

        {/* Honest Unavailable State when slice is missing */}
        {!isLoadingSlice && (!sliceData || !sliceStats) && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#0D141A]/95 px-6 text-center">
            <div className="max-w-md space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] border border-[#213240] bg-[#131E27] text-xs font-mono text-[#A6B7C6]">
                <AlertCircle className="h-3.5 w-3.5 text-[#7E8B96]" />
                <span>SPECTRAL SLICE UNAVAILABLE</span>
              </div>
              <p className="text-xs text-[#6A7E8F] leading-relaxed">
                {sliceError ||
                  'Raw spectral matrix data is not available for this observation from backend service. Procedural signal synthesis is disabled.'}
              </p>
              <div className="pt-2 text-[11px] font-mono text-[#4A6375] flex items-center justify-center gap-3">
                <span>Target: {observation.id}</span>
                <span>•</span>
                <span>
                  Frequency:{' '}
                  {observation.frequencyMHz != null
                    ? `${observation.frequencyMHz.toFixed(3)} MHz`
                    : 'Unavailable'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Strip */}
      <div className="border-t border-[#213240] bg-[#111A22] px-4 py-2 flex flex-wrap items-center justify-between text-[11px] font-mono text-[#7C8E9E]">
        <div className="flex items-center gap-3">
          <span>Observation: {observation.id}</span>
          <span>·</span>
          <span>Target: {observation.name}</span>
          <span>·</span>
          <span>
            Dimensions: {sliceStats ? `${sliceStats.n_time}t × ${sliceStats.n_freq}f` : '—'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {sliceStats && (
            <span>Valid sample coverage: {(sliceStats.validFraction * 100).toFixed(1)}%</span>
          )}
        </div>
      </div>
    </div>
  );
}
