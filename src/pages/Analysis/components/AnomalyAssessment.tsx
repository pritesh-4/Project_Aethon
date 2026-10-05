import type { SignalAnalysisRecord } from '../types.ts';
import { Zap } from 'lucide-react';

export interface AnomalyAssessmentProps {
  record: SignalAnalysisRecord;
}

export function AnomalyAssessment({ record }: AnomalyAssessmentProps) {
  const isHigh = record.priority === 'HIGH';
  const segmentsCount = 24;
  const activeCount = Math.round(record.anomalyIndex * segmentsCount);

  return (
    <div className="rounded border border-[#1C2630] bg-[#0B0F14] p-4 select-none">
      <div className="flex items-center justify-between border-b border-[#1C2630] pb-2 mb-3">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-[#5BD8F5]" />
          <h4 className="text-xs font-semibold text-[#E6EDF2]">Anomaly assessment</h4>
        </div>
      </div>

      {/* Main Analytical Score Meter */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-[#7F8B95]">Anomaly index</span>
          <span
            className={`text-lg font-semibold font-mono ${
              isHigh ? 'text-[#E8AE50]' : 'text-[#5BD8F5]'
            }`}
          >
            {record.anomalyIndex.toFixed(3)}
          </span>
        </div>

        {/* 24-Segment Analytical Scale */}
        <div className="flex items-center gap-0.5">
          {Array.from({ length: segmentsCount }).map((_, i) => {
            const isActive = i < activeCount;
            let barColor = 'bg-[#1C2630]';
            if (isActive) {
              if (i >= 18) {
                barColor = 'bg-[#E8AE50]';
              } else if (i >= 12) {
                barColor = 'bg-[#5BD8F5]';
              } else {
                barColor = 'bg-[#7F8B95]';
              }
            }

            return (
              <div
                key={i}
                className={`h-2 flex-1 rounded-sm transition-colors duration-200 ${barColor}`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[10px] text-[#7F8B95] pt-0.5">
          <span>0.000 (Baseline)</span>
          <span>Threshold 0.700</span>
          <span className="text-[#E8AE50]">1.000 (High deviance)</span>
        </div>
      </div>

      {/* 4 Telemetry Metrics */}
      <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
        <div className="rounded border border-[#1C2630] bg-[#10161D] p-2">
          <span className="block text-[11px] text-[#7F8B95]">Known pattern similarity</span>
          <span className="text-xs font-semibold font-mono text-[#E6EDF2]">
            {(record.knownPatternSimilarity * 100).toFixed(1)}%
          </span>
        </div>

        <div className="rounded border border-[#1C2630] bg-[#10161D] p-2">
          <span className="block text-[11px] text-[#7F8B95]">Interference estimate</span>
          <span className="text-xs font-semibold font-mono text-[#5BD8F5]">
            {(record.interferenceProbability * 100).toFixed(1)}%
          </span>
        </div>

        <div className="rounded border border-[#1C2630] bg-[#10161D] p-2">
          <span className="block text-[11px] text-[#7F8B95]">Signal persistence</span>
          <span className="text-xs font-semibold font-mono text-[#5BD8F5]">
            {(record.persistence * 100).toFixed(1)}%
          </span>
        </div>

        <div className="rounded border border-[#1C2630] bg-[#10161D] p-2">
          <span className="block text-[11px] text-[#7F8B95]">Priority</span>
          <span className="text-xs font-semibold font-mono text-[#E8AE50]">
            {record.priority.toLowerCase()}
          </span>
        </div>
      </div>

      {/* Analytical Statement */}
      <div className="mt-3 rounded border border-[#1C2630] bg-[#06080B] p-2.5 text-xs text-[#7F8B95] leading-relaxed">
        The candidate exhibits substantial deviation from the learned signal distribution while
        maintaining temporal coherence across consecutive observational pointings.
      </div>
    </div>
  );
}
