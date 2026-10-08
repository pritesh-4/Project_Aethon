import { type ElementType } from 'react';
import { NavLink } from 'react-router';
import { motion } from 'motion/react';
import { Tooltip } from '@/components/ui/Tooltip.tsx';
import { cn } from '@/lib/utils.ts';

export interface SidebarItemProps {
  id: string;
  label: string;
  path: string;
  icon: ElementType;
  isCollapsed?: boolean;
  onClick?: () => void;
}

export function SidebarItem({
  label,
  path,
  icon: Icon,
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
          'focus-visible:ring-1 focus-visible:ring-[#D4864A] focus-visible:ring-offset-1 focus-visible:ring-offset-[#0F1110]',
          isCollapsed
            ? 'h-8.5 w-8.5 mx-auto justify-center rounded-[2px]'
            : 'h-8.5 w-full px-3 gap-3 rounded-[2px] text-xs',
          isActive
            ? 'bg-[#1A1E1B] text-[#E6E4DD] font-medium'
            : 'text-[#9A9C96] hover:text-[#E6E4DD] hover:bg-[#141715]'
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Active State: Quiet 2px warm copper left rule */}
          {isActive && (
            <motion.span
              layoutId="activeNavIndicator"
              className="absolute left-0 top-1 bottom-1 w-[2px] bg-[#D4864A]"
              transition={{ duration: 0.15, ease: 'easeOut' }}
            />
          )}

          {/* Icon */}
          <span className="relative shrink-0">
            <Icon
              className={cn(
                'h-3.5 w-3.5 transition-colors duration-150',
                isActive ? 'text-[#D4864A]' : 'text-[#9A9C96] group-hover:text-[#E6E4DD]'
              )}
            />
          </span>

          {/* Humanist mixed-case label */}
          {!isCollapsed && (
            <span className="truncate text-xs font-normal tracking-normal">{label}</span>
          )}
        </>
      )}
    </NavLink>
  );

  if (isCollapsed) {
    return (
      <Tooltip content={label} side="right">
        {content}
      </Tooltip>
    );
  }

  return content;
}
