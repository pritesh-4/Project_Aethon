import { useMemo } from 'react';
import type { ArchivedObservation } from '../types.ts';
import { ObservationRecord } from './ObservationRecord.tsx';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils.ts';

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
  // Group observations by date
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
    <div className="relative font-mono select-none py-2">
      {/* Outer Continuous Vertical Signal Line */}
      <div className="absolute left-[19px] sm:left-[23px] top-6 bottom-6 w-[1px] bg-[#1C2630] pointer-events-none" />

      <div className="space-y-8">
        {groupedByDate.map((group) => {
          const isDateActive = group.items.some((item) => item.id === selectedObservationId);

          return (
            <div key={group.date} className="relative">
              {/* Date Header Node */}
              <div className="flex items-center gap-3 mb-4 sticky top-0 bg-[#06080B]/90 backdrop-blur-sm z-10 py-1">
                {/* Timeline Node Icon */}
                <div
                  className={cn(
                    'relative z-10 flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-[2px] border bg-[#06080B] transition-colors',
                    isDateActive
                      ? 'border-[#5BD8F5]/70 text-[#5BD8F5]'
                      : 'border-[#1C2630] text-slate-500'
                  )}
                >
                  <Calendar className="h-4 w-4" />
                  <span
                    className={cn(
                      'absolute -top-1 -right-1 h-2 w-2 rounded-full',
                      isDateActive ? 'bg-[#5BD8F5]' : 'bg-slate-700'
                    )}
                  />
                </div>

                {/* Date Label & Summary Count */}
                <div className="flex items-center gap-3">
                  <span className="text-xs sm:text-sm font-semibold tracking-wider text-[#E6EDF2]">
                    {group.date}
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    ({group.items.length}{' '}
                    {group.items.length === 1 ? 'observation' : 'observations'})
                  </span>
                </div>
              </div>

              {/* Observation Nodes under this date */}
              <div className="space-y-3.5 pl-8 sm:pl-10 relative">
                {group.items.map((obs) => {
                  const isSelected = obs.id === selectedObservationId;

                  return (
                    <div key={obs.id} className="relative group">
                      {/* Branch Connector Line (├──) */}
                      <div
                        className={cn(
                          'absolute -left-[13px] sm:-left-[17px] top-[22px] w-[14px] sm:w-[18px] h-[1px] transition-colors',
                          isSelected ? 'bg-[#5BD8F5]' : 'bg-[#1C2630] group-hover:bg-slate-700'
                        )}
                      />

                      {/* Small Junction Node on Timeline Spine */}
                      <div
                        className={cn(
                          'absolute -left-[15px] sm:-left-[19px] top-[20px] h-[5px] w-[5px] rounded-full transition-all',
                          isSelected
                            ? 'bg-[#5BD8F5] ring-2 ring-[#5BD8F5]/30'
                            : 'bg-slate-700 group-hover:bg-slate-500'
                        )}
                      />

                      {/* The Observation Record Card */}
                      <ObservationRecord
                        observation={obs}
                        isSelected={isSelected}
                        onSelect={onSelectObservation}
                      />
                    </div>
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
