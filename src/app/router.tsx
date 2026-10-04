import { createBrowserRouter, RouterProvider } from 'react-router';
import { AppLayout } from '@/components/layout/AppLayout.tsx';
import LandingPage from '@/pages/Landing/index.tsx';
import ObservatoryPage from '@/pages/Observatory/index.tsx';
import DiscoverPage from '@/pages/Discover/index.tsx';
import AnalysisPage from '@/pages/Analysis/index.tsx';
import ModelPage from '@/pages/Model/index.tsx';
import AboutPage from '@/pages/About/index.tsx';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <LandingPage />,
      },
      {
        path: 'observatory',
        element: <ObservatoryPage />,
      },
      {
        path: 'discover',
        element: <DiscoverPage />,
      },
      {
        path: 'analysis/:signalId',
        element: <AnalysisPage />,
      },
      {
        path: 'model',
        element: <ModelPage />,
      },
      {
        path: 'about',
        element: <AboutPage />,
      },
      {
        path: '*',
        element: <LandingPage />,
      },
    ],
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
