import type { ModelStageId } from '../types.ts';
import { ARCHITECTURE_STAGES } from '../data/modelData.ts';
import {
  Radio,
  Filter,
  Waves,
  Cpu,
  Zap,
  Award,
  ArrowDown,
  Database,
  CheckCircle2,
} from 'lucide-react';

export interface ArchitectureMapProps {
  activeStageId: ModelStageId;
  onSelectStage: (id: ModelStageId) => void;
}

export function ArchitectureMap({ activeStageId, onSelectStage }: ArchitectureMapProps) {
  const activeStage =
    ARCHITECTURE_STAGES.find((s) => s.id === activeStageId) || ARCHITECTURE_STAGES[0];

  return (
    <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-5 font-mono select-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-3 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-[#66E3FF]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#EAF4F7]">
            COMPUTATIONAL ARCHITECTURE TOPOLOGY
          </h2>
        </div>
        <span className="text-[10px] text-[#84929C] uppercase">
          CLICK ANY NODE TO INSPECT SUBSYSTEM REASONING
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Computational Architecture Graph (7 Cols) */}
        <div className="lg:col-span-7 rounded-[2px] border border-slate-800 bg-[#05070A]/90 p-4 space-y-3 relative">
          <div className="text-[9px] uppercase tracking-wider text-slate-500 flex items-center justify-between border-b border-slate-800/60 pb-2">
            <span>PIPELINE EXECUTION GRAPH</span>
            <span className="text-emerald-400">STATUS: ALL CORES NOMINAL</span>
          </div>

          {/* Node 1: Radio Observation */}
          <button
            type="button"
            onClick={() => onSelectStage('observation')}
            className={`w-full text-left rounded-[2px] border p-3 transition-all cursor-pointer ${
              activeStageId === 'observation'
                ? 'border-[#66E3FF] bg-[#06b6d4]/10 shadow-[0_0_12px_rgba(102,227,255,0.15)] text-[#EAF4F7]'
                : 'border-slate-800 bg-[#0A0E13] text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio
                  className={`h-4 w-4 ${
                    activeStageId === 'observation' ? 'text-[#66E3FF]' : 'text-slate-400'
                  }`}
                />
                <span className="text-xs font-bold uppercase tracking-wider">
                  01 // RADIO OBSERVATION
                </span>
              </div>
              <span className="text-[9px] text-[#84929C] font-mono">25.0 MSPS COMPLEX</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 font-sans">
              Raw dual-polarization baseband voltages acquired across temporal/frequency window.
            </p>
          </button>

          {/* Flow Connector */}
          <div className="flex justify-center text-slate-600">
            <ArrowDown className="h-4 w-4 animate-pulse" />
          </div>

          {/* Node 2: Preprocessing */}
          <button
            type="button"
            onClick={() => onSelectStage('preprocessing')}
            className={`w-full text-left rounded-[2px] border p-3 transition-all cursor-pointer ${
              activeStageId === 'preprocessing'
                ? 'border-[#66E3FF] bg-[#06b6d4]/10 shadow-[0_0_12px_rgba(102,227,255,0.15)] text-[#EAF4F7]'
                : 'border-slate-800 bg-[#0A0E13] text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter
                  className={`h-4 w-4 ${
                    activeStageId === 'preprocessing' ? 'text-[#66E3FF]' : 'text-slate-400'
                  }`}
                />
                <span className="text-xs font-bold uppercase tracking-wider">
                  02 // PREPROCESSING & WHITENING
                </span>
              </div>
              <span className="text-[9px] text-[#84929C] font-mono">SPECTRAL KURTOSIS</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 font-sans">
              Baseline normalization, thermal background whitening, and stationary bandpass removal.
            </p>
          </button>

          {/* Flow Connector */}
          <div className="flex justify-center text-slate-600">
            <ArrowDown className="h-4 w-4 animate-pulse" />
          </div>

          {/* Node 3: Time-Frequency */}
          <button
            type="button"
            onClick={() => onSelectStage('transform')}
            className={`w-full text-left rounded-[2px] border p-3 transition-all cursor-pointer ${
              activeStageId === 'transform'
                ? 'border-[#66E3FF] bg-[#06b6d4]/10 shadow-[0_0_12px_rgba(102,227,255,0.15)] text-[#EAF4F7]'
                : 'border-slate-800 bg-[#0A0E13] text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Waves
                  className={`h-4 w-4 ${
                    activeStageId === 'transform' ? 'text-[#66E3FF]' : 'text-slate-400'
                  }`}
                />
                <span className="text-xs font-bold uppercase tracking-wider">
                  03 // TIME–FREQUENCY REPRESENTATION
                </span>
              </div>
              <span className="text-[9px] text-[#84929C] font-mono">STFT WATERFALL</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 font-sans">
              Temporal evolution × Spectral resolution. Doppler drift and chirp rate become
              observable.
            </p>
          </button>

          {/* Flow Connector */}
          <div className="flex justify-center text-slate-600">
            <ArrowDown className="h-4 w-4 animate-pulse" />
          </div>

          {/* Node 4: Feature / Embedding Space */}
          <button
            type="button"
            onClick={() => onSelectStage('representation')}
            className={`w-full text-left rounded-[2px] border p-3 transition-all cursor-pointer ${
              activeStageId === 'representation'
                ? 'border-[#66E3FF] bg-[#06b6d4]/10 shadow-[0_0_12px_rgba(102,227,255,0.15)] text-[#EAF4F7]'
                : 'border-slate-800 bg-[#0A0E13] text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu
                  className={`h-4 w-4 ${
                    activeStageId === 'representation' ? 'text-[#66E3FF]' : 'text-slate-400'
                  }`}
                />
                <span className="text-xs font-bold uppercase tracking-wider">
                  04 // FEATURE / EMBEDDING SPACE
                </span>
              </div>
              <span className="text-[9px] text-[#84929C] font-mono">z ∈ ℝ⁵¹²</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 font-sans">
              Hyperspherical projection capturing structural morphology, harmonicity, and coherence.
            </p>
          </button>

          {/* Bifurcation Split Connector */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="flex justify-center text-slate-600">
              <ArrowDown className="h-4 w-4 text-[#66E3FF]" />
            </div>
            <div className="flex justify-center text-slate-600">
              <ArrowDown className="h-4 w-4 text-[#FFB84D]" />
            </div>
          </div>

          {/* Bifurcated Nodes: Known Structure vs Anomaly Analysis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Reference Branch */}
            <div className="rounded-[2px] border border-cyan-900/60 bg-[#0A0E13] p-3 text-xs">
              <div className="flex items-center justify-between text-[10px] text-cyan-300 font-bold uppercase mb-1">
                <span>KNOWN STRUCTURE</span>
                <span>CATALOG</span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
                Pulsars, masers, thermal noise manifold, and verified satellite RFI templates.
              </p>
            </div>

            {/* Anomaly Analysis Node */}
            <button
              type="button"
              onClick={() => onSelectStage('anomaly')}
              className={`text-left rounded-[2px] border p-3 transition-all cursor-pointer ${
                activeStageId === 'anomaly'
                  ? 'border-[#FFB84D] bg-amber-950/20 shadow-[0_0_12px_rgba(255,184,77,0.15)] text-[#EAF4F7]'
                  : 'border-slate-800 bg-[#0A0E13] text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Zap
                    className={`h-3.5 w-3.5 ${
                      activeStageId === 'anomaly' ? 'text-[#FFB84D]' : 'text-amber-400'
                    }`}
                  />
                  <span className="text-xs font-bold uppercase tracking-wider">
                    05 // ANOMALY ANALYSIS
                  </span>
                </div>
              </div>
              <p className="mt-1 text-[11px] text-slate-400 font-sans">
                Residual divergence from learned manifold (Index 0.947).
              </p>
            </button>
          </div>

          {/* Convergence Flow Connector */}
          <div className="flex justify-center text-slate-600">
            <ArrowDown className="h-4 w-4 animate-pulse" />
          </div>

          {/* Final Node: Candidate Ranking */}
          <button
            type="button"
            onClick={() => onSelectStage('ranking')}
            className={`w-full text-left rounded-[2px] border p-3 transition-all cursor-pointer ${
              activeStageId === 'ranking'
                ? 'border-[#66E3FF] bg-[#06b6d4]/10 shadow-[0_0_12px_rgba(102,227,255,0.15)] text-[#EAF4F7]'
                : 'border-slate-800 bg-[#0A0E13] text-slate-300 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award
                  className={`h-4 w-4 ${
                    activeStageId === 'ranking' ? 'text-[#66E3FF]' : 'text-slate-400'
                  }`}
                />
                <span className="text-xs font-bold uppercase tracking-wider">
                  06 // CANDIDATE PRIORITIZATION
                </span>
              </div>
              <span className="text-[9px] text-[#FFB84D] font-mono">TRIAGE RANK: HIGH</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400 font-sans">
              Weighted multi-factor score dispatching verified candidates to human scientific
              review.
            </p>
          </button>
        </div>

        {/* Right: Selected Stage Diagnostics & Algorithmic Telemetry (5 Cols) */}
        <div className="lg:col-span-5 rounded-[2px] border border-cyan-800/70 bg-[#05070A] p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-[#66E3FF] font-bold text-xs">STAGE {activeStage.index}</span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#EAF4F7]">
                {activeStage.name}
              </h3>
            </div>
            <div className="flex items-center gap-1 text-[9px] text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              <span>{activeStage.operationalStatus}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-[#84929C] uppercase">SUBSYSTEM FOCUS</span>
            <p className="text-sm font-semibold text-slate-200">{activeStage.subtitle}</p>
            <p className="text-xs text-slate-300 font-sans leading-relaxed pt-1">
              {activeStage.description}
            </p>
          </div>

          {/* Input & Output Specifications */}
          <div className="space-y-2 rounded-[2px] border border-slate-800 bg-[#0A0E13] p-3 text-xs">
            <div>
              <span className="block text-[9px] text-[#84929C] uppercase tracking-wider">
                INPUT FORMAT
              </span>
              <span className="text-xs font-mono text-slate-300">{activeStage.inputFormat}</span>
            </div>
            <div className="border-t border-slate-800/80 pt-2">
              <span className="block text-[9px] text-[#84929C] uppercase tracking-wider">
                OUTPUT FORMAT
              </span>
              <span className="text-xs font-mono text-[#66E3FF]">{activeStage.outputFormat}</span>
            </div>
          </div>

          {/* Telemetry Grid */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-[#84929C] uppercase tracking-wider">
              OPERATIONAL PARAMETERS
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {activeStage.telemetry.map((t) => (
                <div
                  key={t.label}
                  className="rounded-[2px] border border-slate-800 bg-[#0A0E13] p-2"
                >
                  <span className="block text-[9px] text-[#84929C] uppercase">{t.label}</span>
                  <span className="text-[11px] font-semibold text-slate-200 mt-0.5 block truncate">
                    {t.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mathematical / Algorithmic Note */}
          <div className="border-t border-slate-800 pt-3">
            <span className="block text-[9px] text-[#84929C] uppercase tracking-wider mb-1">
              ALGORITHMIC IMPLEMENTATION
            </span>
            <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
              {activeStage.algorithmDetails}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
