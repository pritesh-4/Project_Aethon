import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { PageTransition } from '@/components/ui/motion.tsx';
import { AnimatePresence, motion } from 'motion/react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

import type { CandidateSignalData, CandidateFilterState } from './types.ts';
import { CANDIDATE_OBSERVATION_SUMMARY, MOCK_CANDIDATE_SIGNALS } from './data/mockCandidates.ts';

import { CandidateHeader } from './components/CandidateHeader.tsx';
import { CandidateTable } from './components/CandidateTable.tsx';
import { CandidateDetail } from './components/CandidateDetail.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { api } from '@/lib/api.ts';
import type { Candidate } from '@/types/schemas.ts';

function backendCandidateToSignalData(cand: Candidate): CandidateSignalData {
  const phys = (cand.physical_coordinates || {}) as Record<string, unknown>;
  const score = cand.current_assessment?.overall_score ?? 82.0;
  const band = cand.current_assessment?.priority_band;
  const priority: CandidateSignalData['priority'] =
    band === 'exceptional' || band === 'high' ? 'HIGH' : band === 'moderate' ? 'MEDIUM' : 'LOW';

  const statusMap: Record<string, CandidateSignalData['status']> = {
    unreviewed: 'REVIEW',
    under_review: 'INVESTIGATING',
    interesting: 'CONFIRMED',
    likely_interference: 'FLAGGED_RFI',
    dismissed: 'REJECTED',
    needs_more_data: 'REVIEW',
  };

  const durSec = cand.target_region.time_stop - cand.target_region.time_start;

  return {
    id: cand.candidate_id,
    observationId: cand.source_observation_ids[0] || 'OBS-UNKNOWN',
    targetName:
      (phys.target_name as string) || cand.source_observation_ids[0] || 'Target Candidate',
    frequencyMHz: (phys.frequency_mhz as number) || 1420.405,
    bandwidthKHz: (phys.bandwidth_khz as number) || 25,
    durationSeconds: durSec || 300,
    peakPowerDbm: -92.4,
    snrDb: (phys.snr_db as number) || 14.5,
    driftRateHzPerSec: (phys.drift_rate_hz_s as number) || (phys.drift_rate as number) || 0.0,
    firstDetectedTime: cand.created_at_utc.slice(0, 10),
    coordinates: {
      ra: (phys.ra_str as string) || '14h 29m 42s',
      dec: (phys.dec_str as string) || '-62° 40′ 46″',
    },
    anomalyIndex: score / 100,
    persistence: 0.88,
    knownPatternSimilarity: 0.12,
    interferenceProbability: 0.08,
    priority,
    status: statusMap[cand.status] || 'REVIEW',
    morphology: {
      observedType: 'Narrowband Doppler Track',
      nearestKnownType: 'Uncataloged Emitter',
      divergenceDegree: 'HIGH',
      cosineDistance: 0.88,
    },
    evidenceFactors: {
      anomalousStructure: { state: 'HIGH', sigma: 4.8 },
      temporalPersistence: { state: 'ELEVATED', cycles: `${durSec || 300}s integration` },
      knownSimilarity: { state: 'LOW', catalogRef: 'Natural RF Catalog v2' },
      rfiEstimate: { state: 'LOW', probPercent: 8 },
      frequencyCoherence: { state: 'STABLE', bandwidthStr: '25 kHz' },
    },
    latentCoordinates: { x: -0.42, y: 0.65 },
    notes: cand.current_assessment?.explanation || cand.scientific_disclaimer,
  };
}

