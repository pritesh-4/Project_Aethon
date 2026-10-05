import { Link } from 'react-router';
import {
  Activity,
  Radio,
  Cpu,
  Compass,
  ArrowRight,
  ShieldCheck,
  Database,
  Zap,
} from 'lucide-react';

interface NarrativeSection6Props {
  progress: number; // 0.90 to 1.00
}

export function NarrativeSection6({ progress }: NarrativeSection6Props) {
  const sectionAlpha = Math.min(1, Math.max(0, (progress - 0.9) * 10));

  return (
    <div
      className="absolute inset-0 flex flex-col justify-between pointer-events-auto p-6 transition-opacity duration-300 z-20"
      style={{ opacity: sectionAlpha }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pt-10 sm:pt-14 px-2 sm:px-8 font-mono select-none">
        <div>
          <span className="text-[10px] tracking-[0.25em] text-cyan-400 uppercase font-semibold">
            SECTION 06 // ENTER THE OBSERVATORY
          </span>
          <p className="text-[9px] text-slate-400 mt-0.5">
            RESEARCH INTERFACE READY // WORKSTATION UNLOCKED
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[10px] font-mono text-cyan-300 font-semibold tracking-wider">
            ALL SYSTEMS NOMINAL
          </span>
        </div>
      </div>

      {/* Main Gateway Hub */}
      <div className="relative w-full max-w-5xl mx-auto px-4 my-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded border border-cyan-800/60 bg-cyan-950/40 text-[10px] font-mono tracking-widest text-cyan-400 mb-3">
            <Activity className="h-3 w-3" />
            OBSERVATORY CORE OPERATIONAL
          </div>
          <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-slate-100 font-sans">
            ENTER THE RESEARCH WORKSTATION
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-slate-400 font-mono tracking-wider">
            SELECT A SYSTEM CONSOLE TO INITIATE SCIENTIFIC INVESTIGATION
          </p>
        </div>

        {/* 4 Primary Action Launchpads */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Live Observatory Console */}
          <Link
            to="/observatory"
            className="group rounded-lg border border-cyan-500/40 bg-slate-950/80 p-5 backdrop-blur-md transition-all hover:border-cyan-400 hover:bg-slate-900/90 hover:shadow-[0_0_20px_rgba(6,182,212,0.18)] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-cyan-400 mb-3">
                <div className="p-2 rounded border border-cyan-900/60 bg-cyan-950/50">
                  <Activity className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-400 border border-emerald-800/80">
                  LIVE STREAM
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-100 font-sans group-hover:text-cyan-300 transition-colors">
                Observatory Console
              </h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Stream live FFT spectrograms from the Green Bank 100m Dish at 1420.405 MHz with
                Doppler drift tracking.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between font-mono text-xs text-cyan-400">
              <span>Launch Feed</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Card 2: Discovery Catalog */}
          <Link
            to="/discover"
            className="group rounded-lg border border-slate-800/80 bg-slate-950/80 p-5 backdrop-blur-md transition-all hover:border-slate-700 hover:bg-slate-900/90 hover:shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-cyan-400 mb-3">
                <div className="p-2 rounded border border-cyan-900/60 bg-cyan-950/50">
                  <Radio className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/80">
                  4 FLAGGED
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-100 font-sans group-hover:text-cyan-300 transition-colors">
                Candidate Catalog
              </h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Inspect isolated candidates, SNR metrics, constellation coordinates, and
                verification logs.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between font-mono text-xs text-slate-300 group-hover:text-cyan-300">
              <span>Inspect Signals</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Card 3: Deep-Space Neural Model */}
          <Link
            to="/model"
            className="group rounded-lg border border-slate-800/80 bg-slate-950/80 p-5 backdrop-blur-md transition-all hover:border-slate-700 hover:bg-slate-900/90 hover:shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-cyan-400 mb-3">
                <div className="p-2 rounded border border-cyan-900/60 bg-cyan-950/50">
                  <Cpu className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono text-slate-400">AethonNet-v2.4</span>
              </div>
              <h3 className="text-base font-semibold text-slate-100 font-sans group-hover:text-cyan-300 transition-colors">
                Neural Architecture
              </h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Examine multi-head attention layers, latent representation manifolds, and RFI
                rejection loss functions.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between font-mono text-xs text-slate-300 group-hover:text-cyan-300">
              <span>Architecture</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Card 4: Detailed Signal Dossier */}
          <Link
            to="/analysis/SIG-2026-089A"
            className="group rounded-lg border border-slate-800/80 bg-slate-950/80 p-5 backdrop-blur-md transition-all hover:border-slate-700 hover:bg-slate-900/90 hover:shadow-lg flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-cyan-400 mb-3">
                <div className="p-2 rounded border border-cyan-900/60 bg-cyan-950/50">
                  <Compass className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/80">
                  SIG-089A
                </span>
              </div>
              <h3 className="text-base font-semibold text-slate-100 font-sans group-hover:text-cyan-300 transition-colors">
                Signal Dossier
              </h3>
              <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                Direct scientific deep-dive into the Proxima Centauri candidate signal, barycentric
                curves, and telemetry.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between font-mono text-xs text-slate-300 group-hover:text-cyan-300">
              <span>Open Dossier</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>

        {/* Live Array Telemetry Status Strip */}
        <div className="mt-6 rounded-lg border border-slate-800/80 bg-slate-950/60 p-4 font-mono text-xs text-slate-400 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-300">
            <Zap className="h-3.5 w-3.5 text-cyan-400" />
            <span>
              ARRAY INFERENCE CLUSTER: <span className="text-emerald-400">14.2 ms LATENCY</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-slate-500" />
            <span>
              SPECTRAL BUFFER: <span className="text-slate-200">100% HEALTH</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-slate-500" />
            <span>
              RFI PURGE EFFICIENCY: <span className="text-cyan-400">99.98%</span>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Status Bar */}
      <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 pb-10 sm:pb-14 px-2 sm:px-8 select-none">
        <div>
          <span>AETHON ASTRONOMICAL SYSTEM // VERSION 1.0</span>
        </div>
        <div className="hidden sm:block">
          <span>GREEN BANK • MEERKAT • PARKES RADIO OBSERVATORIES</span>
        </div>
      </div>
    </div>
  );
}
