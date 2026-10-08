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
      className="rounded-[3px] border border-[#E8D2A3] bg-[#FDF8EE] p-4 select-none font-sans shadow-2xs"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Candidate Identification */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-[#C19348]" />
            <span className="text-xs font-semibold text-[#C19348]">Candidate event detected</span>
            <span className="text-[#D6D2C9]">|</span>
            <span className="rounded-[2px] border border-[#E8D2A3] bg-[#FAF3E3] px-1.5 py-0.2 text-[10px] font-mono text-[#C19348] font-medium">
              Priority: {observation.priority.toLowerCase()}
            </span>
          </div>

          <p className="text-xs text-[#17202A] leading-relaxed">
            Narrowband carrier persistent across the observation window with linear Doppler drift of{' '}
            <span className="font-mono text-[#C19348] font-semibold">
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
