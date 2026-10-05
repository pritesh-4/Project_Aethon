import { useState } from 'react';
import { Link } from 'react-router';
import type { SignalAnalysisRecord } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import { CheckCircle2, Clock, ArrowRight, ArrowLeft, Download, FileCheck } from 'lucide-react';
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
    <div className="rounded-[4px] border border-[#1C2630] bg-[#0B0F14] p-4 sm:p-5 select-none font-sans">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        {/* Left: 3 Core Decision Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 divide-y sm:divide-y-0 sm:divide-x divide-[#1C2630]">
          {/* Metric 1: Anomaly Index */}
          <div className="pt-2 sm:pt-0 sm:px-4 first:pl-0">
            <span className="block text-xs text-[#7F8B95]">Anomaly score</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl sm:text-2xl font-semibold font-mono text-[#5BD8F5]">
                {record.anomalyIndex.toFixed(3)}
              </span>
              <span className="text-xs text-[#7F8B95]">/ 1.000</span>
            </div>
            <p className="text-[11px] text-[#7F8B95] mt-0.5">Structural deviance index</p>
          </div>

          {/* Metric 2: Drift Rate */}
          <div className="pt-3 sm:pt-0 sm:px-4">
            <span className="block text-xs text-[#7F8B95]">Doppler drift rate</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl sm:text-2xl font-semibold font-mono text-[#5BD8F5]">
                {record.driftRateHzPerSec > 0 ? '+' : ''}
                {record.driftRateHzPerSec.toFixed(2)} Hz/s
              </span>
            </div>
            <p className="text-[11px] text-[#7F8B95] mt-0.5">Non-local barycentric projection</p>
          </div>

          {/* Metric 3: Interference Probability */}
          <div className="pt-3 sm:pt-0 sm:px-4 last:pr-0">
            <span className="block text-xs text-[#7F8B95]">Interference estimate</span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-xl sm:text-2xl font-semibold font-mono text-[#5BD8F5]">
                {(record.interferenceProbability * 100).toFixed(1)}%
              </span>
              <span className="text-xs text-[#7F8B95]">Low risk</span>
            </div>
            <p className="text-[11px] text-[#7F8B95] mt-0.5">Sidelobe correlation: Clear</p>
          </div>
        </div>

        {/* Right: Primary Actions & Review Status */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-[#1C2630]">
          {/* Status badge */}
          <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded bg-[#10161D] border border-[#1C2630] self-start sm:self-auto">
            {isMarked ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5 text-[#5BD8F5]" />
                <span className="text-xs font-medium text-[#5BD8F5]">Marked for review</span>
              </>
            ) : (
              <>
                <Clock className="h-3.5 w-3.5 text-[#E8AE50]" />
                <span className="text-xs font-medium text-[#E8AE50]">Pending review</span>
              </>
            )}
          </div>

          {/* Primary Action Button */}
          <Button
            variant="primary"
            size="sm"
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

          {/* Secondary Action: Export Data */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAnalysis}
            icon={<Download className="h-3.5 w-3.5" />}
          >
            Export
          </Button>

          {/* Return to candidates link */}
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
