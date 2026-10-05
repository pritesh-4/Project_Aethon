import { Link } from 'react-router';
import type { DiscoveredCandidate } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import { ShieldCheck, HelpCircle } from 'lucide-react';

export interface CandidatePreviewProps {
  candidate: DiscoveredCandidate;
}

export function CandidatePreview({ candidate }: CandidatePreviewProps) {
  return (
    <div className="rounded-[2px] border border-cyan-800/80 bg-gradient-to-b from-[#0A1220] to-[#0A0E13] p-4 font-mono select-none flex flex-col justify-between shadow-[0_4px_20px_rgba(6,182,212,0.1)]">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-none bg-[#66E3FF]" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#EAF4F7]">
              TOP CANDIDATE EVENT PREVIEW
            </h4>
          </div>

          <span className="rounded-[1px] border border-cyan-800 bg-cyan-950/70 px-1.5 py-0.2 text-[10px] font-bold text-[#66E3FF] uppercase tracking-wider">
            PRIORITY // {candidate.priority}
          </span>
        </div>

        {/* Candidate Identifier & Target */}
        <div className="flex items-baseline justify-between">
          <span className="text-base font-bold text-[#66E3FF] tracking-wider">{candidate.id}</span>
          <span className="text-xs text-slate-300 font-sans">{candidate.targetName}</span>
        </div>

        {/* 4 Metric Instrumentation Readouts */}
        <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-[2px] border border-slate-800 bg-[#05070A]/80 p-2">
            <span className="block text-[9px] uppercase tracking-wider text-[#84929C]">
              ANOMALY INDEX
            </span>
            <span className="text-xs font-bold text-[#66E3FF]">
              {candidate.anomalyIndex.toFixed(3)}
            </span>
          </div>

          <div className="rounded-[2px] border border-slate-800 bg-[#05070A]/80 p-2">
            <span className="block text-[9px] uppercase tracking-wider text-[#84929C]">
              PERSISTENCE
            </span>
            <span className="text-xs font-bold text-emerald-400">
              {(candidate.persistence * 100).toFixed(1)}%
            </span>
          </div>

          <div className="rounded-[2px] border border-slate-800 bg-[#05070A]/80 p-2">
            <span className="block text-[9px] uppercase tracking-wider text-[#84929C]">
              KNOWN SIMILARITY
            </span>
            <span className="text-xs font-bold text-slate-300">
              {(candidate.knownSimilarity * 100).toFixed(1)}%
            </span>
          </div>

          <div className="rounded-[2px] border border-slate-800 bg-[#05070A]/80 p-2">
            <span className="block text-[9px] uppercase tracking-wider text-[#84929C]">
              RFI RISK
            </span>
            <span className="text-xs font-bold text-emerald-400">
              {(candidate.rfiRisk * 100).toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Explanatory Interpretability Section: Factors Contributing to Prioritization */}
        <div className="mt-4 rounded-[2px] border border-slate-800/80 bg-[#05070A]/90 p-3 text-[11px] space-y-2">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold text-[10px] uppercase tracking-wider">
            <HelpCircle className="h-3 w-3 text-cyan-400" />
            <span>FACTORS CONTRIBUTING TO PRIORITIZATION</span>
          </div>

          <ul className="space-y-1.5 text-[#84929C] text-[10px] leading-relaxed">
            <li className="flex items-start gap-1.5">
              <span className="text-cyan-400 text-xs">◈</span>
              <span>
                <strong>Latent Reconstruction Residual:</strong> Δ = +
                {candidate.explanation.latentResidualSigma}σ divergence from background Gaussian
                distribution.
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-emerald-400 text-xs">◈</span>
              <span>
                <strong>Temporal Persistence:</strong> {candidate.explanation.persistenceReason}
              </span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-cyan-400 text-xs">◈</span>
              <span>
                <strong>Spatial Rejection:</strong> Score{' '}
                {(candidate.explanation.spatialRejectionScore * 100).toFixed(0)}% confirms signal is
                absent in off-pointing reference beam.
              </span>
            </li>
          </ul>
        </div>
      </div>

      {/* CTA Button */}
      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <span>TOPOCENTRIC VERIFIED</span>
        </div>

        <Link to={`/analysis/${candidate.id}`}>
          <Button variant="primary" size="sm" withArrow cornerAccents>
            INVESTIGATE
          </Button>
        </Link>
      </div>
    </div>
  );
}
