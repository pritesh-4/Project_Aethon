import { Link } from 'react-router';
import { Button } from '@/components/ui/Button.tsx';
import { Compass, ArrowRight, ListFilter } from 'lucide-react';

export function ModelCta() {
  return (
    <div className="border-t border-[#D6D2C9] pt-8 pb-4 text-center select-none space-y-3 font-sans">
      <div className="flex justify-center text-[#376A9B]">
        <Compass className="h-5 w-5" />
      </div>

      <div className="space-y-1 max-w-lg mx-auto">
        <h3 className="text-base font-normal text-[#17202A] font-serif">
          AETHON does not declare definitive discoveries.
        </h3>
        <p className="text-xs text-[#56616A] leading-relaxed">
          It isolates anomalous candidate signals from astronomical noise baselines for researcher
          review and multi-telescope validation.
        </p>
      </div>

      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
        <Link to="/candidates">
          <Button variant="secondary" size="sm" icon={<ListFilter className="h-3.5 w-3.5" />}>
            Candidate Review Ledger
          </Button>
        </Link>

        <Link to="/discover">
          <Button variant="primary" size="sm" icon={<ArrowRight className="h-3.5 w-3.5" />}>
            Configure Discovery Search
          </Button>
        </Link>
      </div>
    </div>
  );
}
