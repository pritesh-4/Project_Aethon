import { useMemo } from 'react';
import type { ArchivedObservation } from '../types.ts';
import { ObservationRecord } from './ObservationRecord.tsx';

export interface ArchiveTimelineProps {
  observations: ArchivedObservation[];
  selectedObservationId: string;
  onSelectObservation: (obs: ArchivedObservation) => void;
}

export function ArchiveTimeline({
  observations,
  selectedObservationId,
  onSelectObservation,
}: ArchiveTimelineProps) {
  // Group observations chronologically by date
  const groupedByDate = useMemo(() => {
    const groups: { date: string; items: ArchivedObservation[] }[] = [];
    const dateMap = new Map<string, ArchivedObservation[]>();

    for (const obs of observations) {
      const list = dateMap.get(obs.date);
      if (list) {
        list.push(obs);
      } else {
        const newList = [obs];
        dateMap.set(obs.date, newList);
        groups.push({ date: obs.date, items: newList });
      }
    }

    return groups;
  }, [observations]);

  return (
    <div className="select-none space-y-4 font-sans">
      {/* Table Column Headers (Desktop) */}
      <div className="hidden sm:grid sm:grid-cols-12 sm:items-center sm:gap-2 px-3.5 py-2 text-[11px] font-mono uppercase tracking-wider text-[#56616A] border-b border-[#D6D2C9]">
        <div className="col-span-3">Timestamp (UTC)</div>
        <div className="col-span-3">Observation ID</div>
        <div className="col-span-2">Detections</div>
        <div className="col-span-2">Priority</div>
        <div className="col-span-2 text-right">Status</div>
      </div>

      {/* Chronological Groups */}
      <div className="space-y-4">
        {groupedByDate.map((group) => {
          return (
            <div key={group.date} className="space-y-1.5">
              {/* Date Header */}
              <div className="flex items-center justify-between px-1 text-xs text-[#56616A]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-[#17202A]">
                    {group.date}
                  </span>
                  <span className="text-[#D6D2C9]">/</span>
                  <span className="text-[11px] font-mono text-[#76828D]">
                    {group.items.length} {group.items.length === 1 ? 'pointing' : 'pointings'}
                  </span>
                </div>
              </div>

              {/* Observation Records Ledger under this date */}
              <div className="border border-[#D6D2C9] bg-[#FAF8F5] rounded-[3px] divide-y divide-[#D6D2C9] overflow-hidden shadow-xs">
                {group.items.map((obs) => {
                  const isSelected = obs.id === selectedObservationId;
                  return (
                    <ObservationRecord
                      key={obs.id}
                      observation={obs}
                      isSelected={isSelected}
                      onSelect={onSelectObservation}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
