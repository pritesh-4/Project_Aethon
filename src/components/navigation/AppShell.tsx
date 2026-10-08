import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar.tsx';
import { TopSystemBar } from './TopSystemBar.tsx';
import { MobileNavigation } from './MobileNavigation.tsx';

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0F1110] text-[#E6E4DD] flex flex-col font-sans selection:bg-[#D4864A]/20 selection:text-[#D4864A] overflow-x-hidden">
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
        <div className="flex-1 flex flex-col min-w-0 bg-[#0F1110]">
          {/* Top Bar */}
          <TopSystemBar onOpenMobileNav={() => setIsMobileNavOpen(true)} />

          {/* Application Content */}
          <main className="flex-1 relative p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>

          {/* Quiet Footer */}
          <footer className="border-t border-[#242825] bg-[#141715] py-2 px-4 text-xs text-[#9A9C96] select-none font-sans">
            <div className="mx-auto max-w-7xl flex items-center justify-between">
              <span className="text-xs text-[#9A9C96]">AETHON</span>
              <span className="text-[11px] text-[#666963]">
                Astronomical signal discovery instrument
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
