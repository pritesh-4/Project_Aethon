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
            className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            aria-hidden="true"
          />

          {/* Slide-out Instrument Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 left-0 z-50 w-64 max-w-[80vw] bg-[#0B0F14] border-r border-[#172230] flex flex-col font-sans select-none shadow-xl lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation Menu"
          >
            {/* Header */}
            <div className="flex h-12 items-center justify-between border-b border-[#172230] px-4">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5BD8F5]" />
                <span className="text-xs font-semibold text-[#E6EDF2]">Aethon</span>
              </div>

              <button
                type="button"
                onClick={onClose}
                title="Close Navigation (Esc)"
                aria-label="Close Navigation"
                className="h-8 w-8 flex items-center justify-center rounded-[4px] text-[#7F8B95] hover:text-[#E6EDF2] hover:bg-[#10161D] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5]"
              >
                <X className="h-4 w-4" />
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

              <div className="pt-1.5 my-1.5 border-t border-[#172230]/60" />

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
            <div className="border-t border-[#172230] p-3 bg-[#0B0F14] text-xs font-mono text-[#7F8B95] flex items-center justify-between">
              <span>Astronomical instrument</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[#5BD8F5]" title="System ready" />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
