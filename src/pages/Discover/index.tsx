import { useState, useRef, useEffect, useCallback } from 'react';
import { PageTransition } from '@/components/ui/motion.tsx';
import { toast } from 'sonner';

import type { DiscoveryStage, DiscoveryObservationMeta, SearchConfig } from './types.ts';
import {
  REFERENCE_OBSERVATIONS,
  MOCK_DISCOVERY_CANDIDATES,
  MOCK_DISCOVERY_RESULT,
} from './data/mockDiscovery.ts';

import { DiscoveryHeader } from './components/DiscoveryHeader.tsx';
import { ObservationInput } from './components/ObservationInput.tsx';
import { SearchSettings } from './components/SearchSettings.tsx';
import { DiscoveryPipeline } from './components/DiscoveryPipeline.tsx';
import { SignalAnalysisViewport } from './components/SignalAnalysisViewport.tsx';
import { DiscoveryResults } from './components/DiscoveryResults.tsx';
import { CandidateSummary } from './components/CandidateSummary.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { ArrowRight, RotateCcw } from 'lucide-react';

export default function DiscoverPage() {
  // Primary State
  const [stage, setStage] = useState<DiscoveryStage>('idle');
  const [observation, setObservation] = useState<DiscoveryObservationMeta>(
    REFERENCE_OBSERVATIONS[0]
  );
  const [searchConfig, setSearchConfig] = useState<SearchConfig>({
    sensitivity: 'standard',
    rejectTerrestrialRfi: true,
  });

  const candidatesRef = useRef<HTMLDivElement | null>(null);
  const animTimerRef = useRef<number | null>(null);

  // Clean up animation timer on unmount
  useEffect(() => {
    return () => {
      if (animTimerRef.current) cancelAnimationFrame(animTimerRef.current);
    };
  }, []);

  // Handle Observation Selection
  const handleSelectObservation = (obs: DiscoveryObservationMeta) => {
    setObservation(obs);
    if (stage === 'complete') {
      setStage('idle');
    }
  };

  // Scroll to candidates section
  const handleViewCandidates = () => {
    candidatesRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Deterministic 4-Stage Discovery Execution Flow
  // PREPARE -> REPRESENT -> SEARCH -> RANK -> COMPLETE
  const handleInitiateDiscovery = useCallback(() => {
    if (!observation) return;
    if (animTimerRef.current) cancelAnimationFrame(animTimerRef.current);

    setStage('prepare');
    toast.info(`Initiating analysis for ${observation.id}`);

    const stages: DiscoveryStage[] = ['prepare', 'represent', 'search', 'rank'];
    const stepDurations = [1200, 1300, 1400, 1200];
    let currentIdx = 0;

    const runNextStage = () => {
      if (currentIdx >= stages.length) {
        setStage('complete');
        toast.success('Observation analyzed', {
          description: '4 candidate events identified.',
        });
        return;
      }

      setStage(stages[currentIdx]);
      const duration = stepDurations[currentIdx];
      const start = performance.now();

      const waitStep = (now: number) => {
        if (now - start >= duration) {
          currentIdx++;
          runNextStage();
        } else {
          animTimerRef.current = requestAnimationFrame(waitStep);
        }
      };

      animTimerRef.current = requestAnimationFrame(waitStep);
    };

    runNextStage();
  }, [observation]);

  // Handle Reset to new discovery
  const handleReset = () => {
    if (animTimerRef.current) cancelAnimationFrame(animTimerRef.current);
    setStage('idle');
  };

  const isAnalyzing =
    stage === 'prepare' || stage === 'represent' || stage === 'search' || stage === 'rank';

  return (
    <PageTransition className="space-y-0">
      {/* 1. Scientific Header */}
      <DiscoveryHeader stage={stage} />

      {/* Main Scientific Procedure Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ==================================================== */}
        {/* STAGE 1: OBSERVATION INPUT & SEARCH SETTINGS */}
        {/* ==================================================== */}
        <ObservationInput
          selectedObservation={observation}
          onSelectObservation={handleSelectObservation}
          disabled={isAnalyzing}
        />

        {/* ==================================================== */}
        {/* STAGE 2: OPTIONAL SEARCH SETTINGS */}
        {/* ==================================================== */}
        {!isAnalyzing && stage !== 'complete' && (
          <SearchSettings config={searchConfig} onChange={setSearchConfig} disabled={isAnalyzing} />
        )}

        {/* ==================================================== */}
        {/* STAGE 3: INITIATE DISCOVERY (CLEAR PRIMARY ACTION) */}
        {/* ==================================================== */}
        {!isAnalyzing && stage !== 'complete' && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded border border-[#1C2630] bg-[#0B0F14] p-4 select-none">
            <div className="space-y-0.5 text-center sm:text-left">
              <span className="text-xs font-semibold text-[#E6EDF2]">
                Ready to analyze observation {observation.id}
              </span>
              <p className="text-[11px] text-[#7F8B95]">
                Executes the 4-stage candidate screening pipeline on the selected data stream.
              </p>
            </div>

            <Button
              variant="primary"
              size="lg"
              icon={<ArrowRight className="h-4 w-4" />}
              onClick={handleInitiateDiscovery}
              className="w-full sm:w-auto text-xs font-semibold uppercase tracking-wider"
            >
              Initiate Discovery
            </Button>
          </div>
        )}

        {/* ==================================================== */}
        {/* STAGE 4: ANALYSIS PROGRESS (PREPARE, REPRESENT, SEARCH, RANK) */}
        {/* ==================================================== */}
        {(isAnalyzing || stage === 'complete') && (
          <div className="space-y-4">
            {/* 4-Stage Procedure Status */}
            <DiscoveryPipeline stage={stage} />

            {/* Time-Frequency Spectrogram Viewport */}
            <SignalAnalysisViewport stage={stage} observation={observation} />
          </div>
        )}

        {/* ==================================================== */}
        {/* STAGE 5: RESULT BANNER (OBSERVATION ANALYZED) */}
        {/* ==================================================== */}
        {stage === 'complete' && (
          <DiscoveryResults
            summary={MOCK_DISCOVERY_RESULT}
            onReset={handleReset}
            onViewCandidates={handleViewCandidates}
          />
        )}

        {/* ==================================================== */}
        {/* STAGE 6: CANDIDATE SUMMARY */}
        {/* ==================================================== */}
        {stage === 'complete' && (
          <div ref={candidatesRef} className="pt-2">
            <CandidateSummary
              candidates={MOCK_DISCOVERY_CANDIDATES.slice(0, 4)}
              observationId={observation.id}
            />
          </div>
        )}

        {/* Reset / Configure button when analyzing */}
        {isAnalyzing && (
          <div className="flex justify-end pt-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<RotateCcw className="h-3 w-3" />}
              onClick={handleReset}
            >
              Cancel procedure
            </Button>
          </div>
        )}
      </main>
    </PageTransition>
  );
}
