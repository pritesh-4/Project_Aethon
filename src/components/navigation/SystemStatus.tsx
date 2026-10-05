import { cn } from '@/lib/utils.ts';

export type SystemStatusCode = 'online' | 'ready' | 'analyzing' | 'offline';

export interface SystemStatusProps {
  status?: SystemStatusCode;
  label?: string;
  className?: string;
  showCategory?: boolean;
}

export function SystemStatus({
  status = 'online',
  label,
  className,
  showCategory = true,
}: SystemStatusProps) {
  const statusConfig: Record<
    SystemStatusCode,
    { dot: string; text: string; defaultLabel: string }
  > = {
    online: {
      dot: 'bg-[#7F8B95]',
      text: 'text-[#E6EDF2]',
      defaultLabel: 'Online',
    },
    ready: {
      dot: 'bg-[#5BD8F5]',
      text: 'text-[#5BD8F5]',
      defaultLabel: 'Ready',
    },
    analyzing: {
      dot: 'bg-[#E8AE50]',
      text: 'text-[#E8AE50]',
      defaultLabel: 'Analyzing',
    },
    offline: {
      dot: 'bg-[#7F8B95]/50',
      text: 'text-[#7F8B95]',
      defaultLabel: 'Offline',
    },
  };

  const current = statusConfig[status] || statusConfig.online;
  const displayLabel = label || current.defaultLabel;

  return (
    <div className={cn('select-none font-sans', className)}>
      {showCategory && (
        <span className="block text-[10px] text-[#7F8B95] font-sans mb-0.5">System status</span>
      )}
      <div className="flex items-center gap-2 text-xs font-medium">
        <span className={cn('inline-block h-1.5 w-1.5 rounded-full shrink-0', current.dot)} />
        <span className={current.text}>{displayLabel}</span>
      </div>
    </div>
  );
}
