import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Cpu } from 'lucide-react';

export function ModelFlowVisualizer() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const steps = [
    {
      id: 'raw',
      title: '01 // RAW BASEBAND VOLTAGES',
      visualType: 'waveform',
      preview: '~~~~~~~~~~~~ ∿∿∿∿∿∿ ~~~~~~~~~~~~',
      spec: 'Complex I(t) + jQ(t) sampled at 25.0 MSPS Nyquist rate',
      detail: 'High-frequency digitization directly from antenna cryogenic receiver feeds.',
    },
    {
      id: 'spectrogram',
      title: '02 // SPECTROTEMPORAL WATERFALL',
      visualType: 'spectrogram',
      preview: '░░░████░░░░░░░░███░░░░░░░░▒▒▒▒░░',
      spec: 'STFT Matrix S(t, f) [Time × Freq × Intensity]',
      detail:
        '3.81 Hz fine frequency channelization exposes negative Doppler drift slope df/dt = -0.32 Hz/s.',
    },
    {
      id: 'vector',
      title: '03 // DENSE FEATURE EMBEDDING',
      visualType: 'vector',
      preview: '[ +0.142, -0.891, +0.433, +0.718, ... z₅₁₂ ]',
      spec: 'z ∈ ℝ⁵¹² normalized to unit hypersphere ||z||₂ = 1.0',
      detail:
        'Self-supervised encoder maps structural morphology into continuous geometric coordinates.',
    },
    {
      id: 'latent',
      title: '04 // REPRESENTATION MANIFOLD',
      visualType: 'space',
      preview: '• • • • • •     [ × CANDIDATE AET-04721 ]',
      spec: 'Cosine distance d(z, μ_known) = 0.918 (Outlier)',
      detail:
        'Candidate event is topologically isolated away from the dense background noise manifold.',
    },
    {
      id: 'score',
      title: '05 // ANOMALY INDEX & TRIAGE',
      visualType: 'score',
      preview: 'ANOMALY INDEX: 0.947 // PRIORITY: HIGH',
      spec: 'Triage weight P = 0.884 → Dispatched to Scientific Queue',
      detail:
        'Observation is prioritized for human scientific review; automated pipeline does not declare discovery.',
    },
  ];

  // Auto-play stepper
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [isPlaying, steps.length]);

  return (
    <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-5 font-mono select-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-3 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-[#66E3FF]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#EAF4F7]">
            TRANSFORMATION FLOW: FROM VOLTAGES TO ANOMALY INDEX
          </h2>
        </div>

        {/* Stepper Controls */}
        <div className="flex items-center gap-2 text-[10px]">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1 rounded-[1px] border border-slate-800 bg-[#05070A] px-2 py-0.5 text-slate-300 hover:border-slate-600 cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="h-3 w-3 text-amber-400" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3 text-emerald-400" />
                <span>PLAY</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveStep(0);
              setIsPlaying(true);
            }}
            className="flex items-center gap-1 rounded-[1px] border border-slate-800 bg-[#05070A] px-2 py-0.5 text-slate-400 hover:text-slate-200 cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>RESET</span>
          </button>
        </div>
      </div>

      {/* Visual Sequence Chain */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {steps.map((step, idx) => {
          const isCurrent = activeStep === idx;
          const isPassed = activeStep > idx;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => {
                setActiveStep(idx);
                setIsPlaying(false);
              }}
              className={`text-left rounded-[2px] border p-3 flex flex-col justify-between transition-all cursor-pointer relative overflow-hidden ${
                isCurrent
                  ? 'border-[#66E3FF] bg-[#06b6d4]/10 shadow-[0_0_12px_rgba(102,227,255,0.15)] text-[#EAF4F7]'
                  : isPassed
                    ? 'border-slate-700/80 bg-[#05070A]/80 text-slate-300'
                    : 'border-slate-800/80 bg-[#05070A]/40 text-slate-500 opacity-60'
              }`}
            >
              {isCurrent && (
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#66E3FF] shadow-[0_0_8px_rgba(102,227,255,0.8)]" />
              )}

              <div>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider block mb-1 ${
                    isCurrent ? 'text-[#66E3FF]' : 'text-slate-500'
                  }`}
                >
                  {step.title}
                </span>

                {/* Micro Visual Preview */}
                <div className="rounded-[1px] border border-slate-800 bg-slate-950 p-2 my-2 text-center text-[10px] font-mono tracking-wider overflow-hidden truncate">
                  <span
                    className={
                      isCurrent
                        ? 'text-[#66E3FF] font-semibold'
                        : isPassed
                          ? 'text-slate-300'
                          : 'text-slate-600'
                    }
                  >
                    {step.preview}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-800/80 pt-2 mt-1">
                <span className="block text-[9px] text-[#84929C] font-mono leading-tight">
                  {step.spec}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Step Diagnostic Breakdown */}
      <div className="mt-4 rounded-[2px] border border-cyan-800/60 bg-[#05070A] p-4 text-xs font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[#66E3FF] font-bold">STAGE {activeStep + 1} OF 5</span>
            <span className="text-slate-600">//</span>
            <span className="font-bold text-[#EAF4F7] uppercase tracking-wider">
              {steps[activeStep].title}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">{steps[activeStep].spec}</span>
        </div>
        <p className="text-xs text-slate-300 font-sans leading-relaxed">
          {steps[activeStep].detail}
        </p>
      </div>
    </div>
  );
}
