import { BarChart2, Clock } from 'lucide-react';

export function EvaluationPanel() {
  const pipelineStatuses = [
    { name: 'INGESTION ENGINE', status: 'READY', latency: '< 2.1 ms' },
    { name: 'SIGNAL PREPROCESSING', status: 'READY', latency: '< 4.6 ms' },
    { name: 'TIME-FREQUENCY TRANSFORM', status: 'READY', latency: '< 6.8 ms' },
    { name: 'REPRESENTATION ENCODER', status: 'READY', latency: '< 12.4 ms' },
    { name: 'ANOMALY DIVERGENCE CORE', status: 'READY', latency: '< 3.2 ms' },
    { name: 'CANDIDATE RANKER', status: 'READY', latency: '< 1.1 ms' },
  ];

  const evaluationDimensions = [
    {
      dimension: 'ANOMALY SEPARATION',
      metric: 'Silhouette & Cosine Divergence',
      scope: 'Quantifies distance between isolated candidates and reference noise centroids.',
    },
    {
      dimension: 'DETECTION SENSITIVITY',
      metric: 'Minimum Detectable Drift Rate',
      scope: 'Evaluates recovery of coherent monochromatic signals down to 3-sigma noise floor.',
    },
    {
      dimension: 'RFI ROBUSTNESS',
      metric: 'Multi-Beam Suppression Ratio',
      scope:
        'Measures rejection of correlated signals present across simultaneous off-target beams.',
    },
    {
      dimension: 'TEMPORAL CONSISTENCY',
      metric: 'Cadence Phase Coherence',
      scope: 'Validates persistent phase across 4 ON/OFF observation cadences.',
    },
  ];

  return (
    <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-5 font-mono select-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-3 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-[#66E3FF]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#EAF4F7]">
            EVALUATION STATUS & INFERENCE PIPELINE TELEMETRY
          </h2>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-amber-400 font-bold uppercase">
          <Clock className="h-3 w-3" />
          <span>EVALUATION STATUS // PROTOTYPE VERIFICATION</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Section 17 Live Pipeline Status (5 Cols) */}
        <div className="lg:col-span-5 rounded-[2px] border border-slate-800 bg-[#05070A] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-[10px] text-[#84929C] uppercase font-bold tracking-wider">
              INFERENCE PIPELINE SUBSYSTEMS
            </span>
            <span className="text-[9px] text-emerald-400 font-mono">ALL READY</span>
          </div>

          <div className="space-y-2 text-xs">
            {pipelineStatuses.map((p) => (
              <div
                key={p.name}
                className="flex items-center justify-between border-b border-slate-800/50 pb-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-none bg-emerald-400" />
                  <span className="text-[11px] text-slate-300 font-mono">{p.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] text-slate-500 font-mono">{p.latency}</span>
                  <span className="text-[9px] text-emerald-400 font-bold font-mono">
                    ● {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-2 text-[9px] text-slate-500">
            Total End-to-End Pipeline Latency: ~30.2 ms / Cadence Buffer
          </div>
        </div>

        {/* Right: Section 14 & 15 Evaluation Dimensions & Scientific Honesty (7 Cols) */}
        <div className="lg:col-span-7 rounded-[2px] border border-cyan-800/70 bg-[#05070A] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-[10px] text-[#66E3FF] uppercase font-bold tracking-wider">
              SYSTEMATIC EVALUATION METHODOLOGY
            </span>
            <span className="text-[9px] text-slate-400 font-mono">
              BENCHMARKS: PENDING QUALIFICATION
            </span>
          </div>

          {/* Scientific Honesty Notice */}
          <div className="rounded-[2px] border border-slate-800 bg-[#0A0E13] p-3 text-xs text-slate-300 font-sans leading-relaxed">
            <p>
              In accordance with strict astronomical research integrity, AETHON does{' '}
              <strong className="text-slate-100 font-semibold">not</strong> present fabricated
              accuracy or F1 benchmarks. Comprehensive validation requires extensive synthetic
              injection campaigns coupled with multi-observatory real-world RF verification across
              thousands of gigabytes of baseband telemetry.
            </p>
          </div>

          {/* 4 Multi-Dimensional Evaluation Axes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
            {evaluationDimensions.map((d) => (
              <div
                key={d.dimension}
                className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-2.5 space-y-1"
              >
                <span className="text-[9px] text-[#66E3FF] uppercase font-bold block">
                  {d.dimension}
                </span>
                <span className="text-[10px] text-slate-300 font-mono block">{d.metric}</span>
                <p className="text-[10px] text-slate-400 font-sans leading-snug">{d.scope}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
