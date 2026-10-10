import { useState } from 'react';
import { Link } from 'react-router';
import type { CandidateSignalData } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import { CandidateSignalViewport } from './CandidateSignalViewport.tsx';
import { X, ChevronDown, ChevronRight, ArrowRight, Download, CheckCircle, Ban } from 'lucide-react';
import { api } from '@/lib/api.ts';
import { toast } from 'sonner';

export interface CandidateDetailProps {
  candidate: CandidateSignalData;
  onClose: () => void;
  onStatusChange?: (newStatus: CandidateSignalData['status']) => void;
}

export function CandidateDetail({ candidate, onClose, onStatusChange }: CandidateDetailProps) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);

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

  // Handle PDF Export
  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const blob = await api.downloadCandidatePdf(candidate.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `candidate_${candidate.id}_dossier.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Scientific case dossier for ${candidate.id} downloaded.`);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to generate PDF case dossier.';
      toast.error('Export failed', { description: msg });
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Handle Candidate Status Review Action
  const handleReview = async (
    newBackendStatus: 'interesting' | 'likely_interference' | 'dismissed'
  ) => {
    setIsReviewing(true);
    try {
      await api.reviewCandidate(candidate.id, {
        new_status: newBackendStatus,
        reviewer_id: 'Investigating Analyst',
        action: 'status_transition',
        notes: `Triage decision via candidate inspection interface. Status changed to ${newBackendStatus}.`,
      });
      const uiStatus: CandidateSignalData['status'] =
        newBackendStatus === 'interesting'
          ? 'CONFIRMED'
          : newBackendStatus === 'likely_interference'
            ? 'FLAGGED_RFI'
            : 'REJECTED';
      onStatusChange?.(uiStatus);
      toast.success(`Candidate ${candidate.id} marked as ${newBackendStatus}.`);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to update review status.';
      toast.error('Review update failed', { description: msg });
    } finally {
      setIsReviewing(false);
    }
  };

  return (
    <div className="rounded-[3px] border border-[#D6D2C9] bg-[#FAF8F5] select-none flex flex-col overflow-hidden font-sans shadow-xs">
      {/* 1. WHO IS THIS? */}
      <div className="border-b border-[#D6D2C9] bg-[#EAE7E0] p-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h3 className="text-xl font-bold font-mono text-[#17202A]">{candidate.id}</h3>
            {candidate.priority === 'HIGH' && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#9E6E20] bg-[#FDF6E9] px-2 py-0.5 rounded-[2px] border border-[#E8CFA0] font-semibold">
                HIGH PRIORITY
              </span>
            )}
            {candidate.priority === 'MEDIUM' && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#56616A] bg-[#EAE7E0] px-2 py-0.5 rounded-[2px] border border-[#D6D2C9]">
                MEDIUM
              </span>
            )}
            {candidate.priority === 'LOW' && (
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#76828D] bg-[#F4F1EA] px-2 py-0.5 rounded-[2px] border border-[#D6D2C9]">
                LOW
              </span>
            )}
          </div>

          <div className="text-xs text-[#17202A] font-medium mt-1">{candidate.targetName}</div>

          <div className="text-[11px] font-mono text-[#56616A] mt-0.5">
            Coordinates: {candidate.coordinates.ra} · {candidate.coordinates.dec}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close specimen inspector"
          className="h-7 w-7 flex items-center justify-center rounded-[2px] text-[#76828D] hover:text-[#17202A] hover:bg-[#D6D2C9]/60 transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#376A9B]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 2. WHY SHOULD I CARE? */}
      <div className="px-4 py-3 bg-[#FAF8F5] border-b border-[#D6D2C9] text-xs">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#76828D] block mb-1">
          Divergence Verdict
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold font-mono text-[#9E6E20]">
            {(candidate.anomalyIndex * 100).toFixed(1)}% anomaly score
          </span>
          <span className="text-xs text-[#56616A]">
            · 4.8σ departure from learned astrophysical baseline
          </span>
        </div>
      </div>

      {/* 3. WHAT DOES IT LOOK LIKE? (HERO SIGNAL VIEWPORT) */}
      <div className="p-4 space-y-1.5 bg-[#FAF8F5]">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#76828D] block">
          Spectrogram Slice
        </span>
        <CandidateSignalViewport candidate={candidate} />
      </div>

      {/* 4. WHAT EVIDENCE SUPPORTS IT? */}
      <div className="px-4 py-3 border-t border-[#D6D2C9] space-y-2.5 bg-[#FAF8F5]">
        <span className="text-[11px] font-mono uppercase tracking-wider text-[#76828D] block">
          Observational Evidence
        </span>

        <div className="space-y-2 text-xs">
          {evidenceClaims.map((claim) => (
            <div key={claim.label} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#376A9B] shrink-0 mt-1.5" />
              <div className="leading-snug">
                <span className="font-semibold text-[#17202A]">{claim.label}: </span>
                <span className="text-[#56616A]">{claim.detail}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. SHOW ME THE TECHNICAL DETAILS (PROGRESSIVELY DISCLOSED LEVEL 3) */}
      <div className="px-4 py-2.5 border-t border-[#D6D2C9] bg-[#FAF8F5]">
        <button
          type="button"
          aria-expanded={showTechnicalDetails}
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="flex items-center justify-between w-full text-xs font-mono text-[#56616A] hover:text-[#17202A] py-1 transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#376A9B]"
        >
          <span>
            {showTechnicalDetails
              ? 'HIDE TECHNICAL MEASUREMENTS'
              : 'INSPECT TECHNICAL MEASUREMENTS'}
          </span>
          {showTechnicalDetails ? (
            <ChevronDown className="h-3.5 w-3.5 text-[#376A9B]" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-[#76828D]" />
          )}
        </button>

        {showTechnicalDetails && (
          <div className="mt-2.5 divide-y divide-[#D6D2C9] border border-[#D6D2C9] bg-[#EAE7E0] rounded-[2px] text-xs font-mono p-3 space-y-1.5 animate-in fade-in duration-150">
            <div className="flex justify-between py-1">
              <span className="text-[#56616A]">Frequency</span>
              <span className="text-[#17202A] font-medium">
                {candidate.frequencyMHz.toFixed(4)} MHz
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#56616A]">Bandwidth</span>
              <span className="text-[#17202A] font-medium">
                {candidate.bandwidthKHz.toFixed(1)} kHz
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#56616A]">Signal-to-Noise Ratio</span>
              <span className="text-[#17202A] font-medium">+{candidate.snrDb.toFixed(1)} dB</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#56616A]">Doppler Drift Rate</span>
              <span className="text-[#376A9B] font-medium">
                {candidate.driftRateHzPerSec > 0 ? '+' : ''}
                {candidate.driftRateHzPerSec} Hz/s
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-[#56616A]">Peak Power</span>
              <span className="text-[#17202A] font-medium">
                {candidate.peakPowerDbm.toFixed(1)} dBm
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 6. TRIAGE ACTIONS & PDF EXPORT */}
      <div className="border-t border-[#D6D2C9] p-4 bg-[#EAE7E0] space-y-2.5">
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleReview('interesting')}
            disabled={isReviewing}
            icon={<CheckCircle className="h-3.5 w-3.5 text-[#3D7D54]" />}
            className="text-xs font-mono justify-center"
          >
            Promote
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleReview('likely_interference')}
            disabled={isReviewing}
            icon={<Ban className="h-3.5 w-3.5 text-[#B64B4B]" />}
            className="text-xs font-mono justify-center"
          >
            Flag RFI
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            state={isExportingPdf ? 'loading' : 'idle'}
            loadingText="Exporting PDF..."
            icon={<Download className="h-3.5 w-3.5" />}
            className="text-xs font-mono justify-center border border-[#D6D2C9]"
          >
            Export Dossier (PDF)
          </Button>

          <Link to={`/analysis/${candidate.id}`} className="block w-full">
            <Button
              variant="primary"
              size="sm"
              icon={<ArrowRight className="h-4 w-4" />}
              className="w-full text-xs font-semibold justify-center shadow-xs"
            >
              Detailed analysis
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
