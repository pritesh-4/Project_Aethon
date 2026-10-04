import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/utils.ts'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  icon?: ReactNode
  isLoading?: boolean
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  isLoading,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs gap-1.5',
    md: 'px-3.5 py-1.5 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  }

  const variantStyles = {
    primary:
      'bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-medium border border-cyan-400/40 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] active:scale-[0.98]',
    secondary:
      'bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 hover:border-slate-600 active:scale-[0.98]',
    outline:
      'bg-transparent hover:bg-slate-900/60 text-cyan-400 border border-cyan-900/80 hover:border-cyan-500/80 active:scale-[0.98]',
    ghost:
      'bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-200 border border-transparent',
    danger:
      'bg-rose-950/70 hover:bg-rose-900/90 text-rose-200 border border-rose-800/70 active:scale-[0.98]',
  }

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded font-sans tracking-wide transition-all focus:outline-none focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin mr-1" />
      ) : (
        icon
      )}
      {children}
    </button>
  )
}
