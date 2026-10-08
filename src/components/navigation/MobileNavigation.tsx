import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { SidebarItem } from './SidebarItem.tsx';
import { MAIN_NAV, SECONDARY_NAV } from '@/app/navigation.ts';

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
            className="fixed inset-0 z-40 bg-black/70 lg:hidden"
            aria-hidden="true"
          />

          {/* Slide-out Instrument Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 left-0 z-50 w-64 max-w-[80vw] bg-[#131614] border-r border-[#262C28] flex flex-col font-sans select-none shadow-xl lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
          >
            {/* Header */}
            <div className="flex h-12 items-center justify-between border-b border-[#262C28] px-4">
              <div className="flex flex-col">
                <span className="text-xs font-semibold tracking-wider text-[#E6E4DD] font-mono">
                  AETHON
                </span>
                <span className="text-[10px] text-[#9A9C96]">Signal observatory</span>
              </div>

              <button
                type="button"
                onClick={onClose}
                title="Close Navigation (Esc)"
                aria-label="Close Navigation"
                className="h-7 w-7 flex items-center justify-center rounded-[2px] text-[#9A9C96] hover:text-[#E6E4DD] hover:bg-[#1A1E1B] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Navigation Rail */}
            <nav aria-label="Mobile navigation" className="flex-1 overflow-y-auto p-3 space-y-1">
              {MAIN_NAV.map((item) => (
                <SidebarItem
                  key={item.id}
                  id={item.id}
                  label={item.label}
                  path={item.path}
                  icon={item.icon}
                  onClick={onClose}
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
                  onClick={onClose}
                />
              ))}
            </nav>

            {/* Footer */}
            <div className="border-t border-[#262C28] p-3 bg-[#131614] text-xs font-mono text-[#9A9C96] flex items-center justify-between">
              <span className="text-[11px]">Receiver 1.42 GHz</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#529E72]" title="System ready" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
