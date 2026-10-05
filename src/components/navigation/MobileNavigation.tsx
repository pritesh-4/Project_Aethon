import { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Radar,
  ScanSearch,
  Crosshair,
  Activity,
  BrainCircuit,
  Database,
  Info,
  X,
  Disc,
} from 'lucide-react';
import { SidebarItem } from './SidebarItem.tsx';
import { SystemStatus } from './SystemStatus.tsx';

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

  const primaryNav = [
    { id: 'observatory', index: '01', label: 'OBSERVATORY', path: '/observatory', icon: Radar },
    {
      id: 'discovery',
      index: '02',
      label: 'DISCOVERY',
      path: '/discover',
      icon: ScanSearch,
      badge: '4',
    },
    { id: 'candidates', index: '03', label: 'CANDIDATES', path: '/candidates', icon: Crosshair },
    {
      id: 'analysis',
      index: '04',
      label: 'ANALYSIS',
      path: '/analysis/SIG-2026-089A',
      icon: Activity,
    },
    { id: 'model', index: '05', label: 'MODEL', path: '/model', icon: BrainCircuit },
  ];

  const secondaryNav = [
    { id: 'archive', label: 'ARCHIVE', path: '/archive', icon: Database },
    { id: 'about', label: 'ABOUT', path: '/about', icon: Info },
    { id: 'mission', label: 'MISSION NARRATIVE', path: '/', icon: Disc },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm lg:hidden"
            aria-hidden="true"
          />

          {/* Slide-out Instrument Panel */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-[#0A0E13] border-r border-slate-800 flex flex-col font-mono select-none shadow-2xl lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Observatory Instrument Panel"
          >
            {/* Header */}
            <div className="flex h-14 items-center justify-between border-b border-slate-800 px-4">
              <div>
                <span className="text-xs font-bold tracking-[0.25em] text-[#EAF4F7] uppercase block">
                  AETHON
                </span>
                <span className="text-[9px] tracking-wider text-[#84929C] uppercase block">
                  INSTRUMENT CONSOLE
                </span>
              </div>

              <button
                type="button"
                onClick={onClose}
                title="Close Instrument Console (Esc)"
                className="h-7 w-7 flex items-center justify-center rounded-[2px] border border-slate-800 bg-[#05070A] text-[#84929C] hover:text-[#EAF4F7] hover:border-slate-700 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* System Status Banner */}
            <div className="border-b border-slate-800/80 px-4 py-2.5 bg-[#05070A]">
              <SystemStatus status="online" label="ONLINE" showCategory={true} />
            </div>

            {/* Navigation Lists */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              <div className="space-y-1">
                <span className="px-2 text-[9px] font-semibold tracking-widest text-slate-500 uppercase block pb-1">
                  OPERATIONAL SUBSYSTEMS
                </span>
                {primaryNav.map((item) => (
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

              <div className="border-t border-slate-800/80 my-2" />

              <div className="space-y-1">
                <span className="px-2 text-[9px] font-semibold tracking-widest text-slate-500 uppercase block pb-1">
                  ARCHIVE & SYSTEM
                </span>
                {secondaryNav.map((item) => (
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

            {/* Telemetry Footer */}
            <div className="border-t border-slate-800 p-3 bg-[#05070A] text-[9px] text-[#84929C] space-y-1">
              <div className="flex justify-between">
                <span>TELEMETRY FEED</span>
                <span className="text-[#66E3FF]">LOCK [1420 MHz]</span>
              </div>
              <div className="flex justify-between">
                <span>NODE CODE</span>
                <span className="text-[#EAF4F7]">AET-01 // v0.1.0</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
