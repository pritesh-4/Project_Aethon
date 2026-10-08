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
      animate={{ width: isCollapsed ? 56 : 210 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'hidden lg:flex flex-col h-screen sticky top-0 shrink-0 border-r border-[#172230] bg-[#0B0F14] select-none font-sans z-30',
        className
      )}
    >
      {/* 1. Compact Header: Wordmark & Collapse Toggle */}
      <div className="h-12 border-b border-[#172230] px-3.5 flex items-center justify-between overflow-hidden">
        {!isCollapsed ? (
          <>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold tracking-tight text-[#E6EDF2]">Aethon</span>
            </div>
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Collapse sidebar rail"
              aria-label="Collapse sidebar rail"
              className="h-6 w-6 flex items-center justify-center rounded text-[#7F8B95] hover:text-[#E6EDF2] hover:bg-[#10161D] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5]"
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
              className="h-7 w-7 flex items-center justify-center rounded text-[#7F8B95] hover:text-[#E6EDF2] hover:bg-[#10161D] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5]"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* 2. Calm Navigation Rail (Core Destinations + Secondary) */}
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

        <div className="pt-1.5 my-1.5 border-t border-[#172230]/60" />

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

      {/* 3. Quiet Footer */}
      <div className="border-t border-[#172230] p-2.5 bg-[#0B0F14] text-[#7F8B95] text-[11px] select-none">
        {!isCollapsed ? (
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] text-[#7F8B95]">Prototype v0.1</span>
            <span className="text-[10px] text-slate-600 font-mono">L-Band</span>
          </div>
        ) : (
          <div className="flex justify-center text-[10px] text-slate-600 font-mono">v0.1</div>
        )}
      </div>
    </motion.aside>
  );
}
