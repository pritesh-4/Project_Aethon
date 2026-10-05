import { PageHeader } from '@/components/layout/PageHeader.tsx';
import { PageTransition } from '@/components/ui/motion.tsx';
import { Telescope, Radio, Terminal, Award } from 'lucide-react';

export default function AboutPage() {
  return (
    <PageTransition className="space-y-6">
      <PageHeader
        category="Overview"
        title="About Project AETHON"
        subtitle="An open-source prototype evaluating neural representations for candidate radio anomaly detection."
      />

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Scientific Context */}
          <section className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-6 space-y-4">
            <h3 className="text-base font-semibold text-[#E6EDF2] flex items-center gap-2">
              <Telescope className="h-4 w-4 text-[#5BD8F5]" />
              The Radio Frequency Interference Challenge
            </h3>
            <p className="text-sm text-[#7F8B95] leading-relaxed">
              Modern radio astronomy facilities collect large volumes of spectral data. Traditional
              thresholding algorithms struggle under the increasing density of terrestrial radio
              frequency interference (RFI) from orbital satellite constellations, aviation
              communications, and ground transmitters.
            </p>
            <p className="text-sm text-[#7F8B95] leading-relaxed">
              AETHON explores an anomaly-detection approach trained directly on spectral waterfall
              representations. By isolating characteristic drift patterns from local stationary
              interference, the pipeline surfaces anomalous candidate events for scientific
              verification.
            </p>
          </section>

          {/* Key Astronomical Concepts */}
          <section className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-6 space-y-4">
            <h3 className="text-base font-semibold text-[#E6EDF2] flex items-center gap-2">
              <Radio className="h-4 w-4 text-[#5BD8F5]" />
              Astronomical concepts
            </h3>

            <div className="grid sm:grid-cols-2 gap-4 text-xs font-mono">
              <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-4 space-y-1.5">
                <span className="text-[#5BD8F5] font-semibold">
                  1420.405 MHz (Neutral Hydrogen Line)
                </span>
                <p className="text-[#7F8B95] text-[11px] leading-relaxed font-sans">
                  The 21 cm emission line of neutral hydrogen. A standard astronomical baseline
                  frequency frequently surveyed for narrow spectral features.
                </p>
              </div>

              <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-4 space-y-1.5">
                <span className="text-[#E6EDF2] font-semibold">Doppler Drift Rate (Δf/Δt)</span>
                <p className="text-[#7F8B95] text-[11px] leading-relaxed font-sans">
                  A signal source in relative orbital motion with respect to the receiver produces a
                  characteristic drift in frequency over time.
                </p>
              </div>

              <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-4 space-y-1.5">
                <span className="text-[#E8AE50] font-semibold">Interference Rejection</span>
                <p className="text-[#7F8B95] text-[11px] leading-relaxed font-sans">
                  Signals that appear across multiple antenna pointings or adjacent beams are
                  flagged as local terrestrial interference rather than celestial sources.
                </p>
              </div>

              <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-4 space-y-1.5">
                <span className="text-[#5BD8F5] font-semibold">Polyphase Filterbanks (PFB)</span>
                <p className="text-[#7F8B95] text-[11px] leading-relaxed font-sans">
                  Channelization that decomposes wideband signals into fine frequency channels with
                  minimal spectral leakage.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar Specifications */}
        <div className="space-y-6">
          <div className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-6 space-y-4">
            <h3 className="text-sm font-semibold text-[#E6EDF2] flex items-center gap-2">
              <Terminal className="h-4 w-4 text-[#5BD8F5]" />
              Software stack
            </h3>

            <div className="space-y-2 text-xs font-mono text-[#E6EDF2]">
              <div className="flex justify-between py-1 border-b border-[#1C2630]">
                <span className="text-slate-400">Frontend:</span>
                <span className="text-[#5BD8F5]">React 19 + TypeScript</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1C2630]">
                <span className="text-slate-400">Build Tool:</span>
                <span className="text-slate-200">Vite 8</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1C2630]">
                <span className="text-slate-400">Styling:</span>
                <span className="text-slate-200">Tailwind CSS v4</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1C2630]">
                <span className="text-slate-400">Animation:</span>
                <span className="text-slate-200">Motion</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#1C2630]">
                <span className="text-slate-400">Data Viz:</span>
                <span className="text-slate-200">Recharts</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Audio:</span>
                <span className="text-slate-200">Web Audio API</span>
              </div>
            </div>
          </div>

          <div className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-6 space-y-3 font-mono text-xs">
            <div className="flex items-center gap-2 text-[#5BD8F5]">
              <Award className="h-4 w-4" />
              <span className="font-semibold">Format compatibility</span>
            </div>
            <p className="text-[#7F8B95] font-sans text-xs leading-relaxed">
              Designed to interface with standard astronomical open data formats including SIGPROC
              Filterbank (.fil), HDF5 (.h5), and FITS standards from open archives.
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
