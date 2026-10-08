import { Outlet, useLocation } from 'react-router';
import { Toaster } from 'sonner';
import { AppShell } from '@/components/navigation/AppShell.tsx';

export function AppLayout() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  // Landing Page: Full-bleed astronomical prologue
  if (isLanding) {
    return (
      <div className="min-h-screen bg-[#0D141A] text-[#E3EBF2] flex flex-col font-sans selection:bg-[#376A9B]/30 selection:text-[#E3EBF2]">
        <Outlet />
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#131E27',
              border: '1px solid #213240',
              color: '#E3EBF2',
              fontFamily: "'Source Sans 3', sans-serif",
              fontSize: '12px',
              borderRadius: '3px',
            },
          }}
        />
      </div>
    );
  }

  // Workstation Shell: Research Desk Workspace
  return (
    <div className="min-h-screen bg-[#F4F1EA] text-[#17202A] flex flex-col font-sans selection:bg-[#376A9B]/15 selection:text-[#17202A]">
      <AppShell>
        <Outlet />
      </AppShell>
      <Toaster
        theme="light"
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#FAF8F5',
            border: '1px solid #D6D2C9',
            color: '#17202A',
            fontFamily: "'Source Sans 3', sans-serif",
            fontSize: '12px',
            borderRadius: '3px',
            boxShadow: '0 2px 8px rgba(23, 32, 42, 0.08)',
          },
        }}
      />
    </div>
  );
}
