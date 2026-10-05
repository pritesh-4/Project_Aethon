import { motion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { SidebarItem } from './SidebarItem.tsx';
import { SystemStatus } from './SystemStatus.tsx';
import { cn } from '@/lib/utils.ts';
import { PRIMARY_NAV, SECONDARY_NAV } from '@/app/navigation.ts';

export interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

export function Sidebar({ isCollapsed, onToggleCollapse, className }: SidebarProps) {
  return (
    <motion.aside
      animate={{ width: isCollapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        'hidden lg:flex flex-col h-screen sticky top-0 shrink-0 border-r border-[#172230] bg-[#0B0F14] select-none font-sans z-30',
        className
      )}
    >
      {/* 1. Header: AETHON Wordmark & System Status */}
      <div className="h-24 border-b border-[#172230] px-4 py-3 flex flex-col justify-between overflow-hidden">
        {!isCollapsed ? (
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#5BD8F5]" />
                <h1 className="text-sm font-semibold tracking-wider text-[#E6EDF2] font-sans">
                  AETHON
                </h1>
              </div>
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Collapse sidebar"
                className="h-6 w-6 flex items-center justify-center rounded-[4px] border border-[#172230] bg-[#10161D] text-[#7F8B95] hover:text-[#E6EDF2] hover:border-[#243345] transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-[#7F8B95] font-sans mt-1">
              Astronomical Signal Discovery
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-semibold text-[#5BD8F5] font-sans">A</span>
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Expand sidebar"
              className="h-6 w-6 flex items-center justify-center rounded-[4px] border border-[#172230] bg-[#10161D] text-[#7F8B95] hover:text-[#E6EDF2] hover:border-[#243345] transition-colors cursor-pointer"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* System Status Readout */}
        {!isCollapsed ? (
          <SystemStatus status="online" label="Online" showCategory={false} />
        ) : (
          <div className="flex justify-center" title="System Status: Online">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7F8B95]" />
          </div>
        )}
      </div>

      {/* 2. Navigation Items: Primary & Secondary */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
        {/* Primary Navigation */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-3 pb-1 text-[11px] font-medium text-[#7F8B95]">Operational</div>
          )}
          {PRIMARY_NAV.map((item) => (
            <SidebarItem
              key={item.id}
              id={item.id}
              index={item.index}
              label={item.label}
              path={item.path}
              icon={item.icon}
              badge={item.badge}
              isCollapsed={isCollapsed}
            />
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-[#172230] my-2" />

        {/* Secondary Navigation */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-3 pb-1 text-[11px] font-medium text-[#7F8B95]">System & Archive</div>
          )}
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
        </div>
      </div>

      {/* 3. Footer: Version & Clean Status */}
      <div className="border-t border-[#172230] p-3 bg-[#0B0F14] text-[#7F8B95] text-[11px] font-sans leading-relaxed">
        {!isCollapsed ? (
          <div className="flex items-center justify-between">
            <span>Aethon Core</span>
            <span className="font-mono text-[10px] text-[#7F8B95]">v0.1.0</span>
          </div>
        ) : (
          <div className="text-center">
            <span className="font-mono text-[9px] text-[#7F8B95]">v0.1</span>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
