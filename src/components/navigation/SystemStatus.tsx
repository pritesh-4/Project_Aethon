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
    { dot: string; text: string; defaultLabel: string; pulse?: boolean }
  > = {
    online: {
      dot: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]',
      text: 'text-emerald-400',
      defaultLabel: 'ONLINE',
      pulse: true,
    },
    ready: {
      dot: 'bg-[#66E3FF] shadow-[0_0_8px_rgba(102,227,255,0.6)]',
      text: 'text-[#66E3FF]',
      defaultLabel: 'READY',
      pulse: false,
    },
    analyzing: {
      dot: 'bg-[#FFB84D] shadow-[0_0_8px_rgba(255,184,77,0.6)]',
      text: 'text-[#FFB84D]',
      defaultLabel: 'ANALYZING',
      pulse: true,
    },
    offline: {
      dot: 'bg-[#84929C]',
      text: 'text-[#84929C]',
      defaultLabel: 'OFFLINE',
      pulse: false,
    },
  };

  const current = statusConfig[status] || statusConfig.online;
  const displayLabel = label || current.defaultLabel;

  return (
    <div className={cn('font-mono select-none', className)}>
      {showCategory && (
        <span className="block text-[9px] font-medium tracking-[0.2em] text-[#84929C] uppercase mb-0.5">
          SYSTEM STATUS
        </span>
      )}
      <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase">
        <span className="relative flex h-1.5 w-1.5 items-center justify-center">
          {current.pulse && (
            <span
              className={cn(
                'absolute inline-flex h-full w-full rounded-none opacity-70 animate-ping',
                current.dot
              )}
            />
          )}
          <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-none', current.dot)} />
        </span>
        <span className={current.text}>{displayLabel}</span>
      </div>
    </div>
  );
}
