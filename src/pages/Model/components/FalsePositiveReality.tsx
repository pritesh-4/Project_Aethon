import { FALSE_POSITIVE_SOURCES } from '../data/modelData.ts';
import { ShieldAlert, Users, Compass } from 'lucide-react';

export function FalsePositiveReality() {
  return (
    <div className="rounded border border-[#1C2630] bg-[#0B0F14] p-5 select-none space-y-5">
      {/* Section Header */}
      <div className="border-b border-[#1C2630] pb-3 space-y-1">
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-4 w-4 text-[#E8AE50]" />
          <h3 className="text-sm font-semibold text-[#E6EDF2]">
            The Reality of False Positives in Radio Astronomy
          </h3>
        </div>
        <p className="text-xs text-[#7F8B95] leading-relaxed">
          In high-cadence observational astronomy, statistical anomalies are common. True scientific
          discovery requires understanding where anomalies come from.
        </p>
      </div>

      {/* 4 Real-World False Positive Sources Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {FALSE_POSITIVE_SOURCES.map((source) => (
          <div
            key={source.id}
            className="rounded border border-[#1C2630] bg-[#06080B] p-4 flex flex-col justify-between space-y-3"
          >
            <div className="space-y-1.5">
              <span className="text-xs font-semibold text-[#E6EDF2] block">{source.title}</span>

              <div className="text-[11px] text-[#7F8B95]">
                <strong className="text-[#94A3B8]">Origin:</strong> {source.origin}
              </div>

              <p className="text-xs text-[#7F8B95] leading-relaxed">{source.description}</p>
            </div>

            <div className="border-t border-[#1C2630] pt-2 text-[11px] text-[#7F8B95]">
              <strong className="text-[#5BD8F5] block mb-0.5">Mitigation Protocol:</strong>
              <span>{source.mitigation}</span>
            </div>
          </div>
        ))}
      </div>

      {/* The Core Scientific Principle Banner: AI SURFACES CANDIDATES. SCIENTISTS INVESTIGATE. */}
      <div className="rounded border border-[#5BD8F5]/30 bg-[#5BD8F5]/5 p-5 text-center sm:text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <Compass className="h-4 w-4 text-[#5BD8F5]" />
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5BD8F5]">
              The Scientific Relationship
            </span>
          </div>

          <h4 className="text-base sm:text-lg font-bold tracking-tight text-[#E6EDF2]">
            AI SURFACES CANDIDATES. SCIENTISTS INVESTIGATE.
          </h4>

          <p className="text-xs text-[#7F8B95] max-w-2xl leading-relaxed">
            Machine learning algorithms excel at identifying subtle statistical outliers across
            petabyte-scale data streams. But an algorithm cannot declare a scientific discovery.
            AETHON screens billions of raw points into prioritized candidate queues so astronomers
            can perform physical validation.
          </p>
        </div>

        <div className="shrink-0 flex items-center justify-center gap-2 rounded border border-[#1C2630] bg-[#0B0F14] px-4 py-3 text-xs text-[#E6EDF2]">
          <Users className="h-4 w-4 text-[#5BD8F5]" />
          <span>Human-in-the-Loop Triage</span>
        </div>
      </div>
    </div>
  );
}
