export function ScientificBasisSection() {
  return (
    <section id="scientific-basis" className="space-y-6 scroll-mt-24">
      {/* Chapter Number & Title */}
      <div className="space-y-1 border-b border-[#E4E1D9] pb-3">
        <div className="font-mono text-xs text-[#376A9B] font-semibold tracking-wider uppercase">
          05 / Scientific Basis
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-normal text-[#17202A] tracking-tight">
          Astronomical Observables & Physical Principles
        </h2>
        <p className="text-xs text-[#7E8B96] font-mono">
          Dynamic spectra, Doppler drift mechanics, the neutral hydrogen line, and radio-frequency
          interference.
        </p>
      </div>

      {/* Dynamic Spectra & Waterfall Representation */}
      <div className="space-y-3 text-base text-[#56616A] leading-relaxed font-sans">
        <h3 className="text-lg font-serif text-[#17202A] font-normal">
          1. Dynamic Spectra (Spectrotemporal Waterfalls)
        </h3>
        <p>
          In observational radio astronomy, continuous voltage time series from antenna feeds are
          channelized into a two-dimensional matrix known as a{' '}
          <strong className="text-[#17202A]">dynamic spectrum</strong> or{' '}
          <strong className="text-[#17202A]">waterfall plot</strong>. The horizontal axis represents
          discrete frequency channels $\nu$, the vertical axis represents sequential observation
          timestamps $t$, and the value at each matrix element $S(t, \nu)$ represents detected power
          spectral density (often recorded across dual polarizations or full Stokes parameters $I,
          Q, U, V$).
        </p>
        <p>
          This representation is mathematically powerful because distinct physical mechanisms
          produce unique geometric curves in (t, ν) space: broadband pulsars produce vertical
          dispersion curves conforming to cold-plasma laws (t ∝ ν⁻²), stationary ground transmitters
          produce vertical lines (dν/dt = 0), and accelerating orbital emitters produce slanted
          Doppler tracks.
        </p>
      </div>

      {/* The Neutral Hydrogen 21cm Line */}
      <div className="p-4 bg-[#FAF8F5] border border-[#D6D2C9] rounded-[2px] space-y-3 my-4">
        <div className="flex items-center justify-between text-xs font-mono border-b border-[#E4E1D9] pb-2">
          <span className="font-semibold text-[#17202A]">
            ASTROPHYSICAL LANDMARK: The Neutral Hydrogen 21 cm Line
          </span>
          <span className="text-[#376A9B]">1420.405751 MHz</span>
        </div>
        <p className="text-xs sm:text-sm text-[#56616A] leading-relaxed">
          The 1420.405751 MHz frequency originates from the spin-flip hyperfine transition of
          neutral atomic hydrogen (H I) in its ground electronic state (Ewen & Purcell, 1951).
          Because hydrogen is the most abundant element in the universe and this transition is
          largely unattenuated by interstellar dust, it forms the foundational reference line of
          modern galactic astronomy.
        </p>
        <div className="p-2.5 bg-[#EAE7E0]/60 rounded-[2px] border-l-2 border-[#C19348] text-xs text-[#17202A] font-sans">
          <strong className="font-semibold font-mono text-[11px] text-[#C19348] block">
            CRITICAL SCIENTIFIC DISTINCTION:
          </strong>
          In Project AETHON demonstrations, 1420 MHz is utilized exclusively as a recognized
          standard astronomical reference channel and calibration baseline. Detecting energy near
          1420 MHz is normal astrophysical behaviour and does <em>not</em> by itself constitute
          evidence of an anomalous or technological origin.
        </div>
      </div>

      {/* Doppler Drift Mechanics */}
      <div className="space-y-3 text-base text-[#56616A] leading-relaxed font-sans pt-2">
        <h3 className="text-lg font-serif text-[#17202A] font-normal">
          2. Topocentric Doppler Drift Rate ($\Delta f / \Delta t$)
        </h3>
        <p>
          Any celestial emitter observed from a ground-based radio telescope undergoes relative
          acceleration due to Earth's diurnal rotation around its axis and orbital revolution around
          the Sun. This relative motion induces a continuous Doppler frequency shift over time:
        </p>

        {/* Doppler Equation Callout */}
        <div className="p-3.5 bg-[#FAF8F5] border border-[#D6D2C9] rounded-[2px] font-mono text-xs text-[#17202A] my-3">
          <div className="text-[10px] text-[#7E8B96] mb-1">
            DOPPLER ACCELERATION DRIFT FORMULATION:
          </div>
          <div className="text-sm font-semibold text-[#376A9B] py-1">
            df / dt = f_0 × (a_parallel / c)
          </div>
          <p className="text-[11px] text-[#56616A] mt-1.5 font-sans leading-relaxed">
            Where f₀ is the emitted rest frequency, a_∥ is the line-of-sight acceleration between
            telescope and emitter, and c is the speed of light. For typical ground-based telescope
            latitudes observing at 1.4 GHz, Earth rotation contributes an apparent drift up to
            approximately ±0.16 Hz/s, while target orbital motions can induce drifts exceeding ±10
            Hz/s.
          </p>
        </div>

        <div className="p-3 bg-[#FAF8F5] border-l-2 border-[#376A9B] text-xs text-[#56616A] leading-relaxed">
          <strong className="text-[#17202A] font-medium block mb-0.5">Scientific Caveat:</strong>A
          non-zero drift rate (df/dt ≠ 0) is <em>not</em> proof of extraterrestrial origin (LEO
          satellites drift rapidly through telescope sidelobes). Conversely, zero drift (df/dt = 0)
          is <em>not</em> definitive proof of terrestrial origin (sources near celestial poles have
          near-zero projected diurnal acceleration). Drift rate is simply one component of a
          holistic physical assessment.
        </div>
      </div>

      {/* Radio Frequency Interference (RFI) */}
      <div className="space-y-3 text-base text-[#56616A] leading-relaxed font-sans pt-2">
        <h3 className="text-lg font-serif text-[#17202A] font-normal">
          3. The Interference Environment (RFI)
        </h3>
        <p>
          Radio telescopes are sensitive to fractions of a jansky (1 Jy = 10⁻²⁶ W·m⁻²·Hz⁻¹). In
          contrast, a mobile phone transmitter or satellite downlink produces billions of janskys at
          the antenna aperture. RFI presents two major taxonomy challenges:
        </p>

        <div className="grid sm:grid-cols-2 gap-3 text-xs pt-1">
          <div className="p-3 bg-[#FAF8F5] border border-[#E4E1D9] rounded-[2px] space-y-1">
            <span className="font-mono text-[10px] text-[#7E8B96] font-semibold block">
              INTERNAL / INSTRUMENTAL RFI
            </span>
            <p className="text-[#56616A]">
              Local clock harmonics, digital correlator noise, cryo-cooler compressors, and
              switching power supplies that generate stationary comb frequencies within the
              observatory electronics.
            </p>
          </div>

          <div className="p-3 bg-[#FAF8F5] border border-[#E4E1D9] rounded-[2px] space-y-1">
            <span className="font-mono text-[10px] text-[#7E8B96] font-semibold block">
              EXTERNAL / ANTHROPOGENIC RFI
            </span>
            <p className="text-[#56616A]">
              Satellite mega-constellations (Starlink, GPS, GLONASS), aircraft radar sweeps, amateur
              radio repeaters, and military telecommunications entering via primary or secondary
              beam sidelobes.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
