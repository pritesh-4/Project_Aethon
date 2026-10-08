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
      <PageTransition className="space-y-6 max-w-4xl mx-auto py-12 px-4">
        <div className="rounded-[3px] border border-[#D6D2C9] bg-[#FAF8F5] p-10 text-center shadow-xs">
          <div className="flex flex-col items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-[#9E6E20]" />
            <h2 className="text-xl font-normal text-[#17202A] font-serif">
              Candidate record not found
            </h2>
            <p className="max-w-md text-xs text-[#56616A] leading-relaxed">
              No analysis record resolved for identifier{' '}
              <span className="text-[#376A9B] font-mono font-semibold">
                {signalId || 'unknown'}
              </span>
              .
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Link to="/analysis/AET-04721">
                <Button variant="primary" size="sm" icon={<RefreshCw className="h-3.5 w-3.5" />}>
                  Load reference candidate AET-04721
                </Button>
              </Link>
              <Link to="/candidates">
                <Button variant="secondary" size="sm" icon={<ArrowLeft className="h-3.5 w-3.5" />}>
                  Return to candidate ledger
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="flex flex-col h-full min-h-0">
      {/* ─────────────────────────────────────────────────────────────
          1. INSTRUMENT IDENTITY STRIP
          Lean single-line header with candidate ID, priority, target
          ───────────────────────────────────────────────────────────── */}
      <AnalysisHeader
        record={record}
        prevCandidateId={prevCandidateId}
        nextCandidateId={nextCandidateId}
      />

      {/* ─────────────────────────────────────────────────────────────
          2. LABORATORY WORKSPACE
          Signal viewport (dominant) + Inspector panel (context)
          ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col">
        <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 flex-1 min-h-0 flex flex-col">
          {/* Stage Pipeline Ribbon — directly attached to viewport */}
          <div className="border-b border-[#D6D2C9] bg-[#FAF8F5]">
            <StageSelector activeStage={activeStage} onSelectStage={setActiveStage} />
          </div>

          {/* Main Workspace: Signal Viewport + Inspector */}
          <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-0 py-4 lg:py-5">
            {/* PRIMARY OBJECT: The Signal Viewport — 65%+ of visual space */}
            <section
              aria-label="Primary Signal Viewport"
              className="flex-1 min-w-0 lg:min-h-[460px]"
            >
              <PrimarySignalVisual record={record} activeStage={activeStage} />
            </section>

            {/* INSPECTOR COLUMN: Evidence & Metrics for the active stage */}
            <aside
              aria-label="Analytical Stage Evidence"
              className="lg:w-[340px] xl:w-[380px] shrink-0 lg:border-l lg:border-[#D6D2C9] lg:pl-5 xl:pl-6 pt-4 lg:pt-0 lg:ml-5 xl:ml-6 overflow-y-auto"
            >
              <StageExplanationPanel record={record} activeStage={activeStage} />

              {/* Scientific caution — progressive disclosure */}
              <div className="mt-4 border-t border-[#D6D2C9] pt-2">
                <ScientificCaution />
              </div>
            </aside>
          </div>
        </div>

        {/* ─────────────────────────────────────────────────────────────
            3. ACTION STRIP — Fixed at bottom, not a floating card
            ───────────────────────────────────────────────────────────── */}
        <AnalysisVerdictBar record={record} />
      </div>
    </PageTransition>
  );
}
