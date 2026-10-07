import { useState } from 'react';
import { Link } from 'react-router';
import type { SignalAnalysisRecord } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import { CheckCircle2, Clock, ArrowLeft, Download, FileCheck, ArrowRight } from 'lucide-react';
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
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded border border-[#1C2630] bg-[#0B0F14] p-4 select-none text-xs">
      {/* Review Status */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#10161D] border border-[#1C2630]">
          {isMarked ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-[#5BD8F5]" />
              <span className="font-medium text-[#5BD8F5]">Marked for review</span>
            </>
          ) : (
            <>
              <Clock className="h-3.5 w-3.5 text-[#E8AE50]" />
              <span className="font-medium text-[#E8AE50]">Pending review</span>
            </>
          )}
        </div>
      </div>

      {/* Primary Actions */}
      <div className="flex flex-wrap items-center gap-2.5">
        <Button
          variant={isMarked ? 'outline' : 'primary'}
          size="sm"
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
  );
}
