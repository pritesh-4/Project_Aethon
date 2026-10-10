import { useMemo } from 'react';
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
import type { SpectralSliceResponse } from '@/types/schemas.ts';

interface SpectrumChartProps {
  data?: SpectrumDataPoint[] | null;
  sliceData?: SpectralSliceResponse | null;
  height?: number;
  centerFrequencyMHz?: number | null;
  bandwidthMHz?: number | null;
  highlightMarkerMHz?: number | null;
  markerLabel?: string;
  showHydrogenLine?: boolean;
}

export function SpectrumChart({
  data,
  sliceData,
  height = 240,
  centerFrequencyMHz,
  bandwidthMHz,
  highlightMarkerMHz,
  markerLabel = 'Signal Peak',
  showHydrogenLine = true,
}: SpectrumChartProps) {
  // Derive per-frequency profile from real spectral slice when provided
  const chartData: SpectrumDataPoint[] = useMemo(() => {
    if (data && data.length > 0) return data;
    if (!sliceData || !sliceData.values || sliceData.values.length === 0) return [];

    const n_time = sliceData.values.length;
    const n_freq = sliceData.values[0]?.length || 0;
    if (n_freq === 0) return [];

    const points: SpectrumDataPoint[] = [];
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
      if (count > 0) {
        const avg = sum / count;
        let freqMHz: number;
        if (freqCoords && freqCoords[f] != null) {
          freqMHz = freqCoords[f] / 1e6;
        } else if (centerFrequencyMHz != null && bandwidthMHz != null && n_freq > 1) {
          freqMHz = centerFrequencyMHz - bandwidthMHz / 2 + (f / (n_freq - 1)) * bandwidthMHz;
        } else if (centerFrequencyMHz != null) {
          freqMHz = centerFrequencyMHz;
        } else {
          freqMHz = f;
        }

        points.push({
          frequencyMHz: Number(freqMHz.toFixed(4)),
          amplitudeDb: Number(avg.toFixed(2)),
        });
      }
    }
    return points;
  }, [data, sliceData, centerFrequencyMHz, bandwidthMHz]);

  const powerUnit =
    sliceData?.sample_value_unit ||
    (sliceData?.sample_value_semantics === 'calibrated_dbm' ? 'dBm' : 'counts');

  const minFreq = chartData.length > 0 ? Math.min(...chartData.map((d) => d.frequencyMHz)) : null;
  const maxFreq = chartData.length > 0 ? Math.max(...chartData.map((d) => d.frequencyMHz)) : null;

  // Only display Hydrogen Line marker if 1420.405 MHz actually lies within observation frequency bounds
  const isHiLineInRange =
    showHydrogenLine &&
    minFreq != null &&
    maxFreq != null &&
    minFreq <= 1420.405 &&
    maxFreq >= 1420.405;

  // Derive real channel resolution from frequency coordinates when available
  const channelResolutionKHz = useMemo(() => {
    if (
      sliceData?.frequency_coordinates_hz &&
      sliceData.frequency_coordinates_hz.length > 1 &&
      sliceData.frequency_coordinates_hz[0] != null &&
      sliceData.frequency_coordinates_hz[1] != null
    ) {
      return (
        Math.abs(sliceData.frequency_coordinates_hz[1] - sliceData.frequency_coordinates_hz[0]) /
        1000
      );
    }
    return null;
  }, [sliceData]);

  if (chartData.length === 0) {
    return (
      <div className="w-full rounded-[2px] border border-[#213240] bg-[#0D141A] p-4 font-sans text-xs">
        <div className="mb-3 flex items-center justify-between border-b border-[#213240] pb-2">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7E8B96]" />
            <span className="font-medium text-[#E3EBF2]">Spectral power distribution</span>
          </div>
        </div>
        <div
          style={{ height }}
          className="flex flex-col items-center justify-center text-center text-xs text-[#6A7E8F] font-mono"
        >
          <span className="text-[#A6B7C6] font-semibold">Spectral profile unavailable</span>
          <span className="text-[11px] text-[#6A7E8F] mt-1 max-w-xs">
            No observation slice data or measured frequency profile returned from backend.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-[2px] border border-[#213240] bg-[#0D141A] p-4 font-sans text-xs">
      <div className="mb-3 flex items-center justify-between border-b border-[#213240] pb-2">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#376A9B]" />
          <span className="font-medium text-[#E3EBF2]">Spectral power distribution</span>
        </div>
        <div className="flex items-center gap-3 text-[#6A7E8F] font-mono text-[11px]">
          {channelResolutionKHz != null && <span>Res: {channelResolutionKHz.toFixed(1)} kHz</span>}
          {centerFrequencyMHz != null && (
            <span className="text-[#5C89B7]">Center: {centerFrequencyMHz.toFixed(3)} MHz</span>
          )}
        </div>
      </div>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <defs>
              <linearGradient id="spectrumGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#376A9B" stopOpacity={0.25} />
                <stop offset="60%" stopColor="#376A9B" stopOpacity={0.06} />
                <stop offset="100%" stopColor="#0D141A" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#213240" opacity={0.6} />

            <XAxis
              dataKey="frequencyMHz"
              stroke="#6A7E8F"
              tick={{ fill: '#6A7E8F', fontSize: 10, fontFamily: 'var(--font-data)' }}
              tickFormatter={(v: number) => `${v.toFixed(3)}`}
              label={{
                value: 'Frequency (MHz)',
                position: 'insideBottom',
                offset: -2,
                fill: '#6A7E8F',
                fontSize: 10,
              }}
            />

            <YAxis
              stroke="#6A7E8F"
              tick={{ fill: '#6A7E8F', fontSize: 10, fontFamily: 'var(--font-data)' }}
              tickFormatter={(v: number) => `${v}`}
              domain={['dataMin - 1', 'dataMax + 1']}
            />

            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const item = payload[0].payload as SpectrumDataPoint;
                return (
                  <div className="rounded-[2px] border border-[#213240] bg-[#131E27] p-2.5 shadow-md">
                    <p className="text-[11px] text-[#6A7E8F] font-sans">Channel Coordinate</p>
                    <p className="font-medium text-[#5C89B7] font-mono">
                      {item.frequencyMHz.toFixed(4)} MHz
                    </p>
                    <p className="mt-0.5 text-[#E3EBF2] font-mono">
                      Amplitude:{' '}
                      <span className="text-[#E3EBF2] font-semibold">
                        {item.amplitudeDb} {powerUnit}
                      </span>
                    </p>
                  </div>
                );
              }}
            />

            {isHiLineInRange && (
              <ReferenceLine
                x={1420.405}
                stroke="#6A7E8F"
                strokeDasharray="4 4"
                label={{
                  value: 'HI Reference (1420.405 MHz)',
                  position: 'top',
                  fill: '#6A7E8F',
                  fontSize: 10,
                }}
              />
            )}

            {highlightMarkerMHz != null && (
              <ReferenceLine
                x={highlightMarkerMHz}
                stroke="#B64B4B"
                strokeWidth={1.5}
                label={{
                  value: markerLabel,
                  position: 'top',
                  fill: '#B64B4B',
                  fontSize: 10,
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="amplitudeDb"
              stroke="#5C89B7"
              strokeWidth={1.3}
              fill="url(#spectrumGradient)"
              isAnimationActive={true}
              animationDuration={400}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
