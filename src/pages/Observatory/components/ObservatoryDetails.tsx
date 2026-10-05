import { useState } from 'react';
import type { ObservationData, ObservationStatus } from '../types.ts';
import { PipelineStatus } from './PipelineStatus.tsx';
import { ChevronDown, ChevronUp } from 'lucide-react';

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
        return 'text-[#5BD8F5]';
      case 'MODERATE':
        return 'text-[#E8AE50]';
      case 'ELEVATED':
      case 'HIGH':
        return 'text-[#D95C5C]';
    }
  };

  const formatRisk = (risk: ObservationData['rfiRisk']) => {
    switch (risk) {
      case 'LOW':
        return 'Low (4.1%)';
      case 'MODERATE':
        return 'Moderate';
      case 'ELEVATED':
        return 'Elevated';
      case 'HIGH':
        return 'High (94.2%)';
    }
  };

  return (
    <div className="space-y-4 font-sans select-none">
      {/* 1. Core Decision Metrics (3 key metrics, unboxed, generous spacing) */}
      <div className="rounded-[4px] border border-[#1C2630] bg-[#0B0F14] p-4 sm:p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-[#1C2630]">
          {/* Metric 1: Anomaly Index */}
          <div className="pt-2 sm:pt-0 sm:px-4 first:pl-0">
            <span className="block text-xs text-[#7F8B95]">Anomaly assessment</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-semibold font-mono text-[#5BD8F5]">
                {isAnalyzed ? `${anomaly.indexPercent.toFixed(1)}%` : 'Pending'}
              </span>
              <span className="text-xs text-[#7F8B95]">
                {isAnalyzed ? 'divergence index' : 'run analysis'}
              </span>
            </div>
            <p className="text-[11px] text-[#7F8B95] mt-1 leading-relaxed">
              {isAnalyzed ? anomaly.classificationLabel : 'Awaiting spectral anomaly calculation'}
            </p>
          </div>

          {/* Metric 2: Doppler Drift Rate */}
          <div className="pt-3 sm:pt-0 sm:px-4">
            <span className="block text-xs text-[#7F8B95]">Doppler drift rate</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`text-xl sm:text-2xl font-semibold font-mono ${
                  observation.driftRateHzPerSec !== 0 ? 'text-[#5BD8F5]' : 'text-[#7F8B95]'
                }`}
              >
                {observation.driftRateHzPerSec > 0 ? '+' : ''}
                {observation.driftRateHzPerSec.toFixed(2)} Hz/s
              </span>
            </div>
            <p className="text-[11px] text-[#7F8B95] mt-1 leading-relaxed">
              {observation.driftRateHzPerSec !== 0
                ? 'Rate consistent with non-local orbital frame'
                : 'Zero drift indicates probable ground transmitter'}
            </p>
          </div>

          {/* Metric 3: Interference Estimate */}
          <div className="pt-3 sm:pt-0 sm:px-4 last:pr-0">
            <span className="block text-xs text-[#7F8B95]">Interference estimate</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`text-xl sm:text-2xl font-semibold ${getRfiColor(observation.rfiRisk)}`}
              >
                {formatRisk(observation.rfiRisk)}
              </span>
            </div>
            <p className="text-[11px] text-[#7F8B95] mt-1 leading-relaxed">
              Multi-beam sidelobe correlation check
            </p>
          </div>
        </div>

        {/* Observation Note */}
        {observation.telemetryNotes && (
          <div className="mt-4 pt-3 border-t border-[#1C2630] text-xs text-[#7F8B95] leading-relaxed">
            <span className="text-[#E6EDF2] font-medium">Observation note: </span>
            {observation.telemetryNotes}
          </div>
        )}

        {/* Progressive Disclosure Toggle */}
        <div className="mt-3 pt-3 border-t border-[#1C2630]/60 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="flex items-center gap-1.5 text-xs text-[#7F8B95] hover:text-[#5BD8F5] transition-colors cursor-pointer"
          >
            {showDiagnostics ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            <span>
              {showDiagnostics
                ? 'Hide pipeline diagnostics'
                : 'View pipeline diagnostics & secondary telemetry'}
            </span>
          </button>

          <span className="text-[11px] text-[#7F8B95] font-mono">
            {observation.id} · {observation.windowDuration}
          </span>
        </div>
      </div>

      {/* 2. Collapsible Diagnostic Section (Progressive Disclosure) */}
      {showDiagnostics && (
        <div className="rounded-[4px] border border-[#1C2630] bg-[#06080B] p-4 sm:p-5 space-y-5 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: 4 Pipeline Stages */}
            <div className="lg:col-span-6">
              <PipelineStatus status={status} />
            </div>

            {/* Right: Detailed Telemetry Grid */}
            <div className="lg:col-span-6 space-y-3">
              <h4 className="text-xs font-medium text-[#E6EDF2]">Secondary telemetry</h4>
              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded border border-[#1C2630] bg-[#0B0F14]">
                  <span className="block text-[10px] text-[#7F8B95] font-sans">
                    Center frequency
                  </span>
                  <span className="text-[#5BD8F5] font-medium">
                    {observation.frequencyMHz.toFixed(2)} MHz
                  </span>
                </div>
                <div className="p-2.5 rounded border border-[#1C2630] bg-[#0B0F14]">
                  <span className="block text-[10px] text-[#7F8B95] font-sans">Bandwidth</span>
                  <span className="text-[#E6EDF2] font-medium">
                    {observation.bandwidthMHz.toFixed(1)} MHz
                  </span>
                </div>
                <div className="p-2.5 rounded border border-[#1C2630] bg-[#0B0F14]">
                  <span className="block text-[10px] text-[#7F8B95] font-sans">
                    Peak signal power
                  </span>
                  <span className="text-[#E6EDF2] font-medium">
                    {observation.signalPowerDbm.toFixed(1)} dBm
                  </span>
                </div>
                <div className="p-2.5 rounded border border-[#1C2630] bg-[#0B0F14]">
                  <span className="block text-[10px] text-[#7F8B95] font-sans">Noise floor</span>
                  <span className="text-[#7F8B95] font-medium">
                    {observation.noiseFloorDbm.toFixed(1)} dBm
                  </span>
                </div>
                <div className="p-2.5 rounded border border-[#1C2630] bg-[#0B0F14]">
                  <span className="block text-[10px] text-[#7F8B95] font-sans">Peak SNR</span>
                  <span className="text-[#5BD8F5] font-medium">
                    +{observation.snrDb.toFixed(1)} dB
                  </span>
                </div>
                <div className="p-2.5 rounded border border-[#1C2630] bg-[#0B0F14]">
                  <span className="block text-[10px] text-[#7F8B95] font-sans">Persistence</span>
                  <span className="text-[#E6EDF2] font-medium">
                    {observation.anomaly.persistencePercent.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
