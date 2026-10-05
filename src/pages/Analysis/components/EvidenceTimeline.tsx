import { useState } from 'react';
import type { SignalAnalysisRecord } from '../types.ts';
import { Clock } from 'lucide-react';

export interface EvidenceTimelineProps {
  record: SignalAnalysisRecord;
}

export function EvidenceTimeline({ record }: EvidenceTimelineProps) {
  const [selectedEventIdx, setSelectedEventIdx] = useState(3); // Default to peak anomaly event

  const events = record.timelineEvents;
  const totalDurationSec = record.durationSeconds || 272;
  const durationMins = Math.floor(totalDurationSec / 60);
  const durationSecs = totalDurationSec % 60;
  const durationString = `00:${durationMins.toString().padStart(2, '0')}:${durationSecs.toString().padStart(2, '0')}`;

  return (
    <div className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-4 font-mono select-none">
      <div className="flex items-center justify-between border-b border-[#1C2630] pb-2 mb-4">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-[#5BD8F5]" />
          <h4 className="text-xs font-medium text-[#E6EDF2]">Timeline evidence</h4>
        </div>
        <span className="text-[10px] text-[#7F8B95]">Duration: {durationString}</span>
      </div>

      {/* Horizontal Axis Track */}
      <div className="relative pt-6 pb-2 px-4">
        {/* Timeline Bar Line */}
        <div className="h-0.5 w-full bg-[#1C2630] relative">
          {/* Anomalous Window Highlight along track */}
          <div
            className="absolute top-0 h-full bg-[#E8AE50]"
            style={{
              left: `${(record.anomalyStartSec / totalDurationSec) * 100}%`,
              width: `${((record.anomalyEndSec - record.anomalyStartSec) / totalDurationSec) * 100}%`,
            }}
          />
        </div>

        {/* Interactive Event Nodes along track */}
        {events.map((ev, idx) => {
          const leftPercent = Math.min(96, Math.max(4, (ev.timeSec / totalDurationSec) * 100));
          const isSelected = selectedEventIdx === idx;
          const isAnomaly = idx === 3;

          const mins = Math.floor(ev.timeSec / 60);
          const secs = ev.timeSec % 60;
          const timeStr = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;

          return (
            <button
              key={ev.label}
              type="button"
              onClick={() => setSelectedEventIdx(idx)}
              className="absolute -top-1.5 -translate-x-1/2 flex flex-col items-center group cursor-pointer"
              style={{ left: `${leftPercent}%` }}
            >
              {/* Event Marker Node */}
              <div
                className={`h-3 w-3 rounded-full border transition-all ${
                  isSelected
                    ? isAnomaly
                      ? 'border-[#E8AE50] bg-[#E8AE50]'
                      : 'border-[#5BD8F5] bg-[#5BD8F5]'
                    : isAnomaly
                      ? 'border-[#E8AE50] bg-amber-950/80 hover:bg-[#E8AE50]'
                      : 'border-[#1C2630] bg-[#10161D] hover:border-[#7F8B95]'
                }`}
              />

              {/* Time Label */}
              <span
                className={`mt-2 text-[9px] font-mono transition-colors ${
                  isSelected
                    ? 'text-[#E6EDF2] font-medium'
                    : 'text-[#7F8B95] group-hover:text-[#E6EDF2]'
                }`}
              >
                {timeStr}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Event Diagnostic Detail Callout */}
      {selectedEventIdx !== null && (
        <div className="mt-6 rounded-[2px] border border-[#1C2630] bg-[#06080B] p-3 text-xs">
          <div className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5BD8F5]" />
              <span className="font-medium text-[#E6EDF2]">{events[selectedEventIdx].label}</span>
            </div>
            <span className="text-[#5BD8F5] font-mono">
              Power: {events[selectedEventIdx].intensityDbm.toFixed(1)} dBm
            </span>
          </div>
          <p className="mt-1 text-[11px] text-[#7F8B95] font-sans">
            {events[selectedEventIdx].description}
          </p>
        </div>
      )}
    </div>
  );
}
