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
          'focus-visible:ring-1 focus-visible:ring-[#5BD8F5] focus-visible:ring-offset-1 focus-visible:ring-offset-[#06080B]',
          isCollapsed
            ? 'h-9 w-9 mx-auto justify-center rounded-[4px]'
            : 'h-9 w-full px-3 gap-3 rounded-[4px] text-xs',
          isActive
            ? 'bg-[#10161D] text-[#E6EDF2] font-medium'
            : 'text-[#7F8B95] hover:text-[#E6EDF2] hover:bg-[#10161D]/50'
        )
      }
    >
      {({ isActive }) => (
        <>
          {/* Active State: One thin cyan indicator */}
          {isActive && (
            <motion.span
              layoutId="activeNavIndicator"
              className="absolute left-0 top-1.5 bottom-1.5 w-[2px] bg-[#5BD8F5]"
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

          {/* Label when expanded */}
          {!isCollapsed && <span className="truncate tracking-wide text-xs">{label}</span>}
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
