import { FolderTree, Terminal, Cpu } from 'lucide-react';

export function ReproducibilitySection() {
  return (
    <section id="reproducibility" className="space-y-6 scroll-mt-24">
      {/* Chapter Number & Title */}
      <div className="space-y-1 border-b border-[#E4E1D9] pb-3">
        <div className="font-mono text-xs text-[#376A9B] font-semibold tracking-wider uppercase">
          12 / Reproducibility & Code Architecture
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-normal text-[#17202A] tracking-tight">
          Repository Structure & Execution Environment
        </h2>
        <p className="text-xs text-[#7E8B96] font-mono">
          Source tree layout, deterministic pseudo-random seeds, environment configurations, and
          build reproduction.
        </p>
      </div>

      {/* Repository Tree Layout */}
      <div className="space-y-3">
        <h3 className="text-sm font-mono font-semibold text-[#17202A] uppercase tracking-wider flex items-center gap-1.5">
          <FolderTree className="h-4 w-4 text-[#376A9B]" />
          <span>Repository Architecture (Source Tree)</span>
        </h3>

        <div className="p-4 bg-[#FAF8F5] border border-[#D6D2C9] rounded-[2px] font-mono text-xs text-[#17202A] space-y-1">
          <div className="text-[#376A9B] font-semibold">src/</div>
          <div className="pl-4">
            ├── <strong className="text-[#17202A]">app/</strong> — Router, application providers,
            navigation definitions
          </div>
          <div className="pl-4">
            ├── <strong className="text-[#17202A]">components/</strong> — Reusable UI primitives,
            layout shell, visualization charts
          </div>
          <div className="pl-4">
            ├── <strong className="text-[#17202A]">pages/</strong> — Route domain workspaces:
          </div>
          <div className="pl-8">
            ├── <span className="text-[#56616A]">Landing/</span> — Cinematic 3D scrollytelling
            prologue (Three.js WebGL + Lenis)
          </div>
          <div className="pl-8">
            ├── <span className="text-[#56616A]">Observatory/</span> — Real-time telemetry inspector
            & dual-spectrum viewports
          </div>
          <div className="pl-8">
            ├── <span className="text-[#56616A]">Discover/</span> — Filterbank ingestion & prototype
            screening parameter setup
          </div>
          <div className="pl-8">
            ├── <span className="text-[#56616A]">Candidates/</span> — Prioritized candidate review
            ledger & filtering
          </div>
          <div className="pl-8">
            ├── <span className="text-[#56616A]">Analysis/</span> — Stage-by-stage candidate
            verification dossier
          </div>
          <div className="pl-8">
            ├── <span className="text-[#56616A]">Archive/</span> — Observational session history &
            candidate branch drawers
          </div>
          <div className="pl-8">
            ├── <span className="text-[#56616A]">Model/</span> — Machine learning architecture
            explanation & conceptual latent space
          </div>
          <div className="pl-8">
            └── <span className="text-[#56616A]">About/</span> — Institutional research dossier
            (This document)
          </div>
          <div className="pl-4">
            ├── <strong className="text-[#17202A]">lib/</strong> — Audio synthesis engine (Web Audio
            API), API client, utility functions
          </div>
          <div className="pl-4">
            └── <strong className="text-[#17202A]">types/</strong> — Strict TypeScript domain
            schemas validated by Zod
          </div>
        </div>
      </div>

      {/* Execution Environment & Reproduction Steps */}
      <div className="grid md:grid-cols-2 gap-4 text-xs">
        {/* Frontend Environment */}
        <div className="p-4 bg-[#FAF8F5] border border-[#D6D2C9] rounded-[2px] space-y-3">
          <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#17202A] uppercase tracking-wider">
            <Terminal className="h-4 w-4 text-[#376A9B]" />
            <span>Frontend Prototype Environment</span>
          </div>
          <ul className="space-y-1 text-[#56616A] font-mono text-[11px]">
            <li>
              <strong>Runtime:</strong> Node.js &gt;= 20.x
            </li>
            <li>
              <strong>Framework:</strong> React 19.2 + TypeScript 5.7+
            </li>
            <li>
              <strong>Bundler:</strong> Vite 8.3
            </li>
            <li>
              <strong>Styling:</strong> Tailwind CSS v4
            </li>
            <li>
              <strong>3D Engine:</strong> Three.js (r186)
            </li>
            <li>
              <strong>Audio:</strong> Native Web Audio API
            </li>
          </ul>
          <div className="pt-2 border-t border-[#E4E1D9] font-mono text-[11px] text-[#17202A] bg-[#F4F1EA] p-2 rounded-[2px]">
            npm install
            <br />
            npm run check # Runs prettier, eslint, tsc, & build
            <br />
            npm run dev # Starts local research server
          </div>
        </div>

        {/* Target Backend Environment */}
        <div className="p-4 bg-[#FAF8F5] border border-[#D6D2C9] rounded-[2px] space-y-3">
          <div className="flex items-center gap-1.5 font-mono text-xs font-semibold text-[#17202A] uppercase tracking-wider">
            <Cpu className="h-4 w-4 text-[#C19348]" />
            <span>Target Backend Environment (Planned)</span>
          </div>
          <ul className="space-y-1 text-[#56616A] font-mono text-[11px]">
            <li>
              <strong>Runtime:</strong> Python 3.11+
            </li>
            <li>
              <strong>API Service:</strong> FastAPI / Uvicorn
            </li>
            <li>
              <strong>Astrophysics I/O:</strong> Astropy, blimpy (HDF5/SIGPROC)
            </li>
            <li>
              <strong>Deep Learning:</strong> PyTorch 2.3+
            </li>
            <li>
              <strong>DSP Acceleration:</strong> CuPy / CUDA 12.x
            </li>
            <li>
              <strong>Clustering:</strong> scikit-learn (HDBSCAN / IsolationForest)
            </li>
          </ul>
          <div className="p-2 bg-[#EAE7E0]/60 rounded-[2px] text-[10.5px] text-[#7E8B96] leading-relaxed font-sans">
            Target backend microservice specifications are defined in{' '}
            <code className="font-mono text-[10px]">docs/runbook.md</code>. Telescope data pipelines
            will connect to the frontend via the typed REST API boundary.
          </div>
        </div>
      </div>

      {/* Deterministic PRNG Seed Policy */}
      <div className="p-4 bg-[#FAF8F5] border border-[#D6D2C9] rounded-[2px] space-y-2 text-xs">
        <div className="font-mono font-semibold text-[#17202A] uppercase tracking-wider text-[11px]">
          Deterministic Seed Policy for Reproducibility
        </div>
        <p className="text-[#56616A] leading-relaxed">
          To ensure visual and mathematical consistency across machines without network variance,
          procedural signal fields and simulated observations utilize a seeded 32-bit generator
          (Mulberry32 initialized to seed{' '}
          <code className="font-mono bg-[#EAE7E0] px-1 text-[#17202A]">1420405</code>). The exact
          same anomalous trajectories, background clusters, and noise distributions will render
          identically across all compliant web browsers.
        </p>
      </div>
    </section>
  );
}
