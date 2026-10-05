import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils.ts';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonState = 'idle' | 'loading' | 'success' | 'error';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  withArrow?: boolean;
  state?: ButtonState;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  metadata?: string; // e.g. "EST. 3.2 SEC"
  cornerAccents?: boolean; // Micro corner markers
}

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconPosition = 'left',
  withArrow = false,
  state = 'idle',
  loadingText,
  successText,
  errorText,
  metadata,
  cornerAccents,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const showCorners = cornerAccents ?? isPrimary;

  const sizeStyles = {
    sm: 'h-7 px-3 text-[11px] gap-1.5',
    md: 'h-8 px-4 text-xs gap-2',
    lg: 'h-9 px-5 text-xs gap-2.5',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    primary:
      'bg-[#0A0E13] text-[#EAF4F7] border border-[#66E3FF]/70 hover:border-[#66E3FF] hover:bg-[#10161D] hover:shadow-[0_0_12px_rgba(102,227,255,0.22)] active:bg-[#05070A]',
    secondary:
      'bg-[#0A0E13] text-[#84929C] border border-slate-800 hover:border-slate-700 hover:text-[#EAF4F7] hover:bg-[#10161D] active:bg-[#05070A]',
    outline:
      'bg-transparent text-[#EAF4F7] border border-slate-700/80 hover:border-[#66E3FF]/70 hover:text-[#66E3FF] hover:bg-[#10161D]/40 active:bg-[#05070A]',
    ghost:
      'bg-transparent text-[#84929C] border border-transparent hover:text-[#EAF4F7] hover:bg-[#10161D]/50 hover:border-slate-800/60',
    danger:
      'bg-[#0A0E13] text-[#FF5E5E] border border-[#FF5E5E]/60 hover:border-[#FF5E5E] hover:bg-rose-950/30 hover:text-rose-200 active:bg-[#05070A]',
  };

  const isDisabled = disabled || state === 'loading';

  return (
    <button
      className={cn(
        'group relative inline-flex items-center justify-center rounded-[4px] font-mono font-medium tracking-wider uppercase transition-all duration-200 select-none outline-none cursor-pointer',
        'focus-visible:ring-1 focus-visible:ring-[#66E3FF] focus-visible:ring-offset-1 focus-visible:ring-offset-[#05070A]',
        'active:translate-y-[1px] disabled:opacity-40 disabled:pointer-events-none disabled:active:translate-y-0',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {/* Restrained Corner Accents for Technical Instrumentation */}
      {showCorners && (
        <>
          <span className="pointer-events-none absolute -left-[1px] -top-[1px] h-1 w-1 border-l border-t border-[#66E3FF]" />
          <span className="pointer-events-none absolute -right-[1px] -top-[1px] h-1 w-1 border-r border-t border-[#66E3FF]" />
          <span className="pointer-events-none absolute -left-[1px] -bottom-[1px] h-1 w-1 border-l border-b border-[#66E3FF]" />
          <span className="pointer-events-none absolute -right-[1px] -bottom-[1px] h-1 w-1 border-r border-b border-[#66E3FF]" />
        </>
      )}

      {/* State: Loading */}
      {state === 'loading' && (
        <span className="inline-flex items-center gap-1.5 text-cyan-300">
          <span>{loadingText || children || 'RUNNING ANALYSIS'}</span>
          <span className="inline-block animate-spin font-sans text-xs">◌</span>
        </span>
      )}

      {/* State: Success */}
      {state === 'success' && (
        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
          <span>{successText || 'ANALYSIS COMPLETE'}</span>
          <Check className="h-3.5 w-3.5" />
        </span>
      )}

      {/* State: Error */}
      {state === 'error' && (
        <span className="inline-flex items-center gap-1.5 text-[#FF5E5E] font-semibold">
          <span>{errorText || 'ANALYSIS FAILED'}</span>
          <X className="h-3.5 w-3.5" />
        </span>
      )}

      {/* State: Default / Idle */}
      {state === 'idle' && (
        <>
          {icon && iconPosition === 'left' && (
            <span className="shrink-0 transition-transform duration-200 group-hover:scale-105">
              {icon}
            </span>
          )}

          <div className="flex flex-col items-start leading-tight">
            <span>{children}</span>
            {metadata && (
              <span className="text-[9px] text-[#84929C] font-normal tracking-tight -mt-0.5 group-hover:text-slate-400">
                {metadata}
              </span>
            )}
          </div>

          {icon && iconPosition === 'right' && (
            <span className="shrink-0 transition-transform duration-200 group-hover:scale-105">
              {icon}
            </span>
          )}

          {withArrow && (
            <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:translate-x-[2px]" />
          )}
        </>
      )}
    </button>
  );
}
