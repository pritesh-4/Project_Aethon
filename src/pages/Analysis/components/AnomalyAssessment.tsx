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
    <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-4 font-mono select-none">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
        <div className="flex items-center gap-1.5">
          <Zap className="h-3.5 w-3.5 text-[#66E3FF]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#EAF4F7]">
            ANOMALY ASSESSMENT
          </h4>
        </div>
        <span className="text-[10px] text-[#84929C] uppercase">RECONSTRUCTION RESIDUAL</span>
      </div>

      {/* Main Analytical Score Meter */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">
            ANOMALY INDEX SCORE
          </span>
          <span
            className={`text-xl font-bold tracking-wider ${
              isHigh ? 'text-[#FFB84D]' : 'text-[#66E3FF]'
            }`}
          >
            {record.anomalyIndex.toFixed(3)}
          </span>
        </div>

        {/* 24-Segment Analytical Scale */}
        <div className="flex items-center gap-0.5">
          {Array.from({ length: segmentsCount }).map((_, i) => {
            const isActive = i < activeCount;
            let barColor = 'bg-slate-800/80';
            if (isActive) {
              if (i >= 18) {
                barColor = 'bg-[#FFB84D] shadow-[0_0_4px_rgba(255,184,77,0.5)]';
              } else if (i >= 12) {
                barColor = 'bg-[#66E3FF] shadow-[0_0_4px_rgba(102,227,255,0.4)]';
              } else {
                barColor = 'bg-slate-400';
              }
            }

            return (
              <div
                key={i}
                className={`h-3 flex-1 rounded-[1px] transition-colors duration-200 ${barColor}`}
              />
            );
          })}
        </div>

        <div className="flex items-center justify-between text-[9px] text-[#84929C] pt-0.5">
          <span>0.000 [EXPECTED BASELINE]</span>
          <span className="text-slate-600">THRESHOLD 0.700</span>
          <span className="text-amber-400 font-semibold">1.000 [EXTREME DEVIANCE]</span>
        </div>
      </div>

      {/* 4 Telemetry Metrics */}
      <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
        <div className="rounded-[2px] border border-slate-800 bg-[#05070A]/80 p-2">
          <span className="block text-[9px] uppercase tracking-wider text-[#84929C]">
            KNOWN PATTERN SIMILARITY
          </span>
          <span className="text-xs font-bold text-slate-300">
            {(record.knownPatternSimilarity * 100).toFixed(1)}%
          </span>
        </div>

        <div className="rounded-[2px] border border-slate-800 bg-[#05070A]/80 p-2">
          <span className="block text-[9px] uppercase tracking-wider text-[#84929C]">
            INTERFERENCE PROBABILITY
          </span>
          <span className="text-xs font-bold text-emerald-400">
            {(record.interferenceProbability * 100).toFixed(1)}%
          </span>
        </div>

        <div className="rounded-[2px] border border-slate-800 bg-[#05070A]/80 p-2">
          <span className="block text-[9px] uppercase tracking-wider text-[#84929C]">
            PERSISTENCE
          </span>
          <span className="text-xs font-bold text-emerald-400">
            {(record.persistence * 100).toFixed(1)}%
          </span>
        </div>

        <div className="rounded-[2px] border border-slate-800 bg-[#05070A]/80 p-2">
          <span className="block text-[9px] uppercase tracking-wider text-[#84929C]">
            INVESTIGATION PRIORITY
          </span>
          <span className="text-xs font-bold text-[#FFB84D]">{record.priority}</span>
        </div>
      </div>

      {/* Analytical Statement */}
      <div className="mt-3 rounded-[2px] border border-slate-800/80 bg-[#05070A] p-2.5 text-[11px] text-[#84929C] leading-relaxed">
        The candidate exhibits substantial deviation from the learned signal distribution while
        maintaining measurable temporal coherence across consecutive observational pointings.
      </div>
    </div>
  );
}
