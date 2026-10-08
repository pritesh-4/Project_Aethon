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
      led: 'bg-[#529E72]',
      text: 'text-[#E6E4DD]',
      defaultLabel: 'Online',
    },
    nominal: {
      led: 'bg-[#529E72]',
      text: 'text-[#E6E4DD]',
      defaultLabel: 'Nominal',
    },
    active: {
      led: 'bg-[#D4864A]',
      text: 'text-[#D4864A]',
      defaultLabel: 'Active',
    },
    warning: {
      led: 'bg-[#D4864A]',
      text: 'text-[#D4864A]',
      defaultLabel: 'Attention',
    },
    critical: {
      led: 'bg-[#C84A4A]',
      text: 'text-[#C84A4A]',
      defaultLabel: 'Anomaly detected',
    },
    calibrating: {
      led: 'bg-[#D4864A]',
      text: 'text-[#D4864A]',
      defaultLabel: 'Calibrating',
    },
    standby: {
      led: 'bg-[#6B706A]',
      text: 'text-[#9A9C96]',
      defaultLabel: 'Standby',
    },
  };

  const current = statusStyles[status] || statusStyles.online;
  const displayLabel = label || current.defaultLabel;

  return (
    <div className={cn('inline-flex items-center gap-2 font-sans text-xs select-none', className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', current.led)} />
      <span className={cn('font-medium', current.text)}>{displayLabel}</span>
      {subtext && <span className="text-[#9A9C96] text-xs font-mono">{subtext}</span>}
    </div>
  );
}
