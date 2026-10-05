import { Link } from 'react-router';
import { ArrowLeft, BrainCircuit } from 'lucide-react';

export function ModelHeader() {
  return (
    <div className="space-y-4 select-none">
      {/* Header Bar */}
      <header className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-4 font-mono">
        {/* Subtle Breadcrumb Strip */}
        <div className="flex items-center justify-between border-b border-[#1C2630] pb-2 mb-3 text-[10px] text-[#7F8B95]">
          <div className="flex items-center gap-1.5">
            <Link
              to="/"
              className="flex items-center gap-1 text-[#7F8B95] hover:text-[#5BD8F5] transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>Aethon</span>
            </Link>
            <span className="text-[#1C2630]">/</span>
            <span className="text-[#5BD8F5] font-medium">Model</span>
            <span className="text-[#1C2630]">/</span>
            <span className="text-[#7F8B95]">Architecture</span>
          </div>
        </div>

        {/* Title Strip */}
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <BrainCircuit className="h-5 w-5 text-[#5BD8F5]" />
            <h1 className="text-base font-medium tracking-wide text-[#E6EDF2] font-sans">
              Model architecture
            </h1>
          </div>

          <div className="text-[11px] text-[#7F8B95]">
            <span>Unsupervised representation learning and candidate anomaly detection</span>
          </div>
        </div>
      </header>

      {/* Core Principle Statement */}
      <div className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-6 font-mono">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Statement 01 */}
          <div className="space-y-2 border-l-2 border-[#1C2630] pl-4 py-1">
            <span className="text-[10px] text-[#7F8B95] block font-medium">
              01 · The classifier
            </span>
            <p className="text-xs text-[#7F8B95] leading-relaxed font-sans">A classifier asks:</p>
            <p className="text-sm font-medium text-[#E6EDF2] font-sans">“What is this?”</p>
            <p className="text-[11px] text-[#7F8B95] font-sans leading-normal">
              Constrained to pre-defined classes, catalogues, and known labels.
            </p>
          </div>

          {/* Statement 02 */}
          <div className="space-y-2 border-l-2 border-[#5BD8F5] pl-4 py-1">
            <span className="text-[10px] text-[#5BD8F5] block font-medium">
              02 · Discovery system
            </span>
            <p className="text-xs text-[#7F8B95] leading-relaxed font-sans">
              A discovery system asks:
            </p>
            <p className="text-sm font-medium text-[#5BD8F5] font-sans">“Does this belong?”</p>
            <p className="text-[11px] text-[#7F8B95] font-sans leading-normal">
              Assesses whether an observation belongs to the learned distribution of natural
              signals.
            </p>
          </div>

          {/* Statement 03 */}
          <div className="space-y-2 border-l-2 border-[#E8AE50] pl-4 py-1">
            <span className="text-[10px] text-[#E8AE50] block font-medium">
              03 · Search strategy
            </span>
            <p className="text-xs text-[#7F8B95] leading-relaxed font-sans">Primary objective:</p>
            <p className="text-sm font-medium text-[#E8AE50] font-sans">
              Searching the space between known signals.
            </p>
            <p className="text-[11px] text-[#7F8B95] font-sans leading-normal">
              Surfacing coherent outliers that deviate from both natural emissions and known
              interference.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
