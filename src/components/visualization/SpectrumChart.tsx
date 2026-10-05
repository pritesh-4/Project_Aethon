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
    <div className="w-full rounded-[4px] border border-[#172230] bg-[#0B0F14] p-4 font-sans text-xs">
      <div className="mb-3 flex items-center justify-between border-b border-[#172230] pb-2">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#5BD8F5]" />
          <span className="font-medium text-[#E6EDF2]">Spectral Power Distribution</span>
        </div>
        <div className="flex items-center gap-3 text-[#7F8B95] font-mono text-[11px]">
          <span>Res: 15.0 kHz</span>
          <span className="text-[#5BD8F5]">Band: 1.42 GHz</span>
        </div>
      </div>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="spectrumGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#5BD8F5" stopOpacity={0.25} />
                <stop offset="60%" stopColor="#5BD8F5" stopOpacity={0.06} />
                <stop offset="100%" stopColor="#0B0F14" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#172230" opacity={0.8} />

            <XAxis
              dataKey="frequencyMHz"
              stroke="#7F8B95"
              tick={{ fill: '#7F8B95', fontSize: 10 }}
              tickFormatter={(v: number) => `${v.toFixed(3)}`}
              label={{
                value: 'Frequency (MHz)',
                position: 'insideBottom',
                offset: -2,
                fill: '#7F8B95',
                fontSize: 10,
              }}
            />

            <YAxis
              stroke="#7F8B95"
              tick={{ fill: '#7F8B95', fontSize: 10 }}
              tickFormatter={(v: number) => `${v} dB`}
              domain={['dataMin - 5', 'dataMax + 5']}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const item = payload[0].payload as SpectrumDataPoint;
                return (
                  <div className="rounded-[4px] border border-[#243345] bg-[#10161D] p-2.5 shadow-md">
                    <p className="text-[11px] text-[#7F8B95] font-sans">Channel</p>
                    <p className="font-medium text-[#5BD8F5] font-mono">
                      {item.frequencyMHz.toFixed(4)} MHz
                    </p>
                    <p className="mt-0.5 text-[#E6EDF2] font-mono">
                      Power:{' '}
                      <span className="text-[#E6EDF2] font-semibold">{item.amplitudeDb} dBm</span>
                    </p>
                  </div>
                );
              }}
            />

            {showHydrogenLine && (
              <ReferenceLine
                x={1420.405}
                stroke="#5BD8F5"
                strokeDasharray="4 4"
                label={{
                  value: 'HI Line (1420.405)',
                  position: 'top',
                  fill: '#5BD8F5',
                  fontSize: 10,
                }}
              />
            )}

            {highlightMarkerMHz && (
              <ReferenceLine
                x={highlightMarkerMHz}
                stroke="#D95C5C"
                strokeWidth={1.5}
                label={{
                  value: markerLabel,
                  position: 'top',
                  fill: '#D95C5C',
                  fontSize: 10,
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="amplitudeDb"
              stroke="#5BD8F5"
              strokeWidth={1.5}
              fill="url(#spectrumGradient)"
              isAnimationActive={true}
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
