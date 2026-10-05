import { useState } from 'react';
import { Link } from 'react-router';
import type { SignalAnalysisRecord } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  ArrowLeft,
  Download,
  AlertTriangle,
  FileCheck,
} from 'lucide-react';
import { toast } from 'sonner';

export interface HumanReviewPanelProps {
  record: SignalAnalysisRecord;
  onViewRawObservation?: () => void;
}

export function HumanReviewPanel({ record, onViewRawObservation }: HumanReviewPanelProps) {
  const [isMarked, setIsMarked] = useState(false);

  const handleMarkForInvestigation = () => {
    setIsMarked(true);
    toast.success(`Candidate ${record.candidateId} marked for review`);
  };

  const handleExportAnalysis = () => {
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

    toast.info(`Exported analysis record for ${record.candidateId}`);
  };

  return (
    <div className="space-y-4 select-none">
      {/* 1: Prioritization Evidence */}
      <div className="rounded border border-[#1C2630] bg-[#0B0F14] p-4">
        <div className="flex items-center justify-between border-b border-[#1C2630] pb-2 mb-3">
          <h4 className="text-xs font-semibold text-[#E6EDF2]">Prioritization evidence</h4>
        </div>

        <div className="space-y-2.5">
          {record.flaggedReasons.map((reason) => (
            <div key={reason.id} className="rounded border border-[#1C2630] bg-[#10161D] p-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[#5BD8F5] font-mono text-xs">{reason.id}</span>
                  <span className="text-[#E6EDF2] font-medium text-xs">{reason.title}</span>
                </div>
                <span className="text-[11px] font-mono text-[#E8AE50]">{reason.metric}</span>
              </div>
              <p className="text-xs text-[#7F8B95] leading-relaxed">{reason.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 2: Verification Status */}
      <div className="rounded border border-[#1C2630] bg-[#0B0F14] p-4">
        <div className="flex items-center justify-between border-b border-[#1C2630] pb-2 mb-3">
          <h4 className="text-xs font-semibold text-[#E6EDF2]">Verification status</h4>
        </div>

        {/* Screening vs Review Status */}
        <div className="grid grid-cols-2 gap-3 text-xs mb-3">
          <div className="rounded border border-[#1C2630] bg-[#10161D] p-2.5">
            <span className="block text-[11px] text-[#7F8B95]">Automated screening</span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5BD8F5]" />
              <span className="text-xs font-medium text-[#5BD8F5]">Complete</span>
            </div>
          </div>

          <div className="rounded border border-[#1C2630] bg-[#10161D] p-2.5">
            <span className="block text-[11px] text-[#7F8B95]">Review status</span>
            <div className="flex items-center gap-1.5 mt-1">
              {isMarked ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-[#5BD8F5]" />
                  <span className="text-xs font-medium text-[#5BD8F5]">Marked for review</span>
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3 text-[#E8AE50]" />
                  <span className="text-xs font-medium text-[#E8AE50]">Pending review</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Scientific Disclaimer */}
        <div className="rounded border border-[#1C2630] bg-[#06080B] p-3 text-xs">
          <div className="flex items-center gap-1.5 font-medium text-xs text-[#E6EDF2] mb-1">
            <AlertTriangle className="h-3.5 w-3.5 text-[#E8AE50]" />
            <span>Candidate verification note</span>
          </div>
          <p className="text-xs text-[#7F8B95] leading-relaxed">
            Candidate events represent observations that deviate from learned distributions.
            Candidate status does not imply confirmed discovery, and secondary multi-station
            follow-up is recommended.
          </p>
        </div>
      </div>

      {/* 3: Actions */}
      <div className="rounded border border-[#1C2630] bg-[#0B0F14] p-4">
        <div className="flex items-center justify-between border-b border-[#1C2630] pb-2 mb-3">
          <h4 className="text-xs font-semibold text-[#E6EDF2]">Actions</h4>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Primary Action */}
          <Button
            variant="primary"
            size="md"
            className="flex-1 justify-center"
            disabled={isMarked}
            onClick={handleMarkForInvestigation}
            icon={
              isMarked ? (
                <FileCheck className="h-3.5 w-3.5" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5" />
              )
            }
          >
            {isMarked ? 'Marked for review' : 'Mark for review'}
          </Button>

          {/* Export Analysis */}
          <Button
            variant="outline"
            size="md"
            className="justify-center"
            onClick={handleExportAnalysis}
            icon={<Download className="h-3.5 w-3.5" />}
          >
            Export data
          </Button>

          {/* View Raw Observation */}
          {onViewRawObservation && (
            <Button
              variant="outline"
              size="md"
              className="justify-center"
              onClick={onViewRawObservation}
            >
              View raw data
            </Button>
          )}

          {/* Return to candidates */}
          <Link to="/candidates" className="contents">
            <Button
              variant="ghost"
              size="md"
              className="justify-center"
              icon={<ArrowLeft className="h-3.5 w-3.5" />}
            >
              Candidates
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
