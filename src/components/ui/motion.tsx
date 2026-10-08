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
    active: 'bg-[#D4864A]',
    warning: 'bg-[#D4864A]',
    critical: 'bg-[#C84A4A]',
    calibrating: 'bg-[#9A9C96]',
  };

  return (
    <span className="inline-flex items-center gap-2 font-sans text-xs text-[#9A9C96]">
      <span className={`inline-block rounded-full h-1.5 w-1.5 shrink-0 ${colorMap[status]}`} />
      {label && <span className="text-[#E6E4DD] font-medium">{label}</span>}
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
      className={`rounded-[2px] border border-[#262C28] bg-[#141715] p-4 transition-colors hover:border-[#313733] ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
