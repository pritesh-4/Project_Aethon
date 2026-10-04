import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  category?: string;
}

export function PageHeader({
  title,
  subtitle,
  badge,
  actions,
  category = 'OBSERVATORY MODULE',
}: PageHeaderProps) {
  return (
    <div className="mb-8 border-b border-slate-800/60 pb-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[11px] tracking-wider text-cyan-400 uppercase">
              {category}
            </span>
            {badge}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-100 font-sans">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-400 font-sans max-w-3xl leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {actions && (
          <div className="flex items-center gap-3 self-start md:self-center">{actions}</div>
        )}
      </div>
    </div>
  );
}
