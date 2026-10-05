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
      led: 'bg-[#7F8B95]',
      text: 'text-[#E6EDF2]',
      defaultLabel: 'Online',
    },
    nominal: {
      led: 'bg-[#7F8B95]',
      text: 'text-[#E6EDF2]',
      defaultLabel: 'Nominal',
    },
    active: {
      led: 'bg-[#5BD8F5]',
      text: 'text-[#5BD8F5]',
      defaultLabel: 'Active',
    },
    warning: {
      led: 'bg-[#E8AE50]',
      text: 'text-[#E8AE50]',
      defaultLabel: 'Attention',
    },
    critical: {
      led: 'bg-[#D95C5C]',
      text: 'text-[#D95C5C]',
      defaultLabel: 'Anomaly detected',
    },
    calibrating: {
      led: 'bg-[#5BD8F5]',
      text: 'text-[#5BD8F5]',
      defaultLabel: 'Calibrating',
    },
    standby: {
      led: 'bg-[#7F8B95]/50',
      text: 'text-[#7F8B95]',
      defaultLabel: 'Standby',
    },
  };

  const current = statusStyles[status] || statusStyles.online;
  const displayLabel = label || current.defaultLabel;

  return (
    <div className={cn('inline-flex items-center gap-2 font-sans text-xs select-none', className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', current.led)} />
      <span className={cn('font-medium', current.text)}>{displayLabel}</span>
      {subtext && <span className="text-[#7F8B95] text-xs font-mono">{subtext}</span>}
    </div>
  );
}
