import { useState, useRef, useEffect, useCallback } from 'react';
import { PageTransition } from '@/components/ui/motion.tsx';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';

import type {
  DiscoveryStage,
  DiscoveryObservationMeta,
  SearchConfig,
  DiscoveredCandidate,
} from './types.ts';
import {
  REFERENCE_OBSERVATIONS,
  MOCK_DISCOVERY_CANDIDATES,
  MOCK_DISCOVERY_RESULT,
} from './data/mockDiscovery.ts';

import { DiscoveryHeader } from './components/DiscoveryHeader.tsx';
import { ObservationDropzone } from './components/ObservationDropzone.tsx';
import { ObservationSummary } from './components/ObservationSummary.tsx';
import { SearchConfiguration } from './components/SearchConfiguration.tsx';
import { DiscoveryPipeline } from './components/DiscoveryPipeline.tsx';
import { SignalAnalysisViewport } from './components/SignalAnalysisViewport.tsx';
import { CandidateRankingTable } from './components/CandidateRankingTable.tsx';
import { CandidatePreview } from './components/CandidatePreview.tsx';
import { DiscoveryResults } from './components/DiscoveryResults.tsx';

export default function DiscoverPage() {
  // Primary State
  const [stage, setStage] = useState<DiscoveryStage>('observation_loaded');
  const [observation, setObservation] = useState<DiscoveryObservationMeta | null>(
    REFERENCE_OBSERVATIONS[0]
  );
  const [searchConfig, setSearchConfig] = useState<SearchConfig>({
    searchMode: 'standard',
    freqRangeMinMHz: 1400,
    freqRangeMaxMHz: 1450,
    minPersistencePercent: 75,
    rfiFilterEnabled: true,
  });

  const [stageProgress, setStageProgress] = useState({
    preprocessing: 0,
    transform: 0,
    representing: 0,
    searching: 0,
    ranking: 0,
  });
  const [overallProgress, setOverallProgress] = useState(0);
  const [visibleCandidateCount, setVisibleCandidateCount] = useState(0);
  const [selectedCandidate, setSelectedCandidate] = useState<DiscoveredCandidate>(
    MOCK_DISCOVERY_CANDIDATES[0]
  );

  const candidatesRef = useRef<HTMLDivElement | null>(null);
  const animTimerRef = useRef<number | null>(null);

  // Clean up animation timers on unmount
  useEffect(() => {
    return () => {
      if (animTimerRef.current) cancelAnimationFrame(animTimerRef.current);
    };
  }, []);

  // Handle Observation Loaded
  const handleObservationLoaded = (obs: DiscoveryObservationMeta) => {
    setObservation(obs);
    setStage('observation_loaded');
    setOverallProgress(0);
    setStageProgress({
      preprocessing: 0,
      transform: 0,
      representing: 0,
      searching: 0,
      ranking: 0,
    });
    setVisibleCandidateCount(0);
    toast.success(`Observation record ${obs.id} loaded into discovery bay`, {
      description: `${obs.samplesCount.toLocaleString()} complex samples ready for PFB transform.`,
    });
  };

  // Handle Remove Observation
  const handleRemoveObservation = () => {
    setObservation(null);
    setStage('idle');
    setOverallProgress(0);
    setVisibleCandidateCount(0);
  };

  // Scroll to candidates section
  const handleScrollToCandidates = () => {
    candidatesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Deterministic Discovery Execution Flow
  const handleInitiateDiscovery = useCallback(() => {
    if (!observation) return;
    if (animTimerRef.current) cancelAnimationFrame(animTimerRef.current);

    setStage('preprocessing');
    setOverallProgress(0);
    setVisibleCandidateCount(0);

    toast.info(`Initiating Autonomous Signal Discovery [${observation.id}]`, {
      description: 'Deploying Polyphase Filterbank and Latent Feature Extraction...',
    });

    const pipelineSequence = [
      { stage: 'preprocessing' as const, key: 'preprocessing' as const, duration: 1000 },
      { stage: 'transform' as const, key: 'transform' as const, duration: 1200 },
      { stage: 'representing' as const, key: 'representing' as const, duration: 1100 },
      { stage: 'searching' as const, key: 'searching' as const, duration: 1300 },
      { stage: 'ranking' as const, key: 'ranking' as const, duration: 1100 },
    ];

    let currentStepIdx = 0;

    const runStep = () => {
      if (currentStepIdx >= pipelineSequence.length) {
        setStage('complete');
        setOverallProgress(100);
        setVisibleCandidateCount(MOCK_DISCOVERY_CANDIDATES.length);
        toast.success('Autonomous Signal Search Procedure Complete', {
          description: `Identified 17 anomalous regions; isolated 4 high-priority candidate signals.`,
        });
        return;
      }

      const step = pipelineSequence[currentStepIdx];
      setStage(step.stage);
      const stepStartTime = performance.now();

      const animateStep = (now: number) => {
        const elapsed = now - stepStartTime;
        const progress = Math.min(100, (elapsed / step.duration) * 100);

        setStageProgress((prev) => ({
          ...prev,
          [step.key]: progress,
        }));

        const totalCompleted = currentStepIdx * 20 + (progress / 100) * 20;
        setOverallProgress(totalCompleted);

        // Gradually reveal candidate events during ranking stage
        if (step.stage === 'ranking') {
          const count = Math.min(
            MOCK_DISCOVERY_CANDIDATES.length,
            Math.floor((progress / 100) * MOCK_DISCOVERY_CANDIDATES.length) + 1
          );
          setVisibleCandidateCount(count);
        }

        if (progress < 100) {
          animTimerRef.current = requestAnimationFrame(animateStep);
        } else {
          currentStepIdx++;
          runStep();
        }
      };

      animTimerRef.current = requestAnimationFrame(animateStep);
    };

    runStep();
  }, [observation]);

  // Handle Reset to new discovery
  const handleReset = () => {
    if (animTimerRef.current) cancelAnimationFrame(animTimerRef.current);
    setStage(observation ? 'observation_loaded' : 'idle');
    setStageProgress({
      preprocessing: 0,
      transform: 0,
      representing: 0,
      searching: 0,
      ranking: 0,
    });
    setOverallProgress(0);
    setVisibleCandidateCount(0);
    toast('Discovery workspace reset');
  };

  const isAnalyzing =
    stage === 'preprocessing' ||
    stage === 'transform' ||
    stage === 'representing' ||
    stage === 'searching' ||
    stage === 'ranking';

  return (
    <PageTransition className="space-y-4">
      {/* 1. Header */}
      <DiscoveryHeader stage={stage} />

      {/* 2. Top Observation Bay: Dropzone vs. Loaded Observation Summary */}
      <AnimatePresence mode="wait">
        {!observation ? (
          <motion.div
            key="dropzone-view"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <ObservationDropzone onObservationLoaded={handleObservationLoaded} />
          </motion.div>
        ) : (
          <motion.div
            key="summary-view"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <ObservationSummary
              observation={observation}
              onRemove={handleRemoveObservation}
              onInitiateDiscovery={handleInitiateDiscovery}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Analysis Configuration (Visible when observation loaded and not running) */}
      {!isAnalyzing && stage !== 'complete' && observation && (
        <SearchConfiguration
          config={searchConfig}
          onChange={setSearchConfig}
          disabled={isAnalyzing}
        />
      )}

      {/* 4. Live Analysis Section: Signal Viewport + Pipeline Progress */}
      {(isAnalyzing || stage === 'complete') && observation && (
        <div className="space-y-4">
          {/* Central Evolving Signal Viewport */}
          <SignalAnalysisViewport
            stage={stage}
            observation={observation}
            overallProgress={overallProgress}
          />

          {/* Dual Column: Pipeline Stages & Results */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-12">
              <DiscoveryPipeline stage={stage} stageProgress={stageProgress} />
            </div>
          </div>
        </div>
      )}

      {/* 5. Completion Result Banner */}
      {stage === 'complete' && (
        <DiscoveryResults
          summary={MOCK_DISCOVERY_RESULT}
          onReset={handleReset}
          onScrollToCandidates={handleScrollToCandidates}
        />
      )}

      {/* 6. Candidate Events Ranking & Preview Section */}
      {(stage === 'ranking' || stage === 'complete') && visibleCandidateCount > 0 && (
        <div ref={candidatesRef} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Ranking Table (8 cols) */}
            <div className="lg:col-span-8">
              <CandidateRankingTable
                candidates={MOCK_DISCOVERY_CANDIDATES}
                selectedCandidateId={selectedCandidate.id}
                onSelectCandidate={setSelectedCandidate}
                visibleCount={visibleCandidateCount}
              />
            </div>

            {/* Right: Top Candidate Preview & Interpretability (4 cols) */}
            <div className="lg:col-span-4">
              <CandidatePreview candidate={selectedCandidate} />
            </div>
          </div>
        </div>
      )}
    </PageTransition>
  );
}
