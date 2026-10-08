import { Link } from 'react-router';
import { Radio, ArrowLeft, Database, Activity } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { PageTransition } from '@/components/ui/motion.tsx';

export default function NotFoundPage() {
  return (
    <PageTransition className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center p-6 text-center select-none font-sans bg-[#F4F1EA]">
      <div className="relative mb-6 flex h-14 w-14 items-center justify-center rounded-[3px] border border-[#D6D2C9] bg-[#FAF8F5] shadow-xs">
        <Radio className="h-6 w-6 text-[#376A9B]" />
      </div>

      <div className="mb-2 font-mono text-xs text-[#9E6E20] font-semibold">
        404 · Unresolved coordinate
      </div>

      <h1 className="mb-2 text-2xl sm:text-3xl font-normal tracking-tight text-[#17202A] font-serif">
        Observation record not found
      </h1>

      <p className="max-w-md text-sm text-[#56616A] leading-relaxed">
        The requested observation coordinate, candidate identifier, or system route does not exist
        in the active ledger.
      </p>

      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Link to="/observatory">
          <Button variant="primary" size="sm" className="gap-2 font-semibold">
            <Radio className="h-3.5 w-3.5" />
            Observatory
          </Button>
        </Link>
        <Link to="/candidates">
          <Button variant="secondary" size="sm" className="gap-2">
            <Activity className="h-3.5 w-3.5" />
            Candidate ledger
          </Button>
        </Link>
        <Link to="/archive">
          <Button variant="secondary" size="sm" className="gap-2">
            <Database className="h-3.5 w-3.5" />
            Archive
          </Button>
        </Link>
        <Link to="/">
          <Button variant="ghost" size="sm" className="gap-2 text-[#56616A]">
            <ArrowLeft className="h-3.5 w-3.5" />
            Overview
          </Button>
        </Link>
      </div>
    </PageTransition>
  );
}
