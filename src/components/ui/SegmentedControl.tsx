import { cn } from '@/lib/utils.ts';

export interface SegmentOption<T extends string = string> {
  value: T;
  label: string;
  badge?: string | number;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
  disabled?: boolean;
}

export function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  size = 'sm',
  className,
  disabled,
}: SegmentedControlProps<T>) {
  const sizeStyles = {
    xs: 'h-6 text-[10px] p-0.5',
    sm: 'h-7 text-xs p-0.5',
    md: 'h-8 text-xs p-1',
  };

  const itemPadding = {
    xs: 'px-2 py-0.5',
    sm: 'px-2.5 py-1',
    md: 'px-3 py-1',
  };

  return (
    <div
      className={cn(
        'inline-flex items-center rounded-[2px] border border-slate-800 bg-[#040814] font-mono select-none',
        sizeStyles[size],
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
      role="radiogroup"
    >
      {options.map((opt) => {
        const isSelected = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            disabled={disabled}
            onClick={() => onChange(opt.value)}
            className={cn(
              'relative inline-flex items-center gap-1.5 rounded-[1px] tracking-wider uppercase transition-colors cursor-pointer',
              'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan-400',
              itemPadding[size],
              isSelected
                ? 'bg-slate-900 text-cyan-300 border border-slate-700/80 shadow-[0_0_8px_rgba(6,182,212,0.12)] font-semibold'
                : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-900/40'
            )}
          >
            <span>{opt.label}</span>
            {opt.badge !== undefined && (
              <span
                className={cn(
                  'text-[9px] px-1 py-0.2 rounded-[1px] border font-mono',
                  isSelected
                    ? 'border-cyan-800/80 bg-cyan-950/70 text-cyan-400'
                    : 'border-slate-800 bg-slate-950/80 text-slate-500'
                )}
              >
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
