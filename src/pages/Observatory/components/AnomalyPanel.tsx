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
  const renderSegmentedMeter = (percent: number, colorType: 'cyan' | 'amber' | 'neutral') => {
    const totalSegments = 12;
    const activeSegments = isAnalyzed ? Math.round((percent / 100) * totalSegments) : 0;

    const activeColorMap = {
      cyan: 'bg-[#5BD8F5]',
      amber: 'bg-[#E8AE50]',
      neutral: 'bg-[#7F8B95]',
    };

    return (
      <div className="flex items-center gap-1 mt-1.5">
        {Array.from({ length: totalSegments }).map((_, i) => (
          <div
            key={i}
            className={`h-1.5 flex-1 rounded-sm transition-colors duration-300 ${
              i < activeSegments ? activeColorMap[colorType] : 'bg-[#1C2630]'
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="rounded border border-[#1C2630] bg-[#0B0F14] p-4 select-none flex flex-col justify-between">
      <div>
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-[#1C2630] pb-2.5">
          <div className="flex items-center gap-2">
            <Zap className="h-3.5 w-3.5 text-[#5BD8F5]" />
            <h3 className="text-xs font-semibold text-[#E6EDF2]">Anomaly assessment</h3>
          </div>
          <span className="text-[11px] text-[#7F8B95]">
            {isAnalyzed ? 'Evaluated' : 'Awaiting evaluation'}
          </span>
        </div>

        {/* Analytical Statement */}
        <div className="mt-3 rounded border border-[#1C2630] bg-[#06080B] p-2.5 text-[11px] text-[#7F8B95] leading-relaxed">
          {isAnalyzed ? (
            <div className="flex items-start gap-2">
              <span className="text-[#5BD8F5] text-xs">◈</span>
              <span>
                Isolated candidate feature deviating from background Gaussian noise and known
                celestial baselines (reconstruction residual Δ &gt; 4.8σ).
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-[#7F8B95]">
              <span className="text-[#7F8B95] text-xs">◈</span>
              <span>
                Run analysis to compute latent embedding distance, interference probability, and
                persistence.
              </span>
            </div>
          )}
        </div>

        {/* 4 Discrete Anomaly Metrics */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1. Anomaly Index */}
          <div className="rounded border border-[#1C2630] bg-[#10161D] p-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-[#7F8B95]">Anomaly index</span>
              <span className="text-xs font-semibold font-mono text-[#5BD8F5]">
                {isAnalyzed ? `${anomaly.indexPercent.toFixed(1)}%` : '—'}
              </span>
            </div>
            {renderSegmentedMeter(anomaly.indexPercent, 'cyan')}
            <span className="block mt-1 text-[10px] text-[#7F8B95]">
              Deviance from expected baseline
            </span>
          </div>

          {/* 2. Known Pattern Similarity */}
          <div className="rounded border border-[#1C2630] bg-[#10161D] p-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-[#7F8B95]">Known pattern similarity</span>
              <span className="text-xs font-semibold font-mono text-[#E6EDF2]">
                {isAnalyzed ? `${anomaly.knownPatternSimilarityPercent.toFixed(1)}%` : '—'}
              </span>
            </div>
            {renderSegmentedMeter(anomaly.knownPatternSimilarityPercent, 'neutral')}
            <span className="block mt-1 text-[10px] text-[#7F8B95]">
              Cross-correlation with pulsar library
            </span>
          </div>

          {/* 3. Interference Probability */}
          <div className="rounded border border-[#1C2630] bg-[#10161D] p-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-[#7F8B95]">Interference estimate</span>
              <span
                className={`text-xs font-semibold font-mono ${
                  anomaly.interferenceProbabilityPercent < 15 ? 'text-[#5BD8F5]' : 'text-[#E8AE50]'
                }`}
              >
                {isAnalyzed ? `${anomaly.interferenceProbabilityPercent.toFixed(1)}%` : '—'}
              </span>
            </div>
            {renderSegmentedMeter(
              anomaly.interferenceProbabilityPercent,
              anomaly.interferenceProbabilityPercent < 15 ? 'cyan' : 'amber'
            )}
            <span className="block mt-1 text-[10px] text-[#7F8B95]">
              Satellite and terrestrial overlap score
            </span>
          </div>

          {/* 4. Persistence */}
          <div className="rounded border border-[#1C2630] bg-[#10161D] p-2.5">
            <div className="flex items-baseline justify-between">
              <span className="text-[11px] text-[#7F8B95]">Signal persistence</span>
              <span className="text-xs font-semibold font-mono text-[#5BD8F5]">
                {isAnalyzed ? `${anomaly.persistencePercent.toFixed(1)}%` : '—'}
              </span>
            </div>
            {renderSegmentedMeter(anomaly.persistencePercent, 'cyan')}
            <span className="block mt-1 text-[10px] text-[#7F8B95]">
              Coherence across observation window
            </span>
          </div>
        </div>
      </div>

      {/* Classification Tag Footer */}
      {isAnalyzed && (
        <div className="mt-4 pt-2.5 border-t border-[#1C2630] flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="text-[#7F8B95]">Preliminary classification:</span>
          <span className="rounded border border-[#5BD8F5]/30 bg-[#5BD8F5]/10 px-2 py-0.5 text-xs font-medium text-[#5BD8F5]">
            {anomaly.classificationLabel}
          </span>
        </div>
      )}
    </div>
  );
}
