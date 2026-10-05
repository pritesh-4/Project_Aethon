import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Cpu } from 'lucide-react';

export function ModelFlowVisualizer() {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const steps = [
    {
      id: 'raw',
      title: '01 · Baseband voltages',
      visualType: 'waveform',
      preview: '~~~~~~~~~~~~ ∿∿∿∿∿∿ ~~~~~~~~~~~~',
      spec: 'Complex I(t) + jQ(t) sampled at 25.0 MSps',
      detail: 'High-frequency digitization directly from antenna receiver feeds.',
    },
    {
      id: 'spectrogram',
      title: '02 · Spectrogram',
      visualType: 'spectrogram',
      preview: '░░░████░░░░░░░░███░░░░░░░░▒▒▒▒░░',
      spec: 'STFT Matrix S(t, f) [Time × Freq × Intensity]',
      detail: '3.81 Hz frequency channelization reveals Doppler drift slope df/dt = -0.32 Hz/s.',
    },
    {
      id: 'vector',
      title: '03 · Latent embedding',
      visualType: 'vector',
      preview: '[ +0.142, -0.891, +0.433, +0.718, ... z₅₁₂ ]',
      spec: 'z ∈ ℝ⁵¹² normalized to unit sphere',
      detail:
        'Self-supervised encoder maps structural morphology into continuous geometric coordinates.',
    },
    {
      id: 'latent',
      title: '04 · Manifold space',
      visualType: 'space',
      preview: '• • • • • •     [ × Candidate AET-04721 ]',
      spec: 'Cosine distance d(z, μ_known) = 0.918',
      detail:
        'Candidate event is topologically separated from the learned background noise manifold.',
    },
    {
      id: 'score',
      title: '05 · Anomaly index',
      visualType: 'score',
      preview: 'Anomaly index: 0.947 · Priority: High',
      spec: 'Triage weight P = 0.884 → Queued for scientific review',
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
    <div className="rounded-[2px] border border-[#1C2630] bg-[#0B0F14] p-5 font-mono select-none">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#1C2630] pb-3 mb-4 gap-2">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-[#5BD8F5]" />
          <h2 className="text-xs font-medium text-[#E6EDF2]">Transformation flow</h2>
        </div>

        {/* Stepper Controls */}
        <div className="flex items-center gap-2 text-[10px]">
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1 rounded-[1px] border border-[#1C2630] bg-[#06080B] px-2 py-0.5 text-[#7F8B95] hover:text-[#E6EDF2] cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="h-3 w-3 text-[#E8AE50]" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="h-3 w-3 text-[#5BD8F5]" />
                <span>Play</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveStep(0);
              setIsPlaying(true);
            }}
            className="flex items-center gap-1 rounded-[1px] border border-[#1C2630] bg-[#06080B] px-2 py-0.5 text-[#7F8B95] hover:text-[#E6EDF2] cursor-pointer"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Reset</span>
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
                  ? 'border-[#5BD8F5] bg-[#5BD8F5]/10 text-[#E6EDF2]'
                  : isPassed
                    ? 'border-[#1C2630] bg-[#06080B] text-[#7F8B95]'
                    : 'border-[#1C2630]/60 bg-[#06080B]/40 text-[#7F8B95]/60'
              }`}
            >
              <div>
                <span
                  className={`text-[9px] font-medium block mb-1 ${
                    isCurrent ? 'text-[#5BD8F5]' : 'text-[#7F8B95]'
                  }`}
                >
                  {step.title}
                </span>

                {/* Micro Visual Preview */}
                <div className="rounded-[1px] border border-[#1C2630] bg-[#06080B] p-2 my-2 text-center text-[10px] font-mono tracking-wider overflow-hidden truncate">
                  <span
                    className={
                      isCurrent
                        ? 'text-[#5BD8F5] font-medium'
                        : isPassed
                          ? 'text-[#E6EDF2]'
                          : 'text-[#7F8B95]'
                    }
                  >
                    {step.preview}
                  </span>
                </div>
              </div>

              <div className="border-t border-[#1C2630] pt-2 mt-1">
                <span className="block text-[9px] text-[#7F8B95] font-mono leading-tight">
                  {step.spec}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Step Diagnostic Breakdown */}
      <div className="mt-4 rounded-[2px] border border-[#1C2630] bg-[#06080B] p-4 text-xs font-mono">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#1C2630] pb-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-[#5BD8F5] font-medium">Stage {activeStep + 1} of 5</span>
            <span className="text-[#7F8B95]">·</span>
            <span className="font-medium text-[#E6EDF2]">{steps[activeStep].title}</span>
          </div>
          <span className="text-[10px] text-[#7F8B95] font-mono">{steps[activeStep].spec}</span>
        </div>
        <p className="text-xs text-[#7F8B95] font-sans leading-relaxed">
          {steps[activeStep].detail}
        </p>
      </div>
    </div>
  );
}
