import { Outlet } from 'react-router';
import { Toaster } from 'sonner';
import { Navbar } from '@/components/navigation/Navbar.tsx';
import { Activity, ShieldCheck, Database, Radio } from 'lucide-react';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <Navbar />

      <main className="flex-1 observatory-grid-bg relative pb-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </div>
      </main>

      {/* Scientific Telemetry Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/95 py-3 px-4 font-mono text-xs text-slate-400">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1.5 text-slate-300">
              <Activity className="h-3.5 w-3.5 text-cyan-400" />
              <span>AETHON TELEMETRY CORE</span>
            </span>
            <span className="text-slate-600">/</span>
            <span className="flex items-center gap-1 text-slate-400">
              <Database className="h-3 w-3 text-emerald-400" />
              <span>SPECTRAL DB: CONNECTED</span>
            </span>
            <span className="text-slate-600 hidden md:inline">/</span>
            <span className="hidden md:flex items-center gap-1 text-slate-400">
              <Radio className="h-3 w-3 text-cyan-400" />
              <span>L-BAND 1.1–1.9 GHz DUAL POL</span>
            </span>
            <span className="text-slate-600 hidden lg:inline">/</span>
            <span className="hidden lg:flex items-center gap-1 text-slate-400">
              <ShieldCheck className="h-3 w-3 text-slate-400" />
              <span>TERRESTRIAL RFI REJECTION: ACTIVE</span>
            </span>
          </div>

          <div className="text-[11px] text-slate-400 flex items-center gap-2">
            <span>AI ASTRONOMICAL DISCOVERY FRAMEWORK</span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-400/80">HACKATHON RELEASE</span>
          </div>
        </div>
      </footer>

      {/* Sonner Toast Notification Center */}
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#090e1a',
            border: '1px solid #1e293b',
            color: '#f1f5f9',
            fontFamily: 'monospace',
            fontSize: '12px',
          },
        }}
      />
    </div>
  );
}
