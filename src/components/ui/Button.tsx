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
    // Primary: Key action (Analyze, Investigate, Open Record) - confident observatory blue
    primary:
      'bg-[#376A9B] text-white border border-[#2E5983] hover:bg-[#2F5E8C] active:bg-[#254C72] shadow-2xs font-semibold',
    // Secondary: Standard action (Load, Inspect, Reset) - quiet paper card surface
    secondary:
      'bg-[#FAF8F5] text-[#17202A] border border-[#D6D2C9] hover:bg-[#EAE7E0] hover:border-[#BCB6A8] active:bg-[#E2DFD7]',
    // Tertiary: Quiet utilities
    tertiary:
      'bg-transparent text-[#56616A] border border-[#D6D2C9] hover:text-[#17202A] hover:bg-[#EAE7E0] hover:border-[#BCB6A8] active:bg-[#E2DFD7]',
    outline:
      'bg-transparent text-[#17202A] border border-[#D6D2C9] hover:bg-[#EAE7E0] hover:border-[#BCB6A8] active:bg-[#E2DFD7]',
    ghost:
      'bg-transparent text-[#56616A] border border-transparent hover:text-[#17202A] hover:bg-[#EAE7E0] active:bg-[#E2DFD7]',
    danger:
      'bg-[#FDF0F0] text-[#B64B4B] border border-[#E8B4B4] hover:bg-[#FBE4E4] active:bg-[#F9D6D6]',
  };

  const isDisabled = disabled || state === 'loading';

  return (
    <button
      className={cn(
        'group relative inline-flex items-center justify-center rounded-[3px] font-sans font-medium text-xs tracking-normal transition-colors duration-150 select-none outline-none cursor-pointer',
        'focus-visible:ring-1 focus-visible:ring-[#376A9B] focus-visible:ring-offset-1 focus-visible:ring-offset-[#F4F1EA]',
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
        <span
          className={cn(
            'inline-flex items-center gap-1.5',
            variant === 'primary' ? 'text-white' : 'text-[#376A9B]'
          )}
        >
          <span>{loadingText || children || 'Loading...'}</span>
          <span className="inline-block animate-spin font-sans text-xs">◌</span>
        </span>
      )}

      {/* State: Success */}
      {state === 'success' && (
        <span className="inline-flex items-center gap-1.5 text-[#3D7D54]">
          <span>{successText || 'Complete'}</span>
          <Check className="h-3.5 w-3.5" />
        </span>
      )}

      {/* State: Error */}
      {state === 'error' && (
        <span className="inline-flex items-center gap-1.5 text-[#B64B4B]">
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
              <span className="text-[10px] text-[#7E8B96] font-mono font-normal tracking-tight -mt-0.5">
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
