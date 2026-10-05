import { BarChart2 } from 'lucide-react';

export function EvaluationPanel() {
  const pipelineStatuses = [
    { name: 'Ingestion', status: 'Ready' },
    { name: 'Signal preprocessing', status: 'Ready' },
    { name: 'Time–frequency transform', status: 'Ready' },
    { name: 'Representation encoding', status: 'Ready' },
    { name: 'Anomaly divergence', status: 'Ready' },
    { name: 'Candidate ranking', status: 'Ready' },
  ];

  const evaluationDimensions = [
    {
      dimension: 'Anomaly separation',
      metric: 'Silhouette & Cosine Divergence',
      scope: 'Quantifies distance between isolated candidates and reference noise centroids.',
    },
    {
      dimension: 'Detection sensitivity',
      metric: 'Minimum Detectable Drift Rate',
      scope: 'Evaluates recovery of coherent monochromatic signals down to 3-sigma noise floor.',
    },
    {
      dimension: 'Interference robustness',
      metric: 'Multi-Beam Suppression Ratio',
      scope:
        'Measures rejection of correlated signals present across simultaneous off-target beams.',
    },
    {
      dimension: 'Temporal consistency',
      metric: 'Cadence Phase Coherence',
      scope: 'Validates persistent phase across 4 ON/OFF observation cadences.',
    },
  ];

  return (
    <div className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-5 font-mono select-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#1C2630] pb-3 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-4 w-4 text-[#5BD8F5]" />
          <h2 className="text-xs font-medium text-[#E6EDF2]">
            Evaluation and pipeline architecture
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Left: Pipeline Stages (5 Cols) */}
        <div className="lg:col-span-5 rounded-[2px] border border-[#1C2630] bg-[#06080B] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1C2630] pb-2">
            <span className="text-[10px] text-[#7F8B95] font-medium">Pipeline stages</span>
            <span className="text-[9px] text-[#5BD8F5] font-mono">Ready</span>
          </div>

          <div className="space-y-2 text-xs">
            {pipelineStatuses.map((p) => (
              <div
                key={p.name}
                className="flex items-center justify-between border-b border-[#1C2630]/50 pb-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#5BD8F5]" />
                  <span className="text-[11px] text-[#E6EDF2] font-mono">{p.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] text-[#5BD8F5] font-mono">{p.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Evaluation Dimensions & Scientific Caution (7 Cols) */}
        <div className="lg:col-span-7 rounded-[2px] border border-[#1C2630] bg-[#06080B] p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-[#1C2630] pb-2">
            <span className="text-[10px] text-[#5BD8F5] font-medium">Evaluation methodology</span>
            <span className="text-[9px] text-[#7F8B95] font-mono">Prototype validation</span>
          </div>

          {/* Scientific Caution Notice */}
          <div className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-3 text-xs text-[#7F8B95] font-sans leading-relaxed">
            <p>
              Aethon does not present synthetic benchmark claims as established scientific truth.
              Validation requires extensive synthetic signal injection campaigns coupled with
              multi-facility verification across authentic radio-frequency observations.
            </p>
          </div>

          {/* 4 Multi-Dimensional Evaluation Axes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 text-xs">
            {evaluationDimensions.map((d) => (
              <div
                key={d.dimension}
                className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-2.5 space-y-1"
              >
                <span className="text-[9px] text-[#5BD8F5] font-medium block">{d.dimension}</span>
                <span className="text-[10px] text-[#E6EDF2] font-mono block">{d.metric}</span>
                <p className="text-[10px] text-[#7F8B95] font-sans leading-snug">{d.scope}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
