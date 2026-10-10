import { useState } from 'react';
import { Info } from 'lucide-react';

export function ConceptualLatentSpace() {
  const [activeDomain, setActiveDomain] = useState<'nominal' | 'boundary' | 'anomaly'>('nominal');

  return (
    <div className="border-t border-[#D6D2C9] pt-6 select-none space-y-4 font-sans">
      {/* Title Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D6D2C9] pb-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#17202A]">Feature Space Schematic</h3>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#76828D]">
              Non-Quantitative Conceptual Model
            </span>
          </div>
          <p className="text-xs text-[#56616A] mt-0.5">
            Architectural schematic illustrating the principle of separating nominal thermal
            background distributions from isolated anomalous candidates.
          </p>
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs font-mono">
          <span className="text-[10px] uppercase tracking-wider text-[#376A9B] bg-[#F4F8FA] px-2 py-0.5 rounded-[2px] border border-[#376A9B]/20 font-semibold">
            Methodological Schematic
          </span>
        </div>
      </div>

      {/* Scientific Footnote */}
      <div className="border-l-2 border-[#376A9B] pl-3 py-2 text-xs text-[#56616A] leading-relaxed flex items-start gap-2 bg-[#FAF8F5] p-2.5 rounded-r-[2px] border-y border-r border-[#D6D2C9]">
        <Info className="h-4 w-4 text-[#376A9B] shrink-0 mt-0.5" />
        <span>
          <strong className="text-[#17202A] font-semibold font-mono text-[11px] uppercase tracking-wider block mb-0.5">
            Methodological Disclosure & Truthfulness Note
          </strong>
          AETHON does not currently deploy an active learned latent embedding space or continuous
          token manifold in production. The operational backend uses robust radiometric statistical
          baselines and Isolation Forest anomaly scoring. This schematic illustrates the
          mathematical concept of density-based outlier isolation without presenting fabricated
          cluster counts or synthetic embedding points.
        </span>
      </div>

      {/* Schematic Diagram Viewport (Dark Instrument) */}
      <div className="relative rounded-[3px] border border-[#213240] bg-[#0D141A] overflow-hidden shadow-md p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Visual SVG Conceptual Architecture */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center">
            <svg
              viewBox="0 0 460 300"
              className="w-full max-w-[440px] h-auto select-none"
              aria-label="Conceptual feature space decision boundary diagram"
            >
              {/* Coordinate Grid Frame */}
              <defs>
                <radialGradient id="nominalGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#376A9B" stopOpacity="0.35" />
                  <stop offset="70%" stopColor="#1E3A52" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#0D141A" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="anomalyGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#C19348" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#0D141A" stopOpacity="0" />
                </radialGradient>
              </defs>

              {/* Grid Lines */}
              <line
                x1="30"
                y1="150"
                x2="430"
                y2="150"
                stroke="#1D2A37"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <line
                x1="230"
                y1="20"
                x2="230"
                y2="280"
                stroke="#1D2A37"
                strokeWidth="1"
                strokeDasharray="3 3"
              />

              {/* Concentric Calibration Reticles */}
              <circle cx="180" cy="150" r="100" stroke="#1D2A37" strokeWidth="1" fill="none" />
              <circle
                cx="180"
                cy="150"
                r="65"
                stroke="#213240"
                strokeWidth="1"
                strokeDasharray="2 4"
                fill="none"
              />

              {/* High-Density Nominal Sky Distribution Domain */}
              <ellipse
                cx="180"
                cy="150"
                rx="85"
                ry="60"
                fill="url(#nominalGlow)"
                stroke={activeDomain === 'nominal' ? '#5C89B7' : '#2A4358'}
                strokeWidth={activeDomain === 'nominal' ? '2' : '1.2'}
                className="transition-all cursor-pointer"
                onClick={() => setActiveDomain('nominal')}
              />

              {/* Nominal Centroid Marker */}
              <circle cx="180" cy="150" r="4" fill="#5C89B7" />
              <text
                x="180"
                y="140"
                fill="#E3EBF2"
                fontSize="11"
                fontFamily="sans-serif"
                textAnchor="middle"
                fontWeight="600"
              >
                Nominal Sky Baseline
              </text>
              <text
                x="180"
                y="166"
                fill="#8EA8BD"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="middle"
              >
                Thermal Gaussian Noise Density
              </text>

              {/* Isolation Decision Boundary Contour */}
              <ellipse
                cx="180"
                cy="150"
                rx="125"
                ry="95"
                fill="none"
                stroke={activeDomain === 'boundary' ? '#C19348' : '#3E566A'}
                strokeWidth={activeDomain === 'boundary' ? '2' : '1.2'}
                strokeDasharray="4 4"
                className="transition-all cursor-pointer"
                onClick={() => setActiveDomain('boundary')}
              />
              <text
                x="290"
                y="70"
                fill={activeDomain === 'boundary' ? '#C19348' : '#7C8E9E'}
                fontSize="9"
                fontFamily="monospace"
                textAnchor="middle"
              >
                Anomaly Decision Boundary (&tau; &gt; 3.5&sigma;)
              </text>

              {/* Low-Density Outlier Anomaly Domain */}
              <circle
                cx="370"
                cy="75"
                r="38"
                fill="url(#anomalyGlow)"
                stroke={activeDomain === 'anomaly' ? '#E0B56C' : '#9E6E20'}
                strokeWidth={activeDomain === 'anomaly' ? '2' : '1.2'}
                className="transition-all cursor-pointer"
                onClick={() => setActiveDomain('anomaly')}
              />
              <circle cx="370" cy="75" r="3.5" fill="#E0B56C" />
              <text
                x="370"
                y="65"
                fill="#E0B56C"
                fontSize="10"
                fontFamily="sans-serif"
                textAnchor="middle"
                fontWeight="600"
              >
                Outlier Domain
              </text>
              <text
                x="370"
                y="90"
                fill="#C19348"
                fontSize="8.5"
                fontFamily="monospace"
                textAnchor="middle"
              >
                Persistent Carrier
              </text>

              {/* Feature Axis Labels */}
              <text
                x="430"
                y="165"
                fill="#6A7E8F"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="end"
              >
                Feature 1 (&sigma; deviation) &rarr;
              </text>
              <text
                x="240"
                y="28"
                fill="#6A7E8F"
                fontSize="9"
                fontFamily="monospace"
                textAnchor="start"
              >
                &uarr; Feature 2 (temporal persistence)
              </text>
            </svg>
          </div>

          {/* Interactive Pedagogical Detail Panel */}
          <div className="lg:col-span-5 space-y-3.5 bg-[#111A22] border border-[#213240] rounded-[3px] p-4 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-[#213240] pb-2">
              <span className="text-[11px] uppercase tracking-wider text-[#7C8E9E]">
                Conceptual Element
              </span>
              <span className="text-[10px] text-[#5C89B7] uppercase font-semibold">
                {activeDomain === 'nominal'
                  ? 'High-Density Nominal'
                  : activeDomain === 'boundary'
                    ? 'Isolation Boundary'
                    : 'Low-Density Outlier'}
              </span>
            </div>

            {activeDomain === 'nominal' && (
              <div className="space-y-2 text-[#A6B7C6] font-sans">
                <p className="text-xs text-[#E3EBF2] font-medium">
                  High-Density Nominal Distribution
                </p>
                <p className="text-[11px] text-[#A6B7C6] leading-relaxed">
                  In nominal sky observations, thermal noise, stable background emissions, and
                  instrumental baselines concentrate in a dense statistical core. In AETHON, this is
                  modeled via robust median and Median Absolute Deviation (MAD).
                </p>
                <div className="pt-2 border-t border-[#213240] text-[10px] font-mono text-[#5C89B7]">
                  Backend Implementation: Robust Median / MAD baseline
                </div>
              </div>
            )}

            {activeDomain === 'boundary' && (
              <div className="space-y-2 text-[#A6B7C6] font-sans">
                <p className="text-xs text-[#E3EBF2] font-medium">
                  Isolation &amp; Deviance Threshold
                </p>
                <p className="text-[11px] text-[#A6B7C6] leading-relaxed">
                  The boundary separating nominal sky observations from candidates is determined by
                  isolation path length in an Isolation Forest and standard deviations above noise
                  floor, rather than arbitrary manual cutoffs.
                </p>
                <div className="pt-2 border-t border-[#213240] text-[10px] font-mono text-[#C19348]">
                  Backend Implementation: IsolationForest (n_estimators=100)
                </div>
              </div>
            )}

            {activeDomain === 'anomaly' && (
              <div className="space-y-2 text-[#A6B7C6] font-sans">
                <p className="text-xs text-[#E3EBF2] font-medium">
                  Outlier Domain (Candidate Signals)
                </p>
                <p className="text-[11px] text-[#A6B7C6] leading-relaxed">
                  Signals residing far outside the nominal density manifold exhibit low isolation
                  depth and high statistical deviance. Surviving coherent narrowband signals are
                  subsequently subjected to Doppler drift regression.
                </p>
                <div className="pt-2 border-t border-[#213240] text-[10px] font-mono text-[#E0B56C]">
                  Backend Implementation: Linear OLS Drift Regression
                </div>
              </div>
            )}

            {/* Element Selector Buttons */}
            <div className="pt-3 border-t border-[#213240] flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setActiveDomain('nominal')}
                className={`px-2 py-1 rounded-[2px] text-[10px] uppercase font-mono transition-colors cursor-pointer ${
                  activeDomain === 'nominal'
                    ? 'bg-[#376A9B] text-white'
                    : 'bg-[#182632] text-[#A6B7C6] hover:text-white'
                }`}
              >
                Nominal Core
              </button>
              <button
                type="button"
                onClick={() => setActiveDomain('boundary')}
                className={`px-2 py-1 rounded-[2px] text-[10px] uppercase font-mono transition-colors cursor-pointer ${
                  activeDomain === 'boundary'
                    ? 'bg-[#9E6E20] text-white'
                    : 'bg-[#182632] text-[#A6B7C6] hover:text-white'
                }`}
              >
                Threshold Boundary
              </button>
              <button
                type="button"
                onClick={() => setActiveDomain('anomaly')}
                className={`px-2 py-1 rounded-[2px] text-[10px] uppercase font-mono transition-colors cursor-pointer ${
                  activeDomain === 'anomaly'
                    ? 'bg-[#C19348] text-white'
                    : 'bg-[#182632] text-[#A6B7C6] hover:text-white'
                }`}
              >
                Candidate Outlier
              </button>
            </div>
          </div>
        </div>

        {/* Legend Overlay */}
        <div className="mt-4 pt-3 border-t border-[#213240] flex flex-wrap items-center justify-between gap-3 text-[10px] font-mono text-[#7C8E9E]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#376A9B]" />
              <span>Nominal Sky Core</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full border border-dashed border-[#C19348]" />
              <span>Deviance Boundary</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#C19348]" />
              <span>Candidate Outlier</span>
            </div>
          </div>
          <span className="text-[#5C89B7]">
            Non-quantitative schematic &middot; No fake candidate data points
          </span>
        </div>
      </div>
    </div>
  );
}
