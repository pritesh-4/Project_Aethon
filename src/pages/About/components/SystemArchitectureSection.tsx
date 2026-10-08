import { useState } from 'react';
import { ARCHITECTURE_STAGES } from '../data/dossierData.ts';
import { Layers } from 'lucide-react';

export function SystemArchitectureSection() {
  const [selectedStageId, setSelectedStageId] = useState<string>('stage-5');

  const selectedStage =
    ARCHITECTURE_STAGES.find((s) => s.id === selectedStageId) || ARCHITECTURE_STAGES[0];

  return (
    <section id="system-architecture" className="space-y-6 scroll-mt-24">
      {/* Chapter Number & Title */}
      <div className="space-y-1 border-b border-[#E4E1D9] pb-3">
        <div className="font-mono text-xs text-[#376A9B] font-semibold tracking-wider uppercase">
          06 / System Architecture
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-normal text-[#17202A] tracking-tight">
          Interactive End-to-End Pipeline & Physical Mapping
        </h2>
        <p className="text-xs text-[#7E8B96] font-mono">
          Interactive ten-stage telemetry lifecycle and the physical-to-computational
          transformation.
        </p>
      </div>

      {/* Conceptual Diagram: Physical to Computational World */}
      <div className="p-5 bg-[#FAF8F5] border border-[#D6D2C9] rounded-[3px] space-y-4 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono border-b border-[#E4E1D9] pb-2.5">
          <span className="font-semibold text-[#17202A]">
            FIGURE 03 — Physical World to Computational Discovery Mapping
          </span>
          <span className="px-2 py-0.5 rounded-[2px] bg-[#EAE7E0] text-[#56616A] text-[10px]">
            STATUS: MATHEMATICAL TRANSFORMATION
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-center text-xs">
          <div className="p-3 bg-[#F4F1EA] border border-[#E4E1D9] rounded-[2px] space-y-1">
            <span className="font-mono text-[9.5px] text-[#7E8B96] block">1. PHYSICAL</span>
            <span className="font-semibold text-[#17202A] block text-xs">Antenna Voltage</span>
            <span className="text-[10px] text-[#56616A] block">Electromagnetic waves at feed</span>
          </div>

          <div className="p-3 bg-[#F4F1EA] border border-[#E4E1D9] rounded-[2px] space-y-1">
            <span className="font-mono text-[9.5px] text-[#7E8B96] block">2. DIGITIZED</span>
            <span className="font-semibold text-[#17202A] block text-xs">Channelized PFB</span>
            <span className="text-[10px] text-[#56616A] block">
              Complex spectra in discrete bins
            </span>
          </div>

          <div className="p-3 bg-[#F4F1EA] border border-[#E4E1D9] rounded-[2px] space-y-1">
            <span className="font-mono text-[9.5px] text-[#7E8B96] block">3. SCIENTIFIC</span>
            <span className="font-semibold text-[#17202A] block text-xs">Dynamic Spectrum</span>
            <span className="text-[10px] text-[#56616A] block">Time × Freq × Stokes matrix</span>
          </div>

          <div className="p-3 bg-[#F4F1EA] border border-[#E4E1D9] rounded-[2px] space-y-1">
            <span className="font-mono text-[9.5px] text-[#7E8B96] block">4. LEARNED</span>
            <span className="font-semibold text-[#17202A] block text-xs">Latent Vector z</span>
            <span className="text-[10px] text-[#56616A] block">Compressed manifold in R^512</span>
          </div>

          <div className="p-3 bg-[#F4F1EA] border border-[#E4E1D9] rounded-[2px] space-y-1">
            <span className="font-mono text-[9.5px] text-[#7E8B96] block">5. NOVELTY</span>
            <span className="font-semibold text-[#17202A] block text-xs">Anomaly Space</span>
            <span className="text-[10px] text-[#56616A] block">Residual L2 + density distance</span>
          </div>

          <div className="p-3 bg-[#376A9B]/10 border border-[#376A9B]/30 rounded-[2px] space-y-1">
            <span className="font-mono text-[9.5px] text-[#376A9B] font-semibold block">
              6. OUTPUT
            </span>
            <span className="font-semibold text-[#17202A] block text-xs">Research Candidate</span>
            <span className="text-[10px] text-[#376A9B] block">Prioritized for human review</span>
          </div>
        </div>
      </div>

      {/* Interactive 10-Stage Pipeline Explorer */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-mono font-semibold text-[#17202A] uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-[#376A9B]" />
            <span>Interactive 10-Stage System Architecture (Click a stage to inspect)</span>
          </h3>
          <span className="text-[11px] font-mono text-[#7E8B96]">
            STAGE {selectedStage.number} OF 10 SELECTED
          </span>
        </div>

        {/* Stage Selection Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {ARCHITECTURE_STAGES.map((stg) => {
            const isSelected = stg.id === selectedStageId;
            return (
              <button
                key={stg.id}
                type="button"
                onClick={() => setSelectedStageId(stg.id)}
                className={`p-2.5 text-left rounded-[2px] border transition-all cursor-pointer flex flex-col justify-between h-20 ${
                  isSelected
                    ? 'bg-[#17202A] text-[#FAF8F5] border-[#17202A] shadow-sm'
                    : 'bg-[#FAF8F5] text-[#56616A] border-[#D6D2C9] hover:bg-[#EAE7E0]'
                }`}
              >
                <div className="flex items-center justify-between w-full font-mono text-[10px]">
                  <span className={isSelected ? 'text-[#C19348]' : 'text-[#376A9B]'}>
                    STAGE {stg.number}
                  </span>
                  <span
                    className={`text-[9px] truncate max-w-[80px] ${isSelected ? 'text-[#A3ADB6]' : 'text-[#7E8B96]'}`}
                  >
                    {stg.layer}
                  </span>
                </div>
                <div className="font-sans font-medium text-xs leading-snug line-clamp-2">
                  {stg.name}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Stage Inspector Drawer */}
        <div className="p-5 bg-[#FAF8F5] border border-[#376A9B]/40 rounded-[2px] space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E4E1D9] pb-3">
            <div>
              <div className="font-mono text-[10px] text-[#376A9B] uppercase tracking-wider">
                LAYER: {selectedStage.layer} // STAGE {selectedStage.number}
              </div>
              <h4 className="text-lg font-serif font-normal text-[#17202A]">
                {selectedStage.name}
              </h4>
            </div>
            <span className="px-2.5 py-1 rounded-[2px] bg-[#EAE7E0] border border-[#D6D2C9] text-[10.5px] font-mono text-[#17202A]">
              STATUS: {selectedStage.status}
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="font-mono text-[10px] text-[#7E8B96] uppercase font-semibold block">
                Primary Input
              </span>
              <p className="font-mono text-[#17202A] bg-[#F4F1EA] p-2 rounded-[2px] border border-[#E4E1D9]">
                {selectedStage.input}
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-mono text-[10px] text-[#7E8B96] uppercase font-semibold block">
                Computational Output
              </span>
              <p className="font-mono text-[#17202A] bg-[#F4F1EA] p-2 rounded-[2px] border border-[#E4E1D9]">
                {selectedStage.output}
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-mono text-[10px] text-[#7E8B96] uppercase font-semibold block">
                Internal Operation / Algorithm
              </span>
              <p className="text-[#56616A] leading-relaxed font-sans">{selectedStage.operation}</p>
            </div>

            <div className="space-y-1">
              <span className="font-mono text-[10px] text-[#7E8B96] uppercase font-semibold block">
                Scientific Purpose
              </span>
              <p className="text-[#56616A] leading-relaxed font-sans">{selectedStage.purpose}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
