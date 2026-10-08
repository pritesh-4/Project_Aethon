import { AlertOctagon, ShieldAlert } from 'lucide-react';

export function LimitationsSection() {
  const THREATS_TO_VALIDITY = [
    {
      title: 'Contaminated Normality Baseline (RFI Leakage)',
      description:
        'If the training archive contains unflagged terrestrial interference, the neural model will learn that RFI is nominal astronomical behavior, depressing anomaly scores for real interference while raising false alarms on clean signals.',
    },
    {
      title: 'Synthetic Injection Bias',
      description:
        'Evaluating exclusively on synthetically modeled signals introduces confirmation bias: models may excel at recovering mathematically parameterized sinusoids while failing on physical astrophysical emissions with stochastic plasma fluctuations.',
    },
    {
      title: 'Inter-Instrument Domain Shift',
      description:
        'A model trained on Green Bank Telescope 100m receiver data cannot be assumed to generalize directly to MeerKAT or Parkes without transfer learning, due to distinct beam sidelobes, cryo-receiver passband ripples, and local RFI environments.',
    },
    {
      title: 'High False-Positive Review Exhaustion',
      description:
        'Even if an anomaly filter boasts a 99.9% true-negative rate, processing billions of spectral channels per hour will still overwhelm astronomer inspection capacity unless secondary kinematic filters are strictly enforced.',
    },
  ];

  return (
    <section id="limitations" className="space-y-6 scroll-mt-24">
      {/* Chapter Number & Title */}
      <div className="space-y-1 border-b border-[#E4E1D9] pb-3">
        <div className="font-mono text-xs text-[#B64B4B] font-semibold tracking-wider uppercase">
          11 / Limitations & Threats to Validity
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-normal text-[#17202A] tracking-tight">
          Scientific Red-Team Analysis & Failure Modes
        </h2>
        <p className="text-xs text-[#7E8B96] font-mono">
          Rigorous assessment of methodological boundaries, observational biases, and definitions of
          project failure.
        </p>
      </div>

      {/* Prominent Red-Team Callout */}
      <div className="p-5 bg-[#FAF8F5] border-l-3 border-[#B64B4B] border border-[#D6D2C9] rounded-r-[2px] space-y-3">
        <div className="flex items-center gap-2 font-mono text-xs font-semibold text-[#B64B4B] uppercase tracking-wider">
          <AlertOctagon className="h-4 w-4 text-[#B64B4B]" />
          <span>Epistemological Humility & System Boundaries</span>
        </div>
        <p className="text-xs sm:text-sm text-[#56616A] leading-relaxed">
          The most dangerous failure mode in computational astronomy is unwarranted confidence.
          AETHON is fundamentally an outlier detector, not a physical interpreter. Flagging a signal
          as statistically anomalous does <em>not</em> prove new physics, nor does it prove an
          extraterrestrial presence. It merely flags an observation whose spectrotemporal structure
          departs from the training baseline.
        </p>
      </div>

      {/* Threats to Validity Grid */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-mono font-semibold text-[#17202A] uppercase tracking-wider flex items-center gap-1.5">
          <ShieldAlert className="h-4 w-4 text-[#B64B4B]" />
          <span>Threats to Methodological Validity</span>
        </h3>

        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          {THREATS_TO_VALIDITY.map((t) => (
            <div
              key={t.title}
              className="p-3.5 bg-[#FAF8F5] border border-[#D6D2C9] rounded-[2px] space-y-1.5"
            >
              <div className="font-mono text-xs font-semibold text-[#17202A]">{t.title}</div>
              <p className="text-[#56616A] text-[11.5px] leading-relaxed">{t.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Definitions of Failure vs Success */}
      <div className="grid md:grid-cols-2 gap-4 pt-2 text-xs">
        <div className="p-4 bg-[#FAF8F5] border border-[#D6D2C9] rounded-[2px] space-y-2">
          <div className="font-mono text-xs font-semibold text-[#3D7D54] uppercase tracking-wider flex items-center gap-1.5">
            <span>What Meaningful Success Looks Like</span>
          </div>
          <ul className="list-disc pl-4 space-y-1 text-[#56616A] leading-relaxed">
            <li>Surfaces genuine uncatalogued spectral outliers from high-cadence streams.</li>
            <li>
              Reduces human review burden by orders of magnitude compared to manual inspection.
            </li>
            <li>Recovers 90%+ of blind synthetic injections in controlled benchmark tests.</li>
            <li>
              Maintains transparent, verifiable provenance that survives scrutiny by peer reviewers.
            </li>
            <li>
              Penalizes common satellite constellations and terrestrial transmitters effectively.
            </li>
          </ul>
        </div>

        <div className="p-4 bg-[#FAF8F5] border border-[#D6D2C9] rounded-[2px] space-y-2">
          <div className="font-mono text-xs font-semibold text-[#B64B4B] uppercase tracking-wider flex items-center gap-1.5">
            <span>What Project Failure Looks Like</span>
          </div>
          <ul className="list-disc pl-4 space-y-1 text-[#56616A] leading-relaxed">
            <li>Review queues flooded with repetitive LEO satellite transponder interference.</li>
            <li>Model learning superficial shortcut features (e.g. edge channel artifacts).</li>
            <li>Catastrophic missed detections on low-SNR drifting signals.</li>
            <li>Overconfident autonomous claims that mislead public communication.</li>
            <li>Inability to replicate anomaly scores across independent software environments.</li>
          </ul>
        </div>
      </div>
    </section>
  );
}
