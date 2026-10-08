import { useState, useRef, useEffect, useCallback } from 'react';
import { PageTransition } from '@/components/ui/motion.tsx';
import { toast } from 'sonner';

import type { DiscoveryStage, DiscoveryObservationMeta, SearchConfig } from './types.ts';
import { MOCK_DISCOVERY_CANDIDATES, MOCK_DISCOVERY_RESULT } from './data/mockDiscovery.ts';

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
  const [observation, setObservation] = useState<DiscoveryObservationMeta | null>(null);
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

  // Handle Observation Selection (clicking selected item again toggles off to idle state)
  const handleSelectObservation = (obs: DiscoveryObservationMeta) => {
    setObservation((prev) => (prev?.id === obs.id ? null : obs));
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
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
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
        {/* STAGE 3: INITIATE DISCOVERY (CLEAR PRIMARY ACTION / IDLE STATE) */}
        {/* ==================================================== */}
        {!isAnalyzing && stage !== 'complete' && (
          <div className="pt-2 pb-6 border-t border-[#D6D2C9] select-none">
            {observation ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-[3px] bg-[#FAF8F5] border border-[#376A9B]/40 shadow-xs">
                <div className="space-y-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#3D7D54]" />
                    <span className="text-sm font-semibold text-[#17202A]">
                      Observation ready for screening
                    </span>
                  </div>
                  <p className="text-xs text-[#56616A]">
                    Observation{' '}
                    <span className="font-mono text-[#376A9B] font-semibold">{observation.id}</span>{' '}
                    will be processed through baseline calibration, latent manifold mapping, and
                    Doppler classification.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="lg"
                  icon={<ArrowRight className="h-4 w-4" />}
                  onClick={handleInitiateDiscovery}
                  className="w-full sm:w-auto text-sm font-semibold shrink-0 py-3 px-6 shadow-xs"
                >
                  Begin discovery
                </Button>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-[3px] border border-[#D6D2C9] bg-[#EAE7E0]/50 opacity-70">
                <div className="space-y-0.5 text-left">
                  <span className="text-xs font-mono uppercase tracking-wider text-[#76828D]">
                    Phase 3 · Pipeline Trigger
                  </span>
                  <p className="text-xs text-[#56616A]">
                    Select a target observation above to enable screening execution.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  disabled
                  icon={<ArrowRight className="h-4 w-4" />}
                  className="w-full sm:w-auto text-xs font-medium cursor-not-allowed opacity-40"
                >
                  Begin discovery
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* STAGE 4: ANALYSIS PROGRESS (PREPARE, REPRESENT, SEARCH, RANK) */}
        {/* ==================================================== */}
        {(isAnalyzing || stage === 'complete') && observation && (
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
        {stage === 'complete' && observation && (
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
      </div>
    </PageTransition>
  );
}
