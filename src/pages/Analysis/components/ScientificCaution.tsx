import { AlertCircle } from 'lucide-react';

export function ScientificCaution() {
  return (
    <aside className="rounded-[2px] border border-[#242825] bg-[#141715] p-4 select-none text-xs space-y-3">
      <div className="flex items-center justify-between border-b border-[#242825] pb-2">
        <div className="flex items-center gap-2 text-[#D4864A]">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="text-xs font-medium">
            Methodological uncertainty & research boundaries
          </span>
        </div>
        <span className="text-[11px] text-[#666963] italic">
          “An anomaly is not an answer. It is a reason to look closer.”
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[#9A9C96] leading-relaxed">
        <div className="rounded-[2px] border border-[#242825] bg-[#101211] p-3 space-y-1">
          <div className="font-medium text-[#E6E4DD]">Statistical deviance is not discovery</div>
          <p className="text-[11px] text-[#9A9C96] leading-normal">
            Outlier detection indicates departure from learned background distributions. An anomaly
            is mathematical deviation, not proof of artificial origin or physical singularity.
          </p>
        </div>

        <div className="rounded-[2px] border border-[#242825] bg-[#101211] p-3 space-y-1">
          <div className="font-medium text-[#E6E4DD]">Model confidence is not empirical proof</div>
          <p className="text-[11px] text-[#9A9C96] leading-normal">
            A high anomaly index reflects reconstruction residual in latent space. Scientific
            confirmation requires independent multi-observatory replication and interferometric
            verification.
          </p>
        </div>

        <div className="rounded-[2px] border border-[#242825] bg-[#101211] p-3 space-y-1">
          <div className="font-medium text-[#E6E4DD]">Uncataloged terrestrial interference</div>
          <p className="text-[11px] text-[#9A9C96] leading-normal">
            Novel satellite constellations, classified military radar, or local receiver anomalies
            can mimic coherent narrowband signals with non-zero Doppler drift.
          </p>
        </div>
      </div>
    </aside>
  );
}
