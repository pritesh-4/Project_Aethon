import { useState, useEffect } from 'react';
import { useLocation } from 'react-router';
import { Menu } from 'lucide-react';
import { formatTelemetryTime } from '@/lib/utils.ts';
import { cn } from '@/lib/utils.ts';

export interface TopSystemBarProps {
  onOpenMobileNav: () => void;
  className?: string;
}

export function TopSystemBar({ onOpenMobileNav, className }: TopSystemBarProps) {
  const [time, setTime] = useState<string>(formatTelemetryTime());
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(formatTelemetryTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getSubsystemTitle = (path: string) => {
    if (path.startsWith('/observatory')) return 'OBSERVATORY';
    if (path.startsWith('/discover')) return 'DISCOVERY';
    if (path.startsWith('/candidates')) return 'CANDIDATES';
    if (path.startsWith('/analysis')) return 'ANALYSIS';
    if (path.startsWith('/model')) return 'MODEL';
    if (path.startsWith('/archive')) return 'ARCHIVE';
    if (path.startsWith('/about')) return 'ABOUT';
    return 'OBSERVATORY';
  };

  const activeSubsystem = getSubsystemTitle(location.pathname);

  return (
    <header
      className={cn(
        'sticky top-0 z-20 h-10 w-full shrink-0 border-b border-slate-800/80 bg-[#0A0E13]/95 backdrop-blur-md px-3 sm:px-4 font-mono select-none flex items-center justify-between',
        className
      )}
    >
      {/* LEFT: AETHON // SUBSYSTEM */}
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={onOpenMobileNav}
          title="Open Subsystem Drawer"
          className="lg:hidden flex h-6 w-6 items-center justify-center rounded-[2px] border border-slate-800 bg-[#05070A] text-[#84929C] hover:text-[#EAF4F7] hover:border-slate-700 transition-colors"
        >
          <Menu className="h-3.5 w-3.5" />
        </button>

        <div className="flex items-center gap-1.5 text-xs tracking-wider">
          <span className="font-bold text-[#EAF4F7]">AETHON</span>
          <span className="text-slate-600">//</span>
          <span className="text-[#66E3FF] font-medium uppercase text-[11px]">
            {activeSubsystem}
          </span>
        </div>
      </div>

      {/* CENTER: SIGNAL ENGINE ● ONLINE */}
      <div className="hidden sm:flex items-center gap-2 text-[10px] tracking-widest text-[#84929C]">
        <span>SIGNAL ENGINE</span>
        <span className="flex items-center gap-1 text-emerald-400 font-semibold">
          <span className="h-1.5 w-1.5 rounded-none bg-emerald-400 animate-pulse" />
          ONLINE
        </span>
      </div>

      {/* RIGHT: UTC TIME & NODE TELEMETRY */}
      <div className="flex items-center gap-3 text-[10px] tracking-wider text-[#84929C]">
        <span className="tabular-nums text-[#EAF4F7] hidden xs:inline">{time}</span>
        <span className="text-slate-700 hidden xs:inline">|</span>
        <span className="text-slate-400">
          NODE <span className="text-slate-600">//</span>{' '}
          <span className="text-[#EAF4F7]">AET-01</span>
        </span>
      </div>
    </header>
  );
}
