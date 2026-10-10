import { useState } from 'react';
import { Link } from 'react-router';
import type { DiscoveredCandidate, CandidatePriority } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import { ExternalLink, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api.ts';
import { toast } from 'sonner';

export interface CandidateSummaryProps {
  candidates: DiscoveredCandidate[];
  observationId?: string;
}

export function CandidateSummary({ candidates, observationId }: CandidateSummaryProps) {
  const [selectedId, setSelectedId] = useState<string>(candidates[0]?.id || '');

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

  const selectedCandidate = candidates.find((c) => c.id === selectedId) || candidates[0];

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
                const isSelected = cand.id === selectedCandidate.id;

                return (
                  <tr
                    key={cand.id}
                    tabIndex={0}
                    aria-selected={isSelected}
                    onClick={() => setSelectedId(cand.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setSelectedId(cand.id);
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
                        <span>{cand.id}</span>
                      </div>
                      <div className="sm:hidden text-[11px] text-[#76828D] font-normal">
                        {cand.frequencyMHz.toFixed(3)} MHz
                      </div>
                    </td>
                    <td className="py-3 px-3.5 font-mono text-[#17202A] hidden sm:table-cell">
                      {cand.frequencyMHz.toFixed(3)} MHz
                    </td>
                    <td className="py-3 px-3.5 font-mono text-right text-[#56616A] hidden md:table-cell">
                      {cand.driftRateHzPerSec > 0
                        ? `+${cand.driftRateHzPerSec}`
                        : cand.driftRateHzPerSec}{' '}
                      Hz/s
                    </td>
                    <td className="py-3 px-3.5 text-center">{getPriorityTag(cand.priority)}</td>
                    <td className="py-3 px-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <Link to={`/analysis/${cand.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<ExternalLink className="h-3.5 w-3.5" />}
                        >
                          <span className="sr-only">Inspect {cand.id}</span>
                        </Button>
                      </Link>
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
              <span className="text-base font-semibold text-[#17202A] font-mono">
                {selectedCandidate.id}
              </span>
              <p className="text-xs text-[#56616A] mt-0.5">{selectedCandidate.targetName}</p>
            </div>

            {/* Ruled Telemetry List */}
            <div className="divide-y divide-[#D6D2C9] border-y border-[#D6D2C9] text-xs">
              <div className="flex items-center justify-between py-2">
                <span className="text-[11px] font-mono text-[#76828D]">Frequency</span>
                <span className="font-mono text-[#17202A] font-medium">
                  {selectedCandidate.frequencyMHz.toFixed(3)} MHz
                </span>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-[11px] font-mono text-[#76828D]">Drift rate</span>
                <span className="font-mono text-[#376A9B] font-medium">
                  {selectedCandidate.driftRateHzPerSec} Hz/s
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
            <Link to={`/analysis/${selectedCandidate.id}`} className="block w-full">
              <Button
                variant="primary"
                size="sm"
                withArrow
                className="w-full text-xs font-semibold"
              >
                Inspect candidate in detail
              </Button>
            </Link>

            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                if (!observationId) return;
                try {
                  await api.createCandidate({
                    observation_id: observationId,
                    target_region: {
                      time_start: 0,
                      time_stop: 64,
                      freq_start: 0,
                      freq_stop: 256,
                    },
                    physical_coordinates: {
                      frequency_mhz: selectedCandidate.frequencyMHz,
                      drift_rate_hz_s: selectedCandidate.driftRateHzPerSec,
                      snr_db: selectedCandidate.snrDb,
                    },
                  });
                  toast.success(`Candidate ${selectedCandidate.id} saved to Candidate Ledger!`, {
                    description: 'Viewable on Candidate Review Ledger page.',
                  });
                } catch (err: unknown) {
                  const msg =
                    (err as { message?: string })?.message || 'Failed to save candidate to ledger.';
                  toast.error('Could not save candidate', { description: msg });
                }
              }}
              className="w-full text-xs font-mono"
            >
              Save to candidate ledger
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
