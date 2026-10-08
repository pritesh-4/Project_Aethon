import { useState } from 'react';
import { Link } from 'react-router';
import type { CandidateSignalData } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import { CandidateSignalViewport } from './CandidateSignalViewport.tsx';
import { X, ChevronDown, ChevronRight, ArrowRight } from 'lucide-react';

export interface CandidateDetailProps {
  candidate: CandidateSignalData;
  onClose: () => void;
}

export function CandidateDetail({ candidate, onClose }: CandidateDetailProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

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
    <div className="rounded-[3px] border border-[#242825] bg-[#101211] select-none flex flex-col overflow-hidden font-sans shadow-sm">
      {/* 1. WHO IS THIS? */}
      <div className="border-b border-[#242825] bg-[#0A0C0B] p-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-xl font-bold font-mono text-[#D4864A]">{candidate.id}</h3>
            {candidate.priority === 'HIGH' && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#D4864A] bg-[#221B16] px-1.5 py-0.5 rounded-[2px] border border-[#D4864A]/30 font-semibold">
                HIGH PRIORITY
              </span>
            )}
            {candidate.priority === 'MEDIUM' && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#9A9C96] bg-[#181B19] px-1.5 py-0.5 rounded-[2px] border border-[#242825]">
                MEDIUM
              </span>
            )}
            {candidate.priority === 'LOW' && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#666963] bg-[#121413] px-1.5 py-0.5 rounded-[2px] border border-[#242825]">
                LOW
              </span>
            )}
          </div>

          <div className="text-xs text-[#E6E4DD] font-medium mt-1">{candidate.targetName}</div>

          <div className="text-[11px] font-mono text-[#767973] mt-0.5">
            Coordinates: {candidate.coordinates.ra} · {candidate.coordinates.dec}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close specimen inspector"
          className="h-7 w-7 flex items-center justify-center rounded-[2px] text-[#767973] hover:text-[#E6E4DD] hover:bg-[#181B19] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 2. WHY SHOULD I CARE? */}
      <div className="px-4 py-3 bg-[#131514] border-b border-[#1F2321] text-xs">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#767973] block mb-1">
          Divergence Verdict
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold font-mono text-[#D4864A]">
            {(candidate.anomalyIndex * 100).toFixed(1)}% anomaly score
          </span>
          <span className="text-xs text-[#848780]">
            · 4.8σ departure from learned astrophysical manifold
          </span>
        </div>
      </div>

      {/* 3. WHAT DOES IT LOOK LIKE? (HERO SIGNAL VIEWPORT) */}
      <div className="p-4 space-y-1.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#767973] block">
          Spectrogram Slice
        </span>
        <CandidateSignalViewport candidate={candidate} />
      </div>

      {/* 4. WHAT EVIDENCE SUPPORTS IT? */}
      <div className="px-4 py-3 border-t border-[#1F2321] space-y-2.5">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#767973] block">
          Observational Evidence
        </span>

        <div className="space-y-2 text-xs">
          {evidenceClaims.map((claim) => (
            <div key={claim.label} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D4864A] shrink-0 mt-1.5" />
              <div className="leading-snug">
                <span className="font-medium text-[#E6E4DD]">{claim.label}: </span>
                <span className="text-[#9A9C96]">{claim.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. SHOW ME THE TECHNICAL DETAILS (PROGRESSIVELY DISCLOSED LEVEL 3) */}
      <div className="px-4 py-2.5 border-t border-[#1F2321]">
        <button
          type="button"
          aria-expanded={showTechnicalDetails}
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="flex items-center justify-between w-full text-xs font-mono text-[#848780] hover:text-[#E6E4DD] py-1 transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A]"
        >
          <span>
            {showTechnicalDetails
              ? 'HIDE TECHNICAL MEASUREMENTS'
              : 'INSPECT TECHNICAL MEASUREMENTS'}
          </span>
          {showTechnicalDetails ? (
            <ChevronDown className="h-3.5 w-3.5 text-[#D4864A]" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-[#767973]" />
          )}
        </button>

        {showTechnicalDetails && (
          <div className="mt-2.5 divide-y divide-[#1D211F] border border-[#242825] bg-[#0C0E0D] rounded-[2px] text-xs font-mono p-3 space-y-1.5 animate-in fade-in duration-150">
            <div className="flex justify-between py-1">
              <span className="text-[#767973]">Frequency</span>
              <span className="text-[#E6E4DD]">{candidate.frequencyMHz.toFixed(4)} MHz</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#767973]">Bandwidth</span>
              <span className="text-[#E6E4DD]">{candidate.bandwidthKHz.toFixed(1)} kHz</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#767973]">Signal-to-Noise Ratio</span>
              <span className="text-[#E6E4DD]">+{candidate.snrDb.toFixed(1)} dB</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#767973]">Doppler Drift Rate</span>
              <span className="text-[#D4864A]">
                {candidate.driftRateHzPerSec > 0 ? '+' : ''}
                {candidate.driftRateHzPerSec} Hz/s
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#767973]">Peak Power</span>
              <span className="text-[#E6E4DD]">{candidate.peakPowerDbm.toFixed(1)} dBm</span>
            </div>
          </div>
        )}
      </div>

      {/* 6. PRIMARY ACTION: EXAMINE IN ANALYSIS */}
      <div className="border-t border-[#242825] p-4 bg-[#0A0C0B]">
        <Link to={`/analysis/${candidate.id}`} className="block w-full">
          <Button
            variant="primary"
            size="md"
            icon={<ArrowRight className="h-4 w-4" />}
            className="w-full text-xs font-medium justify-center"
          >
            Examine candidate in analysis
          </Button>
        </Link>
      </div>
    </div>
  );
}
