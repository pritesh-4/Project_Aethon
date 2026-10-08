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
    sm: 'h-6.5 w-6.5 text-xs',
    md: 'h-7.5 w-7.5 text-xs',
    lg: 'h-8.5 w-8.5 text-sm',
  };

  const variantStyles: Record<IconButtonVariant, string> = {
    primary:
      'bg-[#376A9B] text-white border border-[#2E5983] hover:bg-[#2F5E8C] active:bg-[#254C72]',
    secondary:
      'bg-[#FAF8F5] text-[#56616A] border border-[#D6D2C9] hover:text-[#17202A] hover:border-[#BCB6A8] hover:bg-[#EAE7E0] active:bg-[#E2DFD7]',
    tertiary:
      'bg-transparent text-[#56616A] border border-[#D6D2C9] hover:text-[#17202A] hover:border-[#BCB6A8] hover:bg-[#EAE7E0] active:bg-[#E2DFD7]',
    ghost:
      'bg-transparent text-[#56616A] border border-transparent hover:text-[#17202A] hover:bg-[#EAE7E0] active:bg-[#E2DFD7]',
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center justify-center rounded-[3px] transition-colors duration-150 select-none outline-none cursor-pointer',
        'focus-visible:ring-1 focus-visible:ring-[#376A9B] focus-visible:ring-offset-1 focus-visible:ring-offset-[#F4F1EA]',
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
