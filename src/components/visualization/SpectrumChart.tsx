import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import type { SpectrumDataPoint } from '@/types/index.ts';

interface SpectrumChartProps {
  data?: SpectrumDataPoint[];
  height?: number;
  centerFrequencyMHz?: number;
  highlightMarkerMHz?: number;
  markerLabel?: string;
  showHydrogenLine?: boolean;
}

// Default synthetic baseline spectrum centered around the 1.420 GHz Hydrogen Line
const DEFAULT_SPECTRUM: SpectrumDataPoint[] = Array.from({ length: 60 }, (_, i) => {
  const freq = 1420.0 + i * 0.015;
  // Add Gaussian peak near 1420.405 MHz (HI line)
  const distFromPeak = Math.abs(freq - 1420.405);
  const peak = Math.exp(-Math.pow(distFromPeak / 0.04, 2)) * 18.5;
  const pseudoNoise = Math.sin(i * 12.9898) * 0.75 - 85;
  return {
    frequencyMHz: Number(freq.toFixed(4)),
    amplitudeDb: Number((pseudoNoise + peak).toFixed(2)),
  };
});

export function SpectrumChart({
  data = DEFAULT_SPECTRUM,
  height = 240,
  highlightMarkerMHz,
  markerLabel = 'Signal Peak',
  showHydrogenLine = true,
}: SpectrumChartProps) {
  return (
    <div className="w-full rounded-lg border border-slate-800/80 bg-slate-950/80 p-4 font-mono text-xs">
      <div className="mb-3 flex items-center justify-between border-b border-slate-800/60 pb-2">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
          <span className="font-semibold uppercase tracking-wider text-slate-300">
            FFT Spectral Power Distribution
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-400">
          <span className="text-[11px] text-slate-500">RES: 15.0 kHz / bin</span>
          <span className="text-cyan-400 font-mono">BAND: L-BAND (1.42 GHz)</span>
        </div>
      </div>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="spectrumGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.45} />
                <stop offset="60%" stopColor="#0284c7" stopOpacity={0.15} />
                <stop offset="100%" stopColor="#0f172a" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} />

            <XAxis
              dataKey="frequencyMHz"
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickFormatter={(v: number) => `${v.toFixed(3)}`}
              label={{
                value: 'Frequency (MHz)',
                position: 'insideBottom',
                offset: -2,
                fill: '#475569',
                fontSize: 10,
              }}
            />

            <YAxis
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickFormatter={(v: number) => `${v} dB`}
              domain={['dataMin - 5', 'dataMax + 5']}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const item = payload[0].payload as SpectrumDataPoint;
                return (
                  <div className="rounded border border-cyan-900/80 bg-slate-900/95 p-2 shadow-xl backdrop-blur-md">
                    <p className="text-[10px] uppercase text-slate-400">Telescope Channel</p>
                    <p className="font-semibold text-cyan-300">
                      {item.frequencyMHz.toFixed(4)} MHz
                    </p>
                    <p className="mt-0.5 text-slate-200">
                      Power:{' '}
                      <span className="text-emerald-400 font-bold">{item.amplitudeDb} dBm</span>
                    </p>
                  </div>
                );
              }}
            />

            {showHydrogenLine && (
              <ReferenceLine
                x={1420.405}
                stroke="#38bdf8"
                strokeDasharray="4 4"
                label={{
                  value: 'HI Line (1420.405)',
                  position: 'top',
                  fill: '#38bdf8',
                  fontSize: 10,
                }}
              />
            )}

            {highlightMarkerMHz && (
              <ReferenceLine
                x={highlightMarkerMHz}
                stroke="#f43f5e"
                strokeWidth={2}
                label={{
                  value: markerLabel,
                  position: 'top',
                  fill: '#f43f5e',
                  fontSize: 10,
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="amplitudeDb"
              stroke="#06b6d4"
              strokeWidth={1.75}
              fill="url(#spectrumGradient)"
              isAnimationActive={true}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
