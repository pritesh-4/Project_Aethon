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
        'hidden lg:flex flex-col h-screen sticky top-0 shrink-0 border-r border-slate-800/80 bg-[#0A0E13] select-none font-mono z-30',
        className
      )}
    >
      {/* 1. Header: AETHON Wordmark & System Status */}
      <div className="h-28 border-b border-slate-800/70 p-4 flex flex-col justify-between overflow-hidden">
        {!isCollapsed ? (
          <div>
            <div className="flex items-center justify-between">
              <h1 className="text-base font-bold tracking-[0.25em] text-[#EAF4F7] uppercase font-mono">
                AETHON
              </h1>
              <button
                type="button"
                onClick={onToggleCollapse}
                title="Collapse sidebar"
                className="h-5 w-5 flex items-center justify-center rounded-[2px] border border-slate-800 bg-[#05070A] text-[#84929C] hover:text-[#EAF4F7] hover:border-slate-700 transition-colors cursor-pointer"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
            </div>
            <p className="text-[9px] tracking-[0.2em] text-[#84929C] uppercase font-mono mt-0.5 leading-tight">
              ASTRONOMICAL
              <br />
              DISCOVERY SYSTEM
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm font-bold tracking-widest text-[#66E3FF] font-mono">A</span>
            <button
              type="button"
              onClick={onToggleCollapse}
              title="Expand sidebar"
              className="h-5 w-5 flex items-center justify-center rounded-[2px] border border-slate-800 bg-[#05070A] text-[#84929C] hover:text-[#EAF4F7] hover:border-slate-700 transition-colors cursor-pointer"
            >
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* System Status Readout */}
        {!isCollapsed ? (
          <SystemStatus status="online" label="ONLINE" showCategory={true} />
        ) : (
          <div className="flex justify-center" title="System Status: Online">
            <span className="h-1.5 w-1.5 rounded-none bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
          </div>
        )}
      </div>

      {/* 2. Navigation Items: Primary & Secondary */}
      <div className="flex-1 overflow-y-auto px-2 py-4 space-y-6">
        {/* Primary Navigation */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-3 pb-1 text-[9px] font-semibold tracking-[0.2em] text-slate-600 uppercase">
              OPERATIONAL
            </div>
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
        <div className="border-t border-slate-800/60 my-2" />

        {/* Secondary Navigation */}
        <div className="space-y-1">
          {!isCollapsed && (
            <div className="px-3 pb-1 text-[9px] font-semibold tracking-[0.2em] text-slate-600 uppercase">
              SYSTEM & ARCHIVE
            </div>
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

      {/* 3. Footer: Astronomical Software Telemetry Status */}
      <div className="border-t border-slate-800/70 p-4 bg-[#05070A] text-[#84929C] text-[10px] font-mono leading-relaxed">
        {!isCollapsed ? (
          <div className="space-y-2">
            <div>
              <span className="block text-[9px] text-slate-500 uppercase tracking-widest">
                AETHON ENGINE
              </span>
              <span className="text-[#EAF4F7] font-semibold text-[10px] tracking-wider">
                ONLINE
              </span>
            </div>

            <div>
              <span className="block text-[9px] text-slate-500 uppercase tracking-widest">
                MODEL
              </span>
              <span className="text-[#66E3FF] font-semibold text-[10px] tracking-wider">READY</span>
            </div>

            <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[9px] text-slate-600">
              <span>v0.1.0</span>
              <span>REST: 1420 MHz</span>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <span className="text-[8px] text-slate-600 block">v0.1</span>
            <span className="h-1 w-1 rounded-none bg-emerald-400 inline-block mt-1" />
          </div>
        )}
      </div>
    </motion.aside>
  );
}
