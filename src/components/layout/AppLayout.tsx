import { Outlet, useLocation } from 'react-router';
import { Toaster } from 'sonner';
import { AppShell } from '@/components/navigation/AppShell.tsx';

export function AppLayout() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  // Landing Page: preserve full-bleed scroll narrative intact
  if (isLanding) {
    return (
      <div className="min-h-screen bg-[#0F1110] text-[#E6E4DD] flex flex-col font-sans selection:bg-[#D4864A]/25 selection:text-[#E6E4DD]">
        <Outlet />
        <Toaster
          theme="dark"
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#141715',
              border: '1px solid #262C28',
              color: '#E6E4DD',
              fontFamily: 'Inter, sans-serif',
              fontSize: '12px',
              borderRadius: '2px',
            },
          }}
        />
      </div>
    );
  }

  // Workstation Shell: TopSystemBar + Sidebar Rail + Application Content
  return (
    <>
      <AppShell>
        <Outlet />
      </AppShell>
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#141715',
            border: '1px solid #262C28',
            color: '#E6E4DD',
            fontFamily: 'Inter, sans-serif',
            fontSize: '12px',
            borderRadius: '2px',
          },
        }}
      />
    </>
  );
}
