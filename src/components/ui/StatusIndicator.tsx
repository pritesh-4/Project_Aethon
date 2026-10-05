import { cn } from '@/lib/utils.ts';

export type SystemStatus =
  'online' | 'nominal' | 'active' | 'warning' | 'critical' | 'calibrating' | 'standby';

export interface StatusIndicatorProps {
  status?: SystemStatus;
  label?: string;
  subtext?: string;
  pulse?: boolean;
  className?: string;
}

export function StatusIndicator({
  status = 'online',
  label,
  subtext,
  pulse = true,
  className,
}: StatusIndicatorProps) {
  const statusStyles: Record<SystemStatus, { led: string; text: string; defaultLabel: string }> = {
    online: {
      led: 'bg-emerald-400',
      text: 'text-emerald-400',
      defaultLabel: 'SYSTEM // ONLINE',
    },
    nominal: {
      led: 'bg-emerald-400',
      text: 'text-emerald-400',
      defaultLabel: 'NOMINAL',
    },
    active: {
      led: 'bg-[#66E3FF]',
      text: 'text-[#66E3FF]',
      defaultLabel: 'ACQUIRING',
    },
    warning: {
      led: 'bg-[#FFB84D]',
      text: 'text-[#FFB84D]',
      defaultLabel: 'ATTENTION',
    },
    critical: {
      led: 'bg-[#FF5E5E]',
      text: 'text-[#FF5E5E]',
      defaultLabel: 'ANOMALY DETECTED',
    },
    calibrating: {
      led: 'bg-[#66E3FF]',
      text: 'text-[#66E3FF]',
      defaultLabel: 'CALIBRATING',
    },
    standby: {
      led: 'bg-[#84929C]',
      text: 'text-[#84929C]',
      defaultLabel: 'STANDBY',
    },
  };

  const current = statusStyles[status] || statusStyles.online;
  const displayLabel = label || current.defaultLabel;

  return (
    <div
      className={cn('inline-flex items-center gap-2 font-mono text-[11px] select-none', className)}
    >
      <span className="relative flex h-2 w-2 items-center justify-center">
        {pulse && (status === 'online' || status === 'active' || status === 'critical') && (
          <span
            className={cn(
              'absolute inline-flex h-full w-full rounded-none opacity-60 animate-ping',
              current.led
            )}
          />
        )}
        <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-none', current.led)} />
      </span>

      <span className={cn('tracking-wider font-semibold uppercase', current.text)}>
        {displayLabel}
      </span>

      {subtext && <span className="text-[#84929C] text-[10px]">[{subtext}]</span>}
    </div>
  );
}
