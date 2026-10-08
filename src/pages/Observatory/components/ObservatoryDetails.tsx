import { useState } from 'react';
import type { ObservationData, ObservationStatus } from '../types.ts';
import { PipelineStatus } from './PipelineStatus.tsx';
import { ChevronDown } from 'lucide-react';

export interface ObservatoryDetailsProps {
  observation: ObservationData;
  status: ObservationStatus;
}

export function ObservatoryDetails({ observation, status }: ObservatoryDetailsProps) {
  const [showDiagnostics, setShowDiagnostics] = useState(false);
  const isAnalyzed = status === 'ANOMALY_DETECTED' || status === 'CANDIDATE_READY';
  const anomaly = observation.anomaly;

  const getRfiColor = (risk: ObservationData['rfiRisk']) => {
    switch (risk) {
      case 'LOW':
        return 'text-[#3D7D54]';
      case 'MODERATE':
        return 'text-[#C19348]';
      case 'ELEVATED':
      case 'HIGH':
        return 'text-[#B64B4B]';
    }
  };

  const formatRisk = (risk: ObservationData['rfiRisk']) => {
    switch (risk) {
      case 'LOW':
        return 'Low (<5%)';
      case 'MODERATE':
        return 'Moderate (~40%)';
      case 'ELEVATED':
        return 'Elevated (~70%)';
      case 'HIGH':
        return 'High (>90%)';
    }
  };

  return (
    <div className="select-none font-sans space-y-0">
      {/* Core Anomaly Assessment — 3 metrics in ruled columns, not bordered cards */}
      <div className="border-t border-[#D6D2C9] bg-[#FAF8F5] px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0">
          {/* Metric 1: How unusual it is */}
          <div className="md:pr-6 md:border-r md:border-[#D6D2C9]">
            <span className="text-[11px] uppercase tracking-wider text-[#7E8B96] font-medium block">
              How unusual
            </span>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-xl font-semibold font-mono text-[#C19348]">
                {isAnalyzed ? `${anomaly.indexPercent.toFixed(1)}%` : '—'}
              </span>
              <span className="text-xs text-[#56616A]">anomaly score</span>
            </div>
            <p className="text-xs text-[#56616A] mt-1 leading-relaxed">
              {isAnalyzed
                ? `${anomaly.classificationLabel} · 4.8σ divergence`
                : 'Awaiting anomaly analysis'}
            </p>
          </div>

          {/* Metric 2: Persistence */}
          <div className="md:px-6 md:border-r md:border-[#D6D2C9]">
            <span className="text-[11px] uppercase tracking-wider text-[#7E8B96] font-medium block">
              Persistence
            </span>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span className="text-xl font-semibold font-mono text-[#17202A]">
                {isAnalyzed ? `${anomaly.persistencePercent.toFixed(1)}%` : '—'}
              </span>
              <span className="text-xs text-[#56616A]">window active</span>
            </div>
            <p className="text-xs text-[#56616A] mt-1 leading-relaxed">
              {isAnalyzed
                ? 'Coherent continuous carrier across 300s integration'
                : 'Measured during observation window'}
            </p>
          </div>

          {/* Metric 3: Interference estimate */}
          <div className="md:pl-6">
            <span className="text-[11px] uppercase tracking-wider text-[#7E8B96] font-medium block">
              Interference
            </span>
            <div className="flex items-baseline gap-2 mt-1.5">
              <span
                className={`text-xl font-semibold font-mono ${getRfiColor(observation.rfiRisk)}`}
              >
                {formatRisk(observation.rfiRisk)}
              </span>
            </div>
            <p className="text-xs text-[#56616A] mt-1 leading-relaxed">
              Uncorrelated with local facility transmitters and sidelobes
            </p>
          </div>
        </div>

        {/* Observation parameters — inline key-value pairs */}
        <div className="mt-5 pt-3.5 border-t border-[#D6D2C9] flex flex-wrap items-center justify-between gap-y-2 text-xs text-[#56616A]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              Bandwidth:{' '}
              <span className="text-[#17202A] font-mono font-medium">
                {observation.bandwidthMHz.toFixed(1)} MHz
              </span>
            </span>
            <span>·</span>
            <span>
              Integration:{' '}
              <span className="text-[#17202A] font-mono font-medium">
                {observation.windowDuration}
              </span>
            </span>
          </div>

          {/* Progressive Disclosure Toggle */}
          <button
            type="button"
            aria-expanded={showDiagnostics}
            aria-controls="observatory-diagnostics-panel"
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="inline-flex items-center gap-1.5 text-xs text-[#56616A] hover:text-[#17202A] transition-colors cursor-pointer py-1 px-1.5 rounded outline-none focus-visible:ring-1 focus-visible:ring-[#376A9B]"
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${
                showDiagnostics ? 'rotate-180' : ''
              }`}
            />
            <span>
              {showDiagnostics ? 'Hide pipeline diagnostics' : 'Pipeline diagnostics & telemetry'}
            </span>
          </button>
        </div>
      </div>

      {/* Secondary Diagnostics (Progressive Disclosure) */}
      {showDiagnostics && (
        <div
          id="observatory-diagnostics-panel"
          className="border-t border-[#D6D2C9] bg-[#F4F1EA] px-4 sm:px-6 py-5 animate-in fade-in duration-200"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: 4-stage pipeline */}
            <PipelineStatus status={status} />

            {/* Right: Secondary telemetry — key-value list, not cards */}
            <div>
              <span className="text-[11px] uppercase tracking-wider text-[#7E8B96] font-medium block mb-3">
                Secondary telemetry
              </span>
              <div className="space-y-2.5">
                {[
                  {
                    label: 'Peak power',
                    value: `${observation.signalPowerDbm.toFixed(1)} dBm`,
                    color: 'text-[#17202A]',
                  },
                  {
                    label: 'Noise floor',
                    value: `${observation.noiseFloorDbm.toFixed(1)} dBm`,
                    color: 'text-[#56616A]',
                  },
                  {
                    label: 'Peak SNR',
                    value: `+${observation.snrDb.toFixed(1)} dB`,
                    color: 'text-[#376A9B]',
                  },
                  {
                    label: 'Source',
                    value: `${observation.telescope} (Simulated)`,
                    color: 'text-[#17202A]',
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-baseline justify-between gap-3 text-xs"
                  >
                    <span className="text-[#56616A]">{item.label}</span>
                    <span className={`font-mono font-medium ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
