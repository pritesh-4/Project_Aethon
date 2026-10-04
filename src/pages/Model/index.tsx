import { PageHeader } from '@/components/layout/PageHeader.tsx';
import { PageTransition } from '@/components/ui/motion.tsx';
import { Badge } from '@/components/ui/Badge.tsx';
import { StatMetric } from '@/components/ui/StatMetric.tsx';
import { Cpu, Layers, GitBranch, Zap, ShieldCheck, Database } from 'lucide-react';

export default function ModelPage() {
  return (
    <PageTransition className="space-y-6">
      <PageHeader
        category="MACHINE LEARNING METHODOLOGY"
        title="AethonNet Neural Architecture"
        subtitle="Transformer-based contrastive representation learning for high-cadence astronomical radio technosignature discovery."
        badge={<Badge variant="cyan">ARCHITECTURE: TRANSFORMER-ENCODER</Badge>}
      />

      {/* Model Spec Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatMetric
          label="Model Backbone"
          value="AethonNet-v2.4"
          subtext="12-Layer Spectral Transformer"
          icon={<Cpu className="h-4 w-4" />}
          status="nominal"
        />
        <StatMetric
          label="Inference Cadence"
          value="14.2"
          unit="ms"
          subtext="Batch Size: 64 channels"
          icon={<Zap className="h-4 w-4" />}
          status="active"
        />
        <StatMetric
          label="Embedding Vector"
          value="512"
          unit="dim"
          subtext="Latent space projection"
          status="nominal"
        />
        <StatMetric
          label="RFI Suppression"
          value="99.98"
          unit="%"
          subtext="Contrastive negative mining"
          icon={<ShieldCheck className="h-4 w-4" />}
          status="nominal"
        />
      </div>

      {/* Neural Pipeline Flow */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-950/80 p-6 backdrop-blur-sm">
        <h3 className="text-lg font-bold font-sans text-slate-100 flex items-center gap-2 mb-4">
          <Layers className="h-5 w-5 text-cyan-400" />
          End-to-End Signal Processing & Anomaly Pipeline
        </h3>

        <div className="grid md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] text-cyan-400">STAGE 01</span>
              <Database className="h-4 w-4 text-slate-400" />
            </div>
            <h4 className="font-bold text-slate-200">Polyphase Channelization</h4>
            <p className="text-slate-400 font-sans text-[11px] leading-relaxed">
              Decomposes wideband gigahertz baseband telemetry into 3.8 Hz fine channels. Produces
              dynamic spectrogram waterfalls (Time × Frequency × Polarization).
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] text-cyan-400">STAGE 02</span>
              <GitBranch className="h-4 w-4 text-slate-400" />
            </div>
            <h4 className="font-bold text-slate-200">Doppler Invariance Transform</h4>
            <p className="text-slate-400 font-sans text-[11px] leading-relaxed">
              Normalizes for Earth's sidereal rotation and barycentric orbital velocities via fast
              Taylor-tree tree de-drifting kernels up to ±20 Hz/s.
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] text-cyan-400">STAGE 03</span>
              <Cpu className="h-4 w-4 text-cyan-400" />
            </div>
            <h4 className="font-bold text-slate-200">Spectral Self-Attention</h4>
            <p className="text-slate-400 font-sans text-[11px] leading-relaxed">
              12 multi-head attention blocks process patches of spectral waterfalls to map noise
              entropy versus coherent, non-natural information structures.
            </p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] text-cyan-400">STAGE 04</span>
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
            </div>
            <h4 className="font-bold text-slate-200">Contrastive RFI Rejection</h4>
            <p className="text-slate-400 font-sans text-[11px] leading-relaxed">
              Signals detected in multi-dish off-target beams are mathematically quarantined as
              terrestrial interference, leaving pure celestial candidates.
            </p>
          </div>
        </div>
      </div>

      {/* Model Benchmark Table */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-950/80 p-6 backdrop-blur-sm font-mono text-xs">
        <h3 className="text-base font-bold font-sans text-slate-100 mb-3">
          Synthetic Injection & Validation Benchmarks
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                <th className="pb-2 font-semibold">SIGNAL CLASS</th>
                <th className="pb-2 font-semibold">SAMPLE COUNT</th>
                <th className="pb-2 font-semibold">PRECISION</th>
                <th className="pb-2 font-semibold">RECALL</th>
                <th className="pb-2 font-semibold">F1 SCORE</th>
                <th className="pb-2 font-semibold">INFERENCE TIME</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900 text-slate-300">
              <tr>
                <td className="py-2.5 font-bold text-cyan-400">Narrowband Continuous Wave (CW)</td>
                <td className="py-2.5">250,000</td>
                <td className="py-2.5 text-emerald-400">99.4%</td>
                <td className="py-2.5 text-emerald-400">98.9%</td>
                <td className="py-2.5 text-emerald-400">0.991</td>
                <td className="py-2.5 text-slate-400">12.1 ms</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-slate-200">Frequency Modulated Carrier</td>
                <td className="py-2.5">180,000</td>
                <td className="py-2.5 text-emerald-400">97.8%</td>
                <td className="py-2.5 text-emerald-400">96.5%</td>
                <td className="py-2.5 text-emerald-400">0.971</td>
                <td className="py-2.5 text-slate-400">14.6 ms</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-slate-200">
                  Dispersed Fast Radio Burst (FRB)
                </td>
                <td className="py-2.5">95,000</td>
                <td className="py-2.5 text-emerald-400">99.1%</td>
                <td className="py-2.5 text-emerald-400">98.2%</td>
                <td className="py-2.5 text-emerald-400">0.986</td>
                <td className="py-2.5 text-slate-400">11.4 ms</td>
              </tr>
              <tr>
                <td className="py-2.5 font-bold text-amber-400">Satellite RFI (LEO / GEO)</td>
                <td className="py-2.5">1,200,000</td>
                <td className="py-2.5 text-emerald-400">99.9%</td>
                <td className="py-2.5 text-emerald-400">99.7%</td>
                <td className="py-2.5 text-emerald-400">0.998</td>
                <td className="py-2.5 text-slate-400">10.8 ms</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </PageTransition>
  );
}
