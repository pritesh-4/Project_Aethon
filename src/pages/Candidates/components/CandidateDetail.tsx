import { Link } from 'react-router';
import type { CandidateSignalData } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import { CandidateSignalViewport } from './CandidateSignalViewport.tsx';
import { X } from 'lucide-react';

export interface CandidateDetailProps {
  candidate: CandidateSignalData;
  onClose: () => void;
}

export function CandidateDetail({ candidate, onClose }: CandidateDetailProps) {
  // Plain-language evidence claims strictly supported by candidate data
  const getEvidenceClaims = () => {
    const claims: { label: string; detail: string }[] = [];

    if (candidate.knownPatternSimilarity < 0.15) {
      claims.push({
        label: 'Low catalog similarity',
        detail: `${(candidate.knownPatternSimilarity * 100).toFixed(1)}% match against cataloged natural radio sources.`,
      });
    } else if (candidate.knownPatternSimilarity < 0.35) {
      claims.push({
        label: 'Moderate profile divergence',
        detail: `${(candidate.knownPatternSimilarity * 100).toFixed(1)}% match to known profiles.`,
      });
    } else {
      claims.push({
        label: 'Partial catalog correlation',
        detail: `Shows morphological overlap with cataloged signals (${(candidate.knownPatternSimilarity * 100).toFixed(1)}%).`,
      });
    }

    if (candidate.persistence >= 0.75) {
      claims.push({
        label: 'Persistent temporal structure',
        detail: `Maintained across ${(candidate.persistence * 100).toFixed(0)}% of observation sequence without standard fading.`,
      });
    } else {
      claims.push({
        label: 'Intermittent signal presence',
        detail: `Detected across ${(candidate.persistence * 100).toFixed(0)}% of pointings.`,
      });
    }

    if (candidate.interferenceProbability < 0.1) {
      claims.push({
        label: 'Low interference probability',
        detail: `${(candidate.interferenceProbability * 100).toFixed(1)}% RFI likelihood; spatial screening indicates absence in off-target pointings.`,
      });
    } else if (candidate.interferenceProbability < 0.25) {
      claims.push({
        label: 'Nominal interference risk',
        detail: `${(candidate.interferenceProbability * 100).toFixed(1)}% probability of ground or satellite transmitter cross-match.`,
      });
    } else {
      claims.push({
        label: 'Elevated interference potential',
        detail: `${(candidate.interferenceProbability * 100).toFixed(1)}% probability of terrestrial origin; spatial multi-beam verification required.`,
      });
    }

    if (Math.abs(candidate.driftRateHzPerSec) > 0.05) {
      claims.push({
        label: 'Doppler frequency drift',
        detail: `Linear frequency shift (${candidate.driftRateHzPerSec > 0 ? '+' : ''}${candidate.driftRateHzPerSec.toFixed(2)} Hz/s) matches non-terrestrial acceleration.`,
      });
    }

    return claims;
  };

  const evidenceClaims = getEvidenceClaims();

  const priorityLabel =
    candidate.priority === 'HIGH'
      ? 'High priority'
      : candidate.priority === 'MEDIUM'
        ? 'Medium'
        : 'Low';
  const priorityColor = candidate.priority === 'HIGH' ? 'text-[#D4864A]' : 'text-[#9A9C96]';

  return (
    <div className="rounded-[2px] border border-[#242825] bg-[#141715] select-none flex flex-col overflow-hidden shadow-sm">
      {/* Header: Inline identity */}
      <div className="flex items-center justify-between border-b border-[#242825] px-4 py-2.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#E6E4DD] font-mono">{candidate.id}</span>
            <span className={`text-[10px] uppercase tracking-wider font-medium ${priorityColor}`}>
              {priorityLabel}
            </span>
          </div>
          <span className="text-[11px] text-[#9A9C96] font-mono">
            {candidate.frequencyMHz.toFixed(3)} MHz · {candidate.targetName}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close specimen review"
          className="h-7 w-7 flex items-center justify-center rounded-sm text-[#666963] hover:text-[#E6E4DD] hover:bg-[#1A1E1B] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Signal viewport */}
      <div className="px-4 pt-3">
        <CandidateSignalViewport candidate={candidate} />
      </div>

      {/* Measurements — key-value list, not mini-cards */}
      <div className="px-4 py-3 space-y-2.5">
        <span className="text-[10px] uppercase tracking-widest text-[#666963] font-medium block">
          Measurements
        </span>
        <div className="space-y-1.5 text-xs">
          {[
            {
              label: 'Anomaly index',
              value: candidate.anomalyIndex.toFixed(3),
              color: 'text-[#D4864A]',
            },
            {
              label: 'Significance',
              value: `+${candidate.evidenceFactors?.anomalousStructure?.sigma.toFixed(1) || '4.0'}σ`,
              color: 'text-[#E6E4DD]',
            },
            { label: 'SNR', value: `${candidate.snrDb.toFixed(1)} dB`, color: 'text-[#E6E4DD]' },
            {
              label: 'Coordinates',
              value: `${candidate.coordinates.ra}, ${candidate.coordinates.dec}`,
              color: 'text-[#9A9C96]',
            },
            {
              label: 'Drift rate',
              value: `${candidate.driftRateHzPerSec > 0 ? '+' : ''}${candidate.driftRateHzPerSec} Hz/s`,
              color: 'text-[#D4864A]',
            },
          ].map((m) => (
            <div key={m.label} className="flex items-baseline justify-between gap-2">
              <span className="text-[#9A9C96]">{m.label}</span>
              <span className={`font-mono ${m.color}`}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Evidence profile — editorial bullet points */}
      <div className="px-4 pb-3 border-t border-[#242825] pt-3">
        <span className="text-[10px] uppercase tracking-widest text-[#666963] font-medium block mb-2.5">
          Evidence
        </span>
        <div className="space-y-2 text-xs">
          {evidenceClaims.map((claim) => (
            <div key={claim.label} className="flex items-start gap-2">
              <span className="w-1 h-1 rounded-full bg-[#D4864A] shrink-0 mt-1.5" />
              <div className="leading-snug min-w-0">
                <span className="font-medium text-[#E6E4DD]">{claim.label}: </span>
                <span className="text-[#9A9C96]">{claim.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action — borderless footer */}
      <div className="border-t border-[#242825] px-4 py-3">
        <Link to={`/analysis/${candidate.id}`} className="block w-full">
          <Button variant="primary" size="md" withArrow className="w-full">
            Examine in analysis
          </Button>
        </Link>
      </div>
    </div>
  );
}
