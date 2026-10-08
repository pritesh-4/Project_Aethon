import { useState } from 'react';
import { Link } from 'react-router';
import type { SignalAnalysisRecord } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import { CheckCircle2, Clock, ArrowLeft, Download, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export interface AnalysisVerdictBarProps {
  record: SignalAnalysisRecord;
}

export function AnalysisVerdictBar({ record }: AnalysisVerdictBarProps) {
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
    <div className="border-t border-[#242825] bg-[#0F1110] px-4 sm:px-6 py-3 select-none">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Review Status — inline label, not a bordered pill */}
        <div className="flex items-center gap-2 text-xs">
          {isMarked ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-[#529E72]" />
              <span className="font-medium text-[#E6E4DD]">Marked for follow-up</span>
            </>
          ) : (
            <>
              <Clock className="h-3.5 w-3.5 text-[#D4864A]" />
              <span className="font-medium text-[#9A9C96]">Pending researcher verdict</span>
            </>
          )}
        </div>

        {/* Primary Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant={isMarked ? 'outline' : 'primary'}
            size="sm"
            onClick={handleMarkForInvestigation}
            icon={
              isMarked ? (
                <CheckCircle2 className="h-3.5 w-3.5" />
              ) : (
                <ArrowRight className="h-3.5 w-3.5" />
              )
            }
          >
            {isMarked ? 'Marked' : 'Mark for follow-up'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={<Download className="h-3.5 w-3.5" />}
            onClick={handleExportAnalysis}
          >
            Export
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