export default function CandidatesPage() {
  const [candidatesList, setCandidatesList] =
    useState<CandidateSignalData[]>(MOCK_CANDIDATE_SIGNALS);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateSignalData | null>(
    MOCK_CANDIDATE_SIGNALS[0]
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  const [filters, setFilters] = useState<CandidateFilterState>({
    searchQuery: '',
    priorityFilter: 'ALL',
    sortBy: 'priority',
    rfiFilter: 'ALL',
  });

  // Load real candidates from backend
  const loadCandidates = useCallback(async () => {
    try {
      setLoadError(null);
      const res = await api.getCandidates({ limit: 50 });
      if (res && res.items && res.items.length > 0) {
        const mapped = res.items.map((c: Candidate) => backendCandidateToSignalData(c));
        setCandidatesList(mapped);
        setSelectedCandidate(mapped[0]);
      } else if (api.isDemoMode()) {
        setCandidatesList(MOCK_CANDIDATE_SIGNALS);
        setSelectedCandidate(MOCK_CANDIDATE_SIGNALS[0]);
      }
    } catch (err: unknown) {
      if (api.isDemoMode()) {
        setCandidatesList(MOCK_CANDIDATE_SIGNALS);
        setSelectedCandidate(MOCK_CANDIDATE_SIGNALS[0]);
      } else {
        const msg =
          (err as { message?: string })?.message || 'Failed to load candidate ledger from backend.';
        setLoadError(msg);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadCandidates();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadCandidates]);

  // Filter and sort candidates (Highest priority first by default)
  const filteredCandidates = useMemo(() => {
    return candidatesList
      .filter((cand) => {
        // 1. Search Query
        const q = filters.searchQuery.toLowerCase().trim();
        if (q) {
          const matchesId = cand.id.toLowerCase().includes(q);
          const matchesTarget = cand.targetName.toLowerCase().includes(q);
          const matchesFreq = cand.frequencyMHz.toString().includes(q);
          if (!matchesId && !matchesTarget && !matchesFreq) return false;
        }

        // 2. Priority Filter
        if (filters.priorityFilter !== 'ALL' && cand.priority !== filters.priorityFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Sort priority: HIGH -> MEDIUM -> LOW, then by anomaly index descending
        const priorityWeights = { HIGH: 3, MEDIUM: 2, LOW: 1 };
        const pDiff = priorityWeights[b.priority] - priorityWeights[a.priority];
        if (pDiff !== 0) return pDiff;
        return b.anomalyIndex - a.anomalyIndex;
      });
  }, [candidatesList, filters]);

  const detailRef = useRef<HTMLDivElement | null>(null);

  const handleSelectCandidate = (candidate: CandidateSignalData) => {
    setSelectedCandidate(candidate);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setTimeout(() => {
        detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  };

  const handleCloseDetail = () => {
    setSelectedCandidate(null);
  };

  const handleStatusChange = (newStatus: CandidateSignalData['status']) => {
    if (!selectedCandidate) return;
    setCandidatesList((prev) =>
      prev.map((c) => (c.id === selectedCandidate.id ? { ...c, status: newStatus } : c))
    );
    setSelectedCandidate((prev) => (prev ? { ...prev, status: newStatus } : null));
  };

  if (loadError && !api.isDemoMode()) {
    return (
      <PageTransition className="space-y-6 max-w-4xl mx-auto py-12 px-4">
        <div className="rounded-[3px] border border-[#D6D2C9] bg-[#FAF8F5] p-10 text-center shadow-xs">
          <div className="flex flex-col items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-[#B64B4B]" />
            <h2 className="text-xl font-normal text-[#17202A] font-serif">
              Candidate Ledger Unavailable
            </h2>
            <p className="max-w-md text-xs text-[#56616A] leading-relaxed">
              Unable to query candidates database from{' '}
              <code className="text-[#376A9B] font-mono font-semibold">{api.getBaseUrl()}</code>.{' '}
              {loadError}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={loadCandidates}
                icon={<RefreshCw className="h-3.5 w-3.5" />}
              >
                Retry connection
              </Button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition className="space-y-0">
      {/* 1. Header with triage context & search/filter controls */}
      <CandidateHeader
        observationId={
          selectedCandidate?.observationId || CANDIDATE_OBSERVATION_SUMMARY.observationId
        }
        totalIdentified={candidatesList.length}
        highPriorityCount={candidatesList.filter((c) => c.priority === 'HIGH').length}
        filters={filters}
        onFilterChange={setFilters}
        filteredCount={filteredCandidates.length}
        totalCount={candidatesList.length}
      />

      {/* 2. Scientific Triage Queue Layout */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Triage Queue Table */}
          <div
            className={`transition-all duration-200 ${
              selectedCandidate ? 'lg:col-span-7 xl:col-span-7' : 'lg:col-span-12'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-[#56616A] px-1 pb-1">
                <span className="font-semibold text-[#17202A]">Candidate ledger</span>
                <span>Select a row to inspect specimen</span>
              </div>

              <CandidateTable
                candidates={filteredCandidates}
                selectedCandidateId={selectedCandidate?.id || null}
                onSelectCandidate={handleSelectCandidate}
              />
            </div>
          </div>

          {/* Inspection & Evidence Panel */}
          <AnimatePresence mode="wait">
            {selectedCandidate && (
              <motion.div
                ref={detailRef}
                key={selectedCandidate.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.18 }}
                className="lg:col-span-5 xl:col-span-5 lg:sticky lg:top-20"
              >
                <CandidateDetail
                  candidate={selectedCandidate}
                  onClose={handleCloseDetail}
                  onStatusChange={handleStatusChange}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </PageTransition>
  );
}
