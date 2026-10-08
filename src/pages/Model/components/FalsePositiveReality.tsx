import { FALSE_POSITIVE_SOURCES } from '../data/modelData.ts';
import { AlertCircle, Users, Compass } from 'lucide-react';

export function FalsePositiveReality() {
  return (
    <div className="rounded-[2px] border border-[#242825] bg-[#141715] p-5 select-none space-y-5">
      {/* Section Header */}
      <div className="border-b border-[#242825] pb-3 space-y-1">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-[#D4864A]" />
          <h3 className="text-sm font-medium text-[#E6E4DD]">
            False positives in observational radio astronomy
          </h3>
        </div>
        <p className="text-xs text-[#9A9C96] leading-relaxed">
          In high-cadence observational astronomy, statistical anomalies are common. Scientific
          validity requires understanding the physical origins of anomalous detector response.
        </p>
      </div>

      {/* Real-World False Positive Sources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {FALSE_POSITIVE_SOURCES.map((source) => (
          <div
            key={source.id}
            className="rounded-[2px] border border-[#242825] bg-[#101211] p-4 flex flex-col justify-between space-y-3"
          >
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-[#E6E4DD] block">{source.title}</span>

              <div className="text-[11px] text-[#9A9C96]">
                <span className="text-[#666963]">Physical origin:</span> {source.origin}
              </div>

              <p className="text-xs text-[#9A9C96] leading-relaxed">{source.description}</p>
            </div>

            <div className="border-t border-[#242825] pt-2 text-[11px] text-[#9A9C96]">
              <span className="text-[#D4864A] block mb-0.5 font-medium">Rejection protocol:</span>
              <span>{source.mitigation}</span>
            </div>
          </div>
        ))}
      </div>

      {/* The Core Scientific Principle Banner */}
      <div className="rounded-[2px] border border-[#242825] bg-[#101211] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-[#D4864A]" />
            <span className="text-xs font-medium text-[#D4864A]">Scientific epistemology</span>
          </div>

          <h4 className="text-sm sm:text-base font-medium tracking-tight text-[#E6E4DD]">
            Algorithms isolate mathematical deviations. Researchers investigate physical reality.
          </h4>

          <p className="text-xs text-[#9A9C96] max-w-2xl leading-relaxed">
            Machine learning models excel at identifying subtle statistical outliers across
            petabyte-scale data streams. However, an algorithm cannot declare an astronomical
            discovery. AETHON screens billions of raw points into prioritized candidate queues so
            observers can perform multi-telescope verification.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2 rounded-[2px] border border-[#242825] bg-[#141715] px-3.5 py-2.5 text-xs text-[#E6E4DD]">
          <Users className="h-4 w-4 text-[#D4864A]" />
          <span>Human researcher review</span>
        </div>
      </div>
    </div>
  );
}
