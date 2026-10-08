import { useState } from 'react';
import { AlertCircle, ChevronDown } from 'lucide-react';

export function ScientificCaution() {
  const [isExpanded, setIsExpanded] = useState(false);

  const cautions = [
    {
      heading: 'Statistical deviance ≠ discovery',
      body: 'Outlier detection indicates departure from learned background distributions. An anomaly is mathematical deviation, not proof of artificial origin or physical singularity.',
    },
    {
      heading: 'Model confidence ≠ empirical proof',
      body: 'A high anomaly index reflects reconstruction residual in latent space. Scientific confirmation requires independent multi-observatory replication and interferometric verification.',
    },
    {
      heading: 'Uncataloged interference sources',
      body: 'Novel satellite constellations, classified military radar, or local receiver anomalies can mimic coherent narrowband signals with non-zero Doppler drift.',
    },
  ];

  return (
    <aside className="select-none font-sans">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between py-2.5 text-left cursor-pointer group transition-colors outline-none focus-visible:ring-1 focus-visible:ring-[#376A9B] rounded-sm"
      >
        <div className="flex items-center gap-2">
          <AlertCircle className="h-3.5 w-3.5 text-[#C19348] shrink-0" />
          <span className="text-xs font-medium text-[#56616A] group-hover:text-[#17202A] transition-colors">
            Methodological uncertainty & research boundaries
          </span>
        </div>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[#76828D] transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isExpanded && (
        <div className="pb-2 space-y-3 pl-5.5">
          <p className="text-xs text-[#56616A] italic font-serif leading-relaxed">
            "An anomaly is not an answer. It is a reason to look closer."
          </p>
          {cautions.map((c) => (
            <div key={c.heading} className="space-y-0.5">
              <span className="text-xs font-semibold text-[#17202A]">{c.heading}</span>
              <p className="text-[11px] text-[#56616A] leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
