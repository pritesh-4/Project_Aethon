import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router';
import { PageTransition } from '@/components/ui/motion.tsx';
import { Button } from '@/components/ui/Button.tsx';
import {
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Activity,
  GitCompare,
  Layers,
  FileText,
} from 'lucide-react';

import type { PipelineStageId } from './types.ts';
import { MOCK_ANALYSIS_RECORDS, CANDIDATE_ORDER_LIST } from './data/mockAnalysis.ts';

import { AnalysisHeader } from './components/AnalysisHeader.tsx';
import { SignalViewer } from './components/SignalViewer.tsx';
import { AnalysisVerdictBar } from './components/AnalysisVerdictBar.tsx';
import { ObservationMetadata } from './components/ObservationMetadata.tsx';
import { AnalysisPipeline } from './components/AnalysisPipeline.tsx';
import { StageDiagnosticView } from './components/StageDiagnosticView.tsx';
import { AnomalyAssessment } from './components/AnomalyAssessment.tsx';
import { PatternComparison } from './components/PatternComparison.tsx';
import { SignalMorphology } from './components/SignalMorphology.tsx';
import { InterferenceAssessment } from './components/InterferenceAssessment.tsx';
import { EvidenceTimeline } from './components/EvidenceTimeline.tsx';

type AnalysisTabId = 'evidence' | 'comparison' | 'pipeline' | 'metadata';

export default function AnalysisPage() {
  const { signalId } = useParams<{ signalId: string }>();

  // Active analytical tab state
  const [activeTab, setActiveTab] = useState<AnalysisTabId>('evidence');

  // Active analytical pipeline stage state (for the pipeline tab)
  const [activeStage, setActiveStage] = useState<PipelineStageId>('observation');

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
        <div className="rounded-[4px] border border-[#1C2630] bg-[#0B0F14] p-8 text-center font-mono">
          <div className="flex flex-col items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-[#E8AE50]" />
            <h2 className="text-base font-medium text-[#E6EDF2]">Candidate not found</h2>
            <p className="max-w-md text-xs text-[#7F8B95] font-sans leading-relaxed">
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

  const tabs: { id: AnalysisTabId; label: string; icon: typeof Activity }[] = [
    { id: 'evidence', label: 'Evidence & morphology', icon: Activity },
    { id: 'comparison', label: 'Pattern & interference', icon: GitCompare },
    { id: 'pipeline', label: 'Pipeline diagnostics', icon: Layers },
    { id: 'metadata', label: 'Observation parameters', icon: FileText },
  ];

  return (
    <PageTransition className="space-y-5">
      {/* 1. Header with Breadcrumb, Navigation & Title */}
      <AnalysisHeader
        record={record}
        prevCandidateId={prevCandidateId}
        nextCandidateId={nextCandidateId}
      />

      {/* 2. PRIMARY SIGNAL VIEW (The visual protagonist of AETHON) */}
      <section aria-label="Primary Signal Representation and Viewport">
        <SignalViewer record={record} />
      </section>

      {/* 3. VERDICT & PRIMARY ACTION BAR (Core metrics + Decisions) */}
      <section aria-label="Candidate Verdict and Actions">
        <AnalysisVerdictBar record={record} />
      </section>

      {/* 4. PROGRESSIVE DISCLOSURE TABS: In-Depth Scientific Evidence */}
      <section aria-label="Detailed Evidence and Diagnostics" className="space-y-4">
        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-[#1C2630] pb-2 font-sans text-xs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[4px] font-medium transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#10161D] text-[#5BD8F5] border border-[#1C2630]'
                    : 'text-[#7F8B95] hover:text-[#E6EDF2] border border-transparent'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'evidence' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <AnomalyAssessment record={record} />
              <SignalMorphology record={record} />
            </div>
            <div className="space-y-4">
              <EvidenceTimeline record={record} />
            </div>
          </div>
        )}

        {activeTab === 'comparison' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="space-y-4">
              <PatternComparison record={record} />
            </div>
            <div className="space-y-4">
              <InterferenceAssessment record={record} />
            </div>
          </div>
        )}

        {activeTab === 'pipeline' && (
          <div className="space-y-4">
            <AnalysisPipeline
              activeStage={activeStage}
              onSelectStage={(stage) => setActiveStage(stage)}
            />
            <StageDiagnosticView activeStage={activeStage} record={record} />
          </div>
        )}

        {activeTab === 'metadata' && (
          <div className="space-y-4">
            <ObservationMetadata record={record} />
          </div>
        )}
      </section>
    </PageTransition>
  );
}
