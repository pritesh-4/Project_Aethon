import { Link } from 'react-router';
import { Radio, ArrowLeft, Database, Activity } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { PageTransition } from '@/components/ui/motion.tsx';

export default function NotFoundPage() {
  return (
    <PageTransition className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center p-6 text-center select-none font-sans">
      <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-[4px] border border-[#1C2630] bg-[#0B0F14]">
        <Radio className="h-7 w-7 text-[#5BD8F5]" />
      </div>

      <div className="mb-2 font-mono text-xs text-[#E8AE50]">404</div>

      <h1 className="mb-2 text-2xl font-semibold tracking-tight text-[#E6EDF2] sm:text-3xl">
        Page not found
      </h1>

      <p className="max-w-md text-sm text-[#7F8B95] leading-relaxed">
        The requested observation, candidate, or route could not be found.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link to="/observatory">
          <Button variant="primary" size="sm" className="gap-2">
            <Radio className="h-4 w-4" />
            Observatory
          </Button>
        </Link>
        <Link to="/candidates">
          <Button variant="secondary" size="sm" className="gap-2">
            <Activity className="h-4 w-4" />
            Candidates
          </Button>
        </Link>
        <Link to="/archive">
          <Button variant="ghost" size="sm" className="gap-2">
            <Database className="h-4 w-4" />
            Archive
          </Button>
        </Link>
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2 text-[#7F8B95]">
            <ArrowLeft className="h-4 w-4" />
            Overview
          </Button>
        </Link>
      </div>
    </PageTransition>
  );
}
