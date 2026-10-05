import { Link } from 'react-router';
import { Radio, ArrowLeft, Database, Activity } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center p-6 text-center select-none">
      <div className="relative mb-6 flex h-24 w-24 items-center justify-center rounded-none border border-slate-800 bg-[#0A0E13]/90 shadow-[0_0_30px_rgba(0,0,0,0.8)]">
        <div className="absolute inset-0 bg-radial from-cyan-950/20 to-transparent" />
        <Radio className="h-10 w-10 text-cyan-400 animate-pulse" />
        <div className="absolute -top-1 -right-1 h-2 w-2 border-t-2 border-r-2 border-cyan-400" />
        <div className="absolute -bottom-1 -left-1 h-2 w-2 border-b-2 border-l-2 border-cyan-400" />
      </div>

      <div className="mb-2 font-mono text-xs uppercase tracking-widest text-amber-400/90">
        [ COORDINATES_OUT_OF_BOUNDS // ERROR 404 ]
      </div>

      <h1 className="mb-3 text-2xl font-semibold tracking-tight text-slate-100 sm:text-3xl">
        Signal Vector Unresolved
      </h1>

      <p className="max-w-md text-sm text-slate-400">
        The requested observation, telemetry coordinate, or subsystem endpoint does not exist in the
        current observatory registry.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link to="/observatory">
          <Button variant="primary" size="sm" className="gap-2">
            <Radio className="h-4 w-4" />
            Active Observatory
          </Button>
        </Link>
        <Link to="/candidates">
          <Button variant="secondary" size="sm" className="gap-2">
            <Activity className="h-4 w-4" />
            Candidate Registry
          </Button>
        </Link>
        <Link to="/archive">
          <Button variant="ghost" size="sm" className="gap-2">
            <Database className="h-4 w-4" />
            Observation Archive
          </Button>
        </Link>
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2 text-slate-400">
            <ArrowLeft className="h-4 w-4" />
            Mission Briefing
          </Button>
        </Link>
      </div>

      <div className="mt-12 font-mono text-[11px] text-slate-600">
        AETHON SYSTEM TELEMETRY // TELEMETRY CODE: 0x404_OFF_TARGET
      </div>
    </div>
  );
}
