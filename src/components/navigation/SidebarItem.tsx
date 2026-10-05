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
          'group relative flex items-center transition-colors duration-150 select-none font-sans outline-none',
          'focus-visible:ring-1 focus-visible:ring-[#5BD8F5] focus-visible:ring-offset-1 focus-visible:ring-offset-[#06080B]',
          isCollapsed
            ? 'h-9 w-9 mx-auto justify-center rounded-[4px]'
            : 'h-9 w-full px-2.5 gap-2.5 rounded-[4px] text-xs',
          isActive
            ? 'bg-[#10161D] text-[#E6EDF2] font-medium'
            : 'text-[#7F8B95] hover:text-[#E6EDF2] hover:bg-[#10161D]/60'
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Active Left Indicator Bar */}
          {isActive && (
            <motion.span
              layoutId="activeNavIndicator"
              className={cn(
                'absolute bg-[#5BD8F5]',
                isCollapsed
                  ? 'left-0 top-1.5 bottom-1.5 w-[2px]'
                  : 'left-0 top-1.5 bottom-1.5 w-[2px]'
              )}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            />
          )}

          {/* Icon */}
          <span className="relative shrink-0">
            <Icon
              className={cn(
                'h-4 w-4 transition-colors duration-150',
                isActive ? 'text-[#5BD8F5]' : 'text-[#7F8B95] group-hover:text-[#E6EDF2]'
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
                      'text-[10px] font-mono transition-colors',
                      isActive ? 'text-[#5BD8F5]' : 'text-[#7F8B95]/60 group-hover:text-[#7F8B95]'
                    )}
                  >
                    {index}
                  </span>
                )}
                <span className="truncate text-xs tracking-normal">{label}</span>
              </div>

              {badge && (
                <span className="ml-2 shrink-0 rounded-[3px] border border-[#172230] bg-[#10161D] px-1.5 py-0.2 text-[10px] font-mono text-[#7F8B95] group-hover:text-[#E6EDF2] transition-colors">
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
