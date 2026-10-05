import { FALSE_POSITIVE_SOURCES } from '../data/modelData.ts';
import { ShieldAlert } from 'lucide-react';

export function FalsePositivePanel() {
  return (
    <div className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-5 font-mono select-none">
      {/* Header */}
      <div className="border-b border-[#1C2630] pb-3 mb-4">
        <div className="flex items-center gap-2 mb-1">
          <ShieldAlert className="h-4 w-4 text-[#E8AE50]" />
          <h2 className="text-sm font-medium text-[#E6EDF2]">
            False-positive identification and screening
          </h2>
        </div>
        <p className="text-xs text-[#7F8B95] font-sans leading-relaxed">
          Radio astronomy operates in an electromagnetic environment saturated with human
          telecommunications, satellite constellations, and receiver noise. Systematic interference
          rejection is essential before candidate prioritization.
        </p>
      </div>

      {/* Grid of Potential False Positive Sources */}
      <div className="space-y-1.5 mb-5">
        <span className="text-[10px] text-[#7F8B95] font-medium block">
          Known interference mechanisms
        </span>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {FALSE_POSITIVE_SOURCES.map((source) => {
            const isCritical = source.riskFactor === 'CRITICAL';
            const isElevated = source.riskFactor === 'ELEVATED';

            return (
              <div
                key={source.id}
                className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-[#1C2630] pb-1.5 mb-2">
                    <span className="text-[10px] font-medium text-[#E6EDF2] truncate">
                      {source.name}
                    </span>
                    <span
                      className={`text-[9px] px-1 rounded-[1px] font-medium ${
                        isCritical
                          ? 'border border-[#D95C5C]/60 text-[#D95C5C]'
                          : isElevated
                            ? 'border border-[#E8AE50]/60 text-[#E8AE50]'
                            : 'border border-[#1C2630] text-[#7F8B95]'
                      }`}
                    >
                      {source.riskFactor === 'CRITICAL'
                        ? 'Critical'
                        : source.riskFactor === 'ELEVATED'
                          ? 'Elevated'
                          : 'Moderate'}
                    </span>
                  </div>

                  <div className="text-[10px] text-[#7F8B95] mb-1">
                    <span>Origin:</span> {source.origin}
                  </div>

                  <p className="text-[11px] text-[#7F8B95] font-sans leading-relaxed mb-2">
                    {source.frequencyProfile}
                  </p>
                </div>

                <div className="border-t border-[#1C2630] pt-2 mt-1">
                  <span className="block text-[9px] text-[#5BD8F5] font-medium">
                    Mitigation strategy:
                  </span>
                  <p className="text-[10px] text-[#7F8B95] font-sans leading-snug mt-0.5">
                    {source.mitigationStrategy}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* The Screening Funnel Flow */}
      <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-4 text-xs font-mono">
        <span className="block text-[10px] text-[#5BD8F5] font-medium mb-3">
          Multi-stage screening funnel
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center text-center">
          <div className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-2.5">
            <span className="text-[9px] text-[#7F8B95] block">Stage 1: Ingestion</span>
            <span className="text-xs font-medium text-[#E6EDF2] mt-1 block">Raw observation</span>
            <span className="text-[9px] text-[#7F8B95]">Baseband stream</span>
          </div>

          <div className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-2.5">
            <span className="text-[9px] text-[#5BD8F5] block">Stage 2: Screening</span>
            <span className="text-xs font-medium text-[#5BD8F5] mt-1 block">
              Interference rejection
            </span>
            <span className="text-[9px] text-[#7F8B95]">Spatial beam differencing</span>
          </div>

          <div className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-2.5">
            <span className="text-[9px] text-[#E8AE50] block">Stage 3: Triage</span>
            <span className="text-xs font-medium text-[#E8AE50] mt-1 block">Candidate ranking</span>
            <span className="text-[9px] text-[#7F8B95]">Persistence and drift rating</span>
          </div>

          <div className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-2.5">
            <span className="text-[9px] text-[#5BD8F5] block">Stage 4: Verification</span>
            <span className="text-xs font-medium text-[#5BD8F5] mt-1 block">Scientific review</span>
            <span className="text-[9px] text-[#7F8B95]">Astronomer verification</span>
          </div>
        </div>
      </div>
    </div>
  );
}
