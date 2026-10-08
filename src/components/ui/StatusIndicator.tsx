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
  className,
}: StatusIndicatorProps) {
  const statusStyles: Record<SystemStatus, { led: string; text: string; defaultLabel: string }> = {
    online: {
      led: 'bg-[#3D7D54]',
      text: 'text-[#17202A]',
      defaultLabel: 'Online',
    },
    nominal: {
      led: 'bg-[#3D7D54]',
      text: 'text-[#17202A]',
      defaultLabel: 'Nominal',
    },
    active: {
      led: 'bg-[#376A9B]',
      text: 'text-[#376A9B]',
      defaultLabel: 'Active',
    },
    warning: {
      led: 'bg-[#C19348]',
      text: 'text-[#9E6E20]',
      defaultLabel: 'Attention',
    },
    critical: {
      led: 'bg-[#B64B4B]',
      text: 'text-[#B64B4B]',
      defaultLabel: 'Anomaly detected',
    },
    calibrating: {
      led: 'bg-[#376A9B]',
      text: 'text-[#376A9B]',
      defaultLabel: 'Calibrating',
    },
    standby: {
      led: 'bg-[#76828D]',
      text: 'text-[#56616A]',
      defaultLabel: 'Standby',
    },
  };

  const current = statusStyles[status] || statusStyles.online;
  const displayLabel = label || current.defaultLabel;

  return (
    <div className={cn('inline-flex items-center gap-2 font-sans text-xs select-none', className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', current.led)} />
      <span className={cn('font-semibold', current.text)}>{displayLabel}</span>
      {subtext && <span className="text-[#56616A] text-xs font-mono">{subtext}</span>}
    </div>
  );
}
