import { Link } from 'react-router';
import type { DiscoveredCandidate } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import { HelpCircle } from 'lucide-react';

export interface CandidatePreviewProps {
  candidate: DiscoveredCandidate;
}

export function CandidatePreview({ candidate }: CandidatePreviewProps) {
  return (
    <div className="rounded border border-[#1C2630] bg-[#0B0F14] p-4 select-none flex flex-col justify-between shadow-sm">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1C2630] pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5BD8F5]" />
            <h4 className="text-xs font-semibold text-[#E6EDF2]">Candidate preview</h4>
          </div>

          <span className="rounded border border-[#E8AE50]/40 bg-[#E8AE50]/10 px-2 py-0.5 text-[10px] font-medium text-[#E8AE50]">
            Priority: {candidate.priority.toLowerCase()}
          </span>
        </div>

        {/* Candidate Identifier & Target */}
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-[#5BD8F5] font-mono">{candidate.id}</span>
          <span className="text-xs text-[#7F8B95]">{candidate.targetName}</span>
        </div>

        {/* 4 Metric Instrumentation Readouts */}
        <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded border border-[#1C2630] bg-[#10161D] p-2">
            <span className="block text-[11px] text-[#7F8B95]">Anomaly index</span>
            <span className="text-xs font-semibold text-[#5BD8F5] font-mono">
              {candidate.anomalyIndex.toFixed(3)}
            </span>
          </div>

          <div className="rounded border border-[#1C2630] bg-[#10161D] p-2">
            <span className="block text-[11px] text-[#7F8B95]">Persistence</span>
            <span className="text-xs font-semibold text-[#E6EDF2] font-mono">
              {(candidate.persistence * 100).toFixed(1)}%
            </span>
          </div>

          <div className="rounded border border-[#1C2630] bg-[#10161D] p-2">
            <span className="block text-[11px] text-[#7F8B95]">Known similarity</span>
            <span className="text-xs font-semibold text-[#7F8B95] font-mono">
              {(candidate.knownSimilarity * 100).toFixed(1)}%
            </span>
          </div>

          <div className="rounded border border-[#1C2630] bg-[#10161D] p-2">
            <span className="block text-[11px] text-[#7F8B95]">Interference estimate</span>
            <span className="text-xs font-semibold text-[#5BD8F5] font-mono">
              {(candidate.rfiRisk * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Explanatory Interpretability Section */}
        <div className="mt-4 rounded border border-[#1C2630] bg-[#06080B] p-3 text-xs space-y-2">
          <div className="flex items-center gap-1.5 text-[#E6EDF2] font-medium text-[11px]">
            <HelpCircle className="h-3 w-3 text-[#5BD8F5]" />
            <span>Prioritization factors</span>
          </div>

          <ul className="space-y-1.5 text-[#7F8B95] text-[11px] leading-relaxed">
            <li className="flex items-start gap-1.5">
              <span className="text-[#5BD8F5] text-xs">◈</span>
              <span>
                <strong className="text-[#E6EDF2]">Latent reconstruction residual:</strong> Δ = +
                {candidate.explanation.latentResidualSigma}σ divergence from background
                distribution.
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-[#5BD8F5] text-xs">◈</span>
              <span>
                <strong className="text-[#E6EDF2]">Temporal persistence:</strong>{' '}
                {candidate.explanation.persistenceReason}
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-[#5BD8F5] text-xs">◈</span>
              <span>
                <strong className="text-[#E6EDF2]">Spatial rejection:</strong> Score{' '}
                {(candidate.explanation.spatialRejectionScore * 100).toFixed(0)}% confirms signal is
                absent in off-pointing beam.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* CTA Button */}
      <div className="mt-4 pt-3 border-t border-[#1C2630] flex items-center justify-end">
        <Link to={`/analysis/${candidate.id}`}>
          <Button variant="primary" size="sm" withArrow>
            Inspect candidate
          </Button>
        </Link>
      </div>
    </div>
  );
}
