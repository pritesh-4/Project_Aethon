import { Link } from 'react-router';
import { Activity, Radio, Cpu, Compass, ArrowRight } from 'lucide-react';

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
      <div className="flex items-center justify-between pt-10 sm:pt-14 px-2 sm:px-8 font-sans select-none">
        <div>
          <span className="text-xs text-[#5BD8F5] font-medium">Observatory</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#5BD8F5]" />
          <span className="text-xs text-[#E6EDF2] font-medium">Workspaces ready</span>
        </div>
      </div>

      {/* Main Gateway Hub */}
      <div className="relative w-full max-w-5xl mx-auto px-4 my-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-5xl font-normal tracking-tight text-[#E6EDF2] font-sans">
            Research Workstations
          </h2>
          <p className="mt-2 text-sm text-[#7F8B95] font-sans">
            Select a workspace to inspect signals, review candidates, or examine model architecture.
          </p>
        </div>

        {/* 4 Primary Action Launchpads */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Live Observatory Console */}
          <Link
            to="/observatory"
            className="group rounded-[4px] border border-[#172230] bg-[#0B0F14] p-5 transition-all hover:border-[#5BD8F5]/60 hover:bg-[#10161D] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-[#5BD8F5] mb-3">
                <div className="p-2 rounded-[4px] border border-[#172230] bg-[#10161D]">
                  <Activity className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-sans px-2 py-0.5 rounded-[4px] bg-[#10161D] text-[#5BD8F5] border border-[#172230]">
                  Live Stream
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#E6EDF2] font-sans group-hover:text-[#5BD8F5] transition-colors">
                Observatory Console
              </h3>
              <p className="mt-2 text-xs text-[#7F8B95] leading-relaxed font-sans">
                Stream simulated spectral data with Doppler drift tracking and real-time STFT.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#172230] flex items-center justify-between text-xs text-[#5BD8F5] font-medium">
              <span>Launch console</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Card 2: Discovery Catalog */}
          <Link
            to="/discover"
            className="group rounded-[4px] border border-[#172230] bg-[#0B0F14] p-5 transition-all hover:border-[#5BD8F5]/60 hover:bg-[#10161D] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-[#5BD8F5] mb-3">
                <div className="p-2 rounded-[4px] border border-[#172230] bg-[#10161D]">
                  <Radio className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-sans px-2 py-0.5 rounded-[4px] bg-[#10161D] text-[#7F8B95] border border-[#172230]">
                  Search
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#E6EDF2] font-sans group-hover:text-[#5BD8F5] transition-colors">
                Signal Discovery
              </h3>
              <p className="mt-2 text-xs text-[#7F8B95] leading-relaxed font-sans">
                Ingest observations and screen against learned distributions for persistent
                anomalies.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#172230] flex items-center justify-between text-xs text-[#7F8B95] group-hover:text-[#5BD8F5] font-medium">
              <span>Run search</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Card 3: Neural Model */}
          <Link
            to="/model"
            className="group rounded-[4px] border border-[#172230] bg-[#0B0F14] p-5 transition-all hover:border-[#5BD8F5]/60 hover:bg-[#10161D] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-[#5BD8F5] mb-3">
                <div className="p-2 rounded-[4px] border border-[#172230] bg-[#10161D]">
                  <Cpu className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-sans text-[#7F8B95]">Architecture</span>
              </div>
              <h3 className="text-sm font-semibold text-[#E6EDF2] font-sans group-hover:text-[#5BD8F5] transition-colors">
                Model Architecture
              </h3>
              <p className="mt-2 text-xs text-[#7F8B95] leading-relaxed font-sans">
                Examine representations, latent spaces, and anomaly rejection criteria.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#172230] flex items-center justify-between text-xs text-[#7F8B95] group-hover:text-[#5BD8F5] font-medium">
              <span>View model</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>

          {/* Card 4: Detailed Signal Dossier */}
          <Link
            to="/candidates"
            className="group rounded-[4px] border border-[#172230] bg-[#0B0F14] p-5 transition-all hover:border-[#5BD8F5]/60 hover:bg-[#10161D] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-[#5BD8F5] mb-3">
                <div className="p-2 rounded-[4px] border border-[#172230] bg-[#10161D]">
                  <Compass className="h-4 w-4" />
                </div>
                <span className="text-[11px] font-sans px-2 py-0.5 rounded-[4px] bg-[#1C160E] text-[#E8AE50] border border-[#E8AE50]/30">
                  Review
                </span>
              </div>
              <h3 className="text-sm font-semibold text-[#E6EDF2] font-sans group-hover:text-[#5BD8F5] transition-colors">
                Candidate Triage
              </h3>
              <p className="mt-2 text-xs text-[#7F8B95] leading-relaxed font-sans">
                Prioritize candidate events and perform forensic evaluation of candidate signals.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#172230] flex items-center justify-between text-xs text-[#7F8B95] group-hover:text-[#5BD8F5] font-medium">
              <span>Review candidates</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        </div>
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center justify-between font-sans text-xs text-[#7F8B95] pb-10 sm:pb-14 px-2 sm:px-8 select-none">
        <div>
          <span>Aethon Discovery System • Demonstration Prototype</span>
        </div>
        <div className="hidden sm:block">
          <span>Synthetic radio observation data</span>
        </div>
      </div>
    </div>
  );
}
