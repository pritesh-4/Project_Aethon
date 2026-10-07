import { useState, type ReactNode } from 'react';
import { useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './Sidebar.tsx';
import { TopSystemBar } from './TopSystemBar.tsx';
import { MobileNavigation } from './MobileNavigation.tsx';

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#06080B] text-[#E6EDF2] flex flex-col font-sans selection:bg-[#5BD8F5]/20 selection:text-[#5BD8F5] overflow-x-hidden">
      {/* Mobile Drawer Navigation */}
      <MobileNavigation isOpen={isMobileNavOpen} onClose={() => setIsMobileNavOpen(false)} />

      {/* Main Layout: Fixed Left Rail + Right Content Shell */}
      <div className="flex-1 flex min-h-screen w-full">
        {/* Desktop Sidebar Rail */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Right Application Viewport */}
        <div className="flex-1 flex flex-col min-w-0 bg-[#06080B]">
          {/* Top Bar */}
          <TopSystemBar onOpenMobileNav={() => setIsMobileNavOpen(true)} />

          {/* Application Content */}
          <main className="flex-1 relative p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          {/* Quiet Footer */}
          <footer className="border-t border-[#172230] bg-[#0B0F14] py-2 px-4 text-xs text-[#7F8B95] select-none">
            <div className="mx-auto max-w-7xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#5BD8F5]" />
                <span className="font-sans text-xs text-[#7F8B95]">AETHON</span>
              </div>
              <span className="text-[11px] text-[#7F8B95]/70 font-mono">
                Astronomical Discovery
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
