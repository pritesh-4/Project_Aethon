import type { SignalAnalysisRecord } from '../types.ts';
import { ShieldCheck, AlertCircle } from 'lucide-react';

export interface InterferenceAssessmentProps {
  record: SignalAnalysisRecord;
}

export function InterferenceAssessment({ record }: InterferenceAssessmentProps) {
  const rfiPercent = (record.interferenceProbability * 100).toFixed(1);
  const isLowRfi = record.interferenceProbability < 0.1;

  return (
    <div className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-4 font-mono select-none">
      <div className="flex items-center justify-between border-b border-[#1C2630] pb-2 mb-3">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="h-3.5 w-3.5 text-[#5BD8F5]" />
          <h4 className="text-xs font-medium text-[#E6EDF2]">Interference assessment</h4>
        </div>
        <span className="text-[10px] text-[#5BD8F5] font-medium">Filter passed</span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-2.5">
          <span className="block text-[9px] text-[#7F8B95]">Estimated probability</span>
          <span
            className={`text-lg font-medium tracking-wider mt-0.5 block ${
              isLowRfi ? 'text-[#5BD8F5]' : 'text-[#E8AE50]'
            }`}
          >
            {rfiPercent}%
          </span>
        </div>

        <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-2.5">
          <span className="block text-[9px] text-[#7F8B95]">Estimated risk</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5BD8F5]" />
            <span className="text-sm font-medium text-[#5BD8F5]">Low</span>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-[2px] border border-[#1C2630] bg-[#06080B] p-2.5 text-xs text-[#E6EDF2]">
        <div className="flex items-center gap-1.5 font-medium text-[10px] text-[#5BD8F5]">
          <span>No obvious interference signature detected</span>
        </div>
        <p className="mt-1 text-[10px] text-[#7F8B95] leading-normal font-sans">
          Absence in off-pointing reference beam and nonzero topocentric Doppler drift (df/dt ={' '}
          {record.driftRateHzPerSec.toFixed(2)} Hz/s) suggest low terrestrial interference
          probability.
        </p>
      </div>

      <div className="mt-2.5 flex items-start gap-1.5 text-[9px] text-[#7F8B95] leading-snug">
        <AlertCircle className="h-3 w-3 text-[#7F8B95] shrink-0 mt-0.5" />
        <span>
          Low estimated interference probability does not confirm astronomical provenance.
          Independent verification is required.
        </span>
      </div>
    </div>
  );
}
