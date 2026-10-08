import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router';
import { PageTransition } from '@/components/ui/motion.tsx';

import type { ArchivedObservation, ArchiveFilterState } from './types.ts';
import { MOCK_ARCHIVED_OBSERVATIONS, ARCHIVE_SUMMARY_STATS } from './data/mockArchive.ts';

import { ArchiveHeader } from './components/ArchiveHeader.tsx';
import { ArchiveToolbar } from './components/ArchiveToolbar.tsx';
import { ArchiveTimeline } from './components/ArchiveTimeline.tsx';
import { ObservationDrawer } from './components/ObservationDrawer.tsx';
import { ArchiveEmptyState } from './components/ArchiveEmptyState.tsx';

export default function ArchivePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedId = searchParams.get('id');

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
  const [selectedIdState, setSelectedIdState] = useState<string>('AET-04721');

  // Selected ID preference: URL search param if valid, otherwise internal state
  const selectedId = useMemo(() => {
    if (requestedId && MOCK_ARCHIVED_OBSERVATIONS.some((o) => o.id === requestedId)) {
      return requestedId;
    }
    return selectedIdState;
  }, [requestedId, selectedIdState]);

  // Mobile drawer visibility toggle
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Available unique dates
  const availableDates = useMemo(() => {
    const dates = Array.from(new Set(MOCK_ARCHIVED_OBSERVATIONS.map((o) => o.date)));
    return dates.sort((a, b) => b.localeCompare(a));
  }, []);

  // Filter & Sort observations
  const filteredObservations = useMemo(() => {
    return MOCK_ARCHIVED_OBSERVATIONS.filter((obs) => {
      // 1. Search Query
      const q = filters.searchQuery.toLowerCase().trim();
      if (q) {
        const matchesId = obs.id.toLowerCase().includes(q);
        const matchesTarget = obs.targetName.toLowerCase().includes(q);
        const matchesTelescope = obs.telescope.toLowerCase().includes(q);
        const matchesFreq = obs.frequency.toString().includes(q);
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
    }).sort((a, b) => {
      switch (filters.sortBy) {
        case 'newest':
          return b.timestamp.localeCompare(a.timestamp);
        case 'oldest':
          return a.timestamp.localeCompare(b.timestamp);
        case 'anomalyIndex':
          return b.anomalyIndex - a.anomalyIndex;
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
  }, [filters]);

  // Selected observation object
  const selectedObservation = useMemo(() => {
    return (
      filteredObservations.find((o) => o.id === selectedId) ||
      filteredObservations[0] ||
      MOCK_ARCHIVED_OBSERVATIONS.find((o) => o.id === selectedId) ||
      null
    );
  }, [filteredObservations, selectedId]);

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
      // Don't intercept if user is typing in an input
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
      <div className="min-h-[calc(100vh-2.5rem)] bg-[#0F1110] text-[#E6E4DD] flex flex-col selection:bg-[#D4864A]/20 selection:text-[#D4864A]">
        {/* 1. Header */}
        <ArchiveHeader stats={ARCHIVE_SUMMARY_STATS} />

        {/* 2. Toolbar (Search, Filter, Sort) */}
        <ArchiveToolbar
          filters={filters}
          onFilterChange={setFilters}
          availableDates={availableDates}
          totalRecords={MOCK_ARCHIVED_OBSERVATIONS.length}
          filteredCount={filteredObservations.length}
        />

        {/* 4. Main Body: Timeline + Right-Side Drawer */}
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
