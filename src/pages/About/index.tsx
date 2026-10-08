import { PageTransition } from '@/components/ui/motion.tsx';

export default function AboutPage() {
  return (
    <PageTransition className="space-y-8 max-w-4xl mx-auto py-6 font-sans">
      {/* Title & Scientific Mission */}
      <div className="space-y-2 border-b border-[#172230] pb-6">
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#E6EDF2]">
          About Project Aethon
        </h1>
        <p className="text-sm text-[#7F8B95] leading-relaxed max-w-2xl">
          An unsupervised discovery instrument for detecting anomalous spectrotemporal signatures in
          high-cadence radio astronomy surveys.
        </p>
      </div>

      {/* Main Content Body */}
      <div className="space-y-8 text-sm text-[#7F8B95] leading-relaxed">
        {/* Section 1: The Scientific Problem */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[#E6EDF2]">
            The Radio Frequency Interference Challenge
          </h2>
          <p>
            Modern radio observatories record petabytes of wideband baseband data every day.
            Traditional search algorithms rely on rigid thresholding and matched filters, which
            struggle under the escalating density of terrestrial and orbital radio frequency
            interference (RFI)—including low-Earth orbit megaconstellations, aircraft transponders,
            and mobile cellular networks.
          </p>
          <p>
            Aethon approaches the problem from an unsupervised perspective. Rather than searching
            only for known, hand-engineered signal templates, the instrument learns high-dimensional
            representations of nominal cosmic background noise and isolates coherent statistical
            deviations.
          </p>
        </section>

        {/* Section 2: Core Methodology */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[#E6EDF2]">Methodological Architecture</h2>
          <div className="grid sm:grid-cols-2 gap-4 pt-1">
            <div className="rounded border border-[#172230] bg-[#0B0F14] p-4 space-y-1.5">
              <h3 className="text-xs font-semibold text-[#E6EDF2]">Polyphase Filterbanks (PFB)</h3>
              <p className="text-xs text-[#7F8B95] leading-relaxed">
                Raw dual-polarization voltages are decomposed into fine frequency channels (3.8 Hz
                resolution) with steep out-of-band rejection to prevent spectral leakage between
                adjacent channels.
              </p>
            </div>

            <div className="rounded border border-[#172230] bg-[#0B0F14] p-4 space-y-1.5">
              <h3 className="text-xs font-semibold text-[#E6EDF2]">
                Spectrotemporal Representation
              </h3>
              <p className="text-xs text-[#7F8B95] leading-relaxed">
                Channelized waterfall patches are transformed into continuous embeddings capturing
                carrier morphology, bandwidth, and Doppler drift rates across integration windows.
              </p>
            </div>

            <div className="rounded border border-[#172230] bg-[#0B0F14] p-4 space-y-1.5">
              <h3 className="text-xs font-semibold text-[#E6EDF2]">Multi-Beam Differencing</h3>
              <p className="text-xs text-[#7F8B95] leading-relaxed">
                Signals appearing simultaneously in on-target and off-target antenna pointings are
                automatically rejected as local terrestrial interference rather than celestial
                sources.
              </p>
            </div>

            <div className="rounded border border-[#172230] bg-[#0B0F14] p-4 space-y-1.5">
              <h3 className="text-xs font-semibold text-[#E6EDF2]">Doppler Frame Consistency</h3>
              <p className="text-xs text-[#7F8B95] leading-relaxed">
                Surviving candidates are validated against topocentric acceleration and Earth
                orbital motion models, verifying physical drift characteristics before queuing for
                review.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Data Interoperability & Formats */}
        <section className="space-y-3">
          <h2 className="text-base font-semibold text-[#E6EDF2]">Data Interoperability</h2>
          <p>
            Aethon interfaces with open astronomical data pipelines and supports standard raw and
            processed container formats:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs">
            <li>
              <strong className="text-[#E6EDF2]">SIGPROC Filterbank (.fil):</strong> Standard format
              for pulsar and continuous-wave search surveys.
            </li>
            <li>
              <strong className="text-[#E6EDF2]">HDF5 (.h5):</strong> Hierarchical spectral
              collections used by high-cadence observing campaigns.
            </li>
            <li>
              <strong className="text-[#E6EDF2]">FITS (.fits):</strong> Calibrated radio spectral
              cubes and astronomical metadata archives.
            </li>
          </ul>
        </section>

        {/* Section 4: Operational Principles */}
        <section className="space-y-2 border-t border-[#172230] pt-6">
          <h2 className="text-base font-semibold text-[#E6EDF2]">Human-in-the-Loop Protocol</h2>
          <p className="text-xs text-[#7F8B95] leading-relaxed">
            Aethon is an anomaly screening instrument, not an autonomous discovery engine.
            Algorithms surface statistical outliers across petabyte archives; astronomers inspect,
            cross-match, and verify physical hypotheses.
          </p>
        </section>
      </div>
    </PageTransition>
  );
}
