import { CheckCircle2, CircleDashed } from 'lucide-react';

export function RoadmapSection() {
  const PHASES = [
    {
      num: 'PHASE 01',
      title: 'Interactive Research Workspace & UI Architecture',
      desc: 'Complete React 19 / TypeScript interactive console: real-time telemetry inspection, analysis dossiers, and candidate review ledgers.',
      status: 'COMPLETED',
      statusClass: 'bg-[#3D7D54]/15 text-[#2E6040] border-[#3D7D54]/30',
      isDone: true,
    },
    {
      num: 'PHASE 02',
      title: 'Native Astronomical File Ingestion Stack',
      desc: 'High-throughput Rust / Python I/O parser for native multi-gigabyte SIGPROC (.fil) and Breakthrough Listen HDF5 (.h5) files.',
      status: 'IN PROGRESS',
      statusClass: 'bg-[#376A9B]/15 text-[#2B547C] border-[#376A9B]/30',
      isDone: false,
    },
    {
      num: 'PHASE 03',
      title: 'Digital Signal Preprocessing & Bandpass Normalization',
      desc: 'GPU-accelerated polyphase filterbank channelization (CuPy) with real-time running median background whitening.',
      status: 'TARGET ARCHITECTURE',
      statusClass: 'bg-[#C19348]/15 text-[#916B2E] border-[#C19348]/30',
      isDone: false,
    },
    {
      num: 'PHASE 04',
      title: 'Self-Supervised Spectrogram Representation Model',
      desc: 'Masked autoencoder architecture trained on public Green Bank and Parkes survey archives to learn baseline cosmic manifolds.',
      status: 'RESEARCH TARGET',
      statusClass: 'bg-[#C19348]/15 text-[#916B2E] border-[#C19348]/30',
      isDone: false,
    },
    {
      num: 'PHASE 05',
      title: 'Reconstruction Residual & Latent Density Scoring',
      desc: 'Calibration of statistical anomaly metrics combining pixel-level reconstruction errors with k-NN latent cluster distances.',
      status: 'PLANNED',
      statusClass: 'bg-[#7E8B96]/15 text-[#4E5862] border-[#7E8B96]/30',
      isDone: false,
    },
    {
      num: 'PHASE 06',
      title: 'Spatial Multi-Beam & Doppler Interference Filter',
      desc: 'Taylor-tree de-doppler integration and cross-beam spatial coincidence testing to suppress terrestrial RFI.',
      status: 'PLANNED',
      statusClass: 'bg-[#7E8B96]/15 text-[#4E5862] border-[#7E8B96]/30',
      isDone: false,
    },
    {
      num: 'PHASE 07',
      title: 'Empirical Synthetic Injection Benchmarking',
      desc: 'Rigorous validation against controlled synthetic signals injected into real survey noise; publication of recovery curves.',
      status: 'PLANNED',
      statusClass: 'bg-[#7E8B96]/15 text-[#4E5862] border-[#7E8B96]/30',
      isDone: false,
    },
    {
      num: 'PHASE 08',
      title: 'Live Observatory Stream Ingestion & Pilot Campaigns',
      desc: 'Direct socket streaming trials in partnership with active radio telescope facilities during dedicated sky surveys.',
      status: 'FUTURE COLLABORATION',
      statusClass: 'bg-[#7E8B96]/15 text-[#4E5862] border-[#7E8B96]/30',
      isDone: false,
    },
    {
      num: 'PHASE 09',
      title: 'Distributed Multi-Observatory Follow-up Network',
      desc: 'Standardized VOEvent trigger generation for coordinating optical and radio cross-pointing replication within minutes of detection.',
      status: 'FUTURE COLLABORATION',
      statusClass: 'bg-[#7E8B96]/15 text-[#4E5862] border-[#7E8B96]/30',
      isDone: false,
    },
  ];

  return (
    <section id="roadmap" className="space-y-6 scroll-mt-24">
      {/* Chapter Number & Title */}
      <div className="space-y-1 border-b border-[#E4E1D9] pb-3">
        <div className="font-mono text-xs text-[#376A9B] font-semibold tracking-wider uppercase">
          14 / Research Roadmap
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-normal text-[#17202A] tracking-tight">
          Nine-Phase Development Trajectory
        </h2>
        <p className="text-xs text-[#7E8B96] font-mono">
          Structured roadmap from client-side prototype to distributed multi-observatory
          coordination.
        </p>
      </div>

      {/* Roadmap Phase Timeline */}
      <div className="space-y-3 pt-2">
        {PHASES.map((p) => (
          <div
            key={p.num}
            className={`p-3.5 rounded-[2px] border transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs ${
              p.isDone ? 'bg-[#FAF8F5] border-[#D6D2C9]' : 'bg-[#FAF8F5]/80 border-[#E4E1D9]'
            }`}
          >
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                {p.isDone ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-[#3D7D54] shrink-0" />
                ) : (
                  <CircleDashed className="h-3.5 w-3.5 text-[#7E8B96] shrink-0" />
                )}
                <span className="font-mono text-xs font-semibold text-[#376A9B]">{p.num}</span>
                <span className="font-semibold text-xs text-[#17202A] font-sans">{p.title}</span>
              </div>
              <p className="text-[#56616A] text-[11.5px] leading-relaxed pl-5 font-sans">
                {p.desc}
              </p>
            </div>

            <div className="shrink-0 self-start sm:self-center pl-5 sm:pl-0">
              <span
                className={`inline-block px-2 py-0.5 rounded-[2px] border text-[10.5px] font-mono whitespace-nowrap ${p.statusClass}`}
              >
                {p.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
