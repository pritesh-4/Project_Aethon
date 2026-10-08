import { BrainCircuit } from 'lucide-react';

export function ModelHeader() {
  return (
    <div className="rounded border border-[#1C2630] bg-[#0B0F14] p-5 sm:p-6 space-y-4 select-none">
      {/* Header Context */}
      <div className="flex items-center justify-between border-b border-[#1C2630] pb-3 text-xs text-[#7F8B95]">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-[#5BD8F5]" />
          <h1 className="text-xs font-semibold text-[#E6EDF2] tracking-wide font-sans">
            Intelligence Architecture
          </h1>
        </div>
        <span className="text-[11px] text-[#7F8B95] hidden sm:inline">
          Unsupervised representation & anomaly isolation
        </span>
      </div>

      {/* The Core Question */}
      <div className="space-y-2">
        <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-[#E6EDF2]">
          “How does AETHON recognize that something does not fit?”
        </h2>

        <p className="text-xs sm:text-sm text-[#7F8B95] leading-relaxed max-w-3xl">
          A standard classifier asks <strong className="text-[#E6EDF2]">“What is this?”</strong> and
          attempts to force unknown astronomical phenomena into predefined categories. AETHON is a
          discovery instrument that asks{' '}
          <strong className="text-[#5BD8F5]">“Does this belong?”</strong> — learning the
          mathematical manifold of natural radio emissions and flagging observations that deviate
          from nominal cosmic backgrounds.
        </p>

        {/* 3 Core Philosophical Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="rounded border border-[#1C2630] bg-[#06080B] p-3 space-y-1">
            <span className="text-[10px] text-[#7F8B95] font-mono block">
              01 · Standard classifier
            </span>
            <span className="text-xs font-semibold text-[#E6EDF2]">“What is this?”</span>
            <p className="text-[11px] text-[#7F8B95] leading-normal">
              Constrained to pre-defined classes, catalogs, and existing training labels.
            </p>
          </div>

          <div className="rounded border border-[#5BD8F5]/30 bg-[#5BD8F5]/5 p-3 space-y-1">
            <span className="text-[10px] text-[#5BD8F5] font-mono block">
              02 · Discovery instrument
            </span>
            <span className="text-xs font-semibold text-[#5BD8F5]">“Does this belong?”</span>
            <p className="text-[11px] text-[#7F8B95] leading-normal">
              Assesses whether an observation belongs to the learned manifold of natural background
              noise.
            </p>
          </div>

          <div className="rounded border border-[#E8AE50]/30 bg-[#E8AE50]/5 p-3 space-y-1">
            <span className="text-[10px] text-[#E8AE50] font-mono block">03 · Search strategy</span>
            <span className="text-xs font-semibold text-[#E8AE50]">Searching the unknown</span>
            <p className="text-[11px] text-[#7F8B95] leading-normal">
              Surfaces coherent outliers that fall outside cataloged astrophysical signatures and
              known interference.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
