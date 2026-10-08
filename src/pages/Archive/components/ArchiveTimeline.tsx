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
    <div className="select-none space-y-4">
      {/* Table Column Headers (Desktop) */}
      <div className="hidden sm:grid sm:grid-cols-12 sm:items-center sm:gap-2 px-3 py-2 text-xs font-normal text-[#9A9C96] border-b border-[#242825]">
        <div className="col-span-3">Date / time (UTC)</div>
        <div className="col-span-3">Observation ID</div>
        <div className="col-span-2">Candidate count</div>
        <div className="col-span-2">Highest priority</div>
        <div className="col-span-2 text-right">Review state</div>
      </div>

      {/* Subtle Chronological Groups */}
      <div className="space-y-5">
        {groupedByDate.map((group) => {
          return (
            <div key={group.date} className="space-y-1.5">
              {/* Subtle Date Header */}
              <div className="flex items-center justify-between px-1 py-1 text-xs text-[#9A9C96]">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-[#E6E4DD]">{group.date}</span>
                  <span className="text-[#666963]">·</span>
                  <span className="text-[11px] text-[#9A9C96]">
                    {group.items.length} {group.items.length === 1 ? 'observation' : 'observations'}
                  </span>
                </div>
              </div>

              {/* Observation Records under this date */}
              <div className="space-y-1">
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
