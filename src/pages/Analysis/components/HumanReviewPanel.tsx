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
    toast.success(`Candidate ${record.candidateId} Marked for Human Scientific Investigation`, {
      description:
        'Prioritized candidate added to observatory follow-up queue for secondary beam verification.',
    });
  };

  const handleExportAnalysis = () => {
    const analysisPayload = {
      analysisVersion: 'AETHON-v2.4-SPECTRAL-CORE',
      timestampUtc: new Date().toISOString(),
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
      investigationStatus: isMarked
        ? 'MARKED_FOR_SCIENTIFIC_REVIEW'
        : 'AUTOMATED_TRIAGE_PENDING_HUMAN_REVIEW',
    };

    const blob = new Blob([JSON.stringify(analysisPayload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `AETHON-ANALYSIS-${record.candidateId}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast.info(`Exported full scientific dossier for ${record.candidateId}`, {
      description: 'JSON format analysis payload downloaded.',
    });
  };

  return (
    <div className="space-y-4 font-mono select-none">
      {/* 18: WHY THIS CANDIDATE WAS PRIORITIZED */}
      <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#EAF4F7]">
            WHY THIS CANDIDATE WAS PRIORITIZED
          </h4>
          <span className="text-[10px] text-[#84929C] uppercase">EVIDENCE-DRIVEN FACTORS</span>
        </div>

        <div className="space-y-2.5">
          {record.flaggedReasons.map((reason) => (
            <div
              key={reason.id}
              className="rounded-[2px] border border-slate-800/80 bg-[#05070A]/80 p-3"
            >
              <div className="flex items-center justify-between text-xs mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[#66E3FF] font-bold text-xs">{reason.id}</span>
                  <span className="text-slate-200 font-bold uppercase text-[11px] tracking-wider">
                    {reason.title}
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-[#FFB84D] uppercase">
                  {reason.metric}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                {reason.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* 19: HUMAN-IN-THE-LOOP STATUS & CREDIBILITY NOTICE */}
      <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#EAF4F7]">
            HUMAN-IN-THE-LOOP VERIFICATION PIPELINE
          </h4>
          <span className="text-[10px] text-[#84929C] uppercase">GATEWAY STAGE 06</span>
        </div>

        {/* Screening vs Review Status */}
        <div className="grid grid-cols-2 gap-3 text-xs mb-3">
          <div className="rounded-[2px] border border-slate-800 bg-[#05070A]/80 p-2.5">
            <span className="block text-[9px] uppercase tracking-wider text-[#84929C]">
              AUTOMATED SCREENING
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="h-2 w-2 rounded-none bg-emerald-400" />
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
                ● COMPLETE
              </span>
            </div>
          </div>

          <div className="rounded-[2px] border border-slate-800 bg-[#05070A]/80 p-2.5">
            <span className="block text-[9px] uppercase tracking-wider text-[#84929C]">
              SCIENTIFIC REVIEW
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              {isMarked ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-[#66E3FF]" />
                  <span className="text-xs font-bold text-[#66E3FF] uppercase tracking-wider">
                    ● MARKED FOR REVIEW
                  </span>
                </>
              ) : (
                <>
                  <Clock className="h-3 w-3 text-amber-400" />
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    ○ PENDING HUMAN TRIAGE
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Scientific Disclaimer (Crucial Scientific Credibility) */}
        <div className="rounded-[2px] border border-cyan-900/60 bg-cyan-950/20 p-3 text-xs">
          <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px] text-[#66E3FF] mb-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>ANOMALY ≠ DISCOVERY</span>
          </div>
          <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
            AETHON prioritizes observations for human investigation. Candidate status does not imply
            scientific confirmation. Low estimated interference probability highlights unusual
            structural persistence requiring secondary aperture cross-observation.
          </p>
        </div>
      </div>

      {/* 20: INVESTIGATION ACTIONS */}
      <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-4">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#EAF4F7]">
            INVESTIGATION ACTIONS
          </h4>
          <span className="text-[10px] text-[#84929C] uppercase">OPERATIONAL COMMANDS</span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {/* Primary Action */}
          <Button
            variant="primary"
            size="md"
            className="flex-1 justify-center rounded-[2px]"
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
            {isMarked ? 'MARKED FOR INVESTIGATION' : 'MARK FOR INVESTIGATION →'}
          </Button>

          {/* Export Analysis */}
          <Button
            variant="outline"
            size="md"
            className="justify-center rounded-[2px]"
            onClick={handleExportAnalysis}
            icon={<Download className="h-3.5 w-3.5" />}
          >
            EXPORT DOSSIER
          </Button>

          {/* View Raw Observation (Switches to stage 01) */}
          {onViewRawObservation && (
            <Button
              variant="outline"
              size="md"
              className="justify-center rounded-[2px]"
              onClick={onViewRawObservation}
            >
              VIEW RAW DATA
            </Button>
          )}

          {/* Return to candidates */}
          <Link to="/candidates" className="contents">
            <Button
              variant="ghost"
              size="md"
              className="justify-center rounded-[2px]"
              icon={<ArrowLeft className="h-3.5 w-3.5" />}
            >
              CANDIDATES
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
