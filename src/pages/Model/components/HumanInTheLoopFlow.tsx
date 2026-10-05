import { Users, AlertTriangle, ArrowDown, CheckCircle2 } from 'lucide-react';

export function HumanInTheLoopFlow() {
  return (
    <div className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-5 font-mono select-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#1C2630] pb-3 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[#5BD8F5]" />
          <h2 className="text-xs font-medium text-[#E6EDF2]">Human-in-the-loop review</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Workflow Flowchart (6 Cols) */}
        <div className="lg:col-span-6 space-y-2 text-xs">
          {/* Step 1 */}
          <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5BD8F5]" />
              <span className="font-medium text-[#E6EDF2]">01 · Signal representation</span>
            </div>
            <span className="text-[9px] text-[#7F8B95]">Automated triage</span>
          </div>

          <div className="flex justify-center text-[#7F8B95]">
            <ArrowDown className="h-3.5 w-3.5" />
          </div>

          {/* Step 2 */}
          <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#E8AE50]" />
              <span className="font-medium text-[#E8AE50]">02 · Candidate event isolated</span>
            </div>
            <span className="text-[9px] text-[#E8AE50]">Residual α = 0.947</span>
          </div>

          <div className="flex justify-center text-[#7F8B95]">
            <ArrowDown className="h-3.5 w-3.5" />
          </div>

          {/* Step 3 */}
          <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5BD8F5]" />
              <span className="font-medium text-[#E6EDF2]">03 · Review queue dispatch</span>
            </div>
            <span className="text-[9px] text-[#7F8B95]">High priority</span>
          </div>

          <div className="flex justify-center text-[#7F8B95]">
            <ArrowDown className="h-3.5 w-3.5" />
          </div>

          {/* Step 4 */}
          <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-3.5 w-3.5 text-[#5BD8F5]" />
              <span className="font-medium text-[#5BD8F5]">04 · Scientific review</span>
            </div>
            <span className="text-[9px] text-[#5BD8F5]">Astronomer verification</span>
          </div>
        </div>

        {/* Right: Core Credibility Mandate (6 Cols) */}
        <div className="lg:col-span-6 rounded-[2px] border border-[#1C2630] bg-[#06080B] p-4 space-y-3">
          <div className="flex items-center gap-2 text-[#E8AE50] font-medium text-xs">
            <AlertTriangle className="h-4 w-4" />
            <span>Anomaly detection is not scientific discovery</span>
          </div>

          <p className="text-xs text-[#7F8B95] font-sans leading-relaxed">
            Machine learning models identify geometric divergence in learned representation space.
            When Aethon isolates an anomalous candidate, it indicates that the signal deviates from
            expected statistical distributions.
          </p>

          <p className="text-xs text-[#7F8B95] font-sans leading-relaxed">
            Independent verification using secondary facilities and off-pointing observations is
            required before establishing astrophysical or artificial provenance.
          </p>

          <div className="border-t border-[#1C2630] pt-2 flex items-center justify-between text-[10px] text-[#7F8B95]">
            <span>Verification step</span>
            <span className="text-[#5BD8F5] font-medium">
              Secondary observation cross-match required
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
