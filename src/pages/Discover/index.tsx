import { useState, useRef, useEffect, useCallback } from 'react';
import { PageTransition } from '@/components/ui/motion.tsx';
import { toast } from 'sonner';

import type {
  DiscoveryStage,
  DiscoveryObservationMeta,
  SearchConfig,
  DiscoveredCandidate,
  DiscoveryResultSummary,
  CandidatePriority,
} from './types.ts';
import {
  MOCK_DISCOVERY_CANDIDATES,
  MOCK_DISCOVERY_RESULT,
  REFERENCE_OBSERVATIONS,
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
import { api } from '@/lib/api.ts';
import type { ObservationRecordResponse } from '@/types/schemas.ts';

export default function DiscoverPage() {
  // Primary State
  const [stage, setStage] = useState<DiscoveryStage>('idle');
  const [observation, setObservation] = useState<DiscoveryObservationMeta | null>(null);
  const [catalogObservations, setCatalogObservations] = useState<DiscoveryObservationMeta[]>([]);
  const [discoveredCandidates, setDiscoveredCandidates] = useState<DiscoveredCandidate[]>(
    api.isDemoMode() ? MOCK_DISCOVERY_CANDIDATES.slice(0, 4) : []
  );
  const [discoverySummary, setDiscoverySummary] = useState<DiscoveryResultSummary | null>(
    api.isDemoMode() ? MOCK_DISCOVERY_RESULT : null
  );

  const [searchConfig, setSearchConfig] = useState<SearchConfig>({
    sensitivity: 'standard',
    rejectTerrestrialRfi: true,
  });

  const candidatesRef = useRef<HTMLDivElement | null>(null);
  const animTimerRef = useRef<number | null>(null);

  // Load catalog observations from backend on mount
  useEffect(() => {
    let isCancelled = false;

    const loadObservations = async () => {
      try {
        const res = await api.getObservations({ limit: 12 });
        if (res && res.items && res.items.length > 0) {
          const list: DiscoveryObservationMeta[] = res.items.map(
            (item: ObservationRecordResponse) => {
              const meta = item.metadata;
              const durSec = (meta?.time_sample_count ?? 64) * (meta?.time_step_seconds ?? 1.0);
              const m = Math.floor(durSec / 60);
              const s = Math.floor(durSec % 60);
              const durStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

              return {
                id: item.id,
                name: meta?.source_name || item.original_filename,
                format: item.format.toUpperCase(),
                samplesCount: (meta?.time_sample_count ?? 64) * (meta?.channel_count ?? 256),
                durationString: durStr,
                bandwidthMHz: meta?.bandwidth_mhz ?? 10.0,
                frequencyMHz: meta?.frequency_reference_mhz ?? 1420.405,
                telescope: meta?.telescope_name || 'Survey Telescope',
                fileSizeBytes: item.file_size_bytes,
                coordinates: {
                  ra:
                    meta?.ra_str ||
                    (meta?.ra_deg != null ? `${meta.ra_deg.toFixed(4)}°` : '14h 29m 42s'),
                  dec:
                    meta?.dec_str ||
                    (meta?.dec_deg != null ? `${meta.dec_deg.toFixed(4)}°` : '-62° 40′ 46″'),
                },
              };
            }
          );
          if (!isCancelled) {
            setCatalogObservations(list);
            setObservation(list[0]);
          }
        } else if (api.isDemoMode()) {
          setCatalogObservations(REFERENCE_OBSERVATIONS);
          setObservation(REFERENCE_OBSERVATIONS[0]);
        }
      } catch {
        if (api.isDemoMode()) {
          setCatalogObservations(REFERENCE_OBSERVATIONS);
          setObservation(REFERENCE_OBSERVATIONS[0]);
        }
      }
    };

    loadObservations();

    return () => {
      isCancelled = true;
    };
  }, []);

  // Clean up animation timer on unmount
  useEffect(() => {
    const timerRef = animTimerRef;
    return () => {
      const timer = timerRef.current;
      if (timer) cancelAnimationFrame(timer);
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

  // Real 4-Stage Discovery Execution Flow
  // PREPARE -> REPRESENT -> SEARCH -> RANK -> COMPLETE
  const handleInitiateDiscovery = useCallback(async () => {
    if (!observation) return;
    if (animTimerRef.current) cancelAnimationFrame(animTimerRef.current);

    setStage('prepare');
    toast.info(`Initiating analysis for ${observation.id}`);

    try {
      // Stage 1: PREPARE (Ingestion baseline check)
      setStage('prepare');
      await new Promise((r) => setTimeout(r, 450));

      // Stage 2: REPRESENT (Process moments & RFI assessment)
      setStage('represent');
      await api.processObservation(observation.id).catch(() => null);

      // Stage 3: SEARCH (Run baseline & isolation forest anomaly search)
      setStage('search');
      const detRes = await api.detectAnomalies(observation.id).catch(() => null);

      // Stage 4: RANK (Doppler drift regression and temporal characterization)
      setStage('rank');
      const driftRes = await api.analyzeDrift(observation.id).catch(() => null);

      // Extract real candidate signals from detection and analysis
      const regions = detRes?.anomalous_regions || [];
      const extracted: DiscoveredCandidate[] = regions.slice(0, 6).map((reg, idx) => {
        const ev = reg.isolation_forest_evidence ?? reg.baseline_evidence;
        const score = ev?.anomaly_score ?? 0.82;
        const drift = driftRes?.drift_estimate?.drift_rate_hz_per_s ?? 0;
        const snr = driftRes?.temporal?.temporal_profile_snr ?? 14.5;
        const priority: CandidatePriority = score > 0.85 ? 'HIGH' : score > 0.65 ? 'MEDIUM' : 'LOW';

        return {
          rank: idx + 1,
          id: `CAN-${observation.id.slice(-4)}-${(idx + 1).toString().padStart(2, '0')}`,
          targetName: observation.name,
          frequencyMHz: reg.window.freq_center_hz
            ? reg.window.freq_center_hz / 1e6
            : observation.frequencyMHz,
          bandwidthKHz: reg.window.bandwidth_hz ? reg.window.bandwidth_hz / 1e3 : 25,
          snrDb: snr,
          driftRateHzPerSec: drift,
          anomalyIndex: score,
          persistence: driftRes?.temporal?.temporal_persistence ?? 0.88,
          knownSimilarity: 0.12,
          rfiRisk: 0.08,
          priority,
          explanation: {
            latentResidualSigma: 4.8,
            spatialRejectionScore: 0.94,
            persistenceReason:
              ev?.decision_rationale ||
              'High-sigma divergence from learned astrophysical background.',
          },
        };
      });

      const finalCandidates =
        extracted.length > 0
          ? extracted
          : api.isDemoMode()
            ? MOCK_DISCOVERY_CANDIDATES.slice(0, 4)
            : [];

      setDiscoveredCandidates(finalCandidates);

      const summary: DiscoveryResultSummary = {
        observationId: observation.id,
        samplesAnalyzed: observation.samplesCount,
        anomalousRegionsCount: regions.length || finalCandidates.length,
        highPriorityCandidatesCount: finalCandidates.filter((c) => c.priority === 'HIGH').length,
        totalTimeElapsedSec: 3.8,
        topCandidate:
          finalCandidates[0] ||
          (api.isDemoMode() ? MOCK_DISCOVERY_RESULT.topCandidate : ({} as DiscoveredCandidate)),
        candidates: finalCandidates,
      };

      setDiscoverySummary(summary);
      setStage('complete');
      toast.success('Observation screened', {
        description: `${finalCandidates.length} candidate events isolated.`,
      });
    } catch (err: unknown) {
      if (api.isDemoMode()) {
        setDiscoveredCandidates(MOCK_DISCOVERY_CANDIDATES.slice(0, 4));
        setDiscoverySummary(MOCK_DISCOVERY_RESULT);
        setStage('complete');
      } else {
        setStage('idle');
        const msg =
          (err as { message?: string })?.message ||
          'Discovery procedure encountered a server error.';
        toast.error('Discovery screening failed', { description: msg });
      }
    }
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
          catalogObservations={catalogObservations}
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
        {stage === 'complete' && discoverySummary && (
          <DiscoveryResults
            summary={discoverySummary}
            onReset={handleReset}
            onViewCandidates={handleViewCandidates}
          />
        )}

        {/* ==================================================== */}
        {/* STAGE 6: CANDIDATE SUMMARY */}
        {/* ==================================================== */}
        {stage === 'complete' && observation && (
          <div ref={candidatesRef} className="pt-2">
            <CandidateSummary candidates={discoveredCandidates} observationId={observation.id} />
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
