import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { PageTransition } from '@/components/ui/motion.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

import type { PipelineStageId } from './types.ts';
import { MOCK_ANALYSIS_RECORDS, CANDIDATE_ORDER_LIST } from './data/mockAnalysis.ts';

import { AnalysisHeader } from './components/AnalysisHeader.tsx';
import { SignalViewer } from './components/SignalViewer.tsx';
import { ObservationMetadata } from './components/ObservationMetadata.tsx';
import { AnalysisPipeline } from './components/AnalysisPipeline.tsx';
import { StageDiagnosticView } from './components/StageDiagnosticView.tsx';
import { AnomalyAssessment } from './components/AnomalyAssessment.tsx';
import { PatternComparison } from './components/PatternComparison.tsx';
import { SignalMorphology } from './components/SignalMorphology.tsx';
import { InterferenceAssessment } from './components/InterferenceAssessment.tsx';
import { EvidenceTimeline } from './components/EvidenceTimeline.tsx';
import { HumanReviewPanel } from './components/HumanReviewPanel.tsx';

export default function AnalysisPage() {
  const { signalId } = useParams<{ signalId: string }>();

  // Active analytical pipeline stage state
  const [activeStage, setActiveStage] = useState<PipelineStageId>('observation');

  // Resolve candidate from route parameter or fallback
  const resolvedId = useMemo(() => {
    if (!signalId) return 'AET-04721';
    const normalized = signalId.toUpperCase();
    if (MOCK_ANALYSIS_RECORDS[normalized]) {
      return normalized;
    }
    // Also check case-insensitive match
    const foundKey = Object.keys(MOCK_ANALYSIS_RECORDS).find(
      (k) => k.toLowerCase() === signalId.toLowerCase()
    );
    return foundKey || null;
  }, [signalId]);

  const record = resolvedId ? MOCK_ANALYSIS_RECORDS[resolvedId] : null;

  // Previous & Next candidate navigation links
  const { prevCandidateId, nextCandidateId } = useMemo(() => {
    if (!resolvedId) return { prevCandidateId: null, nextCandidateId: null };
    const currentIndex = CANDIDATE_ORDER_LIST.indexOf(resolvedId);
    if (currentIndex === -1) {
      return { prevCandidateId: null, nextCandidateId: null };
    }
    return {
      prevCandidateId: currentIndex > 0 ? CANDIDATE_ORDER_LIST[currentIndex - 1] : null,
      nextCandidateId:
        currentIndex < CANDIDATE_ORDER_LIST.length - 1
          ? CANDIDATE_ORDER_LIST[currentIndex + 1]
          : null,
    };
  }, [resolvedId]);

  // Invalid candidate error state
  if (!record) {
    return (
      <PageTransition className="space-y-6">
        <div className="rounded-[2px] border border-amber-900/60 bg-[#0A0E13] p-8 text-center font-mono">
          <div className="flex flex-col items-center gap-3">
            <AlertTriangle className="h-10 w-10 text-[#FFB84D]" />
            <h2 className="text-base font-bold uppercase tracking-wider text-[#EAF4F7]">
              CANDIDATE RECORD NOT LOCATED
            </h2>
            <p className="max-w-md text-xs text-slate-400 font-sans leading-relaxed">
              No matching anomaly event telemetry exists in the primary active buffer for query
              identifier{' '}
              <span className="text-[#66E3FF] font-mono font-semibold">{signalId || 'NULL'}</span>.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Link to="/analysis/AET-04721">
                <Button variant="primary" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />}>
                  LOAD PRIMARY CANDIDATE (AET-04721)
                </Button>
              </Link>
              <Link to="/candidates">
                <Button variant="outline" size="sm" icon={<ArrowLeft className="h-3.5 w-3.5" />}>
                  RETURN TO CANDIDATES
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-4">
      {/* 2. PAGE HEADER with Breadcrumb, Title & Engine Status */}
      <AnalysisHeader
        record={record}
        prevCandidateId={prevCandidateId}
        nextCandidateId={nextCandidateId}
      />

      {/* 3 & 4 & 5. PRIMARY SIGNAL VIEW (The visual protagonist of AETHON) */}
      <section aria-label="Primary Signal Representation and Viewport">
        <SignalViewer record={record} />
      </section>

      {/* 6. OBSERVATION METADATA (Monospace scientific telemetry) */}
      <section aria-label="Observation Telemetry Metadata">
        <ObservationMetadata record={record} />
      </section>

      {/* 7. ANALYTICAL PIPELINE (Clickable stages: Observe -> Preprocess -> Transform -> Represent -> Anomaly -> Score) */}
      <section aria-label="AETHON Transformation Pipeline Stages">
        <AnalysisPipeline
          activeStage={activeStage}
          onSelectStage={(stage) => setActiveStage(stage)}
        />
      </section>

      {/* 8-11. STAGE DIAGNOSTIC VIEW (Dynamic stage explanation and data evidence) */}
      <section aria-label="Stage Analytical Evidence">
        <StageDiagnosticView activeStage={activeStage} record={record} />
      </section>

      {/* 12-16. CORE ANALYTICAL EVIDENCE & SCIENTIFIC ASSESSMENTS */}
      <section
        aria-label="Analytical Assessments and Pattern Comparison"
        className="grid grid-cols-1 lg:grid-cols-2 gap-4"
      >
        {/* Left Column: Anomaly Assessment & Pattern Comparison */}
        <div className="space-y-4">
          {/* 12 & 13: Anomaly Assessment with 24-Segment Analytical Scale */}
          <AnomalyAssessment record={record} />

          {/* 14: Pattern Comparison (Current vs Nearest Known Pattern PSR B0833-45) */}
          <PatternComparison record={record} />

          {/* 15: Signal Morphology Profile */}
          <SignalMorphology record={record} />
        </div>

        {/* Right Column: Interference Analysis & Human Review Workflows */}
        <div className="space-y-4">
          {/* 16: Radio-Frequency Interference (RFI) Assessment */}
          <InterferenceAssessment record={record} />

          {/* 17: Temporal Evidence Timeline */}
          <EvidenceTimeline record={record} />

          {/* 18, 19, 20: Prioritized Evidence Factors, Human-in-the-Loop, and Investigation Actions */}
          <HumanReviewPanel
            record={record}
            onViewRawObservation={() => setActiveStage('observation')}
          />
        </div>
      </section>
    </PageTransition>
  );
}
