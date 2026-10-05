import { useState, useMemo } from 'react';
import { PageTransition } from '@/components/ui/motion.tsx';
import { AnimatePresence } from 'motion/react';

import type { CandidateSignalData, CandidateFilterState } from './types.ts';
import { CANDIDATE_OBSERVATION_SUMMARY, MOCK_CANDIDATE_SIGNALS } from './data/mockCandidates.ts';

import { CandidateHeader } from './components/CandidateHeader.tsx';
import { CandidateTable } from './components/CandidateTable.tsx';
import { CandidateDrawer } from './components/CandidateDrawer.tsx';

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

  // Filter and Sort Candidates
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

      // 3. RFI Risk Filter
      if (filters.rfiFilter === 'LOW' && cand.interferenceProbability >= 0.1) {
        return false;
      }
      if (filters.rfiFilter === 'MODERATE' && cand.interferenceProbability >= 0.25) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      switch (filters.sortBy) {
        case 'priority': {
          const priorityWeights = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          const pDiff = priorityWeights[b.priority] - priorityWeights[a.priority];
          if (pDiff !== 0) return pDiff;
          return b.anomalyIndex - a.anomalyIndex;
        }
        case 'anomalyIndex':
          return b.anomalyIndex - a.anomalyIndex;
        case 'snr':
          return b.snrDb - a.snrDb;
        case 'frequency':
          return a.frequencyMHz - b.frequencyMHz;
        case 'persistence':
          return b.persistence - a.persistence;
        default:
          return 0;
      }
    });
  }, [filters]);

  const handleSelectCandidate = (candidate: CandidateSignalData) => {
    setSelectedCandidate(candidate);
  };

  const handleCloseDrawer = () => {
    setSelectedCandidate(null);
  };

  return (
    <PageTransition className="space-y-4">
      {/* 1. Unified Page Header with Search, Filter & Triage Counts */}
      <CandidateHeader
        observationId={CANDIDATE_OBSERVATION_SUMMARY.observationId}
        targetName={CANDIDATE_OBSERVATION_SUMMARY.targetName}
        totalIdentified={CANDIDATE_OBSERVATION_SUMMARY.anomalousRegionsCount}
        highPriorityCount={CANDIDATE_OBSERVATION_SUMMARY.highPriorityCount}
        filters={filters}
        onFilterChange={setFilters}
        totalCount={MOCK_CANDIDATE_SIGNALS.length}
        filteredCount={filteredCandidates.length}
      />

      {/* 2. Primary Triage Layout: Candidate Table on Left, Detail Drawer on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left: Candidate Records Table */}
        <div
          className={`transition-all duration-200 ${
            selectedCandidate ? 'lg:col-span-6 xl:col-span-7' : 'lg:col-span-12'
          }`}
        >
          <CandidateTable
            candidates={filteredCandidates}
            selectedCandidateId={selectedCandidate?.id || null}
            onSelectCandidate={handleSelectCandidate}
          />
        </div>

        {/* Right: Detailed Investigation Workspace Drawer */}
        <AnimatePresence mode="wait">
          {selectedCandidate && (
            <div className="lg:col-span-6 xl:col-span-5 lg:sticky lg:top-14">
              <CandidateDrawer
                key={selectedCandidate.id}
                candidate={selectedCandidate}
                onClose={handleCloseDrawer}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
