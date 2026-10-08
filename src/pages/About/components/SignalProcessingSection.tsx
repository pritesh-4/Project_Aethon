import { DATA_FORMAT_SPECS } from '../data/dossierData.ts';
import { Database, ShieldCheck } from 'lucide-react';

export function SignalProcessingSection() {
  return (
    <section id="signal-processing" className="space-y-6 scroll-mt-24">
      {/* Chapter Number & Title */}
      <div className="space-y-1 border-b border-[#E4E1D9] pb-3">
        <div className="font-mono text-xs text-[#376A9B] font-semibold tracking-wider uppercase">
          07 / Signal Processing & Data Formats
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-normal text-[#17202A] tracking-tight">
          Spectrotemporal Representation & File Specifications
        </h2>
        <p className="text-xs text-[#7E8B96] font-mono">
          Dynamic spectrum matrices, astronomical container comparisons, and immutable observational
          provenance.
        </p>
      </div>

      {/* Core Representation Narrative */}
      <div className="space-y-4 text-base text-[#56616A] leading-relaxed font-sans">
        <p>
          The fundamental data structure in Project AETHON is the{' '}
          <strong className="text-[#17202A]">three-dimensional dynamic spectrum tensor</strong>:
        </p>

        <div className="p-4 bg-[#FAF8F5] border border-[#D6D2C9] rounded-[2px] font-mono text-xs text-[#17202A] my-3">
          <div className="text-[10px] text-[#7E8B96] mb-1">TENSOR REPRESENTATION:</div>
          <div className="text-sm font-semibold text-[#376A9B]">D in R^(T × F × P)</div>
          <div className="grid sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-[#E4E1D9] text-[11px] text-[#56616A]">
            <div>
              <strong>T:</strong> Observation Time integration steps
            </div>
            <div>
              <strong>F:</strong> Discrete Frequency channels (Hz)
            </div>
            <div>
              <strong>P:</strong> Polarization / Stokes (I, Q, U, V)
            </div>
          </div>
        </div>

        <p>
          By structuring observations into $(T \times F \times P)$ tensors, morphological properties
          become directly quantifiable: temporal persistence corresponds to continuity along $T$,
          instantaneous bandwidth corresponds to thickness along $F$, and linear Doppler drift
          corresponds to the directional derivative $\partial F / \partial T$.
        </p>
      </div>

      {/* Data Container Comparison Table */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-mono font-semibold text-[#17202A] uppercase tracking-wider flex items-center gap-1.5">
          <Database className="h-4 w-4 text-[#376A9B]" />
          <span>Astronomical Container Formats in AETHON</span>
        </h3>

        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          {DATA_FORMAT_SPECS.map((fmt) => (
            <div
              key={fmt.extension}
              className="p-3.5 bg-[#FAF8F5] border border-[#D6D2C9] rounded-[2px] space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-semibold text-[#376A9B]">
                    {fmt.extension}
                  </span>
                  <span className="text-[10px] font-mono bg-[#EAE7E0] px-1.5 py-0.5 rounded-[2px] text-[#56616A]">
                    {fmt.status}
                  </span>
                </div>
                <div className="font-medium text-[#17202A] mt-1 text-xs">{fmt.name}</div>
                <p className="text-[#56616A] text-[11.5px] mt-1 leading-relaxed">{fmt.role}</p>
              </div>

              <div className="pt-2 border-t border-[#E4E1D9] space-y-1 text-[10.5px]">
                <div className="text-[#3D7D54]">
                  <strong>Strengths:</strong> {fmt.strengths}
                </div>
                <div className="text-[#7E8B96]">
                  <strong>Caveat:</strong> {fmt.caveat}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Provenance and Reproducibility Chain */}
      <div className="p-4 bg-[#FAF8F5] border border-[#D6D2C9] rounded-[2px] space-y-3 my-4">
        <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#17202A] uppercase tracking-wider border-b border-[#E4E1D9] pb-2">
          <ShieldCheck className="h-4 w-4 text-[#376A9B]" />
          <span>Observational Provenance & Traceability Ledger</span>
        </div>
        <p className="text-xs text-[#56616A] leading-relaxed">
          For any candidate surfaced by AETHON, the system records an immutable provenance payload.
          This metadata ensures that any anomalous deviation can be reproduced by independent
          researchers directly from raw observatory archives:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[10.5px]">
          <div className="p-2 bg-[#F4F1EA] rounded-[2px] border border-[#E4E1D9]">
            <span className="text-[#7E8B96] block text-[9.5px]">IDENTIFIER</span>
            <span className="text-[#17202A]">OBS_ID / UUID</span>
          </div>
          <div className="p-2 bg-[#F4F1EA] rounded-[2px] border border-[#E4E1D9]">
            <span className="text-[#7E8B96] block text-[9.5px]">POINTINGS</span>
            <span className="text-[#17202A]">RA / DEC / J2000</span>
          </div>
          <div className="p-2 bg-[#F4F1EA] rounded-[2px] border border-[#E4E1D9]">
            <span className="text-[#7E8B96] block text-[9.5px]">BANDWIDTH</span>
            <span className="text-[#17202A]">Center MHz / df (Hz)</span>
          </div>
          <div className="p-2 bg-[#F4F1EA] rounded-[2px] border border-[#E4E1D9]">
            <span className="text-[#7E8B96] block text-[9.5px]">REPRODUCIBILITY</span>
            <span className="text-[#17202A]">SHA256 Hash + Seed</span>
          </div>
        </div>
      </div>
    </section>
  );
}
