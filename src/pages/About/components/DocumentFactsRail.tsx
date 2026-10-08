import { useState } from 'react';
import { Copy, Check, FileText, ExternalLink } from 'lucide-react';

export function DocumentFactsRail() {
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null);

  const bibtex = `@misc{aethon2026,
  title={AETHON: AI-Assisted Discovery of Anomalous Astronomical Radio Signatures},
  author={Project AETHON},
  year={2026},
  howpublished={\\url{https://github.com/pritesh-4/Project_Aethon}},
  note={Research Prototype Dossier ATR-2026-W01}
}`;

  const apa = `Project AETHON. (2026). AETHON: AI-Assisted Discovery of Anomalous Astronomical Radio Signatures (Research Dossier ATR-2026-W01). Retrieved from https://github.com/pritesh-4/Project_Aethon`;

  const handleCopy = (text: string, format: string) => {
    navigator.clipboard.writeText(text);
    setCopiedFormat(format);
    setTimeout(() => setCopiedFormat(null), 2000);
  };

  return (
    <aside
      aria-label="Document Metadata and Citation Rail"
      className="hidden xl:block w-64 shrink-0 sticky top-20 self-start max-h-[calc(100vh-6rem)] overflow-y-auto space-y-5 text-xs select-none pl-4 border-l border-[#E4E1D9]"
    >
      {/* Quick Facts Card */}
      <div className="p-3.5 bg-[#FAF8F5] border border-[#D6D2C9] rounded-[2px] space-y-2.5">
        <div className="flex items-center gap-1.5 font-mono text-[11px] font-semibold text-[#17202A] uppercase tracking-wider border-b border-[#E4E1D9] pb-1.5">
          <FileText className="h-3.5 w-3.5 text-[#376A9B]" />
          <span>Dossier Facts</span>
        </div>

        <div className="space-y-2 text-[11px]">
          <div>
            <span className="text-[#7E8B96] block text-[10px] font-mono">OBSERVABLE MATRIX</span>
            <span className="font-mono text-[#17202A]">Time × Freq × Stokes</span>
          </div>

          <div>
            <span className="text-[#7E8B96] block text-[10px] font-mono">REFERENCE FREQUENCY</span>
            <span className="font-mono text-[#17202A]">1420.405751 MHz (H I)</span>
          </div>

          <div>
            <span className="text-[#7E8B96] block text-[10px] font-mono">PRIMARY DRIFT METRIC</span>
            <span className="font-mono text-[#17202A]">df/dt (Hz/s topocentric)</span>
          </div>

          <div>
            <span className="text-[#7E8B96] block text-[10px] font-mono">DISCOVERY METHOD</span>
            <span className="text-[#17202A]">Normality Manifold Deviation</span>
          </div>

          <div>
            <span className="text-[#7E8B96] block text-[10px] font-mono">EPISTEMOLOGICAL RULE</span>
            <span className="text-[#17202A]">Anomaly ≠ Physical Discovery</span>
          </div>
        </div>
      </div>

      {/* Target Telescopes */}
      <div className="p-3 bg-[#FAF8F5] border border-[#D6D2C9] rounded-[2px] space-y-1.5 text-[11px]">
        <span className="text-[#7E8B96] block text-[10px] font-mono font-semibold uppercase">
          Target Facilities
        </span>
        <ul className="text-[#56616A] space-y-1">
          <li className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-[#376A9B]" />
            <span>Green Bank Telescope (GBT 100m)</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-[#376A9B]" />
            <span>MeerKAT Radio Telescope</span>
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-1 w-1 rounded-full bg-[#376A9B]" />
            <span>Parkes Observatory (Murriyang)</span>
          </li>
        </ul>
      </div>

      {/* Citation Helper */}
      <div className="p-3 bg-[#FAF8F5] border border-[#D6D2C9] rounded-[2px] space-y-2 text-[11px]">
        <span className="text-[#7E8B96] block text-[10px] font-mono font-semibold uppercase">
          Cite This Dossier
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleCopy(bibtex, 'bibtex')}
            className="flex-1 px-2 py-1 bg-[#EAE7E0] hover:bg-[#E2DFD7] text-[#17202A] rounded-[2px] font-mono text-[10px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            {copiedFormat === 'bibtex' ? (
              <Check className="h-3 w-3 text-[#3D7D54]" />
            ) : (
              <Copy className="h-3 w-3 text-[#7E8B96]" />
            )}
            <span>BibTeX</span>
          </button>

          <button
            type="button"
            onClick={() => handleCopy(apa, 'apa')}
            className="flex-1 px-2 py-1 bg-[#EAE7E0] hover:bg-[#E2DFD7] text-[#17202A] rounded-[2px] font-mono text-[10px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
          >
            {copiedFormat === 'apa' ? (
              <Check className="h-3 w-3 text-[#3D7D54]" />
            ) : (
              <Copy className="h-3 w-3 text-[#7E8B96]" />
            )}
            <span>APA</span>
          </button>
        </div>
      </div>

      {/* External Repository Link */}
      <div className="pt-1">
        <a
          href="https://github.com/pritesh-4/Project_Aethon.git"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-mono text-[#376A9B] hover:underline"
        >
          <span>Open GitHub Repository</span>
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </aside>
  );
}
