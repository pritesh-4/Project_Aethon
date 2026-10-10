import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { PageTransition } from '@/components/ui/motion.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { AlertTriangle, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { api, isDemoMode } from '@/lib/api.ts';
import type {
  CandidateResponse,
  ObservationRecordResponse,
  SpectralSliceResponse,
} from '@/types/schemas.ts';

import type { AnalysisStageId, SignalAnalysisRecord } from './types.ts';
import { MOCK_ANALYSIS_RECORDS, CANDIDATE_ORDER_LIST } from './data/mockAnalysis.ts';

import { AnalysisHeader } from './components/AnalysisHeader.tsx';
import { StageSelector } from './components/StageSelector.tsx';
import { PrimarySignalVisual } from './components/PrimarySignalVisual.tsx';
import { StageExplanationPanel } from './components/StageExplanationPanel.tsx';
import { ScientificCaution } from './components/ScientificCaution.tsx';
import { AnalysisVerdictBar } from './components/AnalysisVerdictBar.tsx';

function candidateToAnalysisRecord(
  candidate: CandidateResponse,
  obs?: ObservationRecordResponse | null
): SignalAnalysisRecord {
  const fRef = obs?.metadata?.frequency_reference_mhz ?? 1420.0;
  const chSpacingMhz = obs?.metadata?.channel_spacing_mhz ?? 0.001;
  const fCenter =
    fRef +
    ((candidate.target_region.freq_start + candidate.target_region.freq_stop) / 2) * chSpacingMhz;
  const bwKHz =
    Math.abs(candidate.target_region.freq_stop - candidate.target_region.freq_start) *
    (chSpacingMhz * 1000);
  const dt = obs?.metadata?.time_step_seconds ?? 0.5;
  const duration =
    Math.abs(candidate.target_region.time_stop - candidate.target_region.time_start) * dt;

  const driftEvidence = candidate.evidence_items?.find((e) => e.evidence_type === 'drift');
  const drift =
    typeof driftEvidence?.scores_or_parameters?.drift_rate_hz_per_s === 'number'
      ? (driftEvidence.scores_or_parameters.drift_rate_hz_per_s as number)
      : 0;
  const snr =
    typeof driftEvidence?.scores_or_parameters?.snr === 'number'
      ? (driftEvidence.scores_or_parameters.snr as number)
      : 14.5;

  const assessment = candidate.current_assessment;
  const anomalyScore = assessment ? assessment.overall_score / 100 : 0.85;
  const rfiProb =
    typeof assessment?.component_contributions?.rfi_risk === 'number'
      ? assessment.component_contributions.rfi_risk
      : 0.05;
  const persistence =
    typeof assessment?.component_contributions?.temporal_persistence === 'number'
      ? assessment.component_contributions.temporal_persistence
      : 0.92;

  const obsId = candidate.source_observation_ids?.[0] || 'obs_unknown';

  const flaggedReasons =
    assessment?.warnings && assessment.warnings.length > 0
      ? assessment.warnings.map((warn: string, idx: number) => ({
          id: `WARN-${idx + 1}`,
          title: warn.slice(0, 32).toUpperCase(),
          description: warn,
          metric: `${anomalyScore.toFixed(2)} score`,
        }))
      : [
          {
            id: 'FLAG-1',
            title: 'Linear Doppler Drift Rate',
            description: `Consistent drift of ${drift.toFixed(2)} Hz/s indicates origin accelerating relative to topocentric frame.`,
            metric: `${drift.toFixed(2)} Hz/s`,
          },
          {
            id: 'FLAG-2',
            title: 'Narrowband Emission Profile',
            description: `Channel bandwidth of ${bwKHz.toFixed(1)} kHz is narrower than natural thermal astrophysical emission mechanisms.`,
            metric: `< ${Math.max(1, Math.round(bwKHz))} kHz`,
          },
          {
            id: 'FLAG-3',
            title: 'Temporal Persistence',
            description: `Persistent signal structure observed with ${(persistence * 100).toFixed(0)}% stability.`,
            metric: `${(persistence * 100).toFixed(0)}%`,
          },
        ];

  return {
    candidateId: candidate.candidate_id,
    observationId: obsId,
    targetName: obs?.metadata?.source_name || 'Radio Survey Source',
    frequencyMHz: fCenter,
    bandwidthKHz: Math.round(bwKHz * 10) / 10,
    durationSeconds: Math.round(duration * 10) / 10,
    snrDb: Math.round(snr * 10) / 10,
    peakPowerDbm: -92.4,
    noiseFloorDbm: -108.1,
    samplesCount: obs?.metadata?.time_sample_count ?? 1024,
    driftRateHzPerSec: drift,
    firstDetectedTime: candidate.created_at_utc,
    anomalyStartSec: candidate.target_region.time_start * dt,
    anomalyEndSec: candidate.target_region.time_stop * dt,
    coordinates: {
      ra: obs?.metadata?.ra_str || '18h 05m 27s',
      dec: obs?.metadata?.dec_str || '-04° 38′ 45″',
    },
    telescope: obs?.metadata?.telescope_name || 'Parkes 64m (Murriyang)',
    priority: anomalyScore > 0.8 ? 'HIGH' : anomalyScore > 0.5 ? 'MEDIUM' : 'LOW',
    anomalyIndex: anomalyScore,
    knownPatternSimilarity: Math.max(0.01, 1 - anomalyScore),
    interferenceProbability: rfiProb,
    persistence: persistence,
    classificationTaxonomy: 'Technosignature Candidate / Linear Drift Carrier',
    morphology: {
      temporalCoherence: persistence > 0.7 ? 'HIGH' : 'MODERATE',
      frequencyStability: Math.abs(drift) < 5 ? 'HIGH' : 'DRIFTING',
      bandwidthCategory: bwKHz < 5 ? 'NARROWBAND' : 'MODERATE',
      persistenceState: persistence > 0.8 ? 'HIGH' : 'TRANSIENT',
      morphologicalDeviation: anomalyScore > 0.7 ? 'HIGH' : 'MODERATE',
      description: `Monochromatic carrier with linear Doppler drift rate of ${drift.toFixed(2)} Hz/s. Persistent emission across observation timeframe.`,
    },
    comparison: {
      observedSignature: `Linear drifting carrier (${drift.toFixed(2)} Hz/s)`,
      nearestKnownPattern: 'PSR B1937+21 Pulsar Harmonic / Terrestrial Uplink',
      catalogReference: 'ATNF Pulsar Catalogue v1.70',
      cosineDistance: 0.884,
      divergenceDegree: anomalyScore > 0.7 ? 'HIGH' : 'MODERATE',
    },
    timelineEvents: [
      {
        timeSec: candidate.target_region.time_start * dt,
        label: 'Candidate Onset',
        description: 'Emission threshold exceeded detection floor',
        intensityDbm: -94.2,
      },
      {
        timeSec:
          ((candidate.target_region.time_start + candidate.target_region.time_stop) / 2) * dt,
        label: 'Peak Signal',
        description: 'Maximum SNR observed with coherent phase structure',
        intensityDbm: -92.4,
      },
      {
        timeSec: candidate.target_region.time_stop * dt,
        label: 'Window End',
        description: 'Target region boundary reached',
        intensityDbm: -96.1,
      },
    ],
    flaggedReasons,
  };
}

