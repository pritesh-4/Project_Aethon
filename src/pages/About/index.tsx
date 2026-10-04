import { PageHeader } from '@/components/layout/PageHeader.tsx';
import { PageTransition } from '@/components/ui/motion.tsx';
import { Badge } from '@/components/ui/Badge.tsx';
import { Telescope, Radio, Terminal, Award } from 'lucide-react';

export default function AboutPage() {
  return (
    <PageTransition className="space-y-6">
      <PageHeader
        category="SCIENTIFIC OBJECTIVES & ARCHITECTURE"
        title="About Project AETHON"
        subtitle="An open-source scientific initiative leveraging edge neural models to accelerate technosignature and astronomical transient discovery."
        badge={<Badge variant="cyan">ASTRONOMICAL SCIENCE FOUNDATION</Badge>}
      />

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Scientific Context */}
          <section className="rounded-xl border border-slate-800/80 bg-slate-950/80 p-6 space-y-4">
            <h3 className="text-lg font-bold font-sans text-slate-100 flex items-center gap-2">
              <Telescope className="h-5 w-5 text-cyan-400" />
              The Deep-Space Signal Challenge
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              Modern radio telescopes such as the 100-meter Green Bank Telescope and the 64-dish
              MeerKAT array collect hundreds of gigabytes of raw spectral data per second.
              Traditional heuristic thresholding algorithms (like TurboSETI) struggle under the
              immense deluge of terrestrial radio frequency interference (RFI) caused by low-Earth
              orbit satellite constellations, aircraft transponders, and mobile cellular networks.
            </p>
            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              <strong>AETHON</strong> introduces a deep neural framework trained directly on
              spectral waterfall matrices. By decoupling topocentric orbital drift from intrinsic
              carrier frequency modulation, AETHON separates terrestrial interference from true
              celestial candidates with unprecedented sensitivity.
            </p>
          </section>

          {/* Key Astronomical Concepts */}
          <section className="rounded-xl border border-slate-800/80 bg-slate-950/80 p-6 space-y-4">
            <h3 className="text-lg font-bold font-sans text-slate-100 flex items-center gap-2">
              <Radio className="h-5 w-5 text-cyan-400" />
              Astrophysical Core Principles
            </h3>

            <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 space-y-1">
                <span className="text-cyan-400 font-bold">1420.405 MHz (The Water Hole)</span>
                <p className="text-slate-400 font-sans text-[11px] leading-relaxed">
                  The neutral hydrogen line (21 cm). Because hydrogen is the most abundant element
                  in the cosmos, astrophysicists hypothesize advanced civilizations choose this
                  frequency as a universal beacon.
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 space-y-1">
                <span className="text-emerald-400 font-bold">Doppler Drift Rate (Δf/Δt)</span>
                <p className="text-slate-400 font-sans text-[11px] leading-relaxed">
                  A signal originating from a transmitter situated on an exoplanet orbiting a
                  distant star undergoes frequency shifts due to relative orbital and rotational
                  accelerations, creating a distinct linear drift.
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 space-y-1">
                <span className="text-amber-400 font-bold">Terrestrial RFI Rejection</span>
                <p className="text-slate-400 font-sans text-[11px] leading-relaxed">
                  Signals present across all telescope beam pointings are flagged as terrestrial
                  local leakage, preventing false alarms and focusing compute on spatial anomalies.
                </p>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-4 space-y-1">
                <span className="text-cyan-400 font-bold">Polyphase Filterbanks (PFB)</span>
                <p className="text-slate-400 font-sans text-[11px] leading-relaxed">
                  Splits broad bandwidths into millions of narrow sub-channels with minimal spectral
                  leakage, crucial for detecting coherent continuous-wave carriers.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Specifications */}
        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/80 p-6 space-y-4">
            <h3 className="text-base font-bold font-sans text-slate-100 flex items-center gap-2">
              <Terminal className="h-4 w-4 text-cyan-400" />
              Observatory Stack
            </h3>

            <div className="space-y-2 text-xs font-mono text-slate-300">
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Frontend:</span>
                <span className="text-cyan-300">React 19 + TypeScript</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Build Tool:</span>
                <span className="text-slate-200">Vite 8</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Styling:</span>
                <span className="text-slate-200">Tailwind CSS v4</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Animation:</span>
                <span className="text-slate-200">Motion (motion/react)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">Data Viz:</span>
                <span className="text-slate-200">Recharts 3</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-900">
                <span className="text-slate-400">API & Validation:</span>
                <span className="text-slate-200">Axios + Zod</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Notifications:</span>
                <span className="text-slate-200">Sonner</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/80 p-6 space-y-3 font-mono text-xs">
            <div className="flex items-center gap-2 text-cyan-400">
              <Award className="h-4 w-4" />
              <span className="font-bold uppercase tracking-wider">Scientific Alignment</span>
            </div>
            <p className="text-slate-400 font-sans text-xs leading-relaxed">
              Designed to interface with standard astronomical open data formats including SIGPROC
              Filterbank (.fil), HDF5 (.h5), and FITS standards from Breakthrough Listen open
              archives.
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
