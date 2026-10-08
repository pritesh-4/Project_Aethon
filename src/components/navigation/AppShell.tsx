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
    <div className="min-h-screen bg-[#F4F1EA] text-[#17202A] flex flex-col font-sans selection:bg-[#376A9B]/15 selection:text-[#17202A] overflow-x-hidden">
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
        <div className="flex-1 flex flex-col min-w-0 bg-[#F4F1EA]">
          {/* Top Bar */}
          <TopSystemBar onOpenMobileNav={() => setIsMobileNavOpen(true)} />

          {/* Application Content */}
          <main className="flex-1 relative p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">{children}</div>
          </main>

          {/* Quiet Research Desk Footer */}
          <footer className="border-t border-[#D6D2C9] bg-[#EAE7E0] py-2.5 px-6 text-xs text-[#56616A] select-none font-sans">
            <div className="mx-auto max-w-7xl flex items-center justify-between">
              <span className="text-xs font-medium text-[#17202A]">AETHON</span>
              <span className="text-[11px] text-[#7E8B96]">
                Astronomical signal discovery instrument
              </span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
