import { useState } from 'react';
import { TECHNICAL_SECTIONS } from '../data/modelData.ts';
import { ChevronDown, ChevronUp, FileCode2, Terminal } from 'lucide-react';

export function TechnicalDetails() {
  const [openSectionId, setOpenSectionId] = useState<string | null>('tech-1');

  const toggleSection = (id: string) => {
    setOpenSectionId(openSectionId === id ? null : id);
  };

  return (
    <div className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-5 font-mono select-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#1C2630] pb-3 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <FileCode2 className="h-4 w-4 text-[#5BD8F5]" />
          <h2 className="text-xs font-medium text-[#E6EDF2]">
            Technical specifications and formulations
          </h2>
        </div>
      </div>

      <div className="space-y-3">
        {TECHNICAL_SECTIONS.map((sec) => {
          const isOpen = openSectionId === sec.id;

          return (
            <div
              key={sec.id}
              className={`rounded-[2px] border transition-colors ${
                isOpen ? 'border-[#5BD8F5]/60 bg-[#06080B]' : 'border-[#1C2630] bg-[#06080B]/50'
              }`}
            >
              {/* Accordion Trigger */}
              <button
                type="button"
                onClick={() => toggleSection(sec.id)}
                className="w-full p-3.5 flex items-center justify-between text-left cursor-pointer hover:bg-[#10161D]/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Terminal className={`h-4 w-4 ${isOpen ? 'text-[#5BD8F5]' : 'text-[#7F8B95]'}`} />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[#E6EDF2]">{sec.title}</span>
                      <span className="rounded-[1px] border border-[#1C2630] bg-[#10161D] px-1.5 py-0.2 text-[9px] font-mono text-[#7F8B95]">
                        {sec.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#7F8B95] font-sans mt-0.5">{sec.summary}</p>
                  </div>
                </div>

                <div className="text-[#7F8B95] pl-2">
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </div>
              </button>

              {/* Accordion Body */}
              {isOpen && (
                <div className="border-t border-[#1C2630] p-4 space-y-3 text-xs">
                  {/* Formal Mathematical Definition */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-[#7F8B95] font-medium block">
                      Formal definition
                    </span>
                    <p className="text-[#E6EDF2] font-mono text-[11px] bg-[#06080B] p-2.5 rounded-[1px] border border-[#1C2630] leading-relaxed overflow-x-auto">
                      {sec.formalDefinition}
                    </p>
                  </div>

                  {/* Parameter Telemetry Table */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-[#7F8B95] font-medium block">
                      Operational parameters
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {sec.parameters.map((p) => (
                        <div
                          key={p.name}
                          className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-2.5 space-y-1"
                        >
                          <span className="text-[9px] text-[#7F8B95] block">{p.name}</span>
                          <span className="text-[11px] text-[#5BD8F5] font-mono font-medium block">
                            {p.spec}
                          </span>
                          <p className="text-[10px] text-[#7F8B95] font-sans leading-tight">
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
