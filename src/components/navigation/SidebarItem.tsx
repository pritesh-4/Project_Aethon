import { type ElementType } from 'react';
import { NavLink } from 'react-router';
import { motion } from 'motion/react';
import { Tooltip } from '@/components/ui/Tooltip.tsx';
import { cn } from '@/lib/utils.ts';

export interface SidebarItemProps {
  id: string;
  index?: string; // e.g. "01", "02"
  label: string;
  path: string;
  icon: ElementType;
  badge?: string;
  isCollapsed?: boolean;
  onClick?: () => void;
}

export function SidebarItem({
  index,
  label,
  path,
  icon: Icon,
  badge,
  isCollapsed = false,
  onClick,
}: SidebarItemProps) {
  const content = (
    <NavLink
      to={path}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center transition-colors duration-200 select-none font-mono outline-none',
          'focus-visible:ring-1 focus-visible:ring-[#66E3FF] focus-visible:ring-offset-1 focus-visible:ring-offset-[#05070A]',
          isCollapsed
            ? 'h-10 w-10 mx-auto justify-center rounded-[2px]'
            : 'h-9 w-full px-3 gap-2.5 rounded-[2px] text-xs',
          isActive
            ? 'bg-[#10161D] text-[#EAF4F7] font-semibold'
            : 'text-[#84929C] hover:text-[#EAF4F7] hover:bg-[#10161D]/50'
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Active Left Indicator Bar (Live System Channel) */}
          {isActive && (
            <motion.span
              layoutId="activeNavIndicator"
              className={cn(
                'absolute bg-[#66E3FF] shadow-[0_0_8px_rgba(102,227,255,0.7)]',
                isCollapsed ? 'left-0 top-1.5 bottom-1.5 w-[2px]' : 'left-0 top-1 bottom-1 w-[2px]'
              )}
              transition={{ duration: 0.18, ease: 'easeOut' }}
            />
          )}

          {/* Icon with 1-2px subtle shift on hover */}
          <span className="relative shrink-0 transition-transform duration-200 group-hover:translate-x-[2px]">
            <Icon
              className={cn(
                'h-4 w-4 transition-colors duration-200',
                isActive ? 'text-[#66E3FF]' : 'text-[#84929C] group-hover:text-[#EAF4F7]'
              )}
            />
          </span>

          {/* Full labels when expanded */}
          {!isCollapsed && (
            <div className="flex flex-1 items-center justify-between min-w-0">
              <div className="flex items-center gap-2 truncate">
                {index && (
                  <span
                    className={cn(
                      'text-[10px] tracking-wider transition-colors',
                      isActive ? 'text-[#66E3FF]' : 'text-slate-600 group-hover:text-slate-400'
                    )}
                  >
                    {index}
                  </span>
                )}
                <span className="truncate tracking-wider text-[11px] uppercase">{label}</span>
              </div>

              {badge && (
                <span className="ml-2 shrink-0 rounded-[1px] border border-slate-800 bg-[#0A0E13] px-1 py-0.2 text-[9px] font-mono text-[#84929C] group-hover:text-[#EAF4F7] transition-colors">
                  {badge}
                </span>
              )}
            </div>
          )}
        </>
      )}
    </NavLink>
  );

  if (isCollapsed) {
    return (
      <Tooltip content={label} position="right">
        {content}
      </Tooltip>
    );
  }

  return content;
}
