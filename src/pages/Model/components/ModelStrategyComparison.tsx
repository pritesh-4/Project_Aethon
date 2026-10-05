import { GitCompare, Check, X, Sparkles } from 'lucide-react';

export function ModelStrategyComparison() {
  return (
    <div className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-5 font-mono select-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#1C2630] pb-3 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <GitCompare className="h-4 w-4 text-[#5BD8F5]" />
          <h2 className="text-xs font-medium text-[#E6EDF2]">Classification vs open discovery</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
        {/* Left Column: Supervised Classification */}
        <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1C2630] pb-2">
            <span className="text-xs font-medium text-[#E6EDF2]">Supervised classifier</span>
            <span className="text-[9px] text-[#7F8B95]">Closed-set assumption</span>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] text-[#7F8B95] font-medium block">
              Operational requirements:
            </span>
            <ul className="space-y-1 text-[#7F8B95] font-sans text-xs">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-[#7F8B95]" />
                <span>Explicit ground-truth training labels</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-[#7F8B95]" />
                <span>Exhaustive catalog of pre-defined categories</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-[#7F8B95]" />
                <span>Verified historical examples per class</span>
              </li>
            </ul>
          </div>

          <div className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-[#E8AE50] font-medium text-[10px]">
              <X className="h-3.5 w-3.5" />
              <span>Fundamental limitation</span>
            </div>
            <p className="text-[11px] text-[#7F8B95] font-sans leading-relaxed">
              If an unfamiliar signal or candidate does not match a pre-defined training class, a
              supervised classifier will either misclassify it into the nearest familiar category or
              discard it.
            </p>
          </div>
        </div>

        {/* Right Column: AETHON Discovery Paradigm */}
        <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1C2630] pb-2">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-[#5BD8F5]" />
              <span className="text-xs font-medium text-[#5BD8F5]">Aethon discovery model</span>
            </div>
            <span className="text-[9px] text-[#5BD8F5]">Open-world discovery</span>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] text-[#5BD8F5] font-medium block">
              Learned representation properties:
            </span>
            <ul className="space-y-1 text-[#E6EDF2] font-sans text-xs">
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-[#5BD8F5]" />
                <span>Continuous geometrical structure of radio spectra</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-[#5BD8F5]" />
                <span>Latent representation distance and harmonic coherence</span>
              </li>
              <li className="flex items-center gap-2">
                <Check className="h-3.5 w-3.5 text-[#5BD8F5]" />
                <span>Temporal persistence across pointing cadence</span>
              </li>
            </ul>
          </div>

          <div className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-3 space-y-1">
            <span className="block text-[10px] text-[#5BD8F5] font-medium">Discovery focus</span>
            <p className="text-[11px] text-[#7F8B95] font-sans leading-relaxed">
              Surfaces candidates that exhibit structural coherence while deviating from learned
              baseline distributions, ensuring uncataloged signals are prioritized for examination.
            </p>
          </div>
        </div>
      </div>

      {/* Discovery Philosophy Quote */}
      <div className="mt-4 rounded-[2px] border border-[#1C2630] bg-[#06080B] p-4 text-xs font-mono">
        <span className="block text-[10px] text-[#E8AE50] font-medium mb-1">
          Discovery approach
        </span>
        <blockquote className="text-[#7F8B95] font-sans leading-relaxed text-xs italic">
          “Aethon does not rely exclusively on closed-set categorization. Its discovery workflow is
          designed to prioritize researcher attention for observations that fall outside dominant
          learned signal structures.”
        </blockquote>
      </div>
    </div>
  );
}
