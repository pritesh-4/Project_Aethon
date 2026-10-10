import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { PageTransition } from '@/components/ui/motion.tsx';
import { api } from '@/lib/api.ts';
import type { ObservationRecordResponse, CandidateResponse } from '@/types/schemas.ts';

import type {
  ArchivedObservation,
  ArchiveFilterState,
  ArchivedCandidateEvent,
  ArchiveSummaryStats,
  CandidatePriority,
} from './types.ts';

import { ArchiveHeader } from './components/ArchiveHeader.tsx';
import { ArchiveToolbar } from './components/ArchiveToolbar.tsx';
import { ArchiveTimeline } from './components/ArchiveTimeline.tsx';
import { ObservationDrawer } from './components/ObservationDrawer.tsx';
import { ArchiveEmptyState } from './components/ArchiveEmptyState.tsx';

function mapObservationToArchived(
  obs: ObservationRecordResponse,
  linkedCandidates: CandidateResponse[] = []
): ArchivedObservation {
  const fRef = obs.metadata?.frequency_reference_mhz ?? null;
  const bw = obs.metadata?.bandwidth_mhz ?? null;
  const sampleCount = obs.metadata?.time_sample_count ?? null;
  const dt = obs.metadata?.time_step_seconds ?? null;
  let durationSec: number | null = null;
  let durationString = '—';
  if (sampleCount != null && dt != null) {
    durationSec = Math.round(sampleCount * dt);
    const minutes = Math.floor(durationSec / 60);
    const seconds = durationSec % 60;
    durationString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  }

  const candidatesMapped: ArchivedCandidateEvent[] = linkedCandidates.map((c, idx) => {
    const score =
      typeof c.current_assessment?.overall_score === 'number'
        ? c.current_assessment.overall_score / 100
        : null;
    const driftEvidence = c.evidence_items?.find((e) => e.evidence_type === 'drift');
    const drift =
      typeof driftEvidence?.scores_or_parameters?.drift_rate_hz_per_s === 'number'
        ? (driftEvidence.scores_or_parameters.drift_rate_hz_per_s as number)
        : null;
    const snr =
      typeof driftEvidence?.scores_or_parameters?.snr === 'number'
        ? (driftEvidence.scores_or_parameters.snr as number)
        : null;

    let bwKHz: number | null = null;
    let freqMHz: number | null = null;
    if (obs.metadata?.channel_spacing_mhz && c.target_region) {
      const chSpacing = obs.metadata.channel_spacing_mhz * 1000;
      bwKHz =
        Math.round(
          Math.abs(c.target_region.freq_stop - c.target_region.freq_start) * chSpacing * 10
        ) / 10;
      if (fRef != null) {
        freqMHz =
          fRef +
          ((c.target_region.freq_start + c.target_region.freq_stop) / 2) *
            obs.metadata.channel_spacing_mhz;
      }
    }

    const priority: CandidatePriority =
      score != null ? (score > 0.8 ? 'HIGH' : score > 0.5 ? 'MEDIUM' : 'LOW') : 'LOW';

    return {
      id: `C${String(idx + 1).padStart(2, '0')}`,
      fullId: c.candidate_id,
      signalId: c.candidate_id,
      label: `C${String(idx + 1).padStart(2, '0')}`,
      priority,
      frequencyMHz: freqMHz,
      bandwidthKHz: bwKHz,
      driftRateHzPerSec: drift,
      snrDb: snr != null ? Math.round(snr * 10) / 10 : null,
      anomalyScore: score,
      classification: undefined,
    };
  });

  const highPriority = candidatesMapped.filter((c) => c.priority === 'HIGH').length;
  const dateStr = obs.ingested_at.split('T')[0] || new Date().toISOString().split('T')[0];

  return {
    id: obs.id,
    date: dateStr,
    timestamp: obs.ingested_at.replace('T', ' ').slice(0, 19) + ' UTC',
    targetName: obs.metadata?.source_name || obs.original_filename,
    telescope: obs.metadata?.telescope_name || 'Radio Telescope',
    coordinates: {
      ra: obs.metadata?.ra_str || null,
      dec: obs.metadata?.dec_str || null,
    },
    frequency: fRef,
    bandwidth: bw,
    duration: durationSec,
    durationString,
    sampleCount,
    anomalousRegions: candidatesMapped.length,
    highPriorityCandidates: highPriority,
    anomalyIndex:
      candidatesMapped.length > 0 && candidatesMapped[0].anomalyScore != null
        ? candidatesMapped[0].anomalyScore
        : null,
    status:
      candidatesMapped.length > 0
        ? 'candidate'
        : obs.status === 'processed'
          ? 'analyzed'
          : 'archived',
    topCandidate: candidatesMapped[0]?.fullId,
    candidates: candidatesMapped,
    modelVersion: '1.0.0',
    modelName: 'AETHON-DSP',
    analysisMode: 'SPECTRAL_DRIFT',
    pipelineStatus: obs.status.toUpperCase(),
    analysisTimeMs: null,
    provenance: {
      ingestedTime: obs.ingested_at,
      preprocessedTime: obs.status === 'processed' ? obs.ingested_at : 'Pending',
      analyzedTime: obs.status === 'processed' ? obs.ingested_at : 'Pending',
      candidatesGeneratedTime: candidatesMapped.length > 0 ? obs.ingested_at : 'None',
    },
    notes: `Ingested from ${obs.original_filename} (${obs.format.toUpperCase()}, ${Math.round(obs.file_size_bytes / 1024)} KB, SHA256: ${obs.sha256.slice(0, 10)}...)`,
  };
}

