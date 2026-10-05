import { Link } from 'react-router';
import { StatusIndicator } from '@/components/ui/StatusIndicator.tsx';
import { Cpu, ArrowLeft, BrainCircuit } from 'lucide-react';

export function ModelHeader() {
  return (
    <div className="space-y-4 select-none">
      {/* Header Bar */}
      <header className="rounded-[2px] border border-slate-800/80 bg-[#080D1A]/80 p-4 font-mono backdrop-blur-sm">
        {/* Subtle Breadcrumb Strip */}
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-2 mb-3 text-[10px] text-[#84929C]">
          <div className="flex items-center gap-1.5">
            <Link
              to="/"
              className="flex items-center gap-1 text-slate-400 hover:text-[#66E3FF] transition-colors"
            >
              <ArrowLeft className="h-3 w-3" />
              <span>AETHON</span>
            </Link>
            <span className="text-slate-600">/</span>
            <span className="text-[#66E3FF] font-semibold">MODEL</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-400">INTELLIGENCE CORE</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[9px] uppercase tracking-wider">
              SUBSYSTEM // MACHINE LEARNING
            </span>
          </div>
        </div>

        {/* Title Strip */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <BrainCircuit className="h-5 w-5 text-[#66E3FF]" />
              <h1 className="text-base font-bold tracking-widest text-[#EAF4F7] uppercase font-sans">
                AETHON INTELLIGENCE
              </h1>
              <span className="text-slate-600">//</span>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider font-mono">
                THE DISCOVERY ENGINE
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#84929C]">
              <span>MODEL //</span>
              <span className="text-cyan-300 font-semibold">UNSUPERVISED ANOMALY ANALYSIS</span>
              <span className="text-slate-600">•</span>
              <span>STATUS //</span>
              <span className="text-emerald-400 font-semibold">READY</span>
            </div>
          </div>

          {/* Right: Inference Core Status */}
          <div className="flex items-center gap-3 self-end sm:self-center font-mono text-[11px]">
            <div className="flex items-center gap-2 rounded-[2px] border border-cyan-800/60 bg-[#05070A]/80 px-3 py-1.5">
              <Cpu className="h-3.5 w-3.5 text-[#66E3FF]" />
              <div className="flex flex-col">
                <span className="text-[9px] text-[#84929C] uppercase tracking-wider">
                  INFERENCE CORE
                </span>
                <StatusIndicator
                  status="nominal"
                  label="ONLINE"
                  pulse={false}
                  className="text-[10px]"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Statement (Restrained, intellectual, sequential philosophy) */}
      <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-6 font-mono">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Statement 01 */}
          <div className="space-y-2 border-l-2 border-slate-700 pl-4 py-1">
            <span className="text-[10px] text-slate-500 uppercase tracking-widest block font-bold">
              01 // THE CLASSIFIER
            </span>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              A classifier answers:
            </p>
            <p className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono">
              “WHAT IS THIS?”
            </p>
            <p className="text-[11px] text-slate-500 font-sans leading-normal">
              Constrained to pre-defined classes, catalogues, and known labels.
            </p>
          </div>

          {/* Statement 02 */}
          <div className="space-y-2 border-l-2 border-[#66E3FF] pl-4 py-1 bg-cyan-950/10">
            <span className="text-[10px] text-[#66E3FF] uppercase tracking-widest block font-bold">
              02 // THE DISCOVERY SYSTEM
            </span>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              A discovery system must also ask:
            </p>
            <p className="text-sm font-bold text-[#66E3FF] uppercase tracking-wider font-mono">
              “DOES THIS BELONG?”
            </p>
            <p className="text-[11px] text-slate-400 font-sans leading-normal">
              Assesses whether an observation belongs to the learned distribution of natural noise.
            </p>
          </div>

          {/* Statement 03 */}
          <div className="space-y-2 border-l-2 border-[#FFB84D] pl-4 py-1 bg-amber-950/10">
            <span className="text-[10px] text-[#FFB84D] uppercase tracking-widest block font-bold">
              03 // THE AETHON PARADIGM
            </span>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">Our core objective:</p>
            <p className="text-sm font-bold text-[#FFB84D] uppercase tracking-wider font-mono">
              AETHON SEARCHES THE SPACE BETWEEN KNOWN SIGNALS.
            </p>
            <p className="text-[11px] text-slate-400 font-sans leading-normal">
              Surfacing high-coherence outliers that deviate from both natural emissions and RFI.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
