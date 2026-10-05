import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { SidebarItem } from './SidebarItem.tsx';
import { SystemStatus } from './SystemStatus.tsx';
import { PRIMARY_NAV, SECONDARY_NAV } from '@/app/navigation.ts';

export interface MobileNavigationProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MobileNavigation({ isOpen, onClose }: MobileNavigationProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            aria-hidden="true"
          />

          {/* Slide-out Instrument Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#0B0F14] border-r border-[#172230] flex flex-col font-sans select-none shadow-xl lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
          >
            {/* Header */}
            <div className="flex h-14 items-center justify-between border-b border-[#172230] px-4">
              <div>
                <span className="text-sm font-semibold tracking-wider text-[#E6EDF2] block">
                  AETHON
                </span>
                <span className="text-[11px] text-[#7F8B95] block">
                  Astronomical Discovery System
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                title="Close Navigation (Esc)"
                className="h-7 w-7 flex items-center justify-center rounded-[4px] border border-[#172230] bg-[#10161D] text-[#7F8B95] hover:text-[#E6EDF2] hover:border-[#243345] transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* System Status Banner */}
            <div className="border-b border-[#172230] px-4 py-2.5 bg-[#0B0F14]">
              <SystemStatus status="online" label="Online" showCategory={false} />
            </div>

            {/* Navigation Lists */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <div className="space-y-1">
                <span className="px-2 text-[11px] font-medium text-[#7F8B95] block pb-1">
                  Operational
                </span>
                {PRIMARY_NAV.map((item) => (
                  <SidebarItem
                    key={item.id}
                    id={item.id}
                    index={item.index}
                    label={item.label}
                    path={item.path}
                    icon={item.icon}
                    badge={item.badge}
                    onClick={onClose}
                  />
                ))}
              </div>

              <div className="border-t border-[#172230] my-2" />

              <div className="space-y-1">
                <span className="px-2 text-[11px] font-medium text-[#7F8B95] block pb-1">
                  System & Archive
                </span>
                {SECONDARY_NAV.map((item) => (
                  <SidebarItem
                    key={item.id}
                    id={item.id}
                    label={item.label}
                    path={item.path}
                    icon={item.icon}
                    onClick={onClose}
                  />
                ))}
              </div>
            </div>

            {/* Clean Version Footer */}
            <div className="border-t border-[#172230] p-4 bg-[#0B0F14] text-xs text-[#7F8B95] flex items-center justify-between">
              <span>Aethon Core</span>
              <span className="font-mono text-[11px] text-[#7F8B95]">v0.1.0</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
