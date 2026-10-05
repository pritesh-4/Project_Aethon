import { Link } from 'react-router';
import { Button } from '@/components/ui/Button.tsx';
import { ArrowRight, Compass } from 'lucide-react';

export function ModelCta() {
  return (
    <div className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-8 text-center font-mono select-none relative overflow-hidden">
      <div className="relative z-10 max-w-xl mx-auto space-y-4">
        <div className="flex justify-center text-[#5BD8F5]">
          <Compass className="h-6 w-6" />
        </div>

        <div className="space-y-1">
          <h3 className="text-sm text-[#7F8B95] font-sans">
            The pipeline does not produce definitive conclusions.
          </h3>
          <h2 className="text-xl sm:text-2xl font-medium text-[#E6EDF2] font-sans">
            It identifies candidates for investigation.
          </h2>
        </div>

        <p className="text-xs text-[#7F8B95] font-sans leading-relaxed">
          Run the discovery pipeline on simulated observations and known reference sets.
        </p>

        <div className="pt-2 flex justify-center">
          <Link to="/discover">
            <Button
              variant="primary"
              size="md"
              className="rounded-[2px] text-xs"
              icon={<ArrowRight className="h-4 w-4" />}
            >
              Launch discovery pipeline
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
