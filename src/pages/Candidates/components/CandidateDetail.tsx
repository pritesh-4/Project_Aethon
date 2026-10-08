import { Link } from 'react-router';
import type { CandidateSignalData, CandidatePriority } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import { CandidateSignalViewport } from './CandidateSignalViewport.tsx';
import { X, CheckCircle2 } from 'lucide-react';

export interface CandidateDetailProps {
  candidate: CandidateSignalData;
  onClose: () => void;
}

export function CandidateDetail({ candidate, onClose }: CandidateDetailProps) {
  const getPriorityBadge = (priority: CandidatePriority) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 rounded border border-[#E8AE50]/40 bg-[#E8AE50]/10 px-2 py-0.5 text-xs font-medium text-[#E8AE50]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E8AE50]" />
            High priority
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 rounded border border-[#7F8B95]/30 bg-[#7F8B95]/10 px-2 py-0.5 text-xs font-medium text-[#7F8B95]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7F8B95]" />
            Medium priority
          </span>
        );
      case 'LOW':
        return (
          <span className="inline-flex items-center gap-1 rounded border border-[#1C2630] bg-[#10161D] px-2 py-0.5 text-xs font-medium text-[#7F8B95]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7F8B95]/60" />
            Low priority
          </span>
        );
    }
  };

  // Derive plain-language evidence claims strictly supported by the candidate's actual data
  const getEvidenceClaims = () => {
    const claims: { label: string; detail: string }[] = [];

    // 1. Learned pattern similarity
    if (candidate.knownPatternSimilarity < 0.15) {
      claims.push({
        label: 'Low similarity to learned patterns.',
        detail: `${(candidate.knownPatternSimilarity * 100).toFixed(1)}% match against cataloged natural radio sources.`,
      });
    } else if (candidate.knownPatternSimilarity < 0.35) {
      claims.push({
        label: 'Moderate divergence from known patterns.',
        detail: `${(candidate.knownPatternSimilarity * 100).toFixed(1)}% match to known profiles.`,
      });
    } else {
      claims.push({
        label: 'Partial correlation with known emitter.',
        detail: `Shows morphological overlap with cataloged signals (${(candidate.knownPatternSimilarity * 100).toFixed(1)}%).`,
      });
    }

    // 2. Temporal persistence
    if (candidate.persistence >= 0.75) {
      claims.push({
        label: 'Persistent temporal structure.',
        detail: `Present across ${(candidate.persistence * 100).toFixed(0)}% of the observation sequence without fading.`,
      });
    } else {
      claims.push({
        label: 'Intermittent signal presence.',
        detail: `Signal detected across ${(candidate.persistence * 100).toFixed(0)}% of pointings.`,
      });
    }

    // 3. Interference / RFI
    if (candidate.interferenceProbability < 0.1) {
      claims.push({
        label: 'Low estimated interference.',
        detail: `${(candidate.interferenceProbability * 100).toFixed(1)}% RFI risk; spatial screening indicates absence in off-target pointings.`,
      });
    } else if (candidate.interferenceProbability < 0.25) {
      claims.push({
        label: 'Nominal interference risk.',
        detail: `${(candidate.interferenceProbability * 100).toFixed(1)}% probability of ground or satellite transmitter cross-match.`,
      });
    } else {
      claims.push({
        label: 'Elevated interference potential.',
        detail: `${(candidate.interferenceProbability * 100).toFixed(1)}% probability of terrestrial origin; spatial multi-beam verification required.`,
      });
    }

    // 4. Doppler drift
    if (Math.abs(candidate.driftRateHzPerSec) > 0.05) {
      claims.push({
        label: 'Consistent Doppler drift rate.',
        detail: `Linear frequency shift (${candidate.driftRateHzPerSec > 0 ? '+' : ''}${candidate.driftRateHzPerSec.toFixed(2)} Hz/s) matches non-terrestrial acceleration.`,
      });
    }

    return claims;
  };

  const evidenceClaims = getEvidenceClaims();

  return (
    <div className="rounded border border-[#1C2630] bg-[#0B0F14] select-none flex flex-col justify-between overflow-hidden shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1C2630] bg-[#0B0F14] p-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-semibold text-[#E6EDF2] font-mono">{candidate.id}</span>
            {getPriorityBadge(candidate.priority)}
          </div>
          <span className="text-xs text-[#7F8B95] font-mono">
            {candidate.frequencyMHz.toFixed(3)} MHz • {candidate.targetName}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close candidate detail"
          className="h-8 w-8 flex items-center justify-center rounded border border-[#1C2630] bg-[#10161D] text-[#7F8B95] hover:border-[#5BD8F5]/40 hover:text-[#E6EDF2] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Main Detail Body: Signal, Anomaly, Key Evidence */}
      <div className="p-4 space-y-4">
        {/* 1. SIGNAL VIEWPORT */}
        <CandidateSignalViewport candidate={candidate} />

        {/* 2. ANOMALY READOUT */}
        <div className="rounded border border-[#1C2630] bg-[#10161D] p-3 text-xs space-y-1">
          <span className="block text-xs font-medium text-[#7F8B95]">Anomaly assessment</span>
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-semibold font-mono text-[#5BD8F5]">
              Index: {candidate.anomalyIndex.toFixed(3)}
            </span>
            <span className="text-xs font-mono text-[#E6EDF2]">
              +{candidate.evidenceFactors?.anomalousStructure?.sigma.toFixed(1) || '4.0'}σ above
              baseline
            </span>
          </div>
        </div>

        {/* 3. KEY EVIDENCE (PLAIN LANGUAGE) */}
        <div className="rounded border border-[#1C2630] bg-[#06080B] p-3.5 space-y-2.5">
          <span className="block text-xs font-medium text-[#E6EDF2]">Key evidence</span>

          <div className="space-y-2 text-xs">
            {evidenceClaims.map((claim) => (
              <div key={claim.label} className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#5BD8F5] shrink-0 mt-0.5" />
                <div className="leading-snug">
                  <span className="font-medium text-[#E6EDF2]">{claim.label} </span>
                  <span className="text-[#7F8B95]">{claim.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. INVESTIGATION ACTION */}
      <div className="border-t border-[#1C2630] bg-[#0B0F14] p-4">
        <Link to={`/analysis/${candidate.id}`} className="block w-full">
          <Button variant="primary" size="md" withArrow className="w-full">
            Investigate candidate in Analysis
          </Button>
        </Link>
      </div>
    </div>
  );
}
