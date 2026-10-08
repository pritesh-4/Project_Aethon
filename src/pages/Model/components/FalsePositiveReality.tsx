import { FALSE_POSITIVE_SOURCES } from '../data/modelData.ts';
import { AlertCircle, Users, Compass } from 'lucide-react';

export function FalsePositiveReality() {
  return (
    <div className="border-t border-[#D6D2C9] pt-6 select-none space-y-5 font-sans">
      {/* Section Header */}
      <div className="border-b border-[#D6D2C9] pb-2.5 space-y-0.5">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-[#C19348]" />
          <h3 className="text-sm font-semibold text-[#17202A]">
            False Positives & Empirical Reality
          </h3>
        </div>
        <p className="text-xs text-[#56616A] leading-relaxed">
          In high-cadence radio astronomy, statistical deviations are frequent. Scientific rigor
          demands isolating true physical emission from systematic instrumentation artifacts.
        </p>
      </div>

      {/* Real-World False Positive Sources: 2x2 Ruled Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#D6D2C9] border border-[#D6D2C9] bg-[#FAF8F5] rounded-[3px] overflow-hidden shadow-xs">
        {FALSE_POSITIVE_SOURCES.map((source) => (
          <div key={source.id} className="p-4 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#17202A]">{source.title}</span>
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#76828D]">
                  {source.id}
                </span>
              </div>

              <div className="text-[11px] font-mono text-[#56616A]">
                <span className="text-[#76828D]">Origin:</span> {source.origin}
              </div>

              <p className="text-xs text-[#56616A] leading-relaxed pt-1">{source.description}</p>
            </div>

            <div className="border-t border-[#D6D2C9] pt-2 text-xs">
              <span className="text-[#376A9B] font-mono text-[10px] uppercase tracking-wider block mb-0.5 font-semibold">
                Rejection Protocol
              </span>
              <span className="text-[#56616A]">{source.mitigation}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Core Scientific Principle Banner */}
      <div className="border-t border-[#D6D2C9] pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Compass className="h-3.5 w-3.5 text-[#376A9B]" />
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#376A9B] font-semibold">
              Scientific Epistemology
            </span>
          </div>

          <h4 className="text-base sm:text-lg font-normal tracking-tight text-[#17202A] font-serif">
            Algorithms isolate mathematical deviations. Observers confirm physical reality.
          </h4>

          <p className="text-xs text-[#56616A] max-w-2xl leading-relaxed">
            Machine learning models excel at identifying subtle statistical outliers across terabyte
            data streams, but an algorithm cannot declare a discovery. AETHON screens raw inputs
            into prioritized queues so human researchers can conduct verification campaigns.
          </p>
        </div>

        <div className="shrink-0 flex items-center gap-2 text-xs font-mono text-[#17202A] border border-[#D6D2C9] bg-[#EAE7E0] px-3.5 py-2.5 rounded-[2px]">
          <Users className="h-3.5 w-3.5 text-[#376A9B]" />
          <span className="font-semibold">HUMAN VERIFICATION</span>
        </div>
      </div>
    </div>
  );
}
