import { useState } from 'react';
import { TECHNICAL_SECTIONS } from '../data/modelData.ts';
import { ChevronDown, ChevronUp, FileCode2, Terminal } from 'lucide-react';

export function TechnicalDetails() {
  const [openSectionId, setOpenSectionId] = useState<string | null>('tech-1');

  const toggleSection = (id: string) => {
    setOpenSectionId(openSectionId === id ? null : id);
  };

  return (
    <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-5 font-mono select-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-3 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <FileCode2 className="h-4 w-4 text-[#66E3FF]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#EAF4F7]">
            TECHNICAL SPECIFICATIONS & MATHEMATICAL FORMULATIONS
          </h2>
        </div>
        <span className="text-[10px] text-[#84929C] uppercase">COLLAPSIBLE RESEARCH APPENDIX</span>
      </div>

      <div className="space-y-3">
        {TECHNICAL_SECTIONS.map((sec) => {
          const isOpen = openSectionId === sec.id;

          return (
            <div
              key={sec.id}
              className={`rounded-[2px] border transition-colors ${
                isOpen ? 'border-[#66E3FF]/60 bg-[#05070A]' : 'border-slate-800 bg-[#05070A]/50'
              }`}
            >
              {/* Accordion Trigger */}
              <button
                type="button"
                onClick={() => toggleSection(sec.id)}
                className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-slate-900/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Terminal className={`h-4 w-4 ${isOpen ? 'text-[#66E3FF]' : 'text-slate-500'}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-[#EAF4F7] uppercase tracking-wider">
                        {sec.title}
                      </span>
                      <span className="rounded-[1px] border border-slate-700 bg-slate-900 px-1.5 py-0.2 text-[9px] font-mono text-slate-400">
                        {sec.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-sans mt-0.5">{sec.summary}</p>
                  </div>
                </div>

                <div className="text-slate-500 pl-2">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {/* Accordion Body */}
              {isOpen && (
                <div className="border-t border-slate-800/80 p-4 space-y-3 text-xs">
                  {/* Formal Mathematical Definition */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-[#84929C] uppercase font-bold tracking-wider">
                      FORMAL DEFINITION
                    </span>
                    <p className="text-slate-300 font-mono text-[11px] bg-slate-950 p-2.5 rounded-[1px] border border-slate-800/80 leading-relaxed overflow-x-auto">
                      {sec.formalDefinition}
                    </p>
                  </div>

                  {/* Parameter Telemetry Table */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-[#84929C] uppercase font-bold tracking-wider">
                      OPERATIONAL PARAMETERS
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {sec.parameters.map((p) => (
                        <div
                          key={p.name}
                          className="rounded-[2px] border border-slate-800 bg-[#0A0E13] p-2.5 space-y-1"
                        >
                          <span className="text-[9px] text-slate-400 uppercase block font-semibold">
                            {p.name}
                          </span>
                          <span className="text-[11px] text-[#66E3FF] font-mono font-bold block">
                            {p.spec}
                          </span>
                          <p className="text-[10px] text-slate-400 font-sans leading-tight">
                            {p.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
