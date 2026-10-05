import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router';
import { Volume2, VolumeX, Menu, Compass, Radio, Disc } from 'lucide-react';
import { StatusIndicator } from '@/components/ui/StatusIndicator.tsx';
import { IconButton } from '@/components/ui/IconButton.tsx';
import { observatoryAudio } from '@/lib/audio-synth.ts';
import { formatTelemetryTime } from '@/lib/utils.ts';

interface TopBarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export function TopBar({ onToggleSidebar }: TopBarProps) {
  const [time, setTime] = useState<string>(formatTelemetryTime());
  const [isAudioActive, setIsAudioActive] = useState<boolean>(false);
  const location = useLocation();

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

  const getSubsystemName = (path: string) => {
    if (path.startsWith('/observatory')) return 'OBSERVATORY // TELEMETRY CONSOLE';
    if (path.startsWith('/discover')) return 'DISCOVERY // CANDIDATE STREAM';
    if (path.startsWith('/analysis')) return 'ANALYSIS // SPECTRAL DOSSIER';
    if (path.startsWith('/model')) return 'MODEL // NEURAL ENCODER';
    if (path.startsWith('/about')) return 'INSTRUMENTATION // ARRAY SPEC';
    return 'OBSERVATORY WORKSTATION';
  };

  return (
    <header className="sticky top-0 z-40 h-11 w-full border-b border-slate-800/80 bg-[#040814]/95 backdrop-blur-md px-3 sm:px-4 font-mono select-none">
      <div className="flex h-full items-center justify-between gap-4">
        {/* Left Section: Mobile toggle, Branding, Subsystem breadcrumb */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <IconButton
              icon={<Menu className="h-4 w-4" />}
              size="sm"
              variant="outline"
              label="Toggle Subsystem Rail"
              onClick={onToggleSidebar}
              className="lg:hidden"
            />
          )}

          {/* System Monogram & Identity */}
          <Link
            to="/observatory"
            className="flex items-center gap-2 text-slate-100 hover:text-cyan-300 transition-colors group"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-[2px] border border-cyan-500/50 bg-cyan-950/40 text-cyan-400 group-hover:border-cyan-400 group-hover:shadow-[0_0_10px_rgba(6,182,212,0.3)] transition-all">
              <Compass className="h-3.5 w-3.5" />
            </div>
            <span className="font-bold text-xs tracking-[0.2em] text-slate-100">AETHON</span>
            <span className="text-[9px] px-1 py-0.2 rounded-[1px] border border-slate-800 bg-slate-900 text-slate-400 font-normal hidden sm:inline">
              v1.0.4-EXP
            </span>
          </Link>

          <span className="text-slate-800 hidden md:inline">|</span>

          {/* Subsystem Identifier */}
          <span className="text-[10px] text-cyan-400/90 tracking-wider font-semibold hidden md:inline">
            {getSubsystemName(location.pathname)}
          </span>

          <span className="text-slate-800 hidden xl:inline">|</span>

          {/* Active Telescope Tuning */}
          <span className="text-[10px] text-slate-400 tracking-wider hidden xl:flex items-center gap-1.5">
            <Radio className="h-3 w-3 text-cyan-500" />
            <span>
              GBT-100M: <span className="text-slate-200">1420.4057 MHz [H I]</span>
            </span>
          </span>
        </div>

        {/* Center Section: Antenna Pointing Coordinates (Wide Displays) */}
        <div className="hidden 2xl:flex items-center gap-3 text-[10px] text-slate-400">
          <span>
            AZ: <span className="text-slate-300">184.22°</span>
          </span>
          <span className="text-slate-800">•</span>
          <span>
            EL: <span className="text-slate-300">48.71°</span>
          </span>
          <span className="text-slate-800">•</span>
          <span>
            DRIFT: <span className="text-cyan-400">-0.32 Hz/s</span>
          </span>
        </div>

        {/* Right Section: Time, Audio Synth, System Status */}
        <div className="flex items-center gap-3">
          {/* Link back to mission landing narrative */}
          <Link
            to="/"
            title="Launch Landing Sequence"
            className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 rounded-[2px] border border-slate-800 bg-slate-900/60 hover:bg-slate-800/80 hover:border-slate-700 text-[10px] text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Disc className="h-3 w-3 text-cyan-400" />
            <span>MISSION NARRATIVE</span>
          </Link>

          {/* Synthesizer Audio Atmospheric Toggle */}
          <button
            type="button"
            onClick={handleToggleAudio}
            title={
              isAudioActive ? 'Mute 1420 MHz Receiver Static' : 'Synthesize 1420 MHz Radio Static'
            }
            className="flex items-center gap-1.5 h-7 px-2 rounded-[2px] border border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:text-slate-200 text-[10px] text-slate-400 transition-colors cursor-pointer"
          >
            {isAudioActive ? (
              <>
                <Volume2 className="h-3 w-3 text-cyan-400" />
                <span className="text-cyan-300 hidden md:inline">AUDIO // ON</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3 w-3 text-slate-500" />
                <span className="text-slate-500 hidden md:inline">AUDIO // OFF</span>
              </>
            )}
          </button>

          {/* UTC Telemetry Clock */}
          <span className="text-[10px] text-slate-300 tabular-nums hidden sm:inline border-l border-slate-800/80 pl-3">
            {time}
          </span>

          {/* Global System Status Tag */}
          <div className="border-l border-slate-800/80 pl-3">
            <StatusIndicator status="online" label="SYSTEM // ONLINE" />
          </div>
        </div>
      </div>
    </header>
  );
}
