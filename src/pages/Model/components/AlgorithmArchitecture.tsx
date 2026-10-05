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
    <div className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-5 font-mono select-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#1C2630] pb-3 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-[#5BD8F5]" />
          <h2 className="text-xs font-medium text-[#E6EDF2]">Algorithm architecture</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 text-xs">
        {/* Left Column: Currently Implemented Methods */}
        <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1C2630] pb-2">
            <div className="flex items-center gap-1.5 text-[#5BD8F5] font-medium text-xs">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Implemented methods</span>
            </div>
            <span className="text-[9px] text-[#5BD8F5] font-mono">Active</span>
          </div>

          <p className="text-[11px] text-[#7F8B95] font-sans leading-relaxed">
            Signal processing and statistical methods powering the current prototype pipeline.
          </p>

          <div className="space-y-2.5 pt-1">
            {currentMethods.map((m) => (
              <div
                key={m.name}
                className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-2.5 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#E6EDF2] text-[11px]">{m.name}</span>
                  <span className="text-[9px] text-[#5BD8F5] font-mono">Active</span>
                </div>
                <div className="text-[10px] text-[#7F8B95] font-mono">{m.spec}</div>
                <p className="text-[10px] text-[#7F8B95] font-sans leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Research Extensions */}
        <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1C2630] pb-2">
            <div className="flex items-center gap-1.5 text-[#E8AE50] font-medium text-xs">
              <FlaskConical className="h-3.5 w-3.5" />
              <span>Research extensions</span>
            </div>
            <span className="text-[9px] text-[#E8AE50] font-mono">Roadmap</span>
          </div>

          <p className="text-[11px] text-[#7F8B95] font-sans leading-relaxed">
            Machine learning architectures under evaluation for future integration.
          </p>

          <div className="space-y-2.5 pt-1">
            {researchExtensions.map((m) => (
              <div
                key={m.name}
                className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-2.5 space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#E6EDF2] text-[11px]">{m.name}</span>
                  <span className="text-[9px] text-[#E8AE50] font-mono">Planned</span>
                </div>
                <p className="text-[10px] text-[#7F8B95] font-sans leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
