import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';
import { cn } from '@/lib/utils.ts';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'outline' | 'ghost' | 'danger';

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
  metadata?: string;
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
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  const sizeStyles = {
    sm: 'h-7 px-2.5 text-xs gap-1.5 min-h-[28px]',
    md: 'h-8 px-3 text-xs gap-2 min-h-[32px]',
    lg: 'h-9 px-3.5 text-xs gap-2 min-h-[36px]',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    // Primary: Key action (Analyze, Investigate, Open Record) - restrained warm copper
    primary:
      'bg-[#141715] text-[#D4864A] border border-[#D4864A]/70 hover:bg-[#1A1E1B] hover:border-[#D4864A] hover:text-[#E0955B] active:bg-[#0F1110]',
    // Secondary: Standard action (Load, Inspect, Reset)
    secondary:
      'bg-[#141715] text-[#E6E4DD] border border-[#262C28] hover:border-[#363C38] hover:bg-[#1A1E1B] active:bg-[#0F1110]',
    // Tertiary: Quiet utilities
    tertiary:
      'bg-transparent text-[#9A9C96] border border-[#262C28] hover:text-[#E6E4DD] hover:border-[#363C38] hover:bg-[#141715] active:bg-[#0F1110]',
    outline:
      'bg-transparent text-[#9A9C96] border border-[#262C28] hover:text-[#E6E4DD] hover:border-[#363C38] hover:bg-[#141715] active:bg-[#0F1110]',
    ghost:
      'bg-transparent text-[#9A9C96] border border-transparent hover:text-[#E6E4DD] hover:bg-[#141715] active:bg-[#0F1110]',
    danger:
      'bg-[#141715] text-[#C84A4A] border border-[#C84A4A]/40 hover:border-[#C84A4A] hover:bg-[#1C1111] active:bg-[#0F1110]',
  };

  const isDisabled = disabled || state === 'loading';

  return (
    <button
      className={cn(
        'group relative inline-flex items-center justify-center rounded-[2px] font-sans font-medium text-xs tracking-normal transition-colors duration-150 select-none outline-none cursor-pointer',
        'focus-visible:ring-1 focus-visible:ring-[#D4864A] focus-visible:ring-offset-1 focus-visible:ring-offset-[#0F1110]',
        'disabled:opacity-40 disabled:pointer-events-none',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      disabled={isDisabled}
      {...props}
    >
      {/* State: Loading */}
      {state === 'loading' && (
        <span className="inline-flex items-center gap-1.5 text-[#D4864A]">
          <span>{loadingText || children || 'Loading...'}</span>
          <span className="inline-block animate-spin font-sans text-xs">◌</span>
        </span>
      )}

      {/* State: Success */}
      {state === 'success' && (
        <span className="inline-flex items-center gap-1.5 text-[#529E72]">
          <span>{successText || 'Complete'}</span>
          <Check className="h-3.5 w-3.5" />
        </span>
      )}

      {/* State: Error */}
      {state === 'error' && (
        <span className="inline-flex items-center gap-1.5 text-[#C84A4A]">
          <span>{errorText || 'Error'}</span>
          <X className="h-3.5 w-3.5" />
        </span>
      )}

      {/* State: Default / Idle */}
      {state === 'idle' && (
        <>
          {icon && iconPosition === 'left' && (
            <span className="shrink-0 transition-transform duration-150">{icon}</span>
          )}

          <div className="flex flex-col items-start leading-tight">
            <span>{children}</span>
            {metadata && (
              <span className="text-[10px] text-[#9A9C96] font-mono font-normal tracking-tight -mt-0.5">
                {metadata}
              </span>
            )}
          </div>

          {icon && iconPosition === 'right' && (
            <span className="shrink-0 transition-transform duration-150">{icon}</span>
          )}

          {withArrow && (
            <ArrowRight className="h-3.5 w-3.5 shrink-0 transition-transform duration-150 group-hover:translate-x-[2px]" />
          )}
        </>
      )}
    </button>
  );
}
