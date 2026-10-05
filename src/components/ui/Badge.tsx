import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils.ts';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate' | 'outline';
  dot?: 'nominal' | 'warning' | 'critical' | 'calibrating' | 'active';
  children: ReactNode;
}

export function Badge({ variant = 'slate', dot, className, children, ...props }: BadgeProps) {
  const variantStyles = {
    cyan: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/70',
    emerald: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/70',
    amber: 'bg-amber-950/60 text-amber-300 border-amber-800/70',
    rose: 'bg-rose-950/60 text-rose-300 border-rose-800/70',
    slate: 'bg-slate-900/80 text-slate-300 border-slate-800',
    outline: 'bg-transparent text-slate-400 border-slate-800',
  };

  const dotColors = {
    nominal: 'bg-emerald-400',
    warning: 'bg-amber-400',
    critical: 'bg-rose-400',
    calibrating: 'bg-cyan-400 animate-pulse',
    active: 'bg-cyan-400',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[1px] text-[10px] font-mono font-medium border tracking-wider uppercase select-none transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('h-1 w-1 shrink-0 rounded-none', dotColors[dot])} />}
      {children}
    </span>
  );
}
