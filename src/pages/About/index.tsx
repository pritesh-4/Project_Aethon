import { useState, useEffect } from 'react';
import { PageTransition } from '@/components/ui/motion.tsx';
import { DossierHeader } from './components/DossierHeader.tsx';
import { TableOfContents } from './components/TableOfContents.tsx';
import { DocumentFactsRail } from './components/DocumentFactsRail.tsx';
import { ExecutiveSummarySection } from './components/ExecutiveSummarySection.tsx';
import { ImplementationStatusSection } from './components/ImplementationStatusSection.tsx';
import { TheProblemSection } from './components/TheProblemSection.tsx';
import { ResearchQuestionsSection } from './components/ResearchQuestionsSection.tsx';
import { ScientificBasisSection } from './components/ScientificBasisSection.tsx';
import { SystemArchitectureSection } from './components/SystemArchitectureSection.tsx';
import { SignalProcessingSection } from './components/SignalProcessingSection.tsx';
import { RepresentationLearningSection } from './components/RepresentationLearningSection.tsx';
import { CandidateScoringSection } from './components/CandidateScoringSection.tsx';
import { EvaluationStrategySection } from './components/EvaluationStrategySection.tsx';
import { LimitationsSection } from './components/LimitationsSection.tsx';
import { ReproducibilitySection } from './components/ReproducibilitySection.tsx';
import { WorkflowSection } from './components/WorkflowSection.tsx';
import { RoadmapSection } from './components/RoadmapSection.tsx';
import { EthicsAndRestraintSection } from './components/EthicsAndRestraintSection.tsx';
import { ReferencesSection } from './components/ReferencesSection.tsx';
import { TABLE_OF_CONTENTS } from './data/dossierData.ts';

export default function AboutPage() {
  const [activeSectionId, setActiveSectionId] = useState<string>('executive-summary');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // IntersectionObserver to dynamically highlight the currently visible section in TOC
  useEffect(() => {
    const observerCallback: IntersectionObserverCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSectionId(entry.target.id);
        }
      });
    };

    const observerOptions: IntersectionObserverInit = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0,
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    TABLE_OF_CONTENTS.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <PageTransition className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans">
      <article className="space-y-8">
        {/* Institutional Document Header */}
        <DossierHeader searchQuery={searchQuery} onSearchChange={setSearchQuery} />

        {/* Search Results Alert if active */}
        {searchQuery.trim() && (
          <div className="p-3 bg-[#EAE7E0] border border-[#D6D2C9] rounded-[2px] text-xs font-mono text-[#17202A] flex items-center justify-between">
            <span>FILTERING SECTIONS MATCHING: &ldquo;{searchQuery}&rdquo;</span>
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-[#376A9B] hover:underline cursor-pointer"
            >
              Reset filter
            </button>
          </div>
        )}

        {/* Multi-Column Document Layout */}
        <div className="flex flex-col lg:flex-row gap-8 items-start relative">
          {/* Left Rail: Sticky Table of Contents */}
          <TableOfContents activeSectionId={activeSectionId} />

          {/* Center Column: Primary Reading Body */}
          <main className="flex-1 min-w-0 max-w-3xl xl:max-w-4xl space-y-16">
            <ExecutiveSummarySection />
            <ImplementationStatusSection />
            <TheProblemSection />
            <ResearchQuestionsSection />
            <ScientificBasisSection />
            <SystemArchitectureSection />
            <SignalProcessingSection />
            <RepresentationLearningSection />
            <CandidateScoringSection />
            <EvaluationStrategySection />
            <LimitationsSection />
            <ReproducibilitySection />
            <WorkflowSection />
            <RoadmapSection />
            <EthicsAndRestraintSection />
            <ReferencesSection />
          </main>

          {/* Right Rail: Document Facts & Citation Tools */}
          <DocumentFactsRail />
        </div>
      </article>
    </PageTransition>
  );
}
