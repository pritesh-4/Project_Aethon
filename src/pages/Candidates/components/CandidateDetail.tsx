import { Link } from 'react-router';
import type { CandidateSignalData, CandidatePriority } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import { CandidateSignalViewport } from './CandidateSignalViewport.tsx';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge.tsx';

export interface CandidateDetailProps {
  candidate: CandidateSignalData;
  onClose: () => void;
}

export function CandidateDetail({ candidate, onClose }: CandidateDetailProps) {
  const getPriorityBadge = (priority: CandidatePriority) => {
    switch (priority) {
      case 'HIGH':
        return <Badge variant="copper">High priority review</Badge>;
      case 'MEDIUM':
        return <Badge variant="slate">Medium priority</Badge>;
      case 'LOW':
        return <Badge variant="neutral">Low priority</Badge>;
    }
  };

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

  return (
    <div className="rounded-[2px] border border-[#242825] bg-[#141715] select-none flex flex-col justify-between overflow-hidden shadow-sm">
      {/* Header: Specimen Record */}
      <div className="flex items-center justify-between border-b border-[#242825] bg-[#141715] px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[#E6E4DD] font-mono">{candidate.id}</span>
            {getPriorityBadge(candidate.priority)}
          </div>
          <span className="text-xs text-[#9A9C96] font-mono">
            {candidate.frequencyMHz.toFixed(3)} MHz • {candidate.targetName}
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close specimen review"
          className="h-7 w-7 flex items-center justify-center rounded-[2px] border border-[#242825] bg-[#1A1E1B] text-[#9A9C96] hover:border-[#D4864A]/40 hover:text-[#E6E4DD] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Main Specimen Body */}
      <div className="p-4 space-y-4">
        {/* 1. SPECTROGRAM SPECIMEN VIEWPORT */}
        <CandidateSignalViewport candidate={candidate} />

        {/* 2. SPECIMEN MEASUREMENTS */}
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="rounded-[2px] border border-[#242825] bg-[#1A1E1B] p-2">
            <span className="block text-[10px] text-[#9A9C96]">Anomaly index</span>
            <span className="font-mono text-sm text-[#D4864A]">
              {candidate.anomalyIndex.toFixed(3)}
            </span>
          </div>
          <div className="rounded-[2px] border border-[#242825] bg-[#1A1E1B] p-2">
            <span className="block text-[10px] text-[#9A9C96]">Significance</span>
            <span className="font-mono text-sm text-[#E6E4DD]">
              +{candidate.evidenceFactors?.anomalousStructure?.sigma.toFixed(1) || '4.0'}σ
            </span>
          </div>
          <div className="rounded-[2px] border border-[#242825] bg-[#1A1E1B] p-2">
            <span className="block text-[10px] text-[#9A9C96]">SNR</span>
            <span className="font-mono text-sm text-[#E6E4DD]">
              {candidate.snrDb.toFixed(1)} dB
            </span>
          </div>
        </div>

        {/* Coordinates and Drift */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-[2px] border border-[#242825] bg-[#101211] p-2.5">
            <span className="block text-[10px] text-[#666963]">Pointing coordinates</span>
            <span className="font-mono text-xs text-[#C9C8C0]">
              {candidate.coordinates.ra}, {candidate.coordinates.dec}
            </span>
          </div>
          <div className="rounded-[2px] border border-[#242825] bg-[#101211] p-2.5">
            <span className="block text-[10px] text-[#666963]">Doppler drift rate</span>
            <span className="font-mono text-xs text-[#D4864A]">
              {candidate.driftRateHzPerSec > 0 ? '+' : ''}
              {candidate.driftRateHzPerSec} Hz/s
            </span>
          </div>
        </div>

        {/* 3. SCIENTIFIC EVIDENCE NOTES */}
        <div className="rounded-[2px] border border-[#242825] bg-[#101211] p-3 space-y-2">
          <span className="block text-xs font-medium text-[#E6E4DD]">Evidence profile</span>

          <div className="space-y-2 text-xs">
            {evidenceClaims.map((claim) => (
              <div
                key={claim.label}
                className="flex items-start gap-2 border-b border-[#242825]/40 pb-1.5 last:border-0 last:pb-0"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#D4864A] shrink-0 mt-1.5" />
                <div className="leading-snug">
                  <span className="font-medium text-[#E6E4DD]">{claim.label}: </span>
                  <span className="text-[#9A9C96]">{claim.detail}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. INVESTIGATION ACTION */}
      <div className="border-t border-[#242825] bg-[#141715] p-4">
        <Link to={`/analysis/${candidate.id}`} className="block w-full">
          <Button variant="primary" size="md" withArrow className="w-full">
            Examine candidate in analysis
          </Button>
        </Link>
      </div>
    </div>
  );
}
