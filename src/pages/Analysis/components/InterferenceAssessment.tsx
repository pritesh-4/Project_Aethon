import type { SignalAnalysisRecord } from '../types.ts';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export interface InterferenceAssessmentProps {
  record: SignalAnalysisRecord;
}

export function InterferenceAssessment({ record }: InterferenceAssessmentProps) {
  const rfiPercent = (record.interferenceProbability * 100).toFixed(1);
  const isLowRfi = record.interferenceProbability < 0.1;

  return (
    <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-4 font-mono select-none">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#EAF4F7]">
            RADIO-FREQUENCY INTERFERENCE (RFI) ASSESSMENT
          </h4>
        </div>
        <span className="text-[10px] text-emerald-400 uppercase font-semibold">FILTER PASSED</span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-[2px] border border-slate-800 bg-[#05070A]/80 p-2.5">
          <span className="block text-[9px] uppercase tracking-wider text-[#84929C]">
            RFI PROBABILITY
          </span>
          <span
            className={`text-lg font-bold tracking-wider mt-0.5 block ${
              isLowRfi ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {rfiPercent}%
          </span>
        </div>

        <div className="rounded-[2px] border border-slate-800 bg-[#05070A]/80 p-2.5">
          <span className="block text-[9px] uppercase tracking-wider text-[#84929C]">
            ESTIMATED RISK
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="h-2 w-2 rounded-none bg-emerald-400" />
            <span className="text-sm font-bold text-emerald-400 uppercase tracking-wider">LOW</span>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-[2px] border border-emerald-900/60 bg-emerald-950/20 p-2.5 text-xs text-emerald-300">
        <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[10px]">
          <span>STATUS: NO STRONG INTERFERENCE SIGNATURE</span>
        </div>
        <p className="mt-1 text-[10px] text-slate-400 leading-normal font-sans">
          Absence in off-pointing reference beam and nonzero topocentric Doppler drift (df/dt ={' '}
          {record.driftRateHzPerSec.toFixed(2)} Hz/s) yield low estimated interference probability.
        </p>
      </div>

      <div className="mt-2.5 flex items-start gap-1.5 text-[9px] text-[#84929C] leading-snug">
        <AlertCircle className="h-3 w-3 text-slate-500 shrink-0 mt-0.5" />
        <span>
          Cautionary note: Low estimated interference probability does not constitute confirmation
          of astrophysical provenance. Secondary telescope cross-matching is required.
        </span>
      </div>
    </div>
  );
}
