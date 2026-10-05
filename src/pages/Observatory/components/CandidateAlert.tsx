import { Link } from 'react-router';
import { motion } from 'motion/react';
import type { ObservationData } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import { Radio, ShieldCheck, Compass } from 'lucide-react';

export interface CandidateAlertProps {
  observation: ObservationData;
  onDismiss?: () => void;
}

export function CandidateAlert({ observation }: CandidateAlertProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="relative rounded-[2px] border border-cyan-800/80 bg-gradient-to-r from-[#081224] via-[#0A162C] to-[#0A0E13] p-4 font-mono shadow-[0_4px_24px_rgba(6,182,212,0.12)]"
    >
      {/* Corner Scientific Accent Brackets */}
      <span className="pointer-events-none absolute -left-[1px] -top-[1px] h-2 w-2 border-l border-t border-[#66E3FF]" />
      <span className="pointer-events-none absolute -right-[1px] -top-[1px] h-2 w-2 border-r border-t border-[#66E3FF]" />
      <span className="pointer-events-none absolute -left-[1px] -bottom-[1px] h-2 w-2 border-l border-b border-[#66E3FF]" />
      <span className="pointer-events-none absolute -right-[1px] -bottom-[1px] h-2 w-2 border-r border-b border-[#66E3FF]" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Candidate Identification */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[#66E3FF] text-xs font-bold uppercase tracking-wider">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              CANDIDATE EVENT DETECTED
            </span>
            <span className="text-slate-600">•</span>
            <span className="rounded-[1px] border border-emerald-500/60 bg-emerald-950/40 px-1.5 py-0.2 text-[10px] font-semibold text-emerald-300 uppercase tracking-wider">
              PRIORITY // {observation.priority}
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-[11px] text-[#84929C] hidden sm:inline">
              AUTONOMOUS PIPELINE ISOLATION COMPLETE
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-3">
            <span className="text-base font-bold text-[#EAF4F7] tracking-wider">
              {observation.id}
            </span>
            <span className="text-xs text-slate-400 font-sans">
              Target: <strong className="text-slate-200">{observation.targetName}</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-xs text-cyan-300">
              f: {observation.frequencyMHz.toFixed(4)} MHz
            </span>
            <span className="text-slate-600">|</span>
            <span className="text-xs text-slate-400">
              Drift: {observation.driftRateHzPerSec.toFixed(2)} Hz/s
            </span>
          </div>

          <p className="text-[11px] text-[#84929C] max-w-3xl leading-relaxed">
            Unclassified coherent narrowband feature persistent across observation window. Non-local
            spatial rejection verified. Human scientific validation and multi-aperture follow-up
            recommended.
          </p>
        </div>

        {/* Right: Primary Call to Action */}
        <div className="flex items-center gap-3 self-start lg:self-center shrink-0">
          <div className="hidden xl:flex flex-col items-end text-[10px] text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="h-3 w-3" />
              BARYCENTRIC CONFIRMED
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <Compass className="h-3 w-3" />
              {observation.coordinates.ra} / {observation.coordinates.dec}
            </span>
          </div>

          <Link to={`/analysis/${observation.id}`} className="inline-block">
            <Button
              variant="primary"
              size="md"
              withArrow
              cornerAccents
              className="text-xs shadow-[0_0_16px_rgba(102,227,255,0.25)]"
            >
              INVESTIGATE CANDIDATE
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
