import type { CandidateSignalData } from '../types.ts';
import { Compass, Radio } from 'lucide-react';

export interface CandidateMetadataProps {
  candidate: CandidateSignalData;
}

export function CandidateMetadata({ candidate }: CandidateMetadataProps) {
  const items = [
    { label: 'OBSERVATION ID', value: candidate.observationId },
    { label: 'FREQUENCY', value: `${candidate.frequencyMHz.toFixed(4)} MHz` },
    { label: 'BANDWIDTH', value: `${candidate.bandwidthKHz.toFixed(1)} kHz` },
    { label: 'DURATION', value: `${candidate.durationSeconds.toFixed(1)} s` },
    { label: 'PEAK POWER', value: `${candidate.peakPowerDbm.toFixed(1)} dBm` },
    { label: 'SNR', value: `+${candidate.snrDb.toFixed(1)} dB` },
    { label: 'DOPPLER DRIFT', value: `${candidate.driftRateHzPerSec.toFixed(2)} Hz/s` },
    { label: 'FIRST DETECTED', value: `T+${candidate.firstDetectedTime}` },
  ];

  return (
    <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-3.5 font-mono select-none">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-3">
        <div className="flex items-center gap-1.5">
          <Radio className="h-3.5 w-3.5 text-[#66E3FF]" />
          <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#EAF4F7]">
            CANDIDATE PROFILE & METADATA
          </h4>
        </div>
        <span className="text-[9px] text-[#84929C] uppercase">INSTRUMENT READOUT</span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {items.map((it) => (
          <div
            key={it.label}
            className="rounded-[2px] border border-slate-800/60 bg-[#05070A]/60 p-2"
          >
            <span className="block text-[9px] uppercase tracking-wider text-[#84929C]">
              {it.label}
            </span>
            <span className="text-xs font-semibold text-[#EAF4F7] truncate block mt-0.5">
              {it.value}
            </span>
          </div>
        ))}
      </div>

      {/* Celestial Coordinates Bar */}
      <div className="mt-2.5 flex items-center justify-between rounded-[2px] border border-slate-800 bg-[#05070A] px-2.5 py-1.5 text-[10px]">
        <div className="flex items-center gap-1 text-slate-400">
          <Compass className="h-3 w-3 text-cyan-400" />
          <span>EQUATORIAL COORDINATES:</span>
        </div>
        <span className="font-semibold text-slate-200">
          RA {candidate.coordinates.ra} / DEC {candidate.coordinates.dec}
        </span>
      </div>
    </div>
  );
}
