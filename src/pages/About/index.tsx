import { PageTransition } from '@/components/ui/motion.tsx';

export default function AboutPage() {
  return (
    <PageTransition className="space-y-12 max-w-3xl mx-auto py-10 px-4 sm:px-6 font-sans">
      {/* Title & Scientific Mission */}
      <header className="space-y-4 border-b border-[#D6D2C9] pb-8">
        <div className="flex items-center gap-2 text-xs font-mono text-[#76828D]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#376A9B]" />
          <span>RESEARCH NOTE & OBSERVATORY MANIFESTO</span>
        </div>

        <h1 className="text-4xl sm:text-5xl font-normal tracking-tight text-[#17202A] font-serif">
          Project Aethon
        </h1>

        <p className="text-lg text-[#56616A] leading-relaxed font-serif">
          An unsupervised discovery instrument for detecting anomalous spectrotemporal signatures in
          high-cadence astronomical radio surveys.
        </p>

        <div className="pt-3">
          <blockquote className="border-l-2 border-[#376A9B] pl-4 italic text-base text-[#17202A] font-serif">
            “We are looking at something we do not completely understand.”
          </blockquote>
        </div>
      </header>

      {/* Main Content Body */}
      <div className="space-y-12 text-sm text-[#56616A] leading-relaxed">
        {/* Section 1: The Core Thesis */}
        <section className="space-y-4">
          <h2 className="text-2xl font-normal text-[#17202A] font-serif">Observatory philosophy</h2>
          <p className="text-base text-[#56616A]">
            AETHON was conceived around a fundamental premise in observational science: most signals
            recorded by a radio telescope fit what we already understand. Astrophysical thermal
            noise, interstellar plasma dispersion, pulsar rotation periods, and terrestrial
            interference make up more than 99.9% of observational volume.
          </p>
          <p className="text-base text-[#17202A] font-medium font-serif italic">
            The scientifically interesting phenomena begin where that assumption fails.
          </p>
          <p className="text-base text-[#56616A]">
            A standard classifier attempts to match incoming energy against historical templates.
            But when searching for uncataloged celestial phenomena or non-terrestrial
            techno-signatures, pre-programmed templates introduce human bias. AETHON instead models
            the continuous manifold of nominal cosmic background, identifying signals whose
            spectrotemporal coherence deviates mathematically from expected distributions.
          </p>
        </section>

        {/* Section 2: Methodological Foundations */}
        <section className="space-y-4 border-t border-[#D6D2C9] pt-8">
          <h2 className="text-2xl font-normal text-[#17202A] font-serif">
            Methodological principles
          </h2>

          <div className="space-y-6 pt-2">
            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold text-[#17202A]">
                1. Polyphase filterbank channelization
              </h3>
              <p className="text-xs text-[#56616A] leading-relaxed">
                Raw dual-polarization voltages from telescope receivers are channelized down to 3.8
                Hz spectral bins with steep out-of-band rejection, minimizing inter-channel leakage
                before latent feature extraction.
              </p>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold text-[#17202A]">
                2. Continuous manifold representation
              </h3>
              <p className="text-xs text-[#56616A] leading-relaxed">
                Time-frequency patches are projected into a 768-dimensional latent space. Rather
                than discrete labels, the system tracks carrier morphology, temporal persistence,
                bandwidth dispersion, and Doppler drift rates as continuous paths.
              </p>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold text-[#17202A]">
                3. Spatial multi-beam differencing
              </h3>
              <p className="text-xs text-[#56616A] leading-relaxed">
                Terrestrial transmitters enter through antenna sidelobes and appear across multiple
                simultaneous pointings. AETHON requires on-target persistence coupled with
                off-target absence before elevating an event to candidate status.
              </p>
            </div>

            <div className="space-y-1.5">
              <h3 className="text-sm font-semibold text-[#17202A]">
                4. Barycentric Doppler drift consistency
              </h3>
              <p className="text-xs text-[#56616A] leading-relaxed">
                Candidate signals must exhibit topocentric frequency acceleration consistent with
                Earth orbital rotation and target line-of-sight acceleration, filtering out
                ground-based static interference.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Data Interoperability */}
        <section className="space-y-4 border-t border-[#D6D2C9] pt-8">
          <h2 className="text-2xl font-normal text-[#17202A] font-serif">
            Astronomical data formats
          </h2>
          <p className="text-sm text-[#56616A]">
            AETHON operates on standard open container formats used across global radio astronomy
            facilities:
          </p>

          <div className="grid sm:grid-cols-3 gap-4 pt-1">
            <div className="p-3.5 rounded-[3px] border border-[#D6D2C9] bg-[#FAF8F5] space-y-1.5 shadow-xs">
              <span className="font-mono text-xs text-[#376A9B] font-semibold block">
                SIGPROC (.fil)
              </span>
              <p className="text-xs text-[#56616A]">
                Standard format for pulsar surveys and high-cadence raw time-frequency streams.
              </p>
            </div>

            <div className="p-3.5 rounded-[3px] border border-[#D6D2C9] bg-[#FAF8F5] space-y-1.5 shadow-xs">
              <span className="font-mono text-xs text-[#376A9B] font-semibold block">
                HDF5 (.h5)
              </span>
              <p className="text-xs text-[#56616A]">
                Hierarchical multi-channel collections used in wideband spectral surveys.
              </p>
            </div>

            <div className="p-3.5 rounded-[3px] border border-[#D6D2C9] bg-[#FAF8F5] space-y-1.5 shadow-xs">
              <span className="font-mono text-xs text-[#376A9B] font-semibold block">
                FITS (.fits)
              </span>
              <p className="text-xs text-[#56616A]">
                Flexible Image Transport System cubes and calibrated archival observations.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Scientific Restraint */}
        <section className="space-y-3 border-t border-[#D6D2C9] pt-8 pb-12">
          <h2 className="text-2xl font-normal text-[#17202A] font-serif">
            Epistemological boundary
          </h2>
          <p className="leading-relaxed text-sm text-[#56616A]">
            AETHON is an anomaly screening instrument, not an autonomous oracle. An anomaly is not a
            discovery; it is a reason for an astronomer to examine an observation with closer
            scrutiny, check for instrumental gain artifacts, and coordinate independent
            multi-observatory replication.
          </p>
          <p className="text-sm text-[#17202A] pt-3 italic font-serif">
            “Something is there. We are trying to understand it.”
          </p>
        </section>
      </div>
    </PageTransition>
  );
}
