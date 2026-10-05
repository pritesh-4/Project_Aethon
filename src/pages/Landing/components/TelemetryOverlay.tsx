import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Volume2, VolumeX, Activity, ArrowRight } from 'lucide-react';
import { observatoryAudio } from '@/lib/audio-synth.ts';
import { formatTelemetryTime } from '@/lib/utils.ts';

interface TelemetryOverlayProps {
  progress: number;
  currentSectionIndex: number;
  onNavigateToSection: (sectionIndex: number) => void;
}

const SECTIONS = [
  { id: 0, code: '01', title: 'THE UNKNOWN' },
  { id: 1, code: '02', title: 'THE PROBLEM' },
  { id: 2, code: '03', title: 'THE SIGNAL' },
  { id: 3, code: '04', title: 'THE INTELLIGENCE' },
  { id: 4, code: '05', title: 'THE DISCOVERY' },
  { id: 5, code: '06', title: 'ENTER THE OBSERVATORY' },
];

export function TelemetryOverlay({
  progress,
  currentSectionIndex,
  onNavigateToSection,
}: TelemetryOverlayProps) {
  const [time, setTime] = useState<string>(formatTelemetryTime());
  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(formatTelemetryTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleToggleAudio = () => {
    const active = observatoryAudio.toggle();
    setIsAudioActive(active);
  };

  const progressPercent = Math.min(100, Math.max(0, Math.round(progress * 100)));

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex flex-col justify-between p-4 sm:p-6 text-slate-400 font-mono text-[11px] select-none">
      {/* Top Observatory Telemetry Bar */}
      <div className="flex items-center justify-between border-b border-slate-900/80 pb-3 bg-gradient-to-b from-[#02040a]/90 to-transparent backdrop-blur-[2px]">
        {/* Left: Location & System Identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-200">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="tracking-widest font-semibold text-xs text-slate-100">AETHON</span>
            <span className="text-[10px] text-slate-500 font-normal hidden sm:inline">
              // EXPERIMENTAL OBSERVATORY
            </span>
          </div>

          <span className="text-slate-700 hidden sm:inline">|</span>

          <span className="text-slate-400 hidden md:inline">GBT-100M [38°25′59″N 79°50′23″W]</span>

          <span className="text-slate-700 hidden lg:inline">|</span>

          <span className="text-cyan-400/90 hidden lg:inline">FREQ: 1420.4057 MHz [H I]</span>
        </div>

        {/* Right: UTC Timestamp, Sound synthesis toggle, Direct Console Link */}
        <div className="flex items-center gap-3 pointer-events-auto">
          <span className="text-slate-400 tabular-nums hidden sm:inline">{time}</span>

          <button
            onClick={handleToggleAudio}
            title={
              isAudioActive ? 'Mute Receiver Atmosphere' : 'Synthesize 1420 MHz Receiver Audio'
            }
            className="flex items-center gap-1 px-2 py-1 rounded border border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:text-slate-200 transition-colors text-[10px]"
          >
            {isAudioActive ? (
              <>
                <Volume2 className="h-3 w-3 text-cyan-400" />
                <span className="text-cyan-300">AUDIO ACTIVE</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3 w-3 text-slate-500" />
                <span className="text-slate-500">AUDIO OFF</span>
              </>
            )}
          </button>

          <Link
            to="/observatory"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded border border-cyan-800/60 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/40 hover:border-cyan-500/50 transition-colors text-[10px]"
          >
            <Activity className="h-3 w-3" />
            <span className="hidden sm:inline">CONSOLE</span>
            <ArrowRight className="h-2.5 w-2.5 opacity-70" />
          </Link>
        </div>
      </div>

      {/* Side Narrative Index & Scrub Navigator (Desktop) */}
      <div className="pointer-events-auto hidden md:flex flex-col gap-1 fixed left-6 top-1/2 -translate-y-1/2 z-30">
        <div className="text-[9px] tracking-widest text-slate-400 mb-1 font-semibold">
          MISSION SEQUENCE
        </div>
        {SECTIONS.map((sec, index) => {
          const isActive = currentSectionIndex === index;
          return (
            <button
              key={sec.id}
              onClick={() => onNavigateToSection(index)}
              className={`flex items-center gap-2.5 py-1 text-left transition-all group ${
                isActive
                  ? 'text-cyan-300 font-semibold pl-1'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full transition-all ${
                  isActive
                    ? 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] scale-125'
                    : 'bg-slate-700 group-hover:bg-slate-500'
                }`}
              />
              <span className="text-[10px] tracking-wider">{sec.code}</span>
              <span
                className={`text-[10px] tracking-widest transition-opacity ${isActive ? 'opacity-100' : 'opacity-60 group-hover:opacity-100'}`}
              >
                {sec.title}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bottom Telemetry & Scroll Progress Indicator */}
      <div className="flex items-center justify-between border-t border-slate-900/80 pt-3 bg-gradient-to-t from-[#02040a]/90 to-transparent backdrop-blur-[2px]">
        {/* Left: Scroll cue */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 tracking-wider">
            SCROLL NAVIGATION // STAGE {SECTIONS[currentSectionIndex]?.code}
          </span>
          <span className="text-slate-400 hidden sm:inline">•</span>
          <span className="text-[10px] text-slate-400 hidden sm:inline">
            {SECTIONS[currentSectionIndex]?.title}
          </span>
        </div>

        {/* Right: Telemetry progress percentage */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400">TELEMETRY SCAN:</span>
          <div className="w-24 h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-cyan-400 transition-all duration-150"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-cyan-400 tabular-nums w-8 text-right font-medium">
            {progressPercent}%
          </span>
        </div>
      </div>
    </div>
  );
}
