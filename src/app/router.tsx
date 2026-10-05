import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout.tsx';

const LandingPage = lazy(() => import('@/pages/Landing/index.tsx'));
const ObservatoryPage = lazy(() => import('@/pages/Observatory/index.tsx'));
const DiscoverPage = lazy(() => import('@/pages/Discover/index.tsx'));
const CandidatesPage = lazy(() => import('@/pages/Candidates/index.tsx'));
const AnalysisPage = lazy(() => import('@/pages/Analysis/index.tsx'));
const ModelPage = lazy(() => import('@/pages/Model/index.tsx'));
const AboutPage = lazy(() => import('@/pages/About/index.tsx'));

function LazyRoute({ children }: { children: ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex h-[40vh] w-full items-center justify-center font-mono text-xs text-slate-500 select-none">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-none bg-cyan-400 animate-pulse" />
            <span className="tracking-wider uppercase">SYNCHRONIZING SUBSYSTEM...</span>
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: (
          <LazyRoute>
            <LandingPage />
          </LazyRoute>
        ),
      },
      {
        path: 'observatory',
        element: (
          <LazyRoute>
            <ObservatoryPage />
          </LazyRoute>
        ),
      },
      {
        path: 'discover',
        element: (
          <LazyRoute>
            <DiscoverPage />
          </LazyRoute>
        ),
      },
      {
        path: 'candidates',
        element: (
          <LazyRoute>
            <CandidatesPage />
          </LazyRoute>
        ),
      },
      {
        path: 'archive',
        element: (
          <LazyRoute>
            <DiscoverPage />
          </LazyRoute>
        ),
      },
      {
        path: 'analysis/:signalId',
        element: (
          <LazyRoute>
            <AnalysisPage />
          </LazyRoute>
        ),
      },
      {
        path: 'model',
        element: (
          <LazyRoute>
            <ModelPage />
          </LazyRoute>
        ),
      },
      {
        path: 'about',
        element: (
          <LazyRoute>
            <AboutPage />
          </LazyRoute>
        ),
      },
      {
        path: '*',
        element: (
          <LazyRoute>
            <LandingPage />
          </LazyRoute>
        ),
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
