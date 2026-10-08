import type { ReactNode } from 'react';
import { cn } from '@/lib/utils.ts';

/**
 * DataRule: Thin structural divider between scientific workspaces and information groups.
 */
export function DataRule({ className }: { className?: string }) {
  return <hr className={cn('border-t border-[#D6D2C9] my-4', className)} />;
}

/**
 * Measurement: Quiet, high-precision metric block.
 * Uses humanist label with strict tabular monospace data.
 */
interface MeasurementProps {
  label: string;
  value: string | number;
  unit?: string;
  subtext?: string;
  accent?: boolean;
  className?: string;
}

export function Measurement({
  label,
  value,
  unit,
  subtext,
  accent = false,
  className,
}: MeasurementProps) {
  return (
    <div className={cn('space-y-0.5', className)}>
      <span className="block text-xs font-sans text-[#56616A]">{label}</span>
      <div className="flex items-baseline gap-1.5 font-mono">
        <span
          className={cn(
            'text-lg sm:text-xl font-semibold tracking-tight',
            accent ? 'text-[#C19348]' : 'text-[#17202A]'
          )}
        >
          {value}
        </span>
        {unit && <span className="text-xs text-[#56616A] font-normal">{unit}</span>}
      </div>
      {subtext && <p className="text-[11px] font-sans text-[#7E8B96] leading-tight">{subtext}</p>}
    </div>
  );
}

/**
 * StatusMarker: Strict semantic status indication.
 * Communicates state through color AND text.
 */
export type ScientificStatus = 'nominal' | 'attention' | 'error' | 'unreviewed';

interface StatusMarkerProps {
  status: ScientificStatus;
  label?: string;
  className?: string;
}

export function StatusMarker({ status, label, className }: StatusMarkerProps) {
  const configs: Record<ScientificStatus, { dot: string; text: string; defaultLabel: string }> = {
    nominal: {
      dot: 'bg-[#3D7D54]',
      text: 'text-[#17202A]',
      defaultLabel: 'Nominal',
    },
    attention: {
      dot: 'bg-[#C19348]',
      text: 'text-[#C19348]',
      defaultLabel: 'Flagged / Review',
    },
    error: {
      dot: 'bg-[#B64B4B]',
      text: 'text-[#B64B4B]',
      defaultLabel: 'Failed / Rejected',
    },
    unreviewed: {
      dot: 'bg-[#7E8B96]',
      text: 'text-[#56616A]',
      defaultLabel: 'Unreviewed',
    },
  };

  const current = configs[status];
  const displayLabel = label || current.defaultLabel;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-sans font-medium select-none',
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', current.dot)} />
      <span className={current.text}>{displayLabel}</span>
    </span>
  );
}

/**
 * Annotation: Editorial / field notebook notation explaining an observation or anomaly.
 */
export function Annotation({
  children,
  lead,
  className,
}: {
  children: ReactNode;
  lead?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'border-l-2 border-[#C19348] pl-3 py-0.5 text-xs text-[#56616A] leading-relaxed font-sans',
        className
      )}
    >
      {lead && <strong className="text-[#17202A] font-medium block mb-0.5">{lead}</strong>}
      {children}
    </div>
  );
}

/**
 * ScientificSection: Generous workspace section with header and negative space.
 */
interface ScientificSectionProps {
  title: string;
  annotation?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function ScientificSection({
  title,
  annotation,
  action,
  children,
  className,
}: ScientificSectionProps) {
  return (
    <section className={cn('space-y-3 font-sans', className)}>
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-[#D6D2C9] pb-2">
        <div>
          <h2 className="text-sm font-semibold tracking-tight text-[#17202A]">{title}</h2>
          {annotation && <p className="text-xs text-[#56616A] mt-0.5">{annotation}</p>}
        </div>
        {action && <div>{action}</div>}
      </div>
      <div>{children}</div>
    </section>
  );
}
