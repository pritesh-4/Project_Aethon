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
        return 'text-[#529E72]';
      case 'MODERATE':
        return 'text-[#D4864A]';
      case 'ELEVATED':
      case 'HIGH':
        return 'text-[#C84A4A]';
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
    <div className="space-y-4 font-sans select-none">
      {/* 1. Core Anomaly Assessment & 3 Decision Metrics */}
      <div className="rounded-[2px] border border-[#262C28] bg-[#141715] p-4 sm:p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-[#262C28]">
          {/* Metric 1: How unusual it is */}
          <div className="pt-2 md:pt-0 md:px-4 first:pl-0">
            <span className="text-xs text-[#9A9C96] block">How unusual it is</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-semibold font-mono text-[#D4864A]">
                {isAnalyzed ? `${anomaly.indexPercent.toFixed(1)}%` : 'Pending'}
              </span>
              <span className="text-xs text-[#9A9C96]">anomaly score</span>
            </div>
            <p className="text-xs text-[#9A9C96] mt-1.5 leading-relaxed">
              {isAnalyzed
                ? `${anomaly.classificationLabel} · 4.8σ divergence`
                : 'Awaiting anomaly analysis'}
            </p>
          </div>

          {/* Metric 2: Persistence */}
          <div className="pt-4 md:pt-0 md:px-4">
            <span className="text-xs text-[#9A9C96] block">Persistence</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-semibold font-mono text-[#E6E4DD]">
                {isAnalyzed ? `${anomaly.persistencePercent.toFixed(1)}%` : 'Pending'}
              </span>
              <span className="text-xs text-[#9A9C96]">window active</span>
            </div>
            <p className="text-xs text-[#9A9C96] mt-1.5 leading-relaxed">
              {isAnalyzed
                ? 'Coherent continuous carrier across 300s integration'
                : 'Measured during observation window'}
            </p>
          </div>

          {/* Metric 3: Interference estimate */}
          <div className="pt-4 md:pt-0 md:px-4 last:pr-0">
            <span className="text-xs text-[#9A9C96] block">Interference estimate</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span
                className={`text-xl sm:text-2xl font-semibold font-mono ${getRfiColor(
                  observation.rfiRisk
                )}`}
              >
                {formatRisk(observation.rfiRisk)}
              </span>
              <span className="text-xs text-[#9A9C96]">RFI probability</span>
            </div>
            <p className="text-xs text-[#9A9C96] mt-1.5 leading-relaxed">
              Uncorrelated with local facility transmitters and sidelobes
            </p>
          </div>
        </div>

        {/* Observation Parameters & Diagnostics Toggle */}
        <div className="mt-5 pt-3.5 border-t border-[#262C28] flex flex-wrap items-center justify-between gap-y-2 text-xs text-[#9A9C96]">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>
              Bandwidth:{' '}
              <span className="text-[#E6E4DD] font-mono">
                {observation.bandwidthMHz.toFixed(1)} MHz
              </span>
            </span>
            <span>·</span>
            <span>
              Integration window:{' '}
              <span className="text-[#E6E4DD] font-mono">{observation.windowDuration}</span>
            </span>
          </div>

          {/* Progressive Disclosure Toggle */}
          <button
            type="button"
            aria-expanded={showDiagnostics}
            aria-controls="observatory-diagnostics-panel"
            onClick={() => setShowDiagnostics(!showDiagnostics)}
            className="inline-flex items-center gap-1.5 text-xs text-[#9A9C96] hover:text-[#D4864A] transition-colors cursor-pointer py-1 px-1.5 rounded outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A]"
          >
            {showDiagnostics ? (
              <ChevronUp className="h-3.5 w-3.5" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5" />
            )}
            <span>
              {showDiagnostics ? 'Hide pipeline diagnostics' : 'Pipeline diagnostics & telemetry'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. Secondary Diagnostics (Tucked away via Progressive Disclosure) */}
      {showDiagnostics && (
        <div
          id="observatory-diagnostics-panel"
          className="rounded-[2px] border border-[#262C28] bg-[#101311] p-4 sm:p-5 space-y-4 animate-in fade-in duration-200"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Left: 4-stage pipeline */}
            <div className="lg:col-span-6">
              <PipelineStatus status={status} />
            </div>

            {/* Right: Secondary signal parameters */}
            <div className="lg:col-span-6 space-y-2.5">
              <h4 className="text-xs font-medium text-[#E6E4DD]">Secondary telemetry</h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="p-2.5 rounded-[2px] border border-[#262C28] bg-[#141715]">
                  <span className="block text-[10px] text-[#9A9C96] font-sans">Peak power</span>
                  <span className="text-[#E6E4DD]">
                    {observation.signalPowerDbm.toFixed(1)} dBm
                  </span>
                </div>
                <div className="p-2.5 rounded-[2px] border border-[#262C28] bg-[#141715]">
                  <span className="block text-[10px] text-[#9A9C96] font-sans">Noise floor</span>
                  <span className="text-[#9A9C96]">{observation.noiseFloorDbm.toFixed(1)} dBm</span>
                </div>
                <div className="p-2.5 rounded-[2px] border border-[#262C28] bg-[#141715]">
                  <span className="block text-[10px] text-[#9A9C96] font-sans">Peak SNR</span>
                  <span className="text-[#D4864A]">+{observation.snrDb.toFixed(1)} dB</span>
                </div>
                <div className="p-2.5 rounded-[2px] border border-[#262C28] bg-[#141715]">
                  <span className="block text-[10px] text-[#9A9C96] font-sans">Source</span>
                  <span className="text-[#E6E4DD] truncate block">
                    {observation.telescope} (Simulated)
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
