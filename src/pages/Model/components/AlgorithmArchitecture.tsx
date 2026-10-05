import { Cpu, FlaskConical, CheckCircle2 } from 'lucide-react';

export function AlgorithmArchitecture() {
  const currentMethods = [
    {
      name: 'Polyphase STFT Decomposition',
      spec: 'Blackman-Harris 7-Term Window / 3.81 Hz Channel Width',
      desc: 'High-cadence time-frequency conversion resolving monochromatic and Doppler-drifting signals.',
    },
    {
      name: 'Running-Median Spectral Whitening',
      spec: 'Window Length = 1024 Bins / Calibrated Noise Baseline',
      desc: 'Removes stationary receiver frequency response curves without eroding narrowband signal peaks.',
    },
    {
      name: 'Doppler Invariance De-Drifting',
      spec: 'Linear Taylor-Tree Integration (-20 Hz/s to +20 Hz/s)',
      desc: 'Corrects for Earth sidereal rotation and spacecraft barycentric motion to preserve phase integration.',
    },
    {
      name: 'Spatial Multi-Beam Differencing',
      spec: 'ON/OFF Target Cadence Matching (4 Cycles)',
      desc: 'Automated rejection of wide-angle terrestrial and satellite RFI present in off-target reference beams.',
    },
    {
      name: 'Hyperspherical Cosine Divergence',
      spec: 'Unit Norm z ∈ ℝ⁵¹² / Nearest Centroid Metric',
      desc: 'Calculates structural deviation against reference clusters of known natural emissions.',
    },
  ];

  const researchExtensions = [
    {
      name: 'Variational Autoencoders (VAEs)',
      status: 'RESEARCH EXTENSION',
      desc: 'Probabilistic reconstruction loss estimating exact epistemic uncertainty across radio spectra.',
    },
    {
      name: 'Contrastive Self-Supervised Encoders',
      status: 'RESEARCH EXTENSION',
      desc: 'SimCLR-style positive pair mining using physical Doppler drifts and time shifts as augmentations.',
    },
    {
      name: 'Density Clustering (HDBSCAN)',
      status: 'RESEARCH EXTENSION',
      desc: 'Hierarchical density clustering to isolate non-parametric noise manifolds in high-dimensional embeddings.',
    },
    {
      name: 'State-Space Sequence Models (Mamba)',
      status: 'RESEARCH EXTENSION',
      desc: 'Linear-time sequence modeling over multi-gigabyte complex baseband I/Q sample streams.',
    },
  ];

  return (
    <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-5 font-mono select-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-3 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-[#66E3FF]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#EAF4F7]">
            ALGORITHM ARCHITECTURE: PRODUCTION DEPLOYED VS RESEARCH EXTENSIONS
          </h2>
        </div>
        <span className="text-[10px] text-[#84929C] uppercase">
          STRICT DATA & CAPABILITY HONESTY
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
        {/* Left Column: Currently Implemented Methods */}
        <div className="rounded-[2px] border border-cyan-800/70 bg-[#05070A] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold uppercase text-xs">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>CURRENT IMPLEMENTATION</span>
            </div>
            <span className="text-[9px] text-emerald-400 font-semibold uppercase">
              ACTIVE IN ENGINE
            </span>
          </div>

          <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
            The algorithms currently powering the observatory triage pipeline in this repository.
          </p>

          <div className="space-y-2.5 pt-1">
            {currentMethods.map((m) => (
              <div
                key={m.name}
                className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-2.5 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 text-[11px]">{m.name}</span>
                  <span className="text-[9px] text-[#66E3FF] font-mono">DEPLOYED</span>
                </div>
                <div className="text-[10px] text-[#84929C] font-mono">{m.spec}</div>
                <p className="text-[10px] text-slate-400 font-sans leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Research Extensions */}
        <div className="rounded-[2px] border border-slate-800 bg-[#05070A] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase text-xs">
              <FlaskConical className="h-3.5 w-3.5" />
              <span>RESEARCH EXTENSIONS</span>
            </div>
            <span className="text-[9px] text-amber-400 font-semibold uppercase">
              PLANNED ROADMAP
            </span>
          </div>

          <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
            Theoretical machine-learning methods under active conceptual evaluation. These are not
            claimed as deployed production algorithms in the current build.
          </p>

          <div className="space-y-2.5 pt-1">
            {researchExtensions.map((m) => (
              <div
                key={m.name}
                className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-2.5 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-300 text-[11px]">{m.name}</span>
                  <span className="text-[9px] text-amber-500 font-mono">FUTURE SPEC</span>
                </div>
                <p className="text-[10px] text-slate-400 font-sans leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
