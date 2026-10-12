import { useState } from 'react';
import { Link } from 'react-router';
import type { SignalAnalysisRecord } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import {
  CheckCircle2,
  Clock,
  ArrowLeft,
  Download,
  ArrowRight,
  FileJson,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api.ts';

export interface AnalysisVerdictBarProps {
  record: SignalAnalysisRecord;
}

export function AnalysisVerdictBar({ record }: AnalysisVerdictBarProps) {
  const [isMarked, setIsMarked] = useState(false);
  const [isReviewPending, setIsReviewPending] = useState(false);
  const [isPdfExporting, setIsPdfExporting] = useState(false);

  const handleMarkForInvestigation = async () => {
    if (isReviewPending || isMarked) return;
    setIsReviewPending(true);
    try {
      await api.reviewCandidate(record.candidateId, {
        new_status: 'under_review',
        action: 'confirm',
        reviewer_id: 'researcher_desk',
        notes: 'Marked for follow-up via Analysis view',
      });
      // Set marked state only after backend confirms successful persistence
      setIsMarked(true);
      toast.success(`Candidate ${record.candidateId} marked for review`);
    } catch (err: unknown) {
      // Truthful failure state: never show candidate as marked if persistence failed
      setIsMarked(false);
      const normalized = api.normalizeApiError(err);
      toast.error(
        `Failed to persist review status for ${record.candidateId}: ${normalized.message || 'Server error. Please retry.'}`
      );
    } finally {
      setIsReviewPending(false);
    }
  };

  const handleExportPdf = async () => {
    if (isPdfExporting) return;
    setIsPdfExporting(true);
    try {
      const blob = await api.downloadCandidatePdf(record.candidateId);
      if (blob.type && !blob.type.includes('pdf') && !blob.type.includes('octet-stream')) {
        throw new Error(
          `Unexpected response format (${blob.type}) received from dossier endpoint. Expected application/pdf.`
        );
      }
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `candidate_${record.candidateId}_dossier.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success(`Dossier PDF downloaded for ${record.candidateId}`);
    } catch (err: unknown) {
      // Strict separation: never silently produce JSON on PDF failure
      const normalized = api.normalizeApiError(err);
      toast.error(
        `PDF dossier generation failed: ${normalized.message || 'Unable to generate PDF dossier. Use Export Raw JSON if PDF service is unavailable.'}`
      );
    } finally {
      setIsPdfExporting(false);
    }
  };

  const handleExportJson = () => {
    const analysisPayload = {
      candidateId: record.candidateId,
      observationId: record.observationId,
      targetName: record.targetName,
      coordinates: record.coordinates,
      telemetry: {
        frequencyMHz: record.frequencyMHz,
        bandwidthKHz: record.bandwidthKHz,
        durationSeconds: record.durationSeconds,
        snrDb: record.snrDb,
        peakPowerDbm: record.peakPowerDbm,
        noiseFloorDbm: record.noiseFloorDbm,
        samplesCount: record.samplesCount,
        driftRateHzPerSec: record.driftRateHzPerSec,
      },
      evaluationMetrics: {
        anomalyIndex: record.anomalyIndex,
        knownPatternSimilarity: record.knownPatternSimilarity,
        interferenceProbability: record.interferenceProbability,
        persistence: record.persistence,
        priority: record.priority,
      },
      morphologicalProfile: record.morphology,
      nearestCatalogComparison: record.comparison,
      prioritizationEvidence: record.flaggedReasons,
      investigationStatus: isMarked ? 'marked_for_review' : 'pending_review',
    };

    const blob = new Blob([JSON.stringify(analysisPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `candidate-${record.candidateId}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast.info(`Exported raw JSON record for ${record.candidateId}`);
  };

  return (
    <div className="border-t border-[#D6D2C9] bg-[#FAF8F5] px-4 sm:px-6 py-3 select-none">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Review Status */}
        <div className="flex items-center gap-2 text-xs">
          {isReviewPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-[#376A9B]" />
              <span className="font-medium text-[#376A9B]">Persisting review to backend...</span>
            </>
          ) : isMarked ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-[#3D7D54]" />
              <span className="font-semibold text-[#17202A]">Marked for follow-up</span>
            </>
          ) : (
            <>
              <Clock className="h-4 w-4 text-[#C19348]" />
              <span className="font-medium text-[#56616A]">Pending researcher verdict</span>
            </>
          )}
        </div>

        {/* Primary Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant={isMarked ? 'secondary' : 'primary'}
            size="sm"
            disabled={isReviewPending || isMarked}
            onClick={handleMarkForInvestigation}
            icon={
              isReviewPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isMarked ? (
                <CheckCircle2 className="h-3.5 w-3.5 text-[#3D7D54]" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5" />
              )
            }
          >
            {isReviewPending ? 'Persisting...' : isMarked ? 'Marked' : 'Mark for follow-up'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            disabled={isPdfExporting}
            icon={
              isPdfExporting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Download className="h-3.5 w-3.5" />
              )
            }
            onClick={handleExportPdf}
          >
            {isPdfExporting ? 'Generating PDF...' : 'Export PDF Dossier'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={<FileJson className="h-3.5 w-3.5" />}
            onClick={handleExportJson}
          >
            Export Raw JSON
          </Button>

          <Link to="/candidates">
            <Button variant="ghost" size="sm" icon={<ArrowLeft className="h-3.5 w-3.5" />}>
              Candidates
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
