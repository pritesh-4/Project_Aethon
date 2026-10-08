import { ShieldAlert } from 'lucide-react';

export function ScientificCaution() {
  return (
    <aside className="rounded border border-[#E8AE50]/30 bg-[#0B0F14] p-4 select-none text-xs">
      <div className="flex items-center gap-2 text-[#E8AE50] font-semibold mb-2">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        <span className="text-xs font-medium">Scientific caution</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[#7F8B95] leading-relaxed">
        <div className="rounded border border-[#1C2630] bg-[#06080B] p-3 space-y-1">
          <div className="font-medium text-[#E6EDF2]">Anomaly is not discovery</div>
          <p className="text-[11px] text-[#7F8B95] leading-normal">
            Statistical outlier detection flags observations that deviate from background
            distributions. An anomaly is not proof of artificial origin, technosignature, or
            discovery.
          </p>
        </div>

        <div className="rounded border border-[#1C2630] bg-[#06080B] p-3 space-y-1">
          <div className="font-medium text-[#E6EDF2]">Model score is not scientific certainty</div>
          <p className="text-[11px] text-[#7F8B95] leading-normal">
            A high anomaly score indicates mathematical divergence from training data. Scientific
            confirmation requires independent multi-observatory replication and physical
            verification.
          </p>
        </div>
      </div>
    </aside>
  );
}
