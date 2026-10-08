import { SCIENTIFIC_REFERENCES } from '../data/dossierData.ts';
import { ExternalLink } from 'lucide-react';

export function ReferencesSection() {
  return (
    <section id="references" className="space-y-6 scroll-mt-24 pb-16">
      {/* Chapter Number & Title */}
      <div className="space-y-1 border-b border-[#E4E1D9] pb-3">
        <div className="font-mono text-xs text-[#376A9B] font-semibold tracking-wider uppercase">
          16 / References & Literature Context
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-normal text-[#17202A] tracking-tight">
          Formal Numbered Citations & Bibliographic Records
        </h2>
        <p className="text-xs text-[#7E8B96] font-mono">
          Authoritative literature from NASA, NRAO, Breakthrough Listen, Nature Astronomy, and the
          Astrophysical Journal.
        </p>
      </div>

      {/* Numbered References List */}
      <div className="space-y-3 pt-2">
        {SCIENTIFIC_REFERENCES.map((ref) => (
          <div
            key={ref.id}
            className="p-4 bg-[#FAF8F5] border border-[#D6D2C9] rounded-[2px] space-y-2 text-xs"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <span className="font-mono font-bold text-[#376A9B] text-xs pt-0.5 shrink-0">
                  [{ref.id}]
                </span>
                <div className="space-y-0.5">
                  <div className="font-sans font-semibold text-[#17202A]">
                    {ref.authors} ({ref.year}).
                  </div>
                  <div className="font-serif italic text-sm text-[#17202A] leading-snug">
                    {ref.title}.
                  </div>
                  <div className="font-sans text-[#56616A] text-xs">{ref.venue}.</div>
                </div>
              </div>

              {ref.doiOrUrl && (
                <a
                  href={ref.doiOrUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 p-1.5 rounded-[2px] bg-[#EAE7E0] hover:bg-[#E2DFD7] text-[#376A9B] hover:text-[#17202A] transition-colors"
                  title="Open reference link"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>

            <div className="border-t border-[#E4E1D9] pt-2 text-[11.5px] text-[#7E8B96] leading-relaxed">
              <strong className="text-[#56616A]">Methodological Relevance:</strong> {ref.relevance}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
