import { Shield, Ban, CheckCircle } from 'lucide-react';

export function EthicsAndRestraintSection() {
  const WHAT_AETHON_IS_NOT = [
    'An alien detector or autonomous proof of extraterrestrial intelligence.',
    'A replacement for human astronomers, astrophysicists, or observatories.',
    'An autonomous scientific oracle that declares discoveries without oversight.',
    'A guaranteed detector of new fundamental physics.',
    'A substitute for independent multi-observatory follow-up pointings.',
    'A closed-world classifier pretending to assign labels to uncharacterized phenomena.',
  ];

  const WHAT_AETHON_IS = [
    'An open-set anomaly screening and candidate-prioritization framework.',
    'A computational instrument that helps astronomers focus limited attention.',
    'An unsupervised baseline model capturing normal spectrotemporal sky topology.',
    'A provenance preservation system ensuring all candidates are reproducible.',
    'A human-in-the-loop workstation built on epistemological humility.',
  ];

  return (
    <section id="ethics-and-restraint" className="space-y-6 scroll-mt-24">
      {/* Chapter Number & Title */}
      <div className="space-y-1 border-b border-[#E4E1D9] pb-3">
        <div className="font-mono text-xs text-[#376A9B] font-semibold tracking-wider uppercase">
          15 / Scientific Restraint & Communication Ethics
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-normal text-[#17202A] tracking-tight">
          What AETHON Is Not & The Ethics of Scientific Disclosure
        </h2>
        <p className="text-xs text-[#7E8B96] font-mono">
          Rigorous boundaries, avoidance of sensationalism, and responsible public scientific
          communication.
        </p>
      </div>

      {/* Comparison Grid: What AETHON Is Not vs What AETHON Is */}
      <div className="grid md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 bg-[#FAF8F5] border border-[#D6D2C9] rounded-[2px] space-y-3">
          <div className="font-mono text-xs font-semibold text-[#B64B4B] uppercase tracking-wider flex items-center gap-1.5">
            <Ban className="h-4 w-4 text-[#B64B4B]" />
            <span>What AETHON Is NOT</span>
          </div>
          <ul className="space-y-2 text-[#56616A]">
            {WHAT_AETHON_IS_NOT.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-[#B64B4B] font-bold">✕</span>
                <span className="leading-relaxed font-sans">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 bg-[#FAF8F5] border border-[#D6D2C9] rounded-[2px] space-y-3">
          <div className="font-mono text-xs font-semibold text-[#3D7D54] uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle className="h-4 w-4 text-[#3D7D54]" />
            <span>What AETHON IS</span>
          </div>
          <ul className="space-y-2 text-[#56616A]">
            {WHAT_AETHON_IS.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-[#3D7D54] font-bold">✓</span>
                <span className="leading-relaxed font-sans">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Scientific Communication Policy Card */}
      <div className="p-5 bg-[#FAF8F5] border-l-3 border-[#376A9B] border border-[#D6D2C9] rounded-r-[2px] space-y-3 my-4">
        <div className="flex items-center gap-2 font-mono text-xs font-semibold text-[#17202A] uppercase tracking-wider">
          <Shield className="h-4 w-4 text-[#376A9B]" />
          <span>Institutional Communication Policy</span>
        </div>
        <p className="text-xs sm:text-sm text-[#56616A] leading-relaxed">
          The history of astronomy is replete with premature declarations: the initial discovery of
          pulsars in 1967 was half-seriously labeled "LGM-1" (Little Green Men) before being
          identified as rotating neutron stars; the BLC1 candidate in 2020 was widely reported by
          media outlets before being proven as terrestrial intermodulation.
        </p>
        <p className="text-xs sm:text-sm text-[#56616A] leading-relaxed">
          Project AETHON enforces a strict code of scientific communication: mathematical anomaly
          scores must never be conflated with the probability of extraterrestrial intelligence. All
          unresolved candidates must remain subject to peer review, spatial nulling, and
          multi-facility confirmation before any public claim of discovery.
        </p>
      </div>
    </section>
  );
}
