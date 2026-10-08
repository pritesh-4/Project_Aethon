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
      dot: 'bg-[#9A9C96]',
      text: 'text-[#E6E4DD]',
      defaultLabel: 'Online',
    },
    ready: {
      dot: 'bg-[#529E72]',
      text: 'text-[#529E72]',
      defaultLabel: 'Ready',
    },
    analyzing: {
      dot: 'bg-[#D4864A]',
      text: 'text-[#D4864A]',
      defaultLabel: 'Analyzing',
    },
    offline: {
      dot: 'bg-[#666963]',
      text: 'text-[#9A9C96]',
      defaultLabel: 'Offline',
    },
  };

  const current = statusConfig[status] || statusConfig.online;
  const displayLabel = label || current.defaultLabel;

  return (
    <div className={cn('select-none font-sans', className)}>
      {showCategory && (
        <span className="block text-[10px] text-[#9A9C96] font-sans mb-0.5">System status</span>
      )}
      <div className="flex items-center gap-2 text-xs font-medium">
        <span className={cn('inline-block h-1.5 w-1.5 rounded-full shrink-0', current.dot)} />
        <span className={current.text}>{displayLabel}</span>
      </div>
    </div>
  );
}
