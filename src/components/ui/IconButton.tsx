import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/utils.ts';

export type IconButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'ghost';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  'aria-label': string;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
}

export function IconButton({
  icon,
  'aria-label': ariaLabel,
  variant = 'secondary',
  size = 'md',
  className,
  disabled,
  ...props
}: IconButtonProps) {
  const sizeStyles = {
    sm: 'h-7 w-7 text-xs',
    md: 'h-8 w-8 text-xs',
    lg: 'h-9 w-9 text-sm',
  };

  const variantStyles: Record<IconButtonVariant, string> = {
    primary:
      'bg-[#10161D] text-[#5BD8F5] border border-[#5BD8F5]/60 hover:bg-[#15202B] hover:border-[#5BD8F5] active:bg-[#0B0F14]',
    secondary:
      'bg-[#10161D] text-[#7F8B95] border border-[#172230] hover:text-[#E6EDF2] hover:border-[#243345] hover:bg-[#151D26] active:bg-[#0B0F14]',
    tertiary:
      'bg-transparent text-[#7F8B95] border border-[#172230] hover:text-[#E6EDF2] hover:border-[#243345] hover:bg-[#10161D]/50 active:bg-[#0B0F14]',
    ghost:
      'bg-transparent text-[#7F8B95] border border-transparent hover:text-[#E6EDF2] hover:bg-[#10161D]/60 active:bg-[#0B0F14]',
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center justify-center rounded-[4px] transition-colors duration-150 select-none outline-none cursor-pointer',
        'focus-visible:ring-1 focus-visible:ring-[#5BD8F5] focus-visible:ring-offset-1 focus-visible:ring-offset-[#06080B]',
        'disabled:opacity-40 disabled:pointer-events-none',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      disabled={disabled}
      {...props}
    >
      <span className="shrink-0">{icon}</span>
    </button>
  );
}
