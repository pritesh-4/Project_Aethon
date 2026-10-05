import type { CandidateSignalData } from '../types.ts';
import { HelpCircle } from 'lucide-react';

export interface CandidateEvidenceProps {
  candidate: CandidateSignalData;
}

export function CandidateEvidence({ candidate }: CandidateEvidenceProps) {
  const factors = [
    {
      title: 'ANOMALOUS STRUCTURE',
      state: candidate.evidenceFactors.anomalousStructure.state,
      metric: `Δ = +${candidate.evidenceFactors.anomalousStructure.sigma.toFixed(1)}σ`,
      subtext: 'Reconstruction residual from Gaussian baseline',
      color: 'amber',
      fillPercent: Math.min(100, (candidate.evidenceFactors.anomalousStructure.sigma / 5) * 100),
    },
    {
      title: 'TEMPORAL PERSISTENCE',
      state: candidate.evidenceFactors.temporalPersistence.state,
      metric: `${(candidate.persistence * 100).toFixed(1)}%`,
      subtext: candidate.evidenceFactors.temporalPersistence.cycles,
      color: 'emerald',
      fillPercent: candidate.persistence * 100,
    },
    {
      title: 'KNOWN-PATTERN SIMILARITY',
      state: candidate.evidenceFactors.knownSimilarity.state,
      metric: `${(candidate.knownPatternSimilarity * 100).toFixed(1)}%`,
      subtext: candidate.evidenceFactors.knownSimilarity.catalogRef,
      color: 'slate',
      fillPercent: candidate.knownPatternSimilarity * 100,
    },
    {
      title: 'RFI ESTIMATE',
      state: candidate.evidenceFactors.rfiEstimate.state,
      metric: `${(candidate.interferenceProbability * 100).toFixed(1)}%`,
      subtext: 'Terrestrial & satellite beacon cross-match',
      color: candidate.interferenceProbability < 0.1 ? 'emerald' : 'amber',
      fillPercent: candidate.interferenceProbability * 100,
    },
    {
      title: 'FREQUENCY COHERENCE',
      state: candidate.evidenceFactors.frequencyCoherence.state,
      metric: `${candidate.bandwidthKHz} kHz`,
      subtext: candidate.evidenceFactors.frequencyCoherence.bandwidthStr,
      color: 'cyan',
      fillPercent: Math.min(100, (50 / candidate.bandwidthKHz) * 20),
    },
  ];

  return (
    <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-3.5 font-mono select-none">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
        <div className="flex items-center gap-1.5">
          <HelpCircle className="h-3.5 w-3.5 text-[#66E3FF]" />
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#EAF4F7]">
            WHY WAS THIS CANDIDATE PRIORITIZED?
          </h4>
        </div>
        <span className="text-[9px] text-[#84929C] uppercase">EVIDENCE FACTORS</span>
      </div>

      <div className="space-y-3">
        {factors.map((f) => (
          <div key={f.title} className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-semibold">{f.title}</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono text-[10px]">{f.metric}</span>
                <span
                  className={`rounded-[1px] px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider ${
                    f.state === 'HIGH' || f.state === 'ELEVATED'
                      ? 'border border-amber-600/70 bg-amber-950/40 text-[#FFB84D]'
                      : f.state === 'LOW'
                        ? 'border border-cyan-800/70 bg-cyan-950/40 text-[#66E3FF]'
                        : f.state === 'STABLE'
                          ? 'border border-emerald-600/70 bg-emerald-950/40 text-emerald-400'
                          : 'border border-slate-700 bg-slate-900 text-slate-400'
                  }`}
                >
                  {f.state}
                </span>
              </div>
            </div>

            {/* Micro Segmented Scale */}
            <div className="h-1 w-full bg-slate-900 overflow-hidden rounded-none border border-slate-800/80">
              <div
                className={`h-full ${
                  f.color === 'amber'
                    ? 'bg-[#FFB84D]'
                    : f.color === 'emerald'
                      ? 'bg-emerald-400'
                      : f.color === 'cyan'
                        ? 'bg-[#66E3FF]'
                        : 'bg-slate-600'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, f.fillPercent))}%` }}
              />
            </div>

            <div className="text-[9px] text-[#84929C] truncate">{f.subtext}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
