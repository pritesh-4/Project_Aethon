import type { ReactNode } from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  actions?: ReactNode;
  category?: string;
}

export function PageHeader({ title, subtitle, badge, actions, category }: PageHeaderProps) {
  return (
    <div className="mb-6 border-b border-[#172230] pb-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {(category || badge) && (
            <div className="flex items-center gap-2 mb-1.5">
              {category && (
                <span className="font-sans text-xs font-medium text-[#7F8B95]">{category}</span>
              )}
              {badge}
            </div>
          )}
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#E6EDF2] font-sans">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-[#7F8B95] font-sans max-w-3xl leading-relaxed">
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
