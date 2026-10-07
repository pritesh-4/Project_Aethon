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
    sm: 'h-7 px-2.5 text-xs gap-1.5',
    md: 'h-8 px-3.5 text-xs gap-2',
    lg: 'h-9 px-4 text-sm gap-2.5',
  };

  const variantStyles: Record<ButtonVariant, string> = {
    // Primary: Investigate, Analyze, Enter Observatory
    primary:
      'bg-[#10161D] text-[#5BD8F5] border border-[#5BD8F5]/60 hover:bg-[#15202B] hover:border-[#5BD8F5] active:bg-[#0B0F14]',
    // Secondary: View Details, Load Observation
    secondary:
      'bg-[#10161D] text-[#E6EDF2] border border-[#172230] hover:border-[#243345] hover:bg-[#151D26] active:bg-[#0B0F14]',
    // Tertiary: Back, Cancel
    tertiary:
      'bg-transparent text-[#7F8B95] border border-[#172230] hover:text-[#E6EDF2] hover:border-[#243345] hover:bg-[#10161D]/50 active:bg-[#0B0F14]',
    outline:
      'bg-transparent text-[#7F8B95] border border-[#172230] hover:text-[#E6EDF2] hover:border-[#243345] hover:bg-[#10161D]/50 active:bg-[#0B0F14]',
    ghost:
      'bg-transparent text-[#7F8B95] border border-transparent hover:text-[#E6EDF2] hover:bg-[#10161D]/60 active:bg-[#0B0F14]',
    danger:
      'bg-[#10161D] text-[#D95C5C] border border-[#D95C5C]/40 hover:border-[#D95C5C] hover:bg-[#1C1111] active:bg-[#0B0F14]',
  };

  const isDisabled = disabled || state === 'loading';

  return (
    <button
      className={cn(
        'group relative inline-flex items-center justify-center rounded-[4px] font-sans font-medium text-xs tracking-normal transition-colors duration-150 select-none outline-none cursor-pointer',
        'focus-visible:ring-1 focus-visible:ring-[#5BD8F5] focus-visible:ring-offset-1 focus-visible:ring-offset-[#06080B]',
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
        <span className="inline-flex items-center gap-1.5 text-[#5BD8F5]">
          <span>{loadingText || children || 'Loading...'}</span>
          <span className="inline-block animate-spin font-sans text-xs">◌</span>
        </span>
      )}

      {/* State: Success */}
      {state === 'success' && (
        <span className="inline-flex items-center gap-1.5 text-[#5BD8F5]">
          <span>{successText || 'Complete'}</span>
          <Check className="h-3.5 w-3.5" />
        </span>
      )}

      {/* State: Error */}
      {state === 'error' && (
        <span className="inline-flex items-center gap-1.5 text-[#D95C5C]">
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
              <span className="text-[10px] text-[#7F8B95] font-mono font-normal tracking-tight -mt-0.5">
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
