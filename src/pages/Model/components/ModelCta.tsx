import { Link } from 'react-router';
import { Button } from '@/components/ui/Button.tsx';
import { Compass, ArrowRight, ListFilter } from 'lucide-react';

export function ModelCta() {
  return (
    <div className="rounded-[2px] border border-[#242825] bg-[#141715] p-6 text-center select-none space-y-4">
      <div className="flex justify-center text-[#D4864A]">
        <Compass className="h-6 w-6" />
      </div>

      <div className="space-y-1 max-w-lg mx-auto">
        <h3 className="text-sm font-medium text-[#E6E4DD]">
          AETHON does not declare definitive discoveries.
        </h3>
        <p className="text-xs text-[#9A9C96] leading-relaxed">
          It isolates anomalous candidates from astronomical noise floors for human review and
          multi-telescope replication.
        </p>
      </div>

      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
        <Link to="/candidates">
          <Button variant="outline" size="sm" icon={<ListFilter className="h-3.5 w-3.5" />}>
            Candidate review ledger
          </Button>
        </Link>

        <Link to="/discover">
          <Button variant="primary" size="sm" icon={<ArrowRight className="h-3.5 w-3.5" />}>
            Configure discovery search
          </Button>
        </Link>
      </div>
    </div>
  );
}
