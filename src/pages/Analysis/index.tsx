import { useState, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { PageTransition } from '@/components/ui/motion.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { AlertTriangle, ArrowLeft, RefreshCw, Loader2 } from 'lucide-react';
import { api } from '@/lib/api.ts';
import type {
  CandidateResponse,
  ObservationRecordResponse,
  SpectralSliceResponse,
} from '@/types/schemas.ts';

import type { AnalysisStageId, SignalAnalysisRecord } from './types.ts';

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
  const fRef = obs?.metadata?.frequency_reference_mhz ?? null;
  const chSpacingMhz = obs?.metadata?.channel_spacing_mhz ?? null;

  const physCoords = candidate.physical_coordinates as Record<string, unknown> | null | undefined;
  const physFreq = typeof physCoords?.frequency_mhz === 'number' ? physCoords.frequency_mhz : null;
  const physDrift =
    typeof physCoords?.drift_rate_hz_s === 'number' ? physCoords.drift_rate_hz_s : null;
  const physSnr = typeof physCoords?.snr_db === 'number' ? physCoords.snr_db : null;

  let fCenter: number | null = physFreq;
  if (fCenter == null && fRef != null && chSpacingMhz != null) {
    fCenter =
      fRef +
      ((candidate.target_region.freq_start + candidate.target_region.freq_stop) / 2) * chSpacingMhz;
  }

  const bwKHz =
    chSpacingMhz != null
      ? Math.abs(candidate.target_region.freq_stop - candidate.target_region.freq_start) *
        (chSpacingMhz * 1000)
      : null;

  const dt = obs?.metadata?.time_step_seconds ?? null;
  const duration =
    dt != null
      ? Math.abs(candidate.target_region.time_stop - candidate.target_region.time_start) * dt
      : null;

  const driftEvidence = candidate.evidence_items?.find((e) => e.evidence_type === 'drift');
  const drift =
    physDrift != null
      ? physDrift
      : typeof driftEvidence?.scores_or_parameters?.drift_rate_hz_per_s === 'number'
        ? (driftEvidence.scores_or_parameters.drift_rate_hz_per_s as number)
        : null;

  const snr =
    physSnr != null
      ? physSnr
      : typeof driftEvidence?.scores_or_parameters?.snr === 'number'
        ? (driftEvidence.scores_or_parameters.snr as number)
        : null;

  const assessment = candidate.current_assessment;
  const anomalyScore = assessment?.overall_score != null ? assessment.overall_score / 100 : null;
  const rfiProb =
    typeof assessment?.component_contributions?.rfi_risk === 'number'
      ? assessment.component_contributions.rfi_risk
      : null;
  const persistence =
    typeof assessment?.component_contributions?.temporal_persistence === 'number'
      ? assessment.component_contributions.temporal_persistence
      : null;

  const obsId = candidate.source_observation_ids?.[0] || 'obs_unknown';

  const flaggedReasons =
    assessment?.warnings && assessment.warnings.length > 0
      ? assessment.warnings.map((warn: string, idx: number) => ({
          id: `WARN-${idx + 1}`,
          title: warn.slice(0, 32).toUpperCase(),
          description: warn,
          metric: anomalyScore != null ? `${anomalyScore.toFixed(2)} score` : 'Flagged',
        }))
      : [
          ...(drift != null
            ? [
                {
                  id: 'FLAG-1',
                  title: 'Linear Doppler Drift Rate',
                  description: `Drift estimate of ${drift.toFixed(2)} Hz/s measured by Doppler regression.`,
                  metric: `${drift.toFixed(2)} Hz/s`,
                },
              ]
            : []),
          ...(bwKHz != null
            ? [
                {
                  id: 'FLAG-2',
                  title: 'Target Channel Bandwidth',
                  description: `Isolated candidate window spans ${bwKHz.toFixed(1)} kHz.`,
                  metric: `${bwKHz.toFixed(1)} kHz`,
                },
              ]
            : []),
          ...(persistence != null
            ? [
                {
                  id: 'FLAG-3',
                  title: 'Temporal Persistence',
                  description: `Persistence fraction across observation window is ${(persistence * 100).toFixed(1)}%.`,
                  metric: `${(persistence * 100).toFixed(1)}%`,
                },
              ]
            : []),
        ];

  const priorityBand = assessment?.priority_band?.toUpperCase();
  const priority: 'HIGH' | 'MEDIUM' | 'LOW' =
    priorityBand === 'HIGH' || priorityBand === 'MEDIUM' || priorityBand === 'LOW'
      ? priorityBand
      : anomalyScore != null
        ? anomalyScore > 0.8
          ? 'HIGH'
          : anomalyScore > 0.5
            ? 'MEDIUM'
            : 'LOW'
        : 'LOW';

  const timelineEvents =
    dt != null
      ? [
          {
            timeSec: candidate.target_region.time_start * dt,
            label: 'Candidate Window Start',
            description: `Target window start at index ${candidate.target_region.time_start}`,
            intensityDbm: null,
          },
          {
            timeSec:
              ((candidate.target_region.time_start + candidate.target_region.time_stop) / 2) * dt,
            label: 'Window Center',
            description: 'Midpoint of detected anomalous region',
            intensityDbm: null,
          },
          {
            timeSec: candidate.target_region.time_stop * dt,
            label: 'Candidate Window End',
            description: `Target window stop at index ${candidate.target_region.time_stop}`,
            intensityDbm: null,
          },
        ]
      : [];

  return {
    candidateId: candidate.candidate_id,
    observationId: obsId,
    targetName: obs?.metadata?.source_name || obs?.original_filename || 'Radio Survey Source',
    frequencyMHz: fCenter,
    bandwidthKHz: bwKHz != null ? Math.round(bwKHz * 10) / 10 : null,
    durationSeconds: duration != null ? Math.round(duration * 10) / 10 : null,
    snrDb: snr != null ? Math.round(snr * 10) / 10 : null,
    peakPowerDbm: null,
    noiseFloorDbm: null,
    samplesCount: obs?.metadata?.time_sample_count ?? null,
    driftRateHzPerSec: drift != null ? Math.round(drift * 100) / 100 : null,
    firstDetectedTime: candidate.created_at_utc,
    anomalyStartSec: dt != null ? candidate.target_region.time_start * dt : null,
    anomalyEndSec: dt != null ? candidate.target_region.time_stop * dt : null,
    coordinates: {
      ra:
        obs?.metadata?.ra_str ||
        (obs?.metadata?.ra_deg != null ? `${obs.metadata.ra_deg.toFixed(4)}°` : null),
      dec:
        obs?.metadata?.dec_str ||
        (obs?.metadata?.dec_deg != null ? `${obs.metadata.dec_deg.toFixed(4)}°` : null),
    },
    telescope: obs?.metadata?.telescope_name || null,
    priority,
    anomalyIndex: anomalyScore,
    knownPatternSimilarity: null,
    interferenceProbability: rfiProb,
    persistence,
    classificationTaxonomy: 'Unsupervised Detection / Candidate Record',
    morphology: {
      temporalCoherence: persistence != null && persistence > 0.7 ? 'HIGH' : 'MODERATE',
      frequencyStability: drift != null && Math.abs(drift) < 5 ? 'HIGH' : 'DRIFTING',
      bandwidthCategory: bwKHz != null && bwKHz < 5 ? 'NARROWBAND' : 'MODERATE',
      persistenceState: persistence != null && persistence > 0.8 ? 'HIGH' : 'TRANSIENT',
      morphologicalDeviation: anomalyScore != null && anomalyScore > 0.7 ? 'HIGH' : 'MODERATE',
      description:
        drift != null
          ? `Doppler drift fitted at ${drift.toFixed(2)} Hz/s.`
          : 'Doppler trajectory not evaluated.',
    },
    comparison: null,
    timelineEvents,
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

    async function loadData() {
      setIsLoading(true);

      let targetId = signalId;
      if (!targetId) {
        try {
          const listRes = await api.getCandidates({ limit: 1 });
          if (listRes.items && listRes.items.length > 0) {
            targetId = listRes.items[0].candidate_id;
          }
        } catch {
          // Backend offline or empty
        }
      }

      if (!targetId) {
        if (isMounted) {
          setRecord(null);
          setSliceData(null);
          setIsLoading(false);
        }
        return;
      }

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
        // Backend candidate not found, proceed to observation check
      }

      // 2. Try observation ID lookup
      if (targetId.startsWith('obs_')) {
        try {
          const obs = await api.getObservation(targetId);
          if (!isMounted) return;

          // Check if real candidate exists for this observation
          const candRes = await api.getCandidates({ limit: 100 });
          const existingCand = candRes.items?.find((c) =>
            c.source_observation_ids.includes(obs.id)
          );

          if (existingCand) {
            try {
              const fullCand = await api.getCandidate(existingCand.candidate_id);
              if (isMounted) {
                setRecord(candidateToAnalysisRecord(fullCand, obs));
                setIsLoading(false);
              }
              return;
            } catch {
              if (isMounted) {
                setRecord(candidateToAnalysisRecord(existingCand, obs));
                setIsLoading(false);
              }
              return;
            }
          }

          // Operational mode: observation exists but has no candidate yet
          if (isMounted) {
            setRecord(null);
            setIsLoading(false);
          }
          return;
        } catch {
          // Observation lookup failed
        }
      }

      // 3. Candidate record not found
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

  // Candidates order list for prev/next navigation
  const availableCandidateIds = backendCandidateIds;

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
