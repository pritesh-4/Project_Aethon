import { Link } from 'react-router';
import { Button } from '@/components/ui/Button.tsx';
import { ArrowRight, Compass } from 'lucide-react';

export function ModelCta() {
  return (
    <div className="rounded-[2px] border border-cyan-800/80 bg-[#0A0E13] p-8 text-center font-mono select-none relative overflow-hidden">
      {/* Background ambient accents */}
      <div className="absolute top-0 right-1/4 w-64 h-64 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-xl mx-auto space-y-4">
        <div className="flex justify-center text-cyan-400">
          <Compass className="h-6 w-6 animate-pulse" />
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest font-mono">
            THE MODEL DOES NOT END WITH AN ANSWER.
          </h3>
          <h2 className="text-xl sm:text-2xl font-bold text-[#EAF4F7] uppercase tracking-wider font-mono">
            IT ENDS WITH A CANDIDATE.
          </h2>
        </div>

        <p className="text-xs text-slate-400 font-sans leading-relaxed">
          Experience the computational discovery pipeline in action on real and simulated
          astronomical radio telemetry.
        </p>

        <div className="pt-2 flex justify-center">
          <Link to="/discover">
            <Button
              variant="primary"
              size="lg"
              className="rounded-[2px] shadow-[0_0_16px_rgba(102,227,255,0.25)] text-xs tracking-wider"
              icon={<ArrowRight className="h-4 w-4" />}
            >
              EXPLORE DISCOVERY →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
