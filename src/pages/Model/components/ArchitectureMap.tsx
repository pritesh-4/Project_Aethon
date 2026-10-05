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
    <div className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-5 font-mono select-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#1C2630] pb-3 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-[#5BD8F5]" />
          <h2 className="text-xs font-medium text-[#E6EDF2]">Architecture topology</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Computational Architecture Graph (7 Cols) */}
        <div className="lg:col-span-7 rounded-[2px] border border-[#1C2630] bg-[#06080B] p-4 space-y-3 relative">
          <div className="text-[9px] text-[#7F8B95] flex items-center justify-between border-b border-[#1C2630] pb-2">
            <span>Execution flow</span>
            <span className="text-[#5BD8F5]">6 pipeline stages</span>
          </div>

          {/* Node 1: Radio Observation */}
          <button
            type="button"
            onClick={() => onSelectStage('observation')}
            className={`w-full text-left rounded-[2px] border p-3 transition-all cursor-pointer ${
              activeStageId === 'observation'
                ? 'border-[#5BD8F5] bg-[#5BD8F5]/10 text-[#E6EDF2]'
                : 'border-[#1C2630] bg-[#0B0F14] text-[#7F8B95] hover:border-[#7F8B95]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Radio
                  className={`h-4 w-4 ${
                    activeStageId === 'observation' ? 'text-[#5BD8F5]' : 'text-[#7F8B95]'
                  }`}
                />
                <span className="text-xs font-medium">01 · Radio observation</span>
              </div>
              <span className="text-[9px] text-[#7F8B95] font-mono">25.0 MSps</span>
            </div>
            <p className="mt-1 text-[11px] text-[#7F8B95] font-sans">
              Baseband voltages acquired across temporal and frequency windows.
            </p>
          </button>

          {/* Flow Connector */}
          <div className="flex justify-center text-[#7F8B95]">
            <ArrowDown className="h-3.5 w-3.5" />
          </div>

          {/* Node 2: Preprocessing */}
          <button
            type="button"
            onClick={() => onSelectStage('preprocessing')}
            className={`w-full text-left rounded-[2px] border p-3 transition-all cursor-pointer ${
              activeStageId === 'preprocessing'
                ? 'border-[#5BD8F5] bg-[#5BD8F5]/10 text-[#E6EDF2]'
                : 'border-[#1C2630] bg-[#0B0F14] text-[#7F8B95] hover:border-[#7F8B95]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Filter
                  className={`h-4 w-4 ${
                    activeStageId === 'preprocessing' ? 'text-[#5BD8F5]' : 'text-[#7F8B95]'
                  }`}
                />
                <span className="text-xs font-medium">02 · Preprocessing & whitening</span>
              </div>
              <span className="text-[9px] text-[#7F8B95] font-mono">Spectral kurtosis</span>
            </div>
            <p className="mt-1 text-[11px] text-[#7F8B95] font-sans">
              Baseline normalization, thermal background whitening, and stationary bandpass removal.
            </p>
          </button>

          {/* Flow Connector */}
          <div className="flex justify-center text-[#7F8B95]">
            <ArrowDown className="h-3.5 w-3.5" />
          </div>

          {/* Node 3: Time-Frequency */}
          <button
            type="button"
            onClick={() => onSelectStage('transform')}
            className={`w-full text-left rounded-[2px] border p-3 transition-all cursor-pointer ${
              activeStageId === 'transform'
                ? 'border-[#5BD8F5] bg-[#5BD8F5]/10 text-[#E6EDF2]'
                : 'border-[#1C2630] bg-[#0B0F14] text-[#7F8B95] hover:border-[#7F8B95]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Waves
                  className={`h-4 w-4 ${
                    activeStageId === 'transform' ? 'text-[#5BD8F5]' : 'text-[#7F8B95]'
                  }`}
                />
                <span className="text-xs font-medium">03 · Time–frequency transform</span>
              </div>
              <span className="text-[9px] text-[#7F8B95] font-mono">STFT Waterfall</span>
            </div>
            <p className="mt-1 text-[11px] text-[#7F8B95] font-sans">
              Temporal evolution and spectral channelization. Doppler drift becomes observable.
            </p>
          </button>

          {/* Flow Connector */}
          <div className="flex justify-center text-[#7F8B95]">
            <ArrowDown className="h-3.5 w-3.5" />
          </div>

          {/* Node 4: Feature / Embedding Space */}
          <button
            type="button"
            onClick={() => onSelectStage('representation')}
            className={`w-full text-left rounded-[2px] border p-3 transition-all cursor-pointer ${
              activeStageId === 'representation'
                ? 'border-[#5BD8F5] bg-[#5BD8F5]/10 text-[#E6EDF2]'
                : 'border-[#1C2630] bg-[#0B0F14] text-[#7F8B95] hover:border-[#7F8B95]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu
                  className={`h-4 w-4 ${
                    activeStageId === 'representation' ? 'text-[#5BD8F5]' : 'text-[#7F8B95]'
                  }`}
                />
                <span className="text-xs font-medium">04 · Latent embedding space</span>
              </div>
              <span className="text-[9px] text-[#7F8B95] font-mono">z ∈ ℝ⁵¹²</span>
            </div>
            <p className="mt-1 text-[11px] text-[#7F8B95] font-sans">
              High-dimensional projection capturing structural morphology, harmonicity, and
              coherence.
            </p>
          </button>

          {/* Bifurcation Split Connector */}
          <div className="grid grid-cols-2 gap-4 pt-1">
            <div className="flex justify-center text-[#7F8B95]">
              <ArrowDown className="h-3.5 w-3.5 text-[#5BD8F5]" />
            </div>
            <div className="flex justify-center text-[#7F8B95]">
              <ArrowDown className="h-3.5 w-3.5 text-[#E8AE50]" />
            </div>
          </div>

          {/* Bifurcated Nodes: Known Structure vs Anomaly Analysis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Reference Branch */}
            <div className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-3 text-xs">
              <div className="flex items-center justify-between text-[10px] text-[#5BD8F5] font-medium mb-1">
                <span>Known signals</span>
                <span>Reference</span>
              </div>
              <p className="text-[11px] text-[#7F8B95] font-sans leading-relaxed">
                Pulsars, masers, background noise manifold, and verified satellite RFI templates.
              </p>
            </div>

            {/* Anomaly Analysis Node */}
            <button
              type="button"
              onClick={() => onSelectStage('anomaly')}
              className={`text-left rounded-[2px] border p-3 transition-all cursor-pointer ${
                activeStageId === 'anomaly'
                  ? 'border-[#E8AE50] bg-[#E8AE50]/10 text-[#E6EDF2]'
                  : 'border-[#1C2630] bg-[#0B0F14] text-[#7F8B95] hover:border-[#7F8B95]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Zap
                    className={`h-3.5 w-3.5 ${
                      activeStageId === 'anomaly' ? 'text-[#E8AE50]' : 'text-[#7F8B95]'
                    }`}
                  />
                  <span className="text-xs font-medium">05 · Anomaly analysis</span>
                </div>
              </div>
              <p className="mt-1 text-[11px] text-[#7F8B95] font-sans">
                Residual divergence from learned manifold (Index 0.947).
              </p>
            </button>
          </div>

          {/* Convergence Flow Connector */}
          <div className="flex justify-center text-[#7F8B95]">
            <ArrowDown className="h-3.5 w-3.5" />
          </div>

          {/* Final Node: Candidate Ranking */}
          <button
            type="button"
            onClick={() => onSelectStage('ranking')}
            className={`w-full text-left rounded-[2px] border p-3 transition-all cursor-pointer ${
              activeStageId === 'ranking'
                ? 'border-[#5BD8F5] bg-[#5BD8F5]/10 text-[#E6EDF2]'
                : 'border-[#1C2630] bg-[#0B0F14] text-[#7F8B95] hover:border-[#7F8B95]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award
                  className={`h-4 w-4 ${
                    activeStageId === 'ranking' ? 'text-[#5BD8F5]' : 'text-[#7F8B95]'
                  }`}
                />
                <span className="text-xs font-medium">06 · Candidate prioritization</span>
              </div>
              <span className="text-[9px] text-[#E8AE50] font-mono">Priority: High</span>
            </div>
            <p className="mt-1 text-[11px] text-[#7F8B95] font-sans">
              Weighted score dispatching prioritized candidates to scientific review.
            </p>
          </button>
        </div>

        {/* Right: Selected Stage Diagnostics (5 Cols) */}
        <div className="lg:col-span-5 rounded-[2px] border border-[#1C2630] bg-[#06080B] p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-[#1C2630] pb-2">
            <div className="flex items-center gap-2">
              <span className="text-[#5BD8F5] font-medium text-xs">Stage {activeStage.index}</span>
              <h3 className="text-xs font-medium text-[#E6EDF2]">{activeStage.name}</h3>
            </div>
            <div className="flex items-center gap-1 text-[9px] text-[#5BD8F5]">
              <CheckCircle2 className="h-3 w-3" />
              <span>{activeStage.operationalStatus}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-[#7F8B95]">Subsystem focus</span>
            <p className="text-sm font-medium text-[#E6EDF2]">{activeStage.subtitle}</p>
            <p className="text-xs text-[#7F8B95] font-sans leading-relaxed pt-1">
              {activeStage.description}
            </p>
          </div>

          {/* Input & Output Specifications */}
          <div className="space-y-2 rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-3 text-xs">
            <div>
              <span className="block text-[9px] text-[#7F8B95]">Input format</span>
              <span className="text-xs font-mono text-[#E6EDF2]">{activeStage.inputFormat}</span>
            </div>
            <div className="border-t border-[#1C2630] pt-2">
              <span className="block text-[9px] text-[#7F8B95]">Output format</span>
              <span className="text-xs font-mono text-[#5BD8F5]">{activeStage.outputFormat}</span>
            </div>
          </div>

          {/* Telemetry Grid */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-[#7F8B95]">Operational parameters</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {activeStage.telemetry.map((t) => (
                <div
                  key={t.label}
                  className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-2"
                >
                  <span className="block text-[9px] text-[#7F8B95]">{t.label}</span>
                  <span className="text-[11px] font-medium text-[#E6EDF2] mt-0.5 block truncate">
                    {t.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mathematical / Algorithmic Note */}
          <div className="border-t border-[#1C2630] pt-3">
            <span className="block text-[9px] text-[#7F8B95] mb-1">Algorithmic implementation</span>
            <p className="text-[11px] text-[#7F8B95] font-sans leading-relaxed">
              {activeStage.algorithmDetails}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
