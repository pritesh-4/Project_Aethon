import { motion, type HTMLMotionProps } from 'motion/react';
import type { ReactNode } from 'react';
import { panelVariants } from './motion-variants.ts';

/**
 * Page level transition wrapper for router views.
 */
interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scientific signal status dot.
 */
interface PulseIndicatorProps {
  status?: 'active' | 'warning' | 'critical' | 'calibrating';
  label?: string;
}

export function PulseIndicator({ status = 'active', label }: PulseIndicatorProps) {
  const colorMap = {
    active: 'bg-[#5BD8F5]',
    warning: 'bg-[#E8AE50]',
    critical: 'bg-[#D95C5C]',
    calibrating: 'bg-[#5BD8F5]',
  };

  return (
    <span className="inline-flex items-center gap-2 font-sans text-xs text-[#7F8B95]">
      <span className={`inline-block rounded-full h-1.5 w-1.5 shrink-0 ${colorMap[status]}`} />
      {label && <span className="text-[#E6EDF2] font-medium">{label}</span>}
    </span>
  );
}

/**
 * Card panel wrapper with restrained technical borders.
 */
export function ObservatoryPanel({ children, className = '', ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      className={`rounded-[4px] border border-[#172230] bg-[#0B0F14] p-4 transition-colors hover:border-[#243345] ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
