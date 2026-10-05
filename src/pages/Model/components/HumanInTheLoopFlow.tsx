import { Users, AlertTriangle, ArrowDown, CheckCircle2 } from 'lucide-react';

export function HumanInTheLoopFlow() {
  return (
    <div className="rounded-[2px] border border-cyan-800/80 bg-[#0A0E13] p-5 font-mono select-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-cyan-800/60 pb-3 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-[#66E3FF]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#EAF4F7]">
            AI SURFACES. SCIENTISTS DECIDE.
          </h2>
        </div>
        <span className="text-[10px] text-cyan-300 uppercase font-semibold">
          HUMAN-IN-THE-LOOP DISCOVERY GATEWAY
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
        {/* Left: Interactive Workflow Flowchart (6 Cols) */}
        <div className="lg:col-span-6 space-y-2 text-xs">
          {/* Step 1 */}
          <div className="rounded-[2px] border border-slate-800 bg-[#05070A] p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-none bg-cyan-400" />
              <span className="font-bold text-slate-200 uppercase">
                01 // AETHON DISCOVERY ENGINE
              </span>
            </div>
            <span className="text-[9px] text-[#84929C]">AUTOMATED TRIAGE</span>
          </div>

          <div className="flex justify-center text-slate-600">
            <ArrowDown className="h-3.5 w-3.5" />
          </div>

          {/* Step 2 */}
          <div className="rounded-[2px] border border-[#FFB84D]/70 bg-amber-950/20 p-3 flex items-center justify-between shadow-[0_0_10px_rgba(255,184,77,0.1)]">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-none bg-[#FFB84D]" />
              <span className="font-bold text-[#FFB84D] uppercase">
                02 // ANOMALOUS CANDIDATE ISOLATED
              </span>
            </div>
            <span className="text-[9px] text-[#FFB84D]">HIGH RESIDUAL α = 0.947</span>
          </div>

          <div className="flex justify-center text-slate-600">
            <ArrowDown className="h-3.5 w-3.5" />
          </div>

          {/* Step 3 */}
          <div className="rounded-[2px] border border-cyan-800 bg-[#05070A] p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-none bg-[#66E3FF]" />
              <span className="font-bold text-cyan-300 uppercase">
                03 // INVESTIGATION QUEUE DISPATCH
              </span>
            </div>
            <span className="text-[9px] text-slate-400">PRIORITY RANK: HIGH</span>
          </div>

          <div className="flex justify-center text-slate-600">
            <ArrowDown className="h-3.5 w-3.5" />
          </div>

          {/* Step 4 */}
          <div className="rounded-[2px] border border-emerald-600 bg-emerald-950/30 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span className="font-bold text-emerald-300 uppercase">
                04 // SCIENTIFIC EXPERT REVIEW
              </span>
            </div>
            <span className="text-[9px] text-emerald-400">ASTRONOMER VALIDATION</span>
          </div>
        </div>

        {/* Right: Core Credibility Mandate (6 Cols) */}
        <div className="lg:col-span-6 rounded-[2px] border border-amber-900/60 bg-amber-950/20 p-4 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold uppercase text-xs">
            <AlertTriangle className="h-4 w-4" />
            <span>ANOMALY DETECTION ≠ SCIENTIFIC DISCOVERY</span>
          </div>

          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            Machine learning models are mathematical optimizers of representation geometry; they
            possess zero astrophysical intuition. When AETHON isolates an anomalous signal, it
            merely asserts:{' '}
            <em className="text-slate-100">
              “This observation breaks our statistical expectations.”
            </em>
          </p>

          <p className="text-xs text-slate-300 font-sans leading-relaxed">
            Only multi-epoch cross-verification by independent human researchers using secondary
            radio telescopes, optical telescopes, or orbital observatories can determine whether a
            candidate represents a novel astrophysical phenomenon, exotic RFI, or an authentic
            technosignature.
          </p>

          <div className="border-t border-amber-900/60 pt-2 flex items-center justify-between text-[10px] text-[#84929C]">
            <span>VERIFICATION PROTOCOL:</span>
            <span className="text-amber-400 font-semibold uppercase">
              SECONDARY BEAM CONFIRMATION MANDATORY
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
