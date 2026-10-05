import { useState, type ReactNode } from 'react';
import { useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './Sidebar.tsx';
import { TopSystemBar } from './TopSystemBar.tsx';
import { MobileNavigation } from './MobileNavigation.tsx';
import { Activity, Database, Radio, ShieldCheck } from 'lucide-react';

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#05070A] text-[#EAF4F7] flex flex-col font-sans selection:bg-[#66E3FF]/30 selection:text-[#66E3FF] overflow-x-hidden">
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
        <div className="flex-1 flex flex-col min-w-0 bg-[#05070A]">
          {/* Thin Instrumentation Top Bar */}
          <TopSystemBar onOpenMobileNav={() => setIsMobileNavOpen(true)} />

          {/* Application Content with Precise Navigation Motion */}
          <main className="flex-1 observatory-grid-bg relative p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                  {children}
                </motion.div>
              </AnimatePresence>
            </div>
          </main>

          {/* Scientific Telemetry Footer */}
          <footer className="border-t border-slate-800/70 bg-[#0A0E13] py-2.5 px-4 font-mono text-[10px] text-[#84929C] select-none">
            <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Activity className="h-3 w-3 text-[#66E3FF]" />
                  <span>AETHON ENGINE // ACTIVE</span>
                </span>
                <span className="text-slate-800">/</span>
                <span className="flex items-center gap-1 text-[#84929C]">
                  <Database className="h-3 w-3 text-emerald-400" />
                  <span>BUFFER: 100% NOMINAL</span>
                </span>
                <span className="text-slate-800 hidden md:inline">/</span>
                <span className="hidden md:flex items-center gap-1 text-[#84929C]">
                  <Radio className="h-3 w-3 text-[#66E3FF]" />
                  <span>1420.4057 MHz [H I]</span>
                </span>
                <span className="text-slate-800 hidden lg:inline">/</span>
                <span className="hidden lg:flex items-center gap-1 text-[#84929C]">
                  <ShieldCheck className="h-3 w-3 text-slate-500" />
                  <span>RFI FILTER: 99.98%</span>
                </span>
              </div>

              <div className="text-[10px] text-[#84929C] flex items-center gap-2">
                <span>ASTRONOMICAL DISCOVERY FRAMEWORK</span>
                <span className="text-slate-800">•</span>
                <span className="text-[#66E3FF]">AET-01</span>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
