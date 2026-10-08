import { EVALUATION_BASELINES } from '../data/dossierData.ts';
import { SlidersHorizontal, TestTube } from 'lucide-react';

export function EvaluationStrategySection() {
  const ABLATION_STUDIES = [
    {
      name: 'Ablation A: Without Neural Latent Encoding',
      mechanism:
        'Compute anomaly scores directly on raw spectrogram pixel variance and spectral kurtosis.',
      question:
        'Does deep self-supervised representation learning outperform classic tabular statistics?',
    },
    {
      name: 'Ablation B: Without Reconstruction Residual Loss',
      mechanism:
        'Score anomalies using latent density distances (k-NN) exclusively, disabling autoencoder decoder.',
      question:
        'Is pixel-level reconstruction fidelity necessary if latent clustering is sufficiently discriminative?',
    },
    {
      name: 'Ablation C: Without Doppler Drift Acceleration Filter',
      mechanism:
        'Rank candidates strictly by spectral rarity without testing topocentric drift consistency (df/dt).',
      question:
        'How severely does false-positive RFI contamination increase when kinematic constraints are omitted?',
    },
    {
      name: 'Ablation D: Without Multi-Beam Spatial Nulling',
      mechanism:
        'Evaluate candidates observed in single-beam mode without spatial coincidence subtraction.',
      question:
        'What percentage of surfaced anomalies originate from far-sidelobe terrestrial interference?',
    },
  ];

  return (
    <section id="evaluation-strategy" className="space-y-6 scroll-mt-24">
      {/* Chapter Number & Title */}
      <div className="space-y-1 border-b border-[#E4E1D9] pb-3">
        <div className="font-mono text-xs text-[#376A9B] font-semibold tracking-wider uppercase">
          10 / Evaluation Strategy & Baselines
        </div>
        <h2 className="text-2xl sm:text-3xl font-serif font-normal text-[#17202A] tracking-tight">
          Empirical Validation Protocol & Comparative Benchmarks
        </h2>
        <p className="text-xs text-[#7E8B96] font-mono">
          Synthetic anomaly injection methodology, baseline algorithm comparison, and planned
          ablation experiments.
        </p>
      </div>

      {/* Methodology Exposition */}
      <div className="space-y-4 text-base text-[#56616A] leading-relaxed font-sans">
        <p>
          A machine learning model in observational astronomy earns its place only if it can be
          proven to prioritize useful candidates more effectively than classical signal-processing
          baselines. Because verified extraterrestrial technosignatures do not exist to provide
          positive training labels, AETHON must be evaluated through a rigorous{' '}
          <strong className="text-[#17202A]">Synthetic Injection & Blind Recovery Protocol</strong>.
        </p>
      </div>

      {/* Synthetic Injection Protocol Card */}
      <div className="p-5 bg-[#FAF8F5] border border-[#D6D2C9] rounded-[2px] space-y-3">
        <div className="flex items-center gap-2 font-mono text-xs font-semibold text-[#17202A] uppercase tracking-wider border-b border-[#E4E1D9] pb-2">
          <TestTube className="h-4 w-4 text-[#376A9B]" />
          <span>Synthetic Signal Injection Experimental Protocol</span>
        </div>
        <p className="text-xs text-[#56616A] leading-relaxed">
          Synthetic signals with parameterized properties are programmatically injected into raw
          observatory noise files at controlled signal-to-noise ratios (SNR):
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs font-mono">
          <div className="p-2.5 bg-[#F4F1EA] rounded-[2px] border border-[#E4E1D9]">
            <span className="text-[#7E8B96] block text-[10px]">DRIFT VELOCITY</span>
            <span className="text-[#17202A]">df/dt: -5.0 to +5.0 Hz/s</span>
          </div>
          <div className="p-2.5 bg-[#F4F1EA] rounded-[2px] border border-[#E4E1D9]">
            <span className="text-[#7E8B96] block text-[10px]">INJECTION SNR</span>
            <span className="text-[#17202A]">SNR: 3 to 25 sigma</span>
          </div>
          <div className="p-2.5 bg-[#F4F1EA] rounded-[2px] border border-[#E4E1D9]">
            <span className="text-[#7E8B96] block text-[10px]">TEMPORAL DURATION</span>
            <span className="text-[#17202A]">Duration: 30s to 600s</span>
          </div>
          <div className="p-2.5 bg-[#F4F1EA] rounded-[2px] border border-[#E4E1D9]">
            <span className="text-[#7E8B96] block text-[10px]">BANDWIDTH</span>
            <span className="text-[#17202A]">df: 3.8 Hz to 50 kHz</span>
          </div>
          <div className="p-2.5 bg-[#F4F1EA] rounded-[2px] border border-[#E4E1D9]">
            <span className="text-[#7E8B96] block text-[10px]">MODULATION SCHEMES</span>
            <span className="text-[#17202A]">CW, FSK, Pulsed, Chirp</span>
          </div>
          <div className="p-2.5 bg-[#F4F1EA] rounded-[2px] border border-[#E4E1D9]">
            <span className="text-[#7E8B96] block text-[10px]">RFI CONTAMINATION</span>
            <span className="text-[#17202A]">Synthetic GPS / Starlink</span>
          </div>
        </div>

        <p className="text-[11.5px] text-[#7E8B96] pt-1">
          <strong>Key Evaluation Metric:</strong> Recovery Recall ($R@K$), measuring the percentage
          of injected anomalies appearing within the top $K=50$ candidates ranked by the model.
        </p>
      </div>

      {/* Comparative Baselines Table */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-mono font-semibold text-[#17202A] uppercase tracking-wider">
          Standard Comparative Baselines
        </h3>

        <div className="overflow-x-auto border border-[#D6D2C9] rounded-[2px] bg-[#FAF8F5]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-[#EAE7E0] border-b border-[#D6D2C9] text-[#17202A] font-mono text-[11px]">
                <th className="py-2 px-3">Baseline System</th>
                <th className="py-2 px-3">Methodology Type</th>
                <th className="py-2 px-3">Detection Principle</th>
                <th className="py-2 px-3">Role in Benchmarking</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E1D9] text-[#56616A]">
              {EVALUATION_BASELINES.map((b) => (
                <tr key={b.name} className="hover:bg-[#F4F1EA] transition-colors">
                  <td className="py-2.5 px-3 font-medium text-[#17202A] font-sans whitespace-nowrap">
                    {b.name}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-[#376A9B] whitespace-nowrap">
                    {b.type}
                  </td>
                  <td className="py-2.5 px-3 text-xs leading-relaxed">{b.mechanism}</td>
                  <td className="py-2.5 px-3 text-xs leading-relaxed">{b.roleInEvaluation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Planned Ablation Studies */}
      <div className="space-y-3 pt-2">
        <h3 className="text-sm font-mono font-semibold text-[#17202A] uppercase tracking-wider flex items-center gap-1.5">
          <SlidersHorizontal className="h-4 w-4 text-[#376A9B]" />
          <span>Planned Scientific Ablation Studies</span>
        </h3>

        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          {ABLATION_STUDIES.map((ab) => (
            <div
              key={ab.name}
              className="p-3.5 bg-[#FAF8F5] border border-[#D6D2C9] rounded-[2px] space-y-1.5"
            >
              <div className="font-mono text-xs font-semibold text-[#17202A]">{ab.name}</div>
              <p className="text-[#56616A] text-[11.5px] leading-relaxed">{ab.mechanism}</p>
              <div className="text-[10.5px] text-[#376A9B] font-mono border-t border-[#E4E1D9] pt-1.5">
                Evaluation Question: {ab.question}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
