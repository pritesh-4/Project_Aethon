import { useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { AnalysisResponse } from '@/types/schemas.ts';

export interface DriftDataPoint {
  timeOffsetSec: number;
  frequencyOffsetHz: number;
  snr?: number | null;
}

interface DriftRateChartProps {
  data?: DriftDataPoint[] | null;
  analysisData?: AnalysisResponse | null;
  height?: number;
  driftRateHzPerSec?: number | null;
  uncertaintyHzPerSec?: number | null;
}

export function DriftRateChart({
  data,
  analysisData,
  height = 200,
  driftRateHzPerSec,
  uncertaintyHzPerSec,
}: DriftRateChartProps) {
  // Extract real trajectory series from AnalysisResponse when provided
  const chartData: DriftDataPoint[] = useMemo(() => {
    if (data && data.length > 0) return data;
    if (!analysisData) return [];

    const rawPoints = analysisData.trajectory?.points || [];
    const validPoints = rawPoints.filter((p) => p.is_valid !== false);

    if (validPoints.length > 0) {
      return validPoints.map((p) => ({
        timeOffsetSec: Number((p.time_s ?? p.time_index).toFixed(2)),
        frequencyOffsetHz: Number((p.freq_hz ?? p.freq_index).toFixed(2)),
        snr: typeof p.snr === 'number' && !Number.isNaN(p.snr) ? Number(p.snr.toFixed(1)) : null,
      }));
    }

    // Fall back to fitted trajectory points if available
    const fitted = analysisData.drift_estimate?.fitted_trajectory_points || [];
    if (fitted.length > 0) {
      return fitted.map(([t, f]) => ({
        timeOffsetSec: Number(t.toFixed(2)),
        frequencyOffsetHz: Number(f.toFixed(2)),
        snr: null,
      }));
    }

    return [];
  }, [data, analysisData]);

  const effectiveDriftRate =
    analysisData?.drift_estimate?.drift_rate_hz_per_s ?? driftRateHzPerSec ?? null;
  const effectiveUncertainty =
    analysisData?.drift_estimate?.uncertainty_hz_per_s ?? uncertaintyHzPerSec ?? null;

  if (chartData.length === 0) {
    return (
      <div className="w-full rounded-[2px] border border-[#213240] bg-[#0D141A] p-4 font-sans text-xs">
        <div className="mb-3 flex items-center justify-between border-b border-[#213240] pb-2">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7E8B96]" />
            <span className="font-medium text-[#E3EBF2]">
              Doppler drift cadence (&Delta;f / &Delta;t)
            </span>
          </div>
          <div className="text-[#6A7E8F] font-mono text-[11px]">
            {effectiveDriftRate != null ? (
              <span>
                Fitted drift:{' '}
                <span className="text-[#C19348]">
                  {effectiveDriftRate > 0
                    ? `+${effectiveDriftRate.toFixed(2)}`
                    : effectiveDriftRate.toFixed(2)}{' '}
                  Hz/s
                </span>
                {effectiveUncertainty != null && (
                  <span className="text-[#6A7E8F]"> &plusmn;{effectiveUncertainty.toFixed(3)}</span>
                )}
              </span>
            ) : (
              <span>
                Drift: <span className="text-[#6A7E8F]">Not fitted</span>
              </span>
            )}
          </div>
        </div>
        <div
          style={{ height }}
          className="flex flex-col items-center justify-center text-center text-xs text-[#6A7E8F] font-mono"
        >
          <span className="text-[#A6B7C6] font-semibold">Doppler trajectory unavailable</span>
          <span className="text-[11px] text-[#6A7E8F] mt-1 max-w-xs">
            No fitted carrier trajectory isolated for this observation.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full rounded-[2px] border border-[#213240] bg-[#0D141A] p-4 font-sans text-xs">
      <div className="mb-3 flex items-center justify-between border-b border-[#213240] pb-2">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#C19348]" />
          <span className="font-medium text-[#E3EBF2]">
            Doppler drift cadence (&Delta;f / &Delta;t)
          </span>
        </div>
        <div className="text-[#6A7E8F] font-mono text-[11px]">
          {effectiveDriftRate != null ? (
            <span>
              Drift:{' '}
              <span className="text-[#C19348]">
                {effectiveDriftRate > 0
                  ? `+${effectiveDriftRate.toFixed(2)}`
                  : effectiveDriftRate.toFixed(2)}{' '}
                Hz/s
              </span>
              {effectiveUncertainty != null && (
                <span className="text-[#6A7E8F]"> &plusmn;{effectiveUncertainty.toFixed(3)}</span>
              )}
            </span>
          ) : (
            <span>
              Drift: <span className="text-[#6A7E8F]">Not measured</span>
            </span>
          )}
        </div>
      </div>

      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
                    {pt.snr != null && (
                      <p className="text-[#E3EBF2] font-mono text-xs">SNR: {pt.snr} dB</p>
                    )}
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
