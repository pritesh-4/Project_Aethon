import { useState, useMemo, useRef } from 'react';
import { PageTransition } from '@/components/ui/motion.tsx';
import { AnimatePresence, motion } from 'motion/react';

import type { CandidateSignalData, CandidateFilterState } from './types.ts';
import { CANDIDATE_OBSERVATION_SUMMARY, MOCK_CANDIDATE_SIGNALS } from './data/mockCandidates.ts';

import { CandidateHeader } from './components/CandidateHeader.tsx';
import { CandidateTable } from './components/CandidateTable.tsx';
import { CandidateDetail } from './components/CandidateDetail.tsx';

export default function CandidatesPage() {
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateSignalData | null>(
    MOCK_CANDIDATE_SIGNALS[0]
  );

  const [filters, setFilters] = useState<CandidateFilterState>({
    searchQuery: '',
    priorityFilter: 'ALL',
    sortBy: 'priority',
    rfiFilter: 'ALL',
  });

  // Filter and sort candidates (Highest priority first by default)
  const filteredCandidates = useMemo(() => {
    return MOCK_CANDIDATE_SIGNALS.filter((cand) => {
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
    }).sort((a, b) => {
      // Sort priority: HIGH -> MEDIUM -> LOW, then by anomaly index descending
      const priorityWeights = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      const pDiff = priorityWeights[b.priority] - priorityWeights[a.priority];
      if (pDiff !== 0) return pDiff;
      return b.anomalyIndex - a.anomalyIndex;
    });
  }, [filters]);

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

  return (
    <PageTransition className="space-y-0">
      {/* 1. Header with triage context & search/filter controls */}
      <CandidateHeader
        observationId={CANDIDATE_OBSERVATION_SUMMARY.observationId}
        totalIdentified={CANDIDATE_OBSERVATION_SUMMARY.anomalousRegionsCount}
        highPriorityCount={CANDIDATE_OBSERVATION_SUMMARY.highPriorityCount}
        filters={filters}
        onFilterChange={setFilters}
        filteredCount={filteredCandidates.length}
        totalCount={MOCK_CANDIDATE_SIGNALS.length}
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
                <CandidateDetail candidate={selectedCandidate} onClose={handleCloseDetail} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </PageTransition>
  );
}