export default function ArchivePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedId = searchParams.get('id');

  // Observations dataset populated strictly from backend
  const [observations, setObservations] = useState<ArchivedObservation[]>([]);

  // Filter state
  const [filters, setFilters] = useState<ArchiveFilterState>({
    searchQuery: '',
    dateFilter: 'ALL',
    statusFilter: 'ALL',
    anomalyFilter: 'ALL',
    priorityFilter: 'ALL',
    sortBy: 'newest',
  });

  // Selected observation ID state
  const [selectedIdState, setSelectedIdState] = useState<string>('');

  // Query real observations and linked candidates from backend
  useEffect(() => {
    let isMounted = true;

    Promise.allSettled([
      api.getObservations({ limit: 100 }),
      api.getCandidates({ limit: 100 }),
    ]).then(([obsResult, candResult]) => {
      if (!isMounted) return;

      if (
        obsResult.status === 'fulfilled' &&
        obsResult.value.items &&
        obsResult.value.items.length > 0
      ) {
        const allCands = candResult.status === 'fulfilled' ? candResult.value.items : [];
        const mapped = obsResult.value.items.map((obs) => {
          const linked = allCands.filter((c) => c.source_observation_ids.includes(obs.id));
          return mapObservationToArchived(obs, linked);
        });

        setObservations(mapped);
        if (mapped.length > 0) {
          setSelectedIdState((curr) => {
            if (requestedId && mapped.some((m) => m.id === requestedId)) return requestedId;
            if (mapped.some((m) => m.id === curr)) return curr;
            return mapped[0].id;
          });
        }
      } else {
        setObservations([]);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [requestedId]);

  // Selected ID preference: URL search param if valid, otherwise internal state
  const selectedId = useMemo(() => {
    if (requestedId && observations.some((o) => o.id === requestedId)) {
      return requestedId;
    }
    return selectedIdState;
  }, [requestedId, selectedIdState, observations]);

  // Mobile drawer visibility toggle
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Dynamic Archive Stats computed from active observations
  const archiveStats: ArchiveSummaryStats = useMemo(() => {
    const total = observations.length;
    const analyzed = observations.filter(
      (o) => o.status === 'analyzed' || o.status === 'candidate'
    ).length;
    const candidateEvents = observations.reduce((acc, o) => acc + o.candidates.length, 0);
    const flaggedForReview = observations.filter(
      (o) => o.status === 'review' || o.highPriorityCandidates > 0
    ).length;
    const anomalous = observations.filter((o) => o.anomalousRegions > 0).length;
    const highPriority = observations.reduce((acc, o) => acc + o.highPriorityCandidates, 0);
    return {
      totalObservations: total,
      analyzed,
      candidateEvents,
      flaggedForReview,
      anomalous,
      highPriority,
    };
  }, [observations]);

  // Available unique dates
  const availableDates = useMemo(() => {
    const dates = Array.from(new Set(observations.map((o) => o.date)));
    return dates.sort((a, b) => b.localeCompare(a));
  }, [observations]);

  // Filter & Sort observations
  const filteredObservations = useMemo(() => {
    return observations
      .filter((obs) => {
        // 1. Search Query
        const q = filters.searchQuery.toLowerCase().trim();
        if (q) {
          const matchesId = obs.id.toLowerCase().includes(q);
          const matchesTarget = obs.targetName.toLowerCase().includes(q);
          const matchesTelescope = obs.telescope.toLowerCase().includes(q);
          const matchesFreq = obs.frequency != null && obs.frequency.toString().includes(q);
          const matchesDate = obs.date.includes(q);
          const matchesStatus = obs.status.toLowerCase().includes(q);
          const matchesCandidates = obs.candidates.some(
            (c) =>
              c.id.toLowerCase().includes(q) ||
              c.fullId.toLowerCase().includes(q) ||
              (c.classification && c.classification.toLowerCase().includes(q))
          );
          if (
            !matchesId &&
            !matchesTarget &&
            !matchesTelescope &&
            !matchesFreq &&
            !matchesDate &&
            !matchesStatus &&
            !matchesCandidates
          ) {
            return false;
          }
        }

        // 2. Date Filter
        if (filters.dateFilter !== 'ALL' && obs.date !== filters.dateFilter) {
          return false;
        }

        // 3. Status Filter
        if (filters.statusFilter !== 'ALL' && obs.status !== filters.statusFilter) {
          return false;
        }

        // 4. Anomaly Filter
        if (filters.anomalyFilter === 'ANOMALOUS' && obs.anomalousRegions <= 0) {
          return false;
        }
        if (filters.anomalyFilter === 'HIGH' && obs.anomalousRegions < 10) {
          return false;
        }
        if (filters.anomalyFilter === 'NONE' && obs.anomalousRegions !== 0) {
          return false;
        }

        // 5. Priority Filter
        if (filters.priorityFilter !== 'ALL') {
          const hasPriorityCandidate = obs.candidates.some(
            (c) => c.priority === filters.priorityFilter
          );
          if (!hasPriorityCandidate) return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (filters.sortBy) {
          case 'newest':
            return b.timestamp.localeCompare(a.timestamp);
          case 'oldest':
            return a.timestamp.localeCompare(b.timestamp);
          case 'anomalyIndex':
            return (b.anomalyIndex ?? 0) - (a.anomalyIndex ?? 0);
          case 'candidateCount':
            return b.candidates.length - a.candidates.length;
          case 'priority': {
            const priorityVal = (obs: ArchivedObservation) => {
              if (obs.status === 'review') return 4;
              if (obs.highPriorityCandidates > 0) return 3;
              if (obs.candidates.length > 0) return 2;
              if (obs.status === 'analyzed') return 1;
              return 0;
            };
            return priorityVal(b) - priorityVal(a);
          }
          default:
            return 0;
        }
      });
  }, [observations, filters]);

  // Selected observation object
  const selectedObservation = useMemo(() => {
    return (
      filteredObservations.find((o) => o.id === selectedId) ||
      filteredObservations[0] ||
      observations.find((o) => o.id === selectedId) ||
      null
    );
  }, [filteredObservations, selectedId, observations]);

  // Adjacent observation navigation
  const currentIndex = useMemo(() => {
    if (!selectedObservation) return -1;
    return filteredObservations.findIndex((o) => o.id === selectedObservation.id);
  }, [filteredObservations, selectedObservation]);

  const hasPrevious = currentIndex > 0;
  const hasNext = currentIndex >= 0 && currentIndex < filteredObservations.length - 1;

  const handleSelectPrevious = useCallback(() => {
    if (hasPrevious) {
      const prevObs = filteredObservations[currentIndex - 1];
      setSelectedIdState(prevObs.id);
      setSearchParams({ id: prevObs.id }, { replace: true });
    }
  }, [hasPrevious, currentIndex, filteredObservations, setSearchParams]);

  const handleSelectNext = useCallback(() => {
    if (hasNext) {
      const nextObs = filteredObservations[currentIndex + 1];
      setSelectedIdState(nextObs.id);
      setSearchParams({ id: nextObs.id }, { replace: true });
    }
  }, [hasNext, currentIndex, filteredObservations, setSearchParams]);

  const handleSelectObservation = useCallback(
    (obs: ArchivedObservation) => {
      setSelectedIdState(obs.id);
      setSearchParams({ id: obs.id }, { replace: true });
      setIsMobileDrawerOpen(true);
    },
    [setSearchParams]
  );

  // Keyboard navigation for records (ArrowUp / ArrowDown)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        document.activeElement instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleSelectPrevious();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleSelectNext();
      } else if (e.key === 'Escape') {
        setIsMobileDrawerOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSelectPrevious, handleSelectNext]);

  return (
    <PageTransition>
      <div className="min-h-[calc(100vh-2.5rem)] bg-[#F4F1EA] text-[#17202A] flex flex-col selection:bg-[#376A9B]/20 selection:text-[#376A9B]">
        {/* 1. Header with dynamic counts */}
        <ArchiveHeader stats={archiveStats} />

        {/* 2. Toolbar (Search, Filter, Sort) */}
        <ArchiveToolbar
          filters={filters}
          onFilterChange={setFilters}
          availableDates={availableDates}
          totalRecords={observations.length}
          filteredCount={filteredObservations.length}
        />

        {/* 3. Main Body: Timeline + Right-Side Drawer */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          {/* Left Column: Timeline List */}
          <div
            role="region"
            tabIndex={0}
            aria-label="Chronological Observation Records List"
            className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 outline-none"
          >
            {filteredObservations.length > 0 ? (
              <ArchiveTimeline
                observations={filteredObservations}
                selectedObservationId={selectedObservation?.id || ''}
                onSelectObservation={handleSelectObservation}
              />
            ) : (
              <ArchiveEmptyState
                searchQuery={filters.searchQuery}
                onClearFilters={() =>
                  setFilters({
                    searchQuery: '',
                    dateFilter: 'ALL',
                    statusFilter: 'ALL',
                    anomalyFilter: 'ALL',
                    priorityFilter: 'ALL',
                    sortBy: 'newest',
                  })
                }
              />
            )}
          </div>

          {/* Right Column: Desktop Docked Detail Drawer */}
          <aside
            aria-label="Observation Investigation Detail"
            className="hidden lg:block w-[420px] xl:w-[460px] h-[calc(100vh-14rem)] sticky top-0 shrink-0"
          >
            <ObservationDrawer
              observation={selectedObservation}
              onSelectPrevious={handleSelectPrevious}
              onSelectNext={handleSelectNext}
              hasPrevious={hasPrevious}
              hasNext={hasNext}
            />
          </aside>

          {/* Mobile / Tablet Drawer Overlay / Sheet */}
          {isMobileDrawerOpen && selectedObservation && (
            <div
              onClick={(e) => {
                if (e.target === e.currentTarget) setIsMobileDrawerOpen(false);
              }}
              className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
            >
              <div
                className="w-full h-[85vh] bg-[#141715] rounded-t-[2px] border-t border-[#242825] shadow-2xl flex flex-col overflow-hidden"
                role="dialog"
                aria-modal="true"
                aria-label="Observation Detail Sheet"
              >
                <ObservationDrawer
                  observation={selectedObservation}
                  onClose={() => setIsMobileDrawerOpen(false)}
                  onSelectPrevious={handleSelectPrevious}
                  onSelectNext={handleSelectNext}
                  hasPrevious={hasPrevious}
                  hasNext={hasNext}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
