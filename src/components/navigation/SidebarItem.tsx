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
          'focus-visible:ring-1 focus-visible:ring-[#376A9B] focus-visible:ring-offset-1 focus-visible:ring-offset-[#EAE7E0]',
          isCollapsed
            ? 'h-8.5 w-8.5 mx-auto justify-center rounded-[3px]'
            : 'h-8.5 w-full px-3 gap-3 rounded-[3px] text-xs',
          isActive
            ? 'bg-[#FAF8F5] text-[#17202A] font-medium shadow-2xs'
            : 'text-[#56616A] hover:text-[#17202A] hover:bg-[#E2DFD7]'
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Active State: Restrained 2px Observatory Blue left rule */}
          {isActive && (
            <motion.span
              layoutId="activeNavIndicator"
              className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-[#376A9B]"
              transition={{ duration: 0.15, ease: 'easeOut' }}
            />
          )}

          {/* Icon */}
          <span className="relative shrink-0">
            <Icon
              className={cn(
                'h-3.5 w-3.5 transition-colors duration-150',
                isActive ? 'text-[#376A9B]' : 'text-[#7E8B96] group-hover:text-[#17202A]'
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
