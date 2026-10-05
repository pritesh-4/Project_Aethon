import type { ObservationData, ObservationStatus } from '../types.ts';
import { Zap } from 'lucide-react';

export interface AnomalyPanelProps {
  observation: ObservationData;
  status: ObservationStatus;
}

export function AnomalyPanel({ observation, status }: AnomalyPanelProps) {
  const isAnalyzed = status === 'ANOMALY_DETECTED' || status === 'CANDIDATE_READY';
  const anomaly = observation.anomaly;

  // Segmented meter renderer (12 discrete instrumentation segments)
  const renderSegmentedMeter = (
    percent: number,
    colorType: 'cyan' | 'amber' | 'emerald' | 'rose'
  ) => {
    const totalSegments = 12;
    const activeSegments = isAnalyzed ? Math.round((percent / 100) * totalSegments) : 0;

    const activeColorMap = {
      cyan: 'bg-[#66E3FF] shadow-[0_0_6px_rgba(102,227,255,0.4)]',
      amber: 'bg-[#FFB84D] shadow-[0_0_6px_rgba(255,184,77,0.4)]',
      emerald: 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.4)]',
      rose: 'bg-[#FF5E5E] shadow-[0_0_6px_rgba(255,94,94,0.4)]',
    };

    return (
      <div className="flex items-center gap-1 mt-1.5">
        {Array.from({ length: totalSegments }).map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-[1px] transition-colors duration-300 ${
              i < activeSegments ? activeColorMap[colorType] : 'bg-slate-800/80'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-4 font-mono select-none flex flex-col justify-between">
      <div>
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-[#66E3FF]" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#EAF4F7]">
              ANOMALY ANALYSIS
            </h3>
          </div>
          <span className="text-[10px] text-[#84929C] uppercase tracking-wider">
            {isAnalyzed ? 'EVALUATION COMPLETE' : 'AWAITING EVALUATION'}
          </span>
        </div>

        {/* Analytical Statement */}
        <div className="mt-3 rounded-[2px] border border-slate-800 bg-[#05070A]/70 p-2.5 text-[11px] text-[#84929C] leading-relaxed">
          {isAnalyzed ? (
            <div className="flex items-start gap-2">
              <span className="text-[#66E3FF] text-xs">◈</span>
              <span>
                AETHON isolated a candidate feature deviating from background Gaussian noise and
                known celestial baselines (reconstruction residual Δ &gt; 4.8σ).
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-slate-500">
              <span className="text-slate-600 text-xs">◈</span>
              <span>
                Run analysis to compute variational latent embedding distance, RFI probability, and
                temporal persistence.
              </span>
            </div>
          )}
        </div>

        {/* 4 Discrete Anomaly Metrics */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Anomaly Index */}
          <div className="rounded-[2px] border border-slate-800/60 bg-[#080D1A]/60 p-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] text-[#84929C] uppercase tracking-wider">
                ANOMALY INDEX
              </span>
              <span className="text-xs font-bold text-[#66E3FF]">
                {isAnalyzed ? `${anomaly.indexPercent.toFixed(1)}%` : '--- %'}
              </span>
            </div>
            {renderSegmentedMeter(anomaly.indexPercent, 'cyan')}
            <span className="block mt-1 text-[9px] text-slate-500">
              Deviance from expected Gaussian baseline
            </span>
          </div>

          {/* 2. Known Pattern Similarity */}
          <div className="rounded-[2px] border border-slate-800/60 bg-[#080D1A]/60 p-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] text-[#84929C] uppercase tracking-wider">
                KNOWN PATTERN SIMILARITY
              </span>
              <span className="text-xs font-bold text-slate-300">
                {isAnalyzed ? `${anomaly.knownPatternSimilarityPercent.toFixed(1)}%` : '--- %'}
              </span>
            </div>
            {renderSegmentedMeter(anomaly.knownPatternSimilarityPercent, 'emerald')}
            <span className="block mt-1 text-[9px] text-slate-500">
              Cross-correlation with known pulsar/FRB library
            </span>
          </div>

          {/* 3. Interference Probability */}
          <div className="rounded-[2px] border border-slate-800/60 bg-[#080D1A]/60 p-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] text-[#84929C] uppercase tracking-wider">
                INTERFERENCE PROBABILITY
              </span>
              <span
                className={`text-xs font-bold ${
                  anomaly.interferenceProbabilityPercent < 15
                    ? 'text-emerald-400'
                    : 'text-[#FFB84D]'
                }`}
              >
                {isAnalyzed ? `${anomaly.interferenceProbabilityPercent.toFixed(1)}%` : '--- %'}
              </span>
            </div>
            {renderSegmentedMeter(
              anomaly.interferenceProbabilityPercent,
              anomaly.interferenceProbabilityPercent < 15 ? 'emerald' : 'amber'
            )}
            <span className="block mt-1 text-[9px] text-slate-500">
              Satellite & terrestrial transmitter overlap score
            </span>
          </div>

          {/* 4. Persistence */}
          <div className="rounded-[2px] border border-slate-800/60 bg-[#080D1A]/60 p-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] text-[#84929C] uppercase tracking-wider">
                PERSISTENCE
              </span>
              <span className="text-xs font-bold text-emerald-400">
                {isAnalyzed ? `${anomaly.persistencePercent.toFixed(1)}%` : '--- %'}
              </span>
            </div>
            {renderSegmentedMeter(anomaly.persistencePercent, 'emerald')}
            <span className="block mt-1 text-[9px] text-slate-500">
              Coherence across multi-cadence integration
            </span>
          </div>
        </div>
      </div>

      {/* Classification Tag Footer */}
      {isAnalyzed && (
        <div className="mt-4 pt-2.5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[10px]">
          <span className="text-[#84929C] uppercase">PRELIMINARY TAXONOMY:</span>
          <span className="rounded-[1px] border border-cyan-800/70 bg-cyan-950/40 px-2 py-0.5 font-semibold text-[#66E3FF] uppercase tracking-wider">
            {anomaly.classificationLabel}
          </span>
        </div>
      )}
    </div>
  );
}
