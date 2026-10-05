interface NarrativeSection5Props {
  progress: number; // 0.78 to 0.90
}

export function NarrativeSection5({ progress }: NarrativeSection5Props) {
  const sectionAlpha =
    Math.min(1, Math.max(0, (progress - 0.78) * 10)) *
    Math.min(1, Math.max(0, (0.9 - progress) * 10));

  return (
    <div
      className="absolute inset-0 flex flex-col justify-between pointer-events-none select-none p-6 transition-opacity duration-300"
      style={{ opacity: sectionAlpha }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pt-10 sm:pt-14 px-2 sm:px-8 font-mono">
        <div>
          <span className="text-[10px] tracking-[0.25em] text-cyan-400 uppercase font-semibold">
            SECTION 05 // THE DISCOVERY
          </span>
          <p className="text-[9px] text-slate-400 mt-0.5">
            CANDIDATE ISOLATION & TOPOCENTRIC CONFIRMATION
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="text-[10px] font-mono text-emerald-400 font-semibold tracking-wider">
            ANOMALY VERIFIED
          </span>
        </div>
      </div>

      {/* Main Center Discovery Dossier */}
      <div className="relative w-full max-w-4xl mx-auto text-center my-auto px-4">
        <div className="space-y-1 mb-6">
          <p className="text-xl sm:text-2xl font-light text-slate-400 font-sans tracking-tight">
            NOT NOISE.
          </p>
          <p className="text-xl sm:text-2xl font-light text-slate-400 font-sans tracking-tight">
            NOT INTERFERENCE.
          </p>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-light tracking-tight text-cyan-300 font-sans mt-3">
            AN UNKNOWN SYSTEMATIC EMISSION.
          </h2>
        </div>

        {/* Telemetry Card for the Candidate */}
        <div className="mt-8 mx-auto max-w-2xl rounded-lg border border-cyan-800/60 bg-slate-950/80 p-4 sm:p-6 backdrop-blur-md text-left font-mono">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3 mb-4">
            <div>
              <span className="text-[10px] text-slate-400">IDENTIFIER:</span>
              <span className="text-sm font-semibold text-slate-100 ml-2">SIG-2026-089A</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400">PRIORITY:</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800/80 text-rose-300">
                CRITICAL // TIER 1
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400">TARGET: </span>
              <span className="text-slate-200">Proxima Centauri [Centaurus]</span>
            </div>
            <div>
              <span className="text-slate-400">COORDINATES: </span>
              <span className="text-slate-200">RA 14h 29m 42.9s | DEC -62° 40′ 46″</span>
            </div>
            <div>
              <span className="text-slate-400">OBSERVED FREQ: </span>
              <span className="text-cyan-400">1420.4057 MHz [HI REST OFFSET]</span>
            </div>
            <div>
              <span className="text-slate-400">DOPPLER DRIFT: </span>
              <span className="text-cyan-300">-0.32 Hz/s [BARYCENTRIC CONFIRMED]</span>
            </div>
            <div>
              <span className="text-slate-400">ANOMALY SCORE: </span>
              <span className="text-emerald-400 font-semibold">0.942 [99.84% DIVERGENCE]</span>
            </div>
            <div>
              <span className="text-slate-400">TELESCOPE APERTURE: </span>
              <span className="text-slate-200">Green Bank 100m Dish</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Telemetry Status */}
      <div className="flex items-center justify-between font-mono text-[10px] text-slate-400 pb-10 sm:pb-14 px-2 sm:px-8">
        <div>
          <span>TOPOCENTRIC VERIFICATION: </span>
          <span className="text-emerald-400">NON-TERRESTRIAL ROTATIONAL COMPENSATED</span>
        </div>
        <div>
          <span>DOSSIER STATUS: </span>
          <span className="text-cyan-400">QUEUED FOR MULTI-OBSERVATORY TRIANGULATION</span>
        </div>
      </div>
    </div>
  );
}
