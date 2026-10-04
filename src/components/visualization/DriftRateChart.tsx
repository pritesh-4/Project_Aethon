import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

export interface DriftDataPoint {
  timeOffsetSec: number
  frequencyOffsetHz: number
  snr: number
}

interface DriftRateChartProps {
  data?: DriftDataPoint[]
  height?: number
  driftRateHzPerSec?: number
}

const DEFAULT_DRIFT: DriftDataPoint[] = Array.from({ length: 20 }, (_, i) => {
  const time = i * 15 // 15s intervals
  const driftRate = -0.32 // -0.32 Hz/s
  const drift = driftRate * time + (Math.random() - 0.5) * 0.4
  return {
    timeOffsetSec: time,
    frequencyOffsetHz: Number(drift.toFixed(2)),
    snr: Number((18.5 + (Math.random() - 0.5) * 1.8).toFixed(1)),
  }
})

export function DriftRateChart({
  data = DEFAULT_DRIFT,
  height = 200,
  driftRateHzPerSec = -0.32,
}: DriftRateChartProps) {
  return (
    <div className="w-full rounded-lg border border-slate-800/80 bg-slate-950/80 p-4 font-mono text-xs">
      <div className="mb-3 flex items-center justify-between border-b border-slate-800/60 pb-2">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          <span className="font-semibold uppercase tracking-wider text-slate-300">
            Doppler Drift Cadence (Δf / Δt)
          </span>
        </div>
        <div className="text-emerald-400">
          DRIFT: {driftRateHzPerSec > 0 ? `+${driftRateHzPerSec}` : driftRateHzPerSec} Hz/s
        </div>
      </div>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.7} />
            <XAxis
              dataKey="timeOffsetSec"
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickFormatter={(v: number) => `${v}s`}
            />
            <YAxis
              stroke="#64748b"
              tick={{ fill: '#64748b', fontSize: 10 }}
              tickFormatter={(v: number) => `${v} Hz`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload || !payload.length) return null
                const pt = payload[0].payload as DriftDataPoint
                return (
                  <div className="rounded border border-emerald-900/80 bg-slate-900/95 p-2 shadow-xl backdrop-blur-md">
                    <p className="text-[10px] uppercase text-slate-400">Cadence Step: {pt.timeOffsetSec}s</p>
                    <p className="font-semibold text-emerald-300">
                      Offset: {pt.frequencyOffsetHz} Hz
                    </p>
                    <p className="text-slate-300">SNR: {pt.snr} dB</p>
                  </div>
                )
              }}
            />
            <Line
              type="monotone"
              dataKey="frequencyOffsetHz"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ r: 2.5, fill: '#10b981' }}
              activeDot={{ r: 4, stroke: '#030712', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
