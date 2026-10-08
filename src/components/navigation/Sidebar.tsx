import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SidebarItem } from './SidebarItem.tsx';
import { cn } from '@/lib/utils.ts';
import { MAIN_NAV, SECONDARY_NAV } from '@/app/navigation.ts';

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

export function Sidebar({ isCollapsed, onToggleCollapse, className }: SidebarProps) {
  return (
    <motion.aside
      animate={{ width: isCollapsed ? 52 : 200 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'hidden lg:flex flex-col h-screen sticky top-0 shrink-0 border-r border-[#262C28] bg-[#131614] select-none font-sans z-30',
        className
      )}
    >
      {/* 1. Header: Wordmark & Collapse Toggle */}
      <div className="h-12 border-b border-[#262C28] px-3.5 flex items-center justify-between overflow-hidden">
        {!isCollapsed ? (
          <>
            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-wider text-[#E6E4DD] font-mono">
                AETHON
              </span>
              <span className="text-[10px] text-[#9A9C96] tracking-tight">Signal observatory</span>
            </div>
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Collapse sidebar rail"
              aria-label="Collapse sidebar rail"
              className="h-6 w-6 flex items-center justify-center rounded-[2px] text-[#9A9C96] hover:text-[#E6E4DD] hover:bg-[#1A1E1B] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A]"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <div className="w-full flex items-center justify-center">
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Expand sidebar rail"
              aria-label="Expand sidebar rail"
              className="h-7 w-7 flex items-center justify-center rounded-[2px] text-[#9A9C96] hover:text-[#E6E4DD] hover:bg-[#1A1E1B] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A]"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 2. Quiet Observatory Navigation Rail */}
      <nav aria-label="Main navigation" className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        {MAIN_NAV.map((item) => (
          <SidebarItem
            key={item.id}
            id={item.id}
            label={item.label}
            path={item.path}
            icon={item.icon}
            isCollapsed={isCollapsed}
          />
        ))}

        <div className="pt-2 my-2 border-t border-[#262C28]" />

        {SECONDARY_NAV.map((item) => (
          <SidebarItem
            key={item.id}
            id={item.id}
            label={item.label}
            path={item.path}
            icon={item.icon}
            isCollapsed={isCollapsed}
          />
        ))}
      </nav>

      {/* 3. Quiet Scientific Footer */}
      <div className="border-t border-[#262C28] p-3 bg-[#131614] text-[#9A9C96] text-[11px] select-none">
        {!isCollapsed ? (
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] text-[#9A9C96]">Receiver 1.42 GHz</span>
            <span className="text-[10px] text-[#6B706A] font-mono">HI Band</span>
          </div>
        ) : (
          <div className="flex justify-center text-[10px] text-[#6B706A] font-mono">1.42G</div>
        )}
      </div>
    </motion.aside>
  );
}
