import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface DriftDataPoint {
  timeOffsetSec: number;
  frequencyOffsetHz: number;
  snr: number;
}

interface DriftRateChartProps {
  data?: DriftDataPoint[];
  height?: number;
  driftRateHzPerSec?: number;
}

const DEFAULT_DRIFT: DriftDataPoint[] = Array.from({ length: 20 }, (_, i) => {
  const time = i * 15; // 15s intervals
  const driftRate = -0.32; // -0.32 Hz/s
  const drift = driftRate * time + Math.sin(i * 4.31) * 0.2;
  return {
    timeOffsetSec: time,
    frequencyOffsetHz: Number(drift.toFixed(2)),
    snr: Number((18.5 + Math.sin(i * 2.7) * 0.9).toFixed(1)),
  };
});

export function DriftRateChart({
  data = DEFAULT_DRIFT,
  height = 200,
  driftRateHzPerSec = -0.32,
}: DriftRateChartProps) {
  return (
    <div className="w-full rounded-[2px] border border-[#213240] bg-[#0D141A] p-4 font-sans text-xs">
      <div className="mb-3 flex items-center justify-between border-b border-[#213240] pb-2">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#C19348]" />
          <span className="font-medium text-[#E3EBF2]">Doppler drift cadence (Δf / Δt)</span>
        </div>
        <div className="text-[#6A7E8F] font-mono text-[11px]">
          Drift:{' '}
          <span className="text-[#C19348]">
            {driftRateHzPerSec > 0 ? `+${driftRateHzPerSec}` : driftRateHzPerSec} Hz/s
          </span>
        </div>
      </div>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#213240" opacity={0.6} />
            <XAxis
              dataKey="timeOffsetSec"
              stroke="#6A7E8F"
              tick={{ fill: '#6A7E8F', fontSize: 10, fontFamily: 'var(--font-data)' }}
              tickFormatter={(v: number) => `${v}s`}
            />
            <YAxis
              stroke="#6A7E8F"
              tick={{ fill: '#6A7E8F', fontSize: 10, fontFamily: 'var(--font-data)' }}
              tickFormatter={(v: number) => `${v} Hz`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const pt = payload[0].payload as DriftDataPoint;
                return (
                  <div className="rounded-[2px] border border-[#213240] bg-[#131E27] p-2.5 shadow-md">
                    <p className="text-[11px] text-[#6A7E8F] font-sans">
                      Cadence step: {pt.timeOffsetSec}s
                    </p>
                    <p className="font-medium text-[#C19348] font-mono">
                      Offset: {pt.frequencyOffsetHz} Hz
                    </p>
                    <p className="text-[#E3EBF2] font-mono text-xs">SNR: {pt.snr} dB</p>
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="frequencyOffsetHz"
              stroke="#C19348"
              strokeWidth={1.3}
              dot={{ r: 2, fill: '#C19348' }}
              activeDot={{ r: 3.5, stroke: '#0D141A', strokeWidth: 1.5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
