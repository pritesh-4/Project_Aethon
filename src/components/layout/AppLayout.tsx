import { Outlet, useLocation } from 'react-router';
import { Toaster } from 'sonner';
import { AppShell } from '@/components/navigation/AppShell.tsx';

export function AppLayout() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  // Landing Page: preserve full-bleed scroll narrative intact
  if (isLanding) {
    return (
      <div className="min-h-screen bg-[#06080B] text-[#E6EDF2] flex flex-col font-sans selection:bg-[#5BD8F5]/20 selection:text-[#5BD8F5]">
        <Outlet />
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#10161D',
              border: '1px solid #172230',
              color: '#E6EDF2',
              fontFamily: 'Inter, sans-serif',
              fontSize: '13px',
              borderRadius: '4px',
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
            background: '#10161D',
            border: '1px solid #172230',
            color: '#E6EDF2',
            fontFamily: 'Inter, sans-serif',
            fontSize: '13px',
            borderRadius: '4px',
          },
        }}
      />
    </AppShell>
  );
}
