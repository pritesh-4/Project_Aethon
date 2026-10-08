import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils.ts';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?:
    'copper' | 'amber' | 'sage' | 'emerald' | 'rose' | 'slate' | 'neutral' | 'outline' | 'cyan';
  dot?: 'nominal' | 'warning' | 'critical' | 'calibrating' | 'active';
  children: ReactNode;
}

export function Badge({ variant = 'slate', dot, className, children, ...props }: BadgeProps) {
  const variantStyles = {
    copper: 'bg-[#241A14] text-[#D4864A] border-[#D4864A]/35',
    amber: 'bg-[#241A14] text-[#D4864A] border-[#D4864A]/35',
    cyan: 'bg-[#241A14] text-[#D4864A] border-[#D4864A]/35', // mapped from legacy
    sage: 'bg-[#141F18] text-[#529E72] border-[#529E72]/35',
    emerald: 'bg-[#141F18] text-[#529E72] border-[#529E72]/35', // mapped from legacy
    rose: 'bg-[#241414] text-[#C84A4A] border-[#C84A4A]/35',
    slate: 'bg-[#141715] text-[#9A9C96] border-[#262C28]',
    neutral: 'bg-[#141715] text-[#9A9C96] border-[#262C28]',
    outline: 'bg-transparent text-[#9A9C96] border-[#262C28]',
  };

  const dotColors = {
    nominal: 'bg-[#529E72]',
    warning: 'bg-[#D4864A]',
    critical: 'bg-[#C84A4A]',
    calibrating: 'bg-[#D4864A]',
    active: 'bg-[#D4864A]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-[11px] font-sans font-medium border select-none transition-colors',
        variantStyles[variant] || variantStyles.slate,
        className
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotColors[dot])} />}
      {children}
    </span>
  );
}
