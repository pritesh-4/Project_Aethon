import { Outlet, useLocation } from 'react-router';
import { Toaster } from 'sonner';
import { AppShell } from '@/components/navigation/AppShell.tsx';

export function AppLayout() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  // Landing Page: preserve full-bleed scroll narrative intact
  if (isLanding) {
    return (
      <div className="min-h-screen bg-[#05070A] text-[#EAF4F7] flex flex-col font-sans selection:bg-[#66E3FF]/30 selection:text-[#66E3FF]">
        <Outlet />
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#0A0E13',
              border: '1px solid #172338',
              color: '#EAF4F7',
              fontFamily: 'monospace',
              fontSize: '12px',
            },
          }}
        />
      </div>
    );
  }

  // Workstation Shell: TopSystemBar + Sidebar Rail + Application Content
  return (
    <AppShell>
      <Outlet />
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#0A0E13',
            border: '1px solid #172338',
            color: '#EAF4F7',
            fontFamily: 'monospace',
            fontSize: '12px',
          },
        }}
      />
    </AppShell>
  );
}
