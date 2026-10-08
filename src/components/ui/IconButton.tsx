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
      'bg-[#141715] text-[#D4864A] border border-[#D4864A]/70 hover:bg-[#1A1E1B] hover:text-[#E0955B] active:bg-[#0F1110]',
    secondary:
      'bg-[#141715] text-[#9A9C96] border border-[#262C28] hover:text-[#E6E4DD] hover:border-[#313733] hover:bg-[#1A1E1B] active:bg-[#0F1110]',
    tertiary:
      'bg-transparent text-[#9A9C96] border border-[#262C28] hover:text-[#E6E4DD] hover:border-[#313733] hover:bg-[#141715] active:bg-[#0F1110]',
    ghost:
      'bg-transparent text-[#9A9C96] border border-transparent hover:text-[#E6E4DD] hover:bg-[#141715] active:bg-[#0F1110]',
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex items-center justify-center rounded-[2px] transition-colors duration-150 select-none outline-none cursor-pointer',
        'focus-visible:ring-1 focus-visible:ring-[#D4864A] focus-visible:ring-offset-1 focus-visible:ring-offset-[#0F1110]',
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
