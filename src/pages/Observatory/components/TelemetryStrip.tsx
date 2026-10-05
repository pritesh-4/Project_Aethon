import type { ObservationData } from '../types.ts';

export interface TelemetryStripProps {
  observation: ObservationData;
}

export function TelemetryStrip({ observation }: TelemetryStripProps) {
  const getRfiColor = (risk: ObservationData['rfiRisk']) => {
    switch (risk) {
      case 'LOW':
        return 'text-emerald-400';
      case 'MODERATE':
        return 'text-[#FFB84D]';
      case 'ELEVATED':
      case 'HIGH':
        return 'text-[#FF5E5E]';
    }
  };

  return (
    <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] px-4 py-2.5 font-mono text-xs select-none">
      <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-800/80">
        {/* Metric 1: Signal Power */}
        <div className="flex-1 min-w-[130px] pt-1 sm:pt-0 sm:px-3 first:pl-0">
          <span className="block text-[10px] text-[#84929C] uppercase tracking-wider">
            SIGNAL POWER
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-sm font-bold text-[#EAF4F7]">
              {observation.signalPowerDbm.toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-500 uppercase">dBm</span>
          </div>
        </div>

        {/* Metric 2: Noise Floor */}
        <div className="flex-1 min-w-[130px] pt-1 sm:pt-0 sm:px-3">
          <span className="block text-[10px] text-[#84929C] uppercase tracking-wider">
            NOISE FLOOR
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-sm font-bold text-slate-400">
              {observation.noiseFloorDbm.toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-500 uppercase">dBm</span>
          </div>
        </div>

        {/* Metric 3: Bandwidth */}
        <div className="flex-1 min-w-[130px] pt-1 sm:pt-0 sm:px-3">
          <span className="block text-[10px] text-[#84929C] uppercase tracking-wider">
            BANDWIDTH
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-sm font-bold text-[#EAF4F7]">
              {observation.bandwidthMHz.toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-500 uppercase">MHz</span>
          </div>
        </div>

        {/* Metric 4: SNR */}
        <div className="flex-1 min-w-[130px] pt-1 sm:pt-0 sm:px-3">
          <span className="block text-[10px] text-[#84929C] uppercase tracking-wider">
            PEAK SNR
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-sm font-bold text-[#66E3FF]">
              +{observation.snrDb.toFixed(1)}
            </span>
            <span className="text-[10px] text-slate-500 uppercase">dB</span>
          </div>
        </div>

        {/* Metric 5: Doppler Drift Rate */}
        <div className="flex-1 min-w-[130px] pt-1 sm:pt-0 sm:px-3">
          <span className="block text-[10px] text-[#84929C] uppercase tracking-wider">
            DOPPLER DRIFT
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span
              className={`text-sm font-bold ${
                observation.driftRateHzPerSec !== 0 ? 'text-[#66E3FF]' : 'text-slate-400'
              }`}
            >
              {observation.driftRateHzPerSec > 0 ? '+' : ''}
              {observation.driftRateHzPerSec.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 uppercase">Hz/s</span>
          </div>
        </div>

        {/* Metric 6: RFI Risk */}
        <div className="flex-1 min-w-[120px] pt-1 sm:pt-0 sm:px-3 last:pr-0">
          <span className="block text-[10px] text-[#84929C] uppercase tracking-wider">
            RFI RISK
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className={`h-1.5 w-1.5 rounded-none ${
                observation.rfiRisk === 'LOW'
                  ? 'bg-emerald-400'
                  : observation.rfiRisk === 'MODERATE'
                    ? 'bg-[#FFB84D]'
                    : 'bg-[#FF5E5E]'
              }`}
            />
            <span
              className={`text-sm font-bold tracking-wider ${getRfiColor(observation.rfiRisk)}`}
            >
              {observation.rfiRisk}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