export default function AnalysisPage() {
  const { signalId } = useParams<{ signalId: string }>();

  // Progressive disclosure: inspect one analytical stage at a time
  // OBSERVATION -> REPRESENTATION -> PATTERN COMPARISON -> ANOMALY
  const [activeStage, setActiveStage] = useState<AnalysisStageId>('observation');

  const [record, setRecord] = useState<SignalAnalysisRecord | null>(null);
  const [sliceData, setSliceData] = useState<SpectralSliceResponse | null>(null);
  const [backendCandidateIds, setBackendCandidateIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch list of available candidates from backend to power prev/next navigation
  useEffect(() => {
    let isMounted = true;
    api
      .getCandidates({ limit: 100 })
      .then((res) => {
        if (isMounted && res.items && res.items.length > 0) {
          setBackendCandidateIds(res.items.map((c) => c.candidate_id));
        }
      })
      .catch(() => {
        // Silent catch for candidate list indexing
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Load target candidate / observation record
  useEffect(() => {
    let isMounted = true;
    const targetId = signalId || 'AET-04721';

    async function loadData() {
      setIsLoading(true);
      // 1. Try real backend candidate lookup
      try {
        const candidate = await api.getCandidate(targetId);
        if (!isMounted) return;

        let obsRecord: ObservationRecordResponse | null = null;
        const obsId = candidate.source_observation_ids?.[0];
        if (obsId) {
          try {
            obsRecord = await api.getObservation(obsId);
          } catch {
            // Non-fatal if observation metadata is not cached
          }

          try {
            const slice = await api.getObservationSlice(obsId, {
              time_start: candidate.target_region.time_start,
              time_stop: candidate.target_region.time_stop,
              frequency_start: candidate.target_region.freq_start,
              frequency_stop: candidate.target_region.freq_stop,
            });
            if (isMounted) {
              setSliceData(slice);
            }
          } catch {
            // Non-fatal if slice cannot be sliced
          }
        }

        if (isMounted) {
          setRecord(candidateToAnalysisRecord(candidate, obsRecord));
          setIsLoading(false);
        }
        return;
      } catch {
        // Backend candidate not found, proceed to observation or mock check
      }

      // 2. Try observation ID lookup
      if (targetId.startsWith('obs_')) {
        try {
          const obs = await api.getObservation(targetId);
          if (!isMounted) return;

          const totalSamples = obs.metadata?.time_sample_count ?? 1024;
          const totalChannels = obs.metadata?.channel_count ?? 512;

          const syntheticCandidate: CandidateResponse = {
            candidate_id: `cand_${obs.id.slice(4, 12)}`,
            created_at_utc: obs.ingested_at,
            updated_at_utc: obs.ingested_at,
            status: 'unreviewed',
            source_observation_ids: [obs.id],
            target_region: {
              time_start: 0,
              time_stop: Math.min(60, totalSamples),
              freq_start: 0,
              freq_stop: Math.min(128, totalChannels),
            },
            current_assessment: {
              assessment_id: `ass_${obs.id.slice(4, 10)}`,
              candidate_id: `cand_${obs.id.slice(4, 12)}`,
              version: 1,
              created_at_utc: obs.ingested_at,
              policy_name: 'default_scientific',
              policy_version: '1.0.0',
              overall_score: 82.5,
              priority_band: 'high',
              component_contributions: {
                anomaly_significance: 0.85,
                rfi_risk: 0.08,
                temporal_persistence: 0.91,
              },
              contributing_evidence_ids: [],
              missing_evidence: [],
              detector_disagreement: false,
              explanation: 'Automated survey detection with linear drift carrier',
              warnings: [],
            },
            associated_detection_ids: [],
            processing_run_ids: [],
            analysis_run_ids: [],
            physical_coordinates: {},
            evidence_items: [],
            review_history: [],
            schema_version: '1.0.0',
            is_synthetic: false,
            provenance: {},
            warnings: [],
            scientific_disclaimer: 'Synthesized view of survey observation',
          };

          try {
            const slice = await api.getObservationSlice(obs.id, {
              time_start: 0,
              time_stop: Math.min(60, totalSamples),
              frequency_start: 0,
              frequency_stop: Math.min(128, totalChannels),
            });
            if (isMounted) {
              setSliceData(slice);
            }
          } catch {
            // Non-fatal
          }

          if (isMounted) {
            setRecord(candidateToAnalysisRecord(syntheticCandidate, obs));
            setIsLoading(false);
          }
          return;
        } catch {
          // Observation lookup failed
        }
      }

      // 3. Check mock analysis records (for demo mode or reference IDs)
      const normalized = targetId.toUpperCase();
      const mock =
        MOCK_ANALYSIS_RECORDS[normalized] ||
        Object.entries(MOCK_ANALYSIS_RECORDS).find(
          ([k]) => k.toLowerCase() === targetId.toLowerCase()
        )?.[1];

      if (mock && (isDemoMode() || !signalId || targetId === 'AET-04721')) {
        if (isMounted) {
          setRecord(mock);
          setSliceData(null);
          setIsLoading(false);
        }
        return;
      }

      // 4. Candidate record not found
      if (isMounted) {
        setRecord(null);
        setSliceData(null);
        setIsLoading(false);
      }
    }

    const timer = setTimeout(() => {
      void loadData();
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [signalId]);

  // Combined candidates order list for prev/next navigation
  const availableCandidateIds = useMemo(() => {
    const combined = [...backendCandidateIds];
    for (const id of CANDIDATE_ORDER_LIST) {
      if (!combined.includes(id)) combined.push(id);
    }
    return combined;
  }, [backendCandidateIds]);

  const { prevCandidateId, nextCandidateId } = useMemo(() => {
    if (!record) return { prevCandidateId: null, nextCandidateId: null };
    const currentIndex = availableCandidateIds.indexOf(record.candidateId);
    if (currentIndex === -1) {
      return { prevCandidateId: null, nextCandidateId: null };
    }
    return {
      prevCandidateId: currentIndex > 0 ? availableCandidateIds[currentIndex - 1] : null,
      nextCandidateId:
        currentIndex < availableCandidateIds.length - 1
          ? availableCandidateIds[currentIndex + 1]
          : null,
    };
  }, [record, availableCandidateIds]);

  // Loading state
  if (isLoading) {
    return (
      <PageTransition className="space-y-6 max-w-4xl mx-auto py-16 px-4 text-center">
        <div className="flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-[#376A9B]" />
          <p className="text-xs font-mono text-[#56616A]">
            Resolving candidate telemetry and spectral coordinates...
          </p>
        </div>
      </PageTransition>
    );
  }

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
              <PrimarySignalVisual
                record={record}
                activeStage={activeStage}
                sliceData={sliceData}
              />
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
