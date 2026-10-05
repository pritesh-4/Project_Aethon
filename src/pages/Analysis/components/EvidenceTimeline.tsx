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
    <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-4 font-mono select-none">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-4">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-[#66E3FF]" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#EAF4F7]">
            TEMPORAL EVIDENCE TIMELINE
          </h4>
        </div>
        <span className="text-[10px] text-[#84929C] uppercase">DURATION // {durationString}</span>
      </div>

      {/* Horizontal Axis Track */}
      <div className="relative pt-6 pb-2 px-4">
        {/* Timeline Bar Line */}
        <div className="h-0.5 w-full bg-slate-800 relative">
          {/* Anomalous Window Highlight along track */}
          <div
            className="absolute top-0 h-full bg-[#FFB84D] shadow-[0_0_8px_rgba(255,184,77,0.6)]"
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
                className={`h-3.5 w-3.5 rounded-none border transition-all ${
                  isSelected
                    ? isAnomaly
                      ? 'border-[#FFB84D] bg-[#FFB84D] shadow-[0_0_8px_rgba(255,184,77,0.8)]'
                      : 'border-[#66E3FF] bg-[#66E3FF] shadow-[0_0_8px_rgba(102,227,255,0.6)]'
                    : isAnomaly
                      ? 'border-[#FFB84D] bg-amber-950/80 hover:bg-[#FFB84D]'
                      : 'border-slate-700 bg-slate-900 hover:border-slate-500'
                }`}
              />

              {/* Time Label */}
              <span
                className={`mt-2 text-[9px] font-mono transition-colors ${
                  isSelected
                    ? 'text-[#EAF4F7] font-bold'
                    : 'text-slate-500 group-hover:text-slate-300'
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
        <div className="mt-6 rounded-[2px] border border-cyan-800/60 bg-[#05070A] p-3 text-xs">
          <div className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-none bg-[#66E3FF]" />
              <span className="font-bold text-[#EAF4F7] tracking-wider uppercase">
                {events[selectedEventIdx].label}
              </span>
            </div>
            <span className="text-[#66E3FF] font-mono">
              POWER: {events[selectedEventIdx].intensityDbm.toFixed(1)} dBm
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-300 font-sans">
            {events[selectedEventIdx].description}
          </p>
        </div>
      )}
    </div>
  );
}
