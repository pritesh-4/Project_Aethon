import { Link } from 'react-router';
import { Button } from '@/components/ui/Button.tsx';
import { Compass, ArrowRight, ListFilter } from 'lucide-react';

export function ModelCta() {
  return (
    <div className="border-t border-[#242825] pt-8 pb-4 text-center select-none space-y-3 font-sans">
      <div className="flex justify-center text-[#D4864A]">
        <Compass className="h-5 w-5" />
      </div>

      <div className="space-y-1 max-w-lg mx-auto">
        <h3 className="text-sm font-medium text-[#E6E4DD]">
          AETHON does not declare definitive discoveries.
        </h3>
        <p className="text-xs text-[#848780] leading-relaxed">
          It isolates anomalous candidate signals from astronomical noise baselines for researcher
          review and multi-telescope validation.
        </p>
      </div>

      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
        <Link to="/candidates">
          <Button variant="outline" size="sm" icon={<ListFilter className="h-3 w-3" />}>
            Candidate Review Ledger
          </Button>
        </Link>

        <Link to="/discover">
          <Button variant="primary" size="sm" icon={<ArrowRight className="h-3 w-3" />}>
            Configure Discovery Search
          </Button>
        </Link>
      </div>
    </div>
  );
}
