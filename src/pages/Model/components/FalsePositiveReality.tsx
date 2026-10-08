import { FALSE_POSITIVE_SOURCES } from '../data/modelData.ts';
import { AlertCircle, Users, Compass } from 'lucide-react';

export function FalsePositiveReality() {
  return (
    <div className="border-t border-[#242825] pt-6 select-none space-y-5 font-sans">
      {/* Section Header */}
      <div className="border-b border-[#242825] pb-2.5 space-y-0.5">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-3.5 w-3.5 text-[#D4864A]" />
          <h3 className="text-sm font-medium text-[#E6E4DD]">
            False Positives & Empirical Reality
          </h3>
        </div>
        <p className="text-xs text-[#848780] leading-relaxed">
          In high-cadence radio astronomy, statistical deviations are frequent. Scientific rigor
          demands isolating true physical emission from systematic instrumentation artifacts.
        </p>
      </div>

      {/* Real-World False Positive Sources: 2x2 Ruled Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x border border-[#242825] bg-[#101211] rounded-[2px] overflow-hidden">
        {FALSE_POSITIVE_SOURCES.map((source) => (
          <div key={source.id} className="p-4 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#E6E4DD]">{source.title}</span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#767973]">
                  {source.id}
                </span>
              </div>

              <div className="text-[11px] font-mono text-[#848780]">
                <span className="text-[#666963]">Origin:</span> {source.origin}
              </div>

              <p className="text-xs text-[#9A9C96] leading-relaxed pt-1">{source.description}</p>
            </div>

            <div className="border-t border-[#1F2321] pt-2 text-[11px]">
              <span className="text-[#D4864A] font-mono text-[10px] uppercase tracking-wider block mb-0.5">
                Rejection Protocol
              </span>
              <span className="text-[#848780]">{source.mitigation}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Core Scientific Principle Banner */}
      <div className="border-t border-[#242825] pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Compass className="h-3.5 w-3.5 text-[#D4864A]" />
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#D4864A]">
              Scientific Epistemology
            </span>
          </div>

          <h4 className="text-sm sm:text-base font-medium tracking-tight text-[#E6E4DD]">
            Algorithms isolate mathematical deviations. Observers confirm physical reality.
          </h4>

          <p className="text-xs text-[#848780] max-w-2xl leading-relaxed">
            Machine learning models excel at identifying subtle statistical outliers across terabyte
            data streams, but an algorithm cannot declare a discovery. AETHON screens raw inputs
            into prioritized queues so human researchers can conduct verification campaigns.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2 text-xs font-mono text-[#C9C8C0] border border-[#242825] bg-[#0E100F] px-3 py-2 rounded-[2px]">
          <Users className="h-3.5 w-3.5 text-[#D4864A]" />
          <span>HUMAN VERIFICATION</span>
        </div>
      </div>
    </div>
  );
}
