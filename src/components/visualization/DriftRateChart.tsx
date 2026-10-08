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
    <div className="w-full rounded-[2px] border border-[#262C28] bg-[#141715] p-4 font-sans text-xs">
      <div className="mb-3 flex items-center justify-between border-b border-[#262C28] pb-2">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#D4864A]" />
          <span className="font-medium text-[#E6E4DD]">Doppler drift cadence (Δf / Δt)</span>
        </div>
        <div className="text-[#9A9C96] font-mono text-[11px]">
          Drift:{' '}
          <span className="text-[#D4864A]">
            {driftRateHzPerSec > 0 ? `+${driftRateHzPerSec}` : driftRateHzPerSec} Hz/s
          </span>
        </div>
      </div>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1E221F" opacity={0.8} />
            <XAxis
              dataKey="timeOffsetSec"
              stroke="#9A9C96"
              tick={{ fill: '#9A9C96', fontSize: 10 }}
              tickFormatter={(v: number) => `${v}s`}
            />
            <YAxis
              stroke="#9A9C96"
              tick={{ fill: '#9A9C96', fontSize: 10 }}
              tickFormatter={(v: number) => `${v} Hz`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const pt = payload[0].payload as DriftDataPoint;
                return (
                  <div className="rounded-[2px] border border-[#262C28] bg-[#1A1E1B] p-2.5 shadow-md">
                    <p className="text-[11px] text-[#9A9C96] font-sans">
                      Cadence step: {pt.timeOffsetSec}s
                    </p>
                    <p className="font-medium text-[#D4864A] font-mono">
                      Offset: {pt.frequencyOffsetHz} Hz
                    </p>
                    <p className="text-[#E6E4DD] font-mono text-xs">SNR: {pt.snr} dB</p>
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="frequencyOffsetHz"
              stroke="#D4864A"
              strokeWidth={1.3}
              dot={{ r: 2, fill: '#D4864A' }}
              activeDot={{ r: 3.5, stroke: '#0F1110', strokeWidth: 1.5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
