import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils.ts'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'slate' | 'outline'
  children: ReactNode
}

export function Badge({ variant = 'slate', className, children, ...props }: BadgeProps) {
  const variantStyles = {
    cyan: 'bg-cyan-950/60 text-cyan-300 border-cyan-800/60 hover:border-cyan-500/80',
    emerald: 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60 hover:border-emerald-500/80',
    amber: 'bg-amber-950/60 text-amber-300 border-amber-800/60 hover:border-amber-500/80',
    rose: 'bg-rose-950/60 text-rose-300 border-rose-800/60 hover:border-rose-500/80',
    slate: 'bg-slate-900/80 text-slate-300 border-slate-800 hover:border-slate-700',
    outline: 'bg-transparent text-slate-400 border-slate-800 hover:border-slate-600',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-medium border tracking-wider transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
