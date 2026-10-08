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
      initial={{ opacity: 0, y: 3 }}
      animate={{ opacity: 1, y: 0 }}
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
    active: 'bg-[#376A9B]',
    warning: 'bg-[#C19348]',
    critical: 'bg-[#B64B4B]',
    calibrating: 'bg-[#76828D]',
  };

  return (
    <span className="inline-flex items-center gap-2 font-sans text-xs text-[#56616A]">
      <span className={`inline-block rounded-full h-1.5 w-1.5 shrink-0 ${colorMap[status]}`} />
      {label && <span className="text-[#17202A] font-semibold">{label}</span>}
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
      className={`rounded-[3px] border border-[#D6D2C9] bg-[#FAF8F5] p-4 transition-colors hover:border-[#B8B3A8] shadow-xs ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
