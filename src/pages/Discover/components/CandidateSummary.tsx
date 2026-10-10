import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import type { DiscoveredCandidate, CandidatePriority } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import { ExternalLink, ArrowRight, Loader2, Check } from 'lucide-react';
import { api } from '@/lib/api.ts';
import { toast } from 'sonner';
import type { CreateCandidateRequest, CandidateResponse } from '@/types/schemas.ts';

export interface CandidateSummaryProps {
  candidates: DiscoveredCandidate[];
  observationId?: string;
  onCandidatePersisted?: (
    localId: string,
    persistedId: string,
    response: CandidateResponse
  ) => void;
}

export function CandidateSummary({
  candidates,
  observationId,
  onCandidatePersisted,
}: CandidateSummaryProps) {
  const [selectedLocalId, setSelectedLocalId] = useState<string>(
    candidates[0]?.localId || candidates[0]?.id || ''
  );
  const [savingCandidateLocalIds, setSavingCandidateLocalIds] = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  if (candidates.length === 0) {
    return (
      <section className="space-y-3 select-none font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D6D2C9] pb-2.5">
          <div>
            <h3 className="text-sm font-semibold text-[#17202A]">Detected Signals</h3>
            <p className="text-xs text-[#56616A]">
              Candidate carriers screened in observation {observationId || ''}
            </p>
          </div>

          <Link to="/candidates">
            <Button variant="ghost" size="sm" icon={<ArrowRight className="h-3.5 w-3.5" />}>
              Candidate Review Ledger
            </Button>
          </Link>
        </div>

        <div className="border border-[#D6D2C9] bg-[#FAF8F5] rounded-[3px] p-8 text-center text-xs text-[#56616A]">
          No anomalous signals exceeded candidate threshold in this observation.
        </div>
      </section>
    );
  }

  const selectedCandidate =
    candidates.find((c) => (c.localId || c.id) === selectedLocalId) || candidates[0];

  const persistCandidate = async (cand: DiscoveredCandidate): Promise<string | null> => {
    // If candidate is already persisted, return the existing persisted ID
    if (cand.persistedCandidateId) {
      return cand.persistedCandidateId;
    }

    const localId = cand.localId || cand.id;
    if (savingCandidateLocalIds.has(localId)) {
      return null;
    }

    setSavingCandidateLocalIds((prev) => new Set(prev).add(localId));

    try {
      // Build physical coordinates using real measurements and genuine physical units
      const physical_coordinates: Record<string, unknown> = {};

      if (cand.physicalCoordinates?.freq_center_hz != null) {
        physical_coordinates.freq_center_hz = cand.physicalCoordinates.freq_center_hz;
      } else if (cand.frequencyMHz != null) {
        physical_coordinates.freq_center_hz = cand.frequencyMHz * 1e6;
      }

      if (cand.physicalCoordinates?.bandwidth_hz != null) {
        physical_coordinates.bandwidth_hz = cand.physicalCoordinates.bandwidth_hz;
      } else if (cand.bandwidthKHz != null) {
        physical_coordinates.bandwidth_hz = cand.bandwidthKHz * 1e3;
      }

      if (cand.physicalCoordinates?.time_center_s != null) {
        physical_coordinates.time_center_s = cand.physicalCoordinates.time_center_s;
      }

      if (cand.physicalCoordinates?.duration_s != null) {
        physical_coordinates.duration_s = cand.physicalCoordinates.duration_s;
      }

      if (cand.frequencyMHz != null) {
        physical_coordinates.frequency_mhz = cand.frequencyMHz;
      }

      if (cand.driftRateHzPerSec != null) {
        physical_coordinates.drift_rate_hz_s = cand.driftRateHzPerSec;
      }

      if (cand.snrDb != null) {
        physical_coordinates.snr_db = cand.snrDb;
      }

      const payload: CreateCandidateRequest = {
        observation_id: cand.observationId || observationId || '',
        target_region: {
          time_start: cand.targetRegion.time_start,
          time_stop: cand.targetRegion.time_stop,
          freq_start: cand.targetRegion.freq_start,
          freq_stop: cand.targetRegion.freq_stop,
        },
        detection_id: cand.detectionId || undefined,
        physical_coordinates:
          Object.keys(physical_coordinates).length > 0 ? physical_coordinates : undefined,
      };

      const res = await api.createCandidate(payload);
      const persistedId = res.candidate_id;

      onCandidatePersisted?.(localId, persistedId, res);

      toast.success(`Candidate saved to ledger as ${persistedId}`, {
        description: 'Candidate record created and viewable on Candidate Review Ledger.',
      });

      return persistedId;
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message || 'Failed to save candidate to ledger.';
      toast.error('Could not save candidate', { description: msg });
      return null;
    } finally {
      setSavingCandidateLocalIds((prev) => {
        const next = new Set(prev);
        next.delete(localId);
        return next;
      });
    }
  };

  const handleSave = async (cand: DiscoveredCandidate) => {
    if (cand.persistedCandidateId) {
      toast.info(`Candidate already saved as ${cand.persistedCandidateId}`);
      return;
    }
    await persistCandidate(cand);
  };

  const handleInspect = async (cand: DiscoveredCandidate) => {
    if (cand.persistedCandidateId) {
      navigate(`/analysis/${cand.persistedCandidateId}`);
      return;
    }

    const persistedId = await persistCandidate(cand);
    if (persistedId) {
      navigate(`/analysis/${persistedId}`);
    }
  };

  const getPriorityTag = (priority: CandidatePriority) => {
    switch (priority) {
      case 'HIGH':
        return (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#9E6E20] bg-[#FDF6E9] px-2 py-0.5 rounded-[2px] border border-[#E8CFA0] font-semibold">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#56616A] bg-[#EAE7E0] px-2 py-0.5 rounded-[2px] border border-[#D6D2C9]">
            MED
          </span>
        );
      case 'LOW':
        return (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#76828D] bg-[#F4F1EA] px-2 py-0.5 rounded-[2px] border border-[#D6D2C9]">
            LOW
          </span>
        );
    }
  };

  const isSelectedCandidateSaving = savingCandidateLocalIds.has(
    selectedCandidate.localId || selectedCandidate.id
  );

  return (
    <section className="space-y-3 select-none font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D6D2C9] pb-2.5">
        <div>
          <h3 className="text-sm font-semibold text-[#17202A]">Detected Signals</h3>
          <p className="text-xs text-[#56616A]">
            Candidate carriers screened in observation {observationId || ''}
          </p>
        </div>

        <Link to="/candidates">
          <Button variant="ghost" size="sm" icon={<ArrowRight className="h-3.5 w-3.5" />}>
            Candidate Review Ledger
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 border border-[#D6D2C9] bg-[#FAF8F5] rounded-[3px] overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-[#D6D2C9] shadow-xs">
        {/* Candidate Ranking List / Table (8 cols) */}
        <div className="lg:col-span-8 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#D6D2C9] bg-[#EAE7E0] text-[11px] font-mono uppercase tracking-wider text-[#56616A]">
                <th className="py-2.5 px-3.5 font-normal hidden sm:table-cell">Rank</th>
                <th className="py-2.5 px-3.5 font-normal">Identifier</th>
                <th className="py-2.5 px-3.5 font-normal hidden sm:table-cell">Frequency</th>
                <th className="py-2.5 px-3.5 font-normal text-right hidden md:table-cell">
                  Drift Rate
                </th>
                <th className="py-2.5 px-3.5 font-normal text-center">Priority</th>
                <th className="py-2.5 px-3.5 font-normal text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D6D2C9]">
              {candidates.map((cand) => {
                const candKey = cand.localId || cand.id;
                const isSelected = candKey === (selectedCandidate.localId || selectedCandidate.id);
                const isSaving = savingCandidateLocalIds.has(candKey);

                return (
                  <tr
                    key={candKey}
                    tabIndex={0}
                    aria-selected={isSelected}
                    onClick={() => setSelectedLocalId(candKey)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedLocalId(candKey);
                      }
                    }}
                    className={`transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#376A9B] focus-visible:ring-inset ${
                      isSelected
                        ? 'bg-[#EAE7E0] text-[#17202A] border-l-2 border-l-[#376A9B]'
                        : 'hover:bg-[#F4F1EA] text-[#56616A]'
                    }`}
                  >
                    <td className="py-3 px-3.5 font-mono text-[#76828D] hidden sm:table-cell">
                      0{cand.rank}
                    </td>
                    <td className="py-3 px-3.5 font-mono font-medium text-[#17202A]">
                      <div className="flex items-center gap-2">
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#376A9B]" />}
                        <span>{cand.persistedCandidateId || cand.localId || cand.id}</span>
                        {cand.persistedCandidateId ? (
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#3D7D54]/10 text-[#2B603B] border border-[#3D7D54]/20 font-semibold">
                            Saved
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#76828D]/10 text-[#56616A] border border-[#76828D]/20">
                            Unsaved
                          </span>
                        )}
                      </div>
                      <div className="sm:hidden text-[11px] text-[#76828D] font-normal">
                        {cand.frequencyMHz != null ? `${cand.frequencyMHz.toFixed(3)} MHz` : '—'}
                      </div>
                    </td>
                    <td className="py-3 px-3.5 font-mono text-[#17202A] hidden sm:table-cell">
                      {cand.frequencyMHz != null ? `${cand.frequencyMHz.toFixed(3)} MHz` : '—'}
                    </td>
                    <td className="py-3 px-3.5 font-mono text-right text-[#56616A] hidden md:table-cell">
                      {cand.driftRateHzPerSec != null
                        ? `${cand.driftRateHzPerSec > 0 ? '+' : ''}${cand.driftRateHzPerSec} Hz/s`
                        : 'Not measured'}
                    </td>
                    <td className="py-3 px-3.5 text-center">{getPriorityTag(cand.priority)}</td>
                    <td className="py-3 px-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={isSaving}
                        icon={
                          isSaving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#376A9B]" />
                          ) : (
                            <ExternalLink className="h-3.5 w-3.5" />
                          )
                        }
                        onClick={() => handleInspect(cand)}
                      >
                        <span className="sr-only">
                          Inspect {cand.persistedCandidateId || cand.localId || cand.id}
                        </span>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Candidate Quick Review Inspector (4 cols) */}
        <div className="lg:col-span-4 p-4 flex flex-col justify-between bg-[#F4F1EA] space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#D6D2C9] pb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#76828D]">
                Candidate Profile
              </span>
              {getPriorityTag(selectedCandidate.priority)}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-[#17202A] font-mono">
                  {selectedCandidate.persistedCandidateId ||
                    selectedCandidate.localId ||
                    selectedCandidate.id}
                </span>
                {selectedCandidate.persistedCandidateId ? (
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#3D7D54]/10 text-[#2B603B] border border-[#3D7D54]/20 font-semibold">
                    Ledger Record
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#C19348]/15 text-[#8C621E] border border-[#C19348]/30 font-semibold">
                    Unsaved Detection
                  </span>
                )}
              </div>
              <p className="text-xs text-[#56616A] mt-0.5">
                {selectedCandidate.persistedCandidateId
                  ? `Persisted candidate in ${selectedCandidate.targetName}`
                  : `Unsaved detector region in ${selectedCandidate.targetName} (Local ID: ${selectedCandidate.localId || selectedCandidate.id})`}
              </p>
            </div>

            {/* Ruled Telemetry List */}
            <div className="divide-y divide-[#D6D2C9] border-y border-[#D6D2C9] text-xs">
              <div className="flex items-center justify-between py-2">
                <span className="text-[11px] font-mono text-[#76828D]">Frequency</span>
                <span className="font-mono text-[#17202A] font-medium">
                  {selectedCandidate.frequencyMHz != null
                    ? `${selectedCandidate.frequencyMHz.toFixed(3)} MHz`
                    : 'Unavailable'}
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[11px] font-mono text-[#76828D]">Drift rate</span>
                <span className="font-mono text-[#376A9B] font-medium">
                  {selectedCandidate.driftRateHzPerSec != null
                    ? `${selectedCandidate.driftRateHzPerSec > 0 ? '+' : ''}${selectedCandidate.driftRateHzPerSec} Hz/s`
                    : 'Not measured'}
                </span>
              </div>
            </div>

            {/* Scientific Explanation */}
            <div className="space-y-1">
              <span className="block text-[11px] font-mono uppercase tracking-wider text-[#76828D]">
                Screening Notes
              </span>
              <p className="text-xs text-[#56616A] leading-relaxed">
                {selectedCandidate.explanation.persistenceReason}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-[#D6D2C9] space-y-2">
            <Button
              variant="primary"
              size="sm"
              withArrow={!isSelectedCandidateSaving}
              disabled={isSelectedCandidateSaving}
              icon={
                isSelectedCandidateSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : undefined
              }
              onClick={() => handleInspect(selectedCandidate)}
              className="w-full text-xs font-semibold"
            >
              {isSelectedCandidateSaving
                ? 'Saving and opening analysis...'
                : selectedCandidate.persistedCandidateId
                  ? 'Inspect candidate in detail'
                  : 'Save & inspect candidate'}
            </Button>

            <Button
              variant="secondary"
              size="sm"
              disabled={
                Boolean(selectedCandidate.persistedCandidateId) || isSelectedCandidateSaving
              }
              icon={
                isSelectedCandidateSaving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : selectedCandidate.persistedCandidateId ? (
                  <Check className="h-3.5 w-3.5 text-[#3D7D54]" />
                ) : undefined
              }
              onClick={() => handleSave(selectedCandidate)}
              className="w-full text-xs font-mono"
            >
              {selectedCandidate.persistedCandidateId
                ? `Saved in ledger (${selectedCandidate.persistedCandidateId.slice(0, 12)}...)`
                : isSelectedCandidateSaving
                  ? 'Saving to ledger...'
                  : 'Save to candidate ledger'}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
