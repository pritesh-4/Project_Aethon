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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className="rounded-[4px] border border-[#5BD8F5]/40 bg-[#10161D] p-4 select-none font-sans"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Left: Candidate Identification */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-[#5BD8F5]" />
            <span className="text-xs font-medium text-[#5BD8F5]">Candidate event detected</span>
            <span className="text-[#172230]">|</span>
            <span className="rounded-[3px] border border-[#E8AE50]/40 bg-[#1C160E] px-1.5 py-0.2 text-[10px] font-mono text-[#E8AE50]">
              Priority: {observation.priority.toLowerCase()}
            </span>
          </div>

          <p className="text-xs text-[#E6EDF2]">
            Narrowband carrier persistent across the observation window with linear Doppler drift of{' '}
            <span className="font-mono text-[#5BD8F5]">
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
