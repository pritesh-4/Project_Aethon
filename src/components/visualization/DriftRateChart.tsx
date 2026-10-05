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
    <div className="w-full rounded-[4px] border border-[#172230] bg-[#0B0F14] p-4 font-sans text-xs">
      <div className="mb-3 flex items-center justify-between border-b border-[#172230] pb-2">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#5BD8F5]" />
          <span className="font-medium text-[#E6EDF2]">Doppler Drift Cadence (Δf / Δt)</span>
        </div>
        <div className="text-[#7F8B95] font-mono text-[11px]">
          Drift:{' '}
          <span className="text-[#5BD8F5]">
            {driftRateHzPerSec > 0 ? `+${driftRateHzPerSec}` : driftRateHzPerSec} Hz/s
          </span>
        </div>
      </div>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#172230" opacity={0.8} />
            <XAxis
              dataKey="timeOffsetSec"
              stroke="#7F8B95"
              tick={{ fill: '#7F8B95', fontSize: 10 }}
              tickFormatter={(v: number) => `${v}s`}
            />
            <YAxis
              stroke="#7F8B95"
              tick={{ fill: '#7F8B95', fontSize: 10 }}
              tickFormatter={(v: number) => `${v} Hz`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null;
                const pt = payload[0].payload as DriftDataPoint;
                return (
                  <div className="rounded-[4px] border border-[#243345] bg-[#10161D] p-2.5 shadow-md">
                    <p className="text-[11px] text-[#7F8B95] font-sans">
                      Cadence Step: {pt.timeOffsetSec}s
                    </p>
                    <p className="font-medium text-[#5BD8F5] font-mono">
                      Offset: {pt.frequencyOffsetHz} Hz
                    </p>
                    <p className="text-[#E6EDF2] font-mono text-xs">SNR: {pt.snr} dB</p>
                  </div>
                );
              }}
            />
            <Line
              type="monotone"
              dataKey="frequencyOffsetHz"
              stroke="#5BD8F5"
              strokeWidth={1.5}
              dot={{ r: 2, fill: '#5BD8F5' }}
              activeDot={{ r: 3.5, stroke: '#06080B', strokeWidth: 1.5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
