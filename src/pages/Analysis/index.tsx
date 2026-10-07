import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { PageTransition } from '@/components/ui/motion.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react';

import type { AnalysisStageId } from './types.ts';
import { MOCK_ANALYSIS_RECORDS, CANDIDATE_ORDER_LIST } from './data/mockAnalysis.ts';

import { AnalysisHeader } from './components/AnalysisHeader.tsx';
import { StageSelector } from './components/StageSelector.tsx';
import { PrimarySignalVisual } from './components/PrimarySignalVisual.tsx';
import { StageExplanationPanel } from './components/StageExplanationPanel.tsx';
import { ScientificCaution } from './components/ScientificCaution.tsx';
import { AnalysisVerdictBar } from './components/AnalysisVerdictBar.tsx';

export default function AnalysisPage() {
  const { signalId } = useParams<{ signalId: string }>();

  // Progressive disclosure: inspect one analytical stage at a time
  // OBSERVATION -> REPRESENTATION -> PATTERN COMPARISON -> ANOMALY
  const [activeStage, setActiveStage] = useState<AnalysisStageId>('observation');

  // Resolve candidate from route parameter or fallback
  const resolvedId = useMemo(() => {
    if (!signalId) return 'AET-04721';
    const normalized = signalId.toUpperCase();
    if (MOCK_ANALYSIS_RECORDS[normalized]) {
      return normalized;
    }
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
        <div className="rounded border border-[#1C2630] bg-[#0B0F14] p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-[#E8AE50]" />
            <h2 className="text-base font-medium text-[#E6EDF2]">Candidate not found</h2>
            <p className="max-w-md text-xs text-[#7F8B95] leading-relaxed">
              No candidate record found for identifier{' '}
              <span className="text-[#5BD8F5] font-mono">{signalId || 'unknown'}</span>.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Link to="/analysis/AET-04721">
                <Button variant="primary" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />}>
                  Load candidate AET-04721
                </Button>
              </Link>
              <Link to="/candidates">
                <Button variant="outline" size="sm" icon={<ArrowLeft className="h-3.5 w-3.5" />}>
                  Return to candidates
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-0">
      {/* 1. Header with breadcrumbs and candidate switcher */}
      <AnalysisHeader
        record={record}
        prevCandidateId={prevCandidateId}
        nextCandidateId={nextCandidateId}
      />

      {/* 2. Main Scientific Investigation Workspace */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Step Selector: OBSERVATION -> REPRESENTATION -> PATTERN COMPARISON -> ANOMALY */}
        <StageSelector activeStage={activeStage} onSelectStage={setActiveStage} />

        {/* PRIMARY VIEW: The signal visual gets the largest area */}
        <section aria-label="Primary Signal Viewport">
          <PrimarySignalVisual record={record} activeStage={activeStage} />
        </section>

        {/* ONE EXPLANATION PANEL: Answering the guiding question with relevant metrics */}
        <section aria-label="Analytical Stage Explanation">
          <StageExplanationPanel record={record} activeStage={activeStage} />
        </section>

        {/* SCIENTIFIC CAUTION: Distinguishing ANOMALY from DISCOVERY and MODEL SCORE from CERTAINTY */}
        <ScientificCaution />

        {/* INVESTIGATION ACTIONS & VERDICT */}
        <AnalysisVerdictBar record={record} />
      </main>
    </PageTransition>
  );
}
