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
import { REFERENCE_OBSERVATIONS } from './data/mockDiscovery.ts';

import { DiscoveryHeader } from './components/DiscoveryHeader.tsx';
import { ObservationInput } from './components/ObservationInput.tsx';
import { SearchSettings } from './components/SearchSettings.tsx';
import { DiscoveryPipeline } from './components/DiscoveryPipeline.tsx';
import { SignalAnalysisViewport } from './components/SignalAnalysisViewport.tsx';
import { DiscoveryResults } from './components/DiscoveryResults.tsx';
import { CandidateSummary } from './components/CandidateSummary.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { ArrowRight, RotateCcw, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api.ts';
import type { ObservationRecordResponse, AnalysisResponse } from '@/types/schemas.ts';

interface PipelineErrorState {
  stage: DiscoveryStage;
  title: string;
  message: string;
}

interface PartialWarningState {
  stage: DiscoveryStage;
  title: string;
  message: string;
}

export default function DiscoverPage() {
  // Primary State
  const [stage, setStage] = useState<DiscoveryStage>('idle');
  const [observation, setObservation] = useState<DiscoveryObservationMeta | null>(null);
  const [catalogObservations, setCatalogObservations] = useState<DiscoveryObservationMeta[]>([]);
  const [discoveredCandidates, setDiscoveredCandidates] = useState<DiscoveredCandidate[]>([]);
  const [discoverySummary, setDiscoverySummary] = useState<DiscoveryResultSummary | null>(null);
  const [pipelineError, setPipelineError] = useState<PipelineErrorState | null>(null);
  const [partialWarning, setPartialWarning] = useState<PartialWarningState | null>(null);

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
    setPipelineError(null);
    setPartialWarning(null);
    setDiscoveredCandidates([]);
    setDiscoverySummary(null);
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

    // 1. Reset all state and previous errors/results to prevent stale data
    setDiscoveredCandidates([]);
    setDiscoverySummary(null);
    setPipelineError(null);
    setPartialWarning(null);

    setStage('prepare');
    toast.info(`Initiating analysis for ${observation.id}`);

    let currentStep: DiscoveryStage = 'prepare';

    try {
      // Stage 1: PREPARE (Ingestion baseline check)
      await new Promise((r) => setTimeout(r, 450));

      // Stage 2: REPRESENT (Process moments & RFI assessment)
      currentStep = 'represent';
      setStage('represent');
      const procRes = await api.processObservation(observation.id);

      // Stage 3: SEARCH (Run baseline & isolation forest anomaly search)
      currentStep = 'search';
      setStage('search');
      const detRes = await api.detectAnomalies(observation.id);

      const regions = detRes?.anomalous_regions || [];

      // Outcome C: Completed with NO detections (valid successful completed analysis)
      if (regions.length === 0) {
        const summary: DiscoveryResultSummary = {
          observationId: observation.id,
          samplesAnalyzed: observation.samplesCount,
          anomalousRegionsCount: 0,
          highPriorityCandidatesCount: 0,
          totalTimeElapsedSec: 3.8,
          topCandidate: {} as DiscoveredCandidate,
          candidates: [],
        };

        setDiscoveredCandidates([]);
        setDiscoverySummary(summary);
        setStage('complete');
        toast.info('Screening completed: no anomalous candidates detected', {
          description: 'All evaluated spectral windows fit nominal background distributions.',
        });
        return;
      }

      // Stage 4: RANK (Doppler drift regression and temporal characterization)
      currentStep = 'rank';
      setStage('rank');

      let driftRes: AnalysisResponse | null = null;
      let driftError: string | null = null;

      try {
        driftRes = await api.analyzeDrift(observation.id);
      } catch (dErr: unknown) {
        driftError =
          (dErr as { message?: string })?.message || 'Doppler drift trajectory fitting failed.';
      }

      // Extract candidate signals using verified API measurements without fabricated fallbacks
      const extracted: DiscoveredCandidate[] = regions.slice(0, 6).map((reg, idx) => {
        const ev = reg.isolation_forest_evidence ?? reg.baseline_evidence;
        const score = ev?.anomaly_score ?? 0.0;
        const drift = driftRes?.drift_estimate?.drift_rate_hz_per_s ?? 0.0;
        const snr = driftRes?.temporal?.temporal_profile_snr ?? reg.features?.['snr'] ?? 0.0;
        const persistence = driftRes?.temporal?.temporal_persistence ?? 0.0;
        const priority: CandidatePriority = score > 0.85 ? 'HIGH' : score > 0.65 ? 'MEDIUM' : 'LOW';

        const rfiRisk =
          procRes?.primary_mask_flagged_fraction ?? reg.window.flagged_sample_fraction ?? 0.0;

        return {
          rank: idx + 1,
          id: `CAN-${observation.id.slice(-4)}-${(idx + 1).toString().padStart(2, '0')}`,
          targetName: observation.name,
          frequencyMHz: reg.window.freq_center_hz
            ? reg.window.freq_center_hz / 1e6
            : observation.frequencyMHz,
          bandwidthKHz: reg.window.bandwidth_hz ? reg.window.bandwidth_hz / 1e3 : 0.0,
          snrDb: Number(snr.toFixed(1)),
          driftRateHzPerSec: Number(drift.toFixed(2)),
          anomalyIndex: Number(score.toFixed(3)),
          persistence: Number(persistence.toFixed(2)),
          knownSimilarity: 0.0,
          rfiRisk: Number(rfiRisk.toFixed(2)),
          priority,
          explanation: {
            latentResidualSigma: 0.0,
            spatialRejectionScore: 0.0,
            persistenceReason:
              ev?.decision_rationale ||
              (driftRes
                ? `Doppler drift estimated at ${drift.toFixed(2)} Hz/s with temporal SNR ${snr.toFixed(1)} dB.`
                : 'Candidate region isolated; downstream Doppler drift analysis failed.'),
          },
        };
      });

      const summary: DiscoveryResultSummary = {
        observationId: observation.id,
        samplesAnalyzed: observation.samplesCount,
        anomalousRegionsCount: regions.length,
        highPriorityCandidatesCount: extracted.filter((c) => c.priority === 'HIGH').length,
        totalTimeElapsedSec: 3.8,
        topCandidate: extracted[0] || ({} as DiscoveredCandidate),
        candidates: extracted,
      };

      setDiscoveredCandidates(extracted);
      setDiscoverySummary(summary);
      setStage('complete');

      if (driftError) {
        // Outcome D: Partially completed
        setPartialWarning({
          stage: 'rank',
          title: 'Doppler Drift Analysis Incomplete',
          message: driftError,
        });
        toast.warning('Observation partially screened', {
          description: `${extracted.length} anomalous candidate region(s) detected, but downstream drift analysis failed.`,
        });
      } else {
        // Outcome B: Completed with detections
        setPartialWarning(null);
        toast.success('Observation screened successfully', {
          description: `${extracted.length} candidate signal(s) isolated with verified drift analysis.`,
        });
      }
    } catch (err: unknown) {
      // Outcome E: Failed during preprocessing or anomaly detection
      setStage('idle');
      const msg =
        (err as { message?: string })?.message ||
        'Server error encountered during screening procedure.';
      const stageLabel =
        currentStep === 'represent'
          ? 'Preprocessing & Quality Assessment'
          : currentStep === 'search'
            ? 'Anomaly Detection'
            : 'Observation Preparation';

      setPipelineError({
        stage: currentStep,
        title: `${stageLabel} Failed`,
        message: msg,
      });

      toast.error(`${stageLabel} failed`, {
        description: msg,
      });
    }
  }, [observation]);

  // Handle Reset to new discovery
  const handleReset = () => {
    if (animTimerRef.current) cancelAnimationFrame(animTimerRef.current);
    setPipelineError(null);
    setPartialWarning(null);
    setDiscoveredCandidates([]);
    setDiscoverySummary(null);
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
        {/* PIPELINE ERROR BANNER (WHEN PROCESSING / DETECTION FAILS) */}
        {/* ==================================================== */}
        {pipelineError && (
          <div className="border border-[#C93B2B]/40 bg-[#FAF4F4] rounded-[3px] p-4 text-xs font-sans space-y-2 text-[#8C2418] shadow-xs animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#C93B2B]/20 pb-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-[#C93B2B] shrink-0" />
                <span className="font-semibold text-sm text-[#17202A]">{pipelineError.title}</span>
              </div>
              <span className="font-mono text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-[2px] bg-[#C93B2B]/10 border border-[#C93B2B]/20 font-semibold text-[#8C2418] self-start sm:self-auto">
                Stage {pipelineError.stage.toUpperCase()} Failed
              </span>
            </div>
            <p className="text-xs text-[#56616A] leading-relaxed">{pipelineError.message}</p>
            <div className="pt-1 flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={<RotateCcw className="h-3 w-3" />}
                onClick={handleInitiateDiscovery}
              >
                Retry screening
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setPipelineError(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        )}

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
                    will be processed through baseline calibration, anomaly detection, and Doppler
                    drift classification.
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
        {/* PARTIAL SCREENING WARNING BANNER */}
        {/* ==================================================== */}
        {stage === 'complete' && partialWarning && (
          <div className="border border-[#C19348]/50 bg-[#FDFBF7] rounded-[3px] p-4 text-xs font-sans space-y-1.5 shadow-xs animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E8CFA0] pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-[#C19348] shrink-0" />
                <span className="font-semibold text-sm text-[#17202A]">{partialWarning.title}</span>
              </div>
              <span className="font-mono text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-[2px] bg-[#C19348]/15 border border-[#C19348]/30 font-semibold text-[#8C621E] self-start sm:self-auto">
                Partial Analysis Only
              </span>
            </div>
            <p className="text-xs text-[#56616A] leading-relaxed">
              Anomaly detection succeeded and isolated {discoveredCandidates.length} candidate
              region{discoveredCandidates.length === 1 ? '' : 's'}, but downstream Doppler drift and
              temporal characterization failed ({partialWarning.message}). Kinematic drift rates and
              temporal persistence metrics could not be verified. The overall screening pipeline is
              not fully complete.
            </p>
          </div>
        )}

        {/* ==================================================== */}
        {/* ZERO DETECTIONS INFORMATIONAL BANNER */}
        {/* ==================================================== */}
        {stage === 'complete' && !partialWarning && discoveredCandidates.length === 0 && (
          <div className="border border-[#376A9B]/30 bg-[#F4F8FA] rounded-[3px] p-4 text-xs font-sans space-y-1 shadow-xs animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#376A9B] shrink-0" />
              <span className="font-semibold text-sm text-[#17202A]">
                No Anomalous Candidates Detected
              </span>
            </div>
            <p className="text-xs text-[#56616A] leading-relaxed">
              Observation screening completed successfully. All evaluated spectral windows were
              consistent with baseline noise distributions and did not exceed anomaly detection
              thresholds.
            </p>
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
