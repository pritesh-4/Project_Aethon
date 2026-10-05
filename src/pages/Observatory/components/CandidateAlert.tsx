import { Link } from 'react-router';
import { motion } from 'motion/react';
import type { ObservationData } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import { Radio, Compass } from 'lucide-react';

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
      className="relative rounded border border-[#5BD8F5]/30 bg-[#10161D] p-4 select-none shadow-sm"
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Candidate Identification */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[#5BD8F5] text-xs font-medium">
              <Radio className="h-3.5 w-3.5" />
              Candidate event detected
            </span>
            <span className="text-[#7F8B95]">•</span>
            <span className="rounded border border-[#E8AE50]/40 bg-[#E8AE50]/10 px-2 py-0.5 text-[10px] font-medium text-[#E8AE50]">
              Priority: {observation.priority.toLowerCase()}
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-3 text-xs">
            <span className="font-semibold text-[#E6EDF2] font-mono">{observation.id}</span>
            <span className="text-[#7F8B95]">
              Target: <span className="text-[#E6EDF2]">{observation.targetName}</span>
            </span>
            <span className="text-[#7F8B95]">|</span>
            <span className="text-[#5BD8F5] font-mono">
              {observation.frequencyMHz.toFixed(4)} MHz
            </span>
            <span className="text-[#7F8B95]">|</span>
            <span className="text-[#7F8B95] font-mono">
              Drift: {observation.driftRateHzPerSec.toFixed(2)} Hz/s
            </span>
          </div>

          <p className="text-[11px] text-[#7F8B95] max-w-3xl leading-relaxed">
            Unclassified coherent narrowband feature persistent across the observation window.
            Multi-station follow-up recommended.
          </p>
        </div>

        {/* Right: Primary Call to Action */}
        <div className="flex items-center gap-3 self-start lg:self-center shrink-0">
          <div className="hidden xl:flex flex-col items-end text-[11px] text-[#7F8B95] font-mono">
            <span className="flex items-center gap-1">
              <Compass className="h-3 w-3" />
              {observation.coordinates.ra} / {observation.coordinates.dec}
            </span>
          </div>

          <Link to={`/analysis/${observation.id}`} className="inline-block">
            <Button variant="primary" size="md" withArrow className="text-xs">
              Inspect candidate
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
