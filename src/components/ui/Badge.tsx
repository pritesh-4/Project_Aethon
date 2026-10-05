import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils.ts';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate' | 'outline';
  dot?: 'nominal' | 'warning' | 'critical' | 'calibrating' | 'active';
  children: ReactNode;
}

export function Badge({ variant = 'slate', dot, className, children, ...props }: BadgeProps) {
  const variantStyles = {
    cyan: 'bg-[#0E1A22] text-[#5BD8F5] border-[#5BD8F5]/30',
    emerald: 'bg-[#10161D] text-[#E6EDF2] border-[#172230]',
    amber: 'bg-[#1C160E] text-[#E8AE50] border-[#E8AE50]/30',
    rose: 'bg-[#1C1111] text-[#D95C5C] border-[#D95C5C]/30',
    slate: 'bg-[#10161D] text-[#7F8B95] border-[#172230]',
    outline: 'bg-transparent text-[#7F8B95] border-[#172230]',
  };

  const dotColors = {
    nominal: 'bg-[#7F8B95]',
    warning: 'bg-[#E8AE50]',
    critical: 'bg-[#D95C5C]',
    calibrating: 'bg-[#5BD8F5]',
    active: 'bg-[#5BD8F5]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[11px] font-sans font-medium border select-none transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotColors[dot])} />}
      {children}
    </span>
  );
}
