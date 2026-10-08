import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils.ts';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?:
    | 'scientific'
    | 'attention'
    | 'verified'
    | 'error'
    | 'copper'
    | 'amber'
    | 'sage'
    | 'emerald'
    | 'rose'
    | 'slate'
    | 'neutral'
    | 'outline'
    | 'cyan';
  dot?: 'nominal' | 'warning' | 'critical' | 'calibrating' | 'active';
  children: ReactNode;
}

export function Badge({ variant = 'neutral', dot, className, children, ...props }: BadgeProps) {
  const variantStyles = {
    scientific: 'bg-[#EAF1F8] text-[#376A9B] border-[#B6CDE2]',
    attention: 'bg-[#FDF8EE] text-[#C19348] border-[#E8D2A3]',
    verified: 'bg-[#EFF7F2] text-[#3D7D54] border-[#B2D8C0]',
    error: 'bg-[#FDF0F0] text-[#B64B4B] border-[#E8B4B4]',
    // Backward compatibility mappings
    copper: 'bg-[#FDF8EE] text-[#C19348] border-[#E8D2A3]',
    amber: 'bg-[#FDF8EE] text-[#C19348] border-[#E8D2A3]',
    cyan: 'bg-[#EAF1F8] text-[#376A9B] border-[#B6CDE2]',
    sage: 'bg-[#EFF7F2] text-[#3D7D54] border-[#B2D8C0]',
    emerald: 'bg-[#EFF7F2] text-[#3D7D54] border-[#B2D8C0]',
    rose: 'bg-[#FDF0F0] text-[#B64B4B] border-[#E8B4B4]',
    slate: 'bg-[#EAE7E0] text-[#56616A] border-[#D6D2C9]',
    neutral: 'bg-[#EAE7E0] text-[#56616A] border-[#D6D2C9]',
    outline: 'bg-transparent text-[#56616A] border-[#D6D2C9]',
  };

  const dotColors = {
    nominal: 'bg-[#3D7D54]',
    warning: 'bg-[#C19348]',
    critical: 'bg-[#B64B4B]',
    calibrating: 'bg-[#C19348]',
    active: 'bg-[#376A9B]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[2px] text-[11px] font-sans font-medium border select-none transition-colors',
        variantStyles[variant] || variantStyles.neutral,
        className
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', dotColors[dot])} />}
      {children}
    </span>
  );
}
