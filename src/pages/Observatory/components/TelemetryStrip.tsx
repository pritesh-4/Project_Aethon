import type { ObservationData } from '../types.ts';

export interface TelemetryStripProps {
  observation: ObservationData;
}

export function TelemetryStrip({ observation }: TelemetryStripProps) {
  const getRfiColor = (risk: ObservationData['rfiRisk']) => {
    switch (risk) {
      case 'LOW':
        return 'text-[#5BD8F5]';
      case 'MODERATE':
        return 'text-[#E8AE50]';
      case 'ELEVATED':
      case 'HIGH':
        return 'text-[#D95C5C]';
    }
  };

  const getRfiBg = (risk: ObservationData['rfiRisk']) => {
    switch (risk) {
      case 'LOW':
        return 'bg-[#5BD8F5]';
      case 'MODERATE':
        return 'bg-[#E8AE50]';
      case 'ELEVATED':
      case 'HIGH':
        return 'bg-[#D95C5C]';
    }
  };

  const formatRisk = (risk: ObservationData['rfiRisk']) => {
    switch (risk) {
      case 'LOW':
        return 'Low';
      case 'MODERATE':
        return 'Moderate';
      case 'ELEVATED':
        return 'Elevated';
      case 'HIGH':
        return 'High';
    }
  };

  return (
    <div className="rounded border border-[#1C2630] bg-[#0B0F14] px-4 py-2.5 font-mono text-xs select-none">
      <div className="flex flex-wrap items-center justify-between gap-y-3 gap-x-4 divide-y sm:divide-y-0 sm:divide-x divide-[#1C2630]">
        {/* Metric 1: Signal Power */}
        <div className="flex-1 min-w-[130px] pt-1 sm:pt-0 sm:px-3 first:pl-0">
          <span className="block text-[11px] text-[#7F8B95] font-sans">Signal power</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-sm font-semibold text-[#E6EDF2]">
              {observation.signalPowerDbm.toFixed(1)}
            </span>
            <span className="text-[10px] text-[#7F8B95]">dBm</span>
          </div>
        </div>

        {/* Metric 2: Noise Floor */}
        <div className="flex-1 min-w-[130px] pt-1 sm:pt-0 sm:px-3">
          <span className="block text-[11px] text-[#7F8B95] font-sans">Noise floor</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-sm font-semibold text-[#7F8B95]">
              {observation.noiseFloorDbm.toFixed(1)}
            </span>
            <span className="text-[10px] text-[#7F8B95]">dBm</span>
          </div>
        </div>

        {/* Metric 3: Bandwidth */}
        <div className="flex-1 min-w-[130px] pt-1 sm:pt-0 sm:px-3">
          <span className="block text-[11px] text-[#7F8B95] font-sans">Bandwidth</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-sm font-semibold text-[#E6EDF2]">
              {observation.bandwidthMHz.toFixed(1)}
            </span>
            <span className="text-[10px] text-[#7F8B95]">MHz</span>
          </div>
        </div>

        {/* Metric 4: SNR */}
        <div className="flex-1 min-w-[130px] pt-1 sm:pt-0 sm:px-3">
          <span className="block text-[11px] text-[#7F8B95] font-sans">Peak SNR</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-sm font-semibold text-[#5BD8F5]">
              +{observation.snrDb.toFixed(1)}
            </span>
            <span className="text-[10px] text-[#7F8B95]">dB</span>
          </div>
        </div>

        {/* Metric 5: Doppler Drift Rate */}
        <div className="flex-1 min-w-[130px] pt-1 sm:pt-0 sm:px-3">
          <span className="block text-[11px] text-[#7F8B95] font-sans">Drift rate</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span
              className={`text-sm font-semibold ${
                observation.driftRateHzPerSec !== 0 ? 'text-[#5BD8F5]' : 'text-[#7F8B95]'
              }`}
            >
              {observation.driftRateHzPerSec > 0 ? '+' : ''}
              {observation.driftRateHzPerSec.toFixed(2)}
            </span>
            <span className="text-[10px] text-[#7F8B95]">Hz/s</span>
          </div>
        </div>

        {/* Metric 6: RFI Risk */}
        <div className="flex-1 min-w-[120px] pt-1 sm:pt-0 sm:px-3 last:pr-0">
          <span className="block text-[11px] text-[#7F8B95] font-sans">Interference estimate</span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`h-1.5 w-1.5 rounded-full ${getRfiBg(observation.rfiRisk)}`} />
            <span className={`text-sm font-semibold ${getRfiColor(observation.rfiRisk)}`}>
              {formatRisk(observation.rfiRisk)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
