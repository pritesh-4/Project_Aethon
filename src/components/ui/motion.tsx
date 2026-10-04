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
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scientific telemetry live signal pulsing dot.
 */
interface PulseIndicatorProps {
  status?: 'active' | 'warning' | 'critical' | 'calibrating';
  label?: string;
}

export function PulseIndicator({ status = 'active', label }: PulseIndicatorProps) {
  const colorMap = {
    active: 'bg-emerald-400',
    warning: 'bg-amber-400',
    critical: 'bg-rose-400',
    calibrating: 'bg-cyan-400',
  };

  const pingMap = {
    active: 'bg-emerald-400/40',
    warning: 'bg-amber-400/40',
    critical: 'bg-rose-400/40',
    calibrating: 'bg-cyan-400/40',
  };

  return (
    <span className="inline-flex items-center gap-2 font-mono text-xs text-slate-300">
      <span className="relative flex h-2 w-2">
        <motion.span
          animate={{ scale: [1, 2, 1], opacity: [0.7, 0, 0.7] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className={`absolute inline-flex h-full w-full rounded-full ${pingMap[status]}`}
        />
        <span className={`relative inline-flex rounded-full h-2 w-2 ${colorMap[status]}`} />
      </span>
      {label && <span className="tracking-wide text-xs">{label}</span>}
    </span>
  );
}

/**
 * Card wrapper with subtle telemetry hover border transition.
 */
export function ObservatoryPanel({ children, className = '', ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      variants={panelVariants}
      initial="hidden"
      animate="visible"
      className={`rounded-lg border border-slate-800/80 bg-slate-950/70 p-4 backdrop-blur-md shadow-lg transition-colors hover:border-slate-700/80 ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}
