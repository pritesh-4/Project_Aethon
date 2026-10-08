import { Search } from 'lucide-react';

interface DossierHeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function DossierHeader({ searchQuery, onSearchChange }: DossierHeaderProps) {
  return (
    <header className="border-b border-[#D6D2C9] pb-8 pt-2 space-y-6">
      {/* Top Institutional Eyebrow */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-[#56616A]">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#376A9B]" />
          <span className="font-semibold text-[#17202A] tracking-wider uppercase">
            AETHON RESEARCH DOSSIER
          </span>
          <span className="text-[#A3ADB6]">/</span>
          <span>DOCUMENT ID: ATR-2026-W01</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-[#7E8B96]">
          <span>STATUS: RESEARCH PROTOTYPE</span>
          <span>•</span>
          <span>REV 1.4</span>
        </div>
      </div>

      {/* Main Document Titles */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif text-[#17202A] tracking-tight font-normal leading-tight">
          AI-Assisted Discovery of Anomalous Astronomical Radio Signatures
        </h1>
        <p className="text-base sm:text-lg text-[#56616A] font-sans leading-relaxed max-w-3xl">
          An open-set anomaly discovery framework for screening, prioritizing, and investigating
          uncatalogued spectrotemporal deviations in high-cadence astronomical radio surveys.
        </p>
      </div>

      {/* Human Central Epistemological Thesis */}
      <div className="border-l-2 border-[#376A9B] pl-4 py-1 bg-[#FAF8F5]/60 rounded-r-[2px]">
        <blockquote className="font-serif italic text-base sm:text-lg text-[#17202A] leading-relaxed">
          “We do not need to know what an unknown signal looks like to recognize that something does
          not fit.”
        </blockquote>
      </div>

      {/* Document Facts / Metadata Badges */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-2 text-xs font-mono text-[#56616A] border-t border-[#E4E1D9] pt-4">
        <div>
          <span className="text-[#7E8B96]">Context: </span>
          <span className="text-[#17202A] font-medium">Independent Research Prototype</span>
        </div>
        <div>
          <span className="text-[#7E8B96]">Domain: </span>
          <span className="text-[#17202A] font-medium">Radio Astronomy · Machine Learning</span>
        </div>
        <div>
          <span className="text-[#7E8B96]">Repository: </span>
          <a
            href="https://github.com/pritesh-4/Project_Aethon.git"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#376A9B] hover:underline"
          >
            github.com/pritesh-4/Project_Aethon
          </a>
        </div>
        <div>
          <span className="text-[#7E8B96]">License: </span>
          <span className="text-[#17202A] font-medium">MIT</span>
        </div>
      </div>

      {/* Quick In-Dossier Search / Filter */}
      <div className="relative max-w-md pt-2">
        <Search className="absolute left-3 top-5 h-4 w-4 text-[#7E8B96] pointer-events-none" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter research dossier (e.g. Doppler, RFI, BLC1, FITS, baselines)..."
          className="w-full pl-9 pr-3 py-2 text-xs font-sans bg-[#FAF8F5] border border-[#D6D2C9] rounded-[2px] focus:outline-none focus:border-[#376A9B] focus:ring-1 focus:ring-[#376A9B]"
          aria-label="Filter research dossier content"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-5 text-[11px] font-mono text-[#7E8B96] hover:text-[#17202A] cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>
    </header>
  );
}
