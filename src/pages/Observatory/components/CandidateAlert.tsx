import { Link } from 'react-router';
import { motion } from 'motion/react';
import type { ObservationData } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import { Radio } from 'lucide-react';

export interface CandidateAlertProps {
  observation: ObservationData;
}

export function CandidateAlert({ observation }: CandidateAlertProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="rounded-[2px] border border-[#D4864A]/40 bg-[#1A1E1B] p-4 select-none font-sans"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Candidate Identification */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-[#D4864A]" />
            <span className="text-xs font-medium text-[#D4864A]">Candidate event detected</span>
            <span className="text-[#363C38]">|</span>
            <span className="rounded-[2px] border border-[#D4864A]/40 bg-[#241A14] px-1.5 py-0.2 text-[10px] font-mono text-[#D4864A]">
              Priority: {observation.priority.toLowerCase()}
            </span>
          </div>

          <p className="text-xs text-[#E6E4DD] leading-relaxed">
            Narrowband carrier persistent across the observation window with linear Doppler drift of{' '}
            <span className="font-mono text-[#D4864A]">
              {observation.driftRateHzPerSec.toFixed(2)} Hz/s
            </span>
            .
          </p>
        </div>

        {/* Right: The Next Action */}
        <div className="shrink-0">
          <Link to={`/analysis/${observation.id}`}>
            <Button variant="primary" size="md" withArrow>
              Open detailed analysis
            </Button>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
