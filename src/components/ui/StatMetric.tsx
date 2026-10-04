import type { ReactNode } from 'react';
import { cn } from '@/lib/utils.ts';

export interface StatMetricProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  status?: 'nominal' | 'active' | 'warning' | 'alert';
  className?: string;
}

export function StatMetric({
  label,
  value,
  unit,
  subtext,
  icon,
  status = 'nominal',
  className,
}: StatMetricProps) {
  const statusAccent = {
    nominal: 'border-slate-800/80 hover:border-slate-700',
    active: 'border-cyan-900/60 hover:border-cyan-600/80 bg-cyan-950/10',
    warning: 'border-amber-900/60 hover:border-amber-600/80 bg-amber-950/10',
    alert: 'border-rose-900/60 hover:border-rose-600/80 bg-rose-950/10',
  };

  const valueColor = {
    nominal: 'text-slate-100',
    active: 'text-cyan-400',
    warning: 'text-amber-400',
    alert: 'text-rose-400',
  };

  return (
    <div
      className={cn(
        'rounded-lg border bg-slate-950/60 p-3.5 backdrop-blur-sm transition-all',
        statusAccent[status],
        className
      )}
    >
      <div className="flex items-center justify-between text-xs font-mono uppercase tracking-wider text-slate-400">
        <span>{label}</span>
        {icon && <span className="text-slate-500">{icon}</span>}
      </div>

      <div className="mt-2 flex items-baseline gap-1.5 font-mono">
        <span className={cn('text-2xl font-bold tracking-tight', valueColor[status])}>{value}</span>
        {unit && <span className="text-xs font-normal text-slate-400">{unit}</span>}
      </div>

      {subtext && <div className="mt-1 text-xs text-slate-500 truncate font-mono">{subtext}</div>}
    </div>
  );
}
