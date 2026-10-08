import { Link } from 'react-router';
import { Button } from '@/components/ui/Button.tsx';
import { Compass, ArrowRight, ListFilter } from 'lucide-react';

export function ModelCta() {
  return (
    <div className="rounded border border-[#1C2630] bg-[#0B0F14] p-6 text-center select-none space-y-4">
      <div className="flex justify-center text-[#5BD8F5]">
        <Compass className="h-6 w-6" />
      </div>

      <div className="space-y-1 max-w-lg mx-auto">
        <h3 className="text-sm font-semibold text-[#E6EDF2]">
          AETHON does not produce definitive discoveries.
        </h3>
        <p className="text-xs text-[#7F8B95] leading-relaxed">
          It isolates high-probability candidates for astronomer inspection and physical
          verification.
        </p>
      </div>

      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
        <Link to="/candidates">
          <Button variant="outline" size="sm" icon={<ListFilter className="h-3.5 w-3.5" />}>
            Inspect candidate triage
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
