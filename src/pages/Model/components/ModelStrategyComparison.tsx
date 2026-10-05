import { GitCompare, Check, X, Sparkles } from 'lucide-react';

export function ModelStrategyComparison() {
  return (
    <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-5 font-mono select-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-3 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <GitCompare className="h-4 w-4 text-[#66E3FF]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#EAF4F7]">
            MODEL STRATEGY: SUPERVISED CLASSIFICATION VS OPEN DISCOVERY
          </h2>
        </div>
        <span className="text-[10px] text-[#84929C] uppercase">PARADIGM COMPARISON</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
        {/* Left Column: Supervised Classification */}
        <div className="rounded-[2px] border border-slate-800 bg-[#05070A]/80 p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              CONVENTIONAL SUPERVISED CLASSIFIER
            </span>
            <span className="text-[9px] text-slate-500 uppercase">CLOSED-WORLD ASSUMPTION</span>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              OPERATIONAL PREREQUISITES:
            </span>
            <ul className="space-y-1 text-slate-400 font-sans text-xs">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-slate-500" />
                <span>Explicit ground-truth training labels</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-slate-500" />
                <span>Exhaustive catalog of pre-defined categories</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-slate-500" />
                <span>Thousands of verified historical examples per class</span>
              </li>
            </ul>
          </div>

          <div className="rounded-[2px] border border-amber-900/60 bg-amber-950/20 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase text-[10px]">
              <X className="h-3.5 w-3.5" />
              <span>FUNDAMENTAL SCIENTIFIC BOTTLENECK</span>
            </div>
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">
              If an unknown astrophysical phenomenon or genuine technosignature does not match an
              existing labeled class, a supervised classifier is mathematically forced to
              misclassify it as the closest known category or discard it as noise.
            </p>
          </div>
        </div>

        {/* Right Column: AETHON Discovery Paradigm */}
        <div className="rounded-[2px] border border-[#66E3FF]/70 bg-cyan-950/10 p-4 space-y-3 shadow-[0_0_15px_rgba(102,227,255,0.06)]">
          <div className="flex items-center justify-between border-b border-cyan-800/60 pb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#66E3FF]" />
              <span className="text-xs font-bold text-[#66E3FF] uppercase tracking-wider">
                AETHON UNSUPERVISED DISCOVERY ENGINE
              </span>
            </div>
            <span className="text-[9px] text-[#66E3FF] uppercase font-bold">
              OPEN-WORLD DISCOVERY
            </span>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] text-cyan-300 font-bold uppercase tracking-wider block">
              WHAT AETHON LEARNS:
            </span>
            <ul className="space-y-1 text-slate-300 font-sans text-xs">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-[#66E3FF]" />
                <span>Continuous geometrical structure of radio observations</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-[#66E3FF]" />
                <span>Latent representation distance & harmonic coherence</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-[#66E3FF]" />
                <span>Multi-cadence temporal persistence across pointing beams</span>
              </li>
            </ul>
          </div>

          <div className="rounded-[2px] border border-cyan-800/80 bg-[#05070A] p-3 space-y-1">
            <span className="block text-[10px] text-[#66E3FF] font-bold uppercase tracking-wider">
              DISCOVERY ADVANTAGE
            </span>
            <p className="text-[11px] text-slate-200 font-sans leading-relaxed">
              Surfaces candidate signatures that exhibit high structural coherence while deviating
              substantially from learned reference distributions, ensuring unexpected phenomena are
              never discarded simply because they lack prior catalog labels.
            </p>
          </div>
        </div>
      </div>

      {/* Discovery Mode Philosophy Quote (Section 11) */}
      <div className="mt-4 rounded-[2px] border border-slate-800 bg-[#05070A] p-4 text-xs font-mono">
        <span className="block text-[10px] text-[#FFB84D] font-bold uppercase tracking-wider mb-1">
          DISCOVERY MODE PHILOSOPHY
        </span>
        <blockquote className="text-slate-300 font-sans leading-relaxed text-xs italic">
          “AETHON is not optimized solely for closed-set classification. Its discovery workflow is
          engineered to preserve researcher attention for observations that fall outside the
          dominant learned signal structure.”
        </blockquote>
      </div>
    </div>
  );
}
