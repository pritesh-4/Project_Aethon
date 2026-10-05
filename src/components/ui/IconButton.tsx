import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Tooltip } from './Tooltip.tsx';
import { cn } from '@/lib/utils.ts';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'active' | 'outline' | 'ghost' | 'danger';
  label?: string;
  tooltip?: string;
  tooltipPosition?: 'top' | 'right' | 'bottom' | 'left';
}

export function IconButton({
  icon,
  size = 'md',
  variant = 'default',
  label,
  tooltip,
  tooltipPosition = 'top',
  className,
  disabled,
  ...props
}: IconButtonProps) {
  const sizeStyles = {
    xs: 'h-6 w-6 text-[10px]',
    sm: 'h-7 w-7 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-9 w-9 text-base',
  };

  const variantStyles = {
    default:
      'bg-[#0A0E13] text-[#84929C] border border-slate-800 hover:border-slate-700 hover:bg-[#10161D] hover:text-[#EAF4F7]',
    active:
      'bg-[#10161D] text-[#66E3FF] border border-[#66E3FF]/70 hover:border-[#66E3FF] hover:bg-[#10161D]',
    outline:
      'bg-transparent text-[#84929C] border border-slate-800 hover:border-slate-700 hover:text-[#EAF4F7]',
    ghost:
      'bg-transparent text-[#84929C] border border-transparent hover:border-slate-800 hover:bg-[#10161D]/50 hover:text-[#EAF4F7]',
    danger:
      'bg-[#0A0E13] text-[#FF5E5E] border border-[#FF5E5E]/60 hover:border-[#FF5E5E] hover:bg-rose-950/30',
  };

  const tooltipText = tooltip || label;

  const button = (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex items-center justify-center rounded-[4px] transition-all duration-150 select-none outline-none',
        'focus-visible:ring-1 focus-visible:ring-[#66E3FF] focus-visible:ring-offset-1 focus-visible:ring-offset-[#05070A]',
        'active:translate-y-[1px] disabled:opacity-40 disabled:pointer-events-none cursor-pointer',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
      disabled={disabled}
      {...props}
    >
      {icon}
    </button>
  );

  if (tooltipText) {
    return (
      <Tooltip content={tooltipText} position={tooltipPosition}>
        {button}
      </Tooltip>
    );
  }

  return button;
}
