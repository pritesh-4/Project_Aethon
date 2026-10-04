import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router';
import { Radio, Activity, Cpu, Compass, Info, Disc } from 'lucide-react';
import { PulseIndicator } from '@/components/ui/motion.tsx';
import { Badge } from '@/components/ui/Badge.tsx';
import { formatTelemetryTime } from '@/lib/utils.ts';

interface NavRoute {
  name: string;
  path: string;
  icon: typeof Radio;
  badge?: string;
}

const ROUTES: NavRoute[] = [
  { name: 'Mission', path: '/', icon: Disc },
  { name: 'Observatory', path: '/observatory', icon: Activity, badge: 'LIVE' },
  { name: 'Discover', path: '/discover', icon: Radio },
  { name: 'ML Model', path: '/model', icon: Cpu },
  { name: 'About', path: '/about', icon: Info },
];

export function Navbar() {
  const [time, setTime] = useState<string>(formatTelemetryTime());
  const location = useLocation();

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(formatTelemetryTime());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      {/* Top micro telemetry bar */}
      <div className="flex h-7 items-center justify-between border-b border-slate-900 px-4 text-[11px] font-mono text-slate-400">
        <div className="flex items-center gap-4">
          <PulseIndicator status="active" label="GBT-100M ARRAY" />
          <span className="hidden sm:inline text-slate-600">|</span>
          <span className="hidden sm:inline text-slate-400">
            FREQ: <span className="text-cyan-400">1420.4057 MHz [HI]</span>
          </span>
          <span className="hidden md:inline text-slate-600">|</span>
          <span className="hidden md:inline text-slate-400">
            INFERENCE LATENCY: <span className="text-emerald-400">14.2 ms</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-300">{time}</span>
          <Badge variant="cyan" className="py-0 px-1.5 text-[10px]">
            REC ACTIVE
          </Badge>
        </div>
      </div>

      {/* Main navigation header */}
      <div className="flex h-14 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <NavLink to="/" className="flex items-center gap-2.5 group">
            <div className="relative flex h-8 w-8 items-center justify-center rounded-md border border-cyan-500/40 bg-cyan-950/30 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.25)] transition-all group-hover:border-cyan-400 group-hover:shadow-[0_0_18px_rgba(6,182,212,0.4)]">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-base font-bold tracking-widest text-slate-100 group-hover:text-cyan-300 transition-colors">
                  AETHON
                </span>
                <span className="text-[10px] font-mono text-cyan-400/90 font-semibold px-1 rounded border border-cyan-800/60 bg-cyan-950/40">
                  v1.0
                </span>
              </div>
              <p className="text-[9px] font-mono uppercase tracking-wider text-slate-400 -mt-0.5">
                Radio Signal Discovery
              </p>
            </div>
          </NavLink>

          <nav className="hidden md:flex items-center gap-1 ml-4 font-mono text-xs">
            {ROUTES.map((route) => {
              const Icon = route.icon;
              const isActive =
                route.path === '/'
                  ? location.pathname === '/'
                  : location.pathname.startsWith(route.path);

              return (
                <NavLink
                  key={route.path}
                  to={route.path}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${
                    isActive
                      ? 'bg-slate-900 text-cyan-300 border border-slate-700/80 shadow-[0_0_10px_rgba(6,182,212,0.12)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span>{route.name}</span>
                  {route.badge && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Mobile menu link shortcuts / quick action */}
        <div className="flex items-center gap-2">
          <NavLink
            to="/discover"
            className="flex items-center gap-1.5 rounded border border-cyan-500/40 bg-cyan-950/40 hover:bg-cyan-900/40 px-3 py-1 text-xs font-mono text-cyan-300 transition-colors"
          >
            <Radio className="h-3.5 w-3.5 animate-pulse text-cyan-400" />
            <span className="hidden sm:inline">Discovery Feed</span>
          </NavLink>
        </div>
      </div>

      {/* Mobile nav row */}
      <div className="flex md:hidden border-t border-slate-900 px-2 py-1.5 overflow-x-auto gap-1 font-mono text-xs">
        {ROUTES.map((route) => {
          const Icon = route.icon;
          const isActive =
            route.path === '/'
              ? location.pathname === '/'
              : location.pathname.startsWith(route.path);

          return (
            <NavLink
              key={route.path}
              to={route.path}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/80'
                  : 'text-slate-400'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{route.name}</span>
            </NavLink>
          );
        })}
      </div>
    </header>
  );
}
