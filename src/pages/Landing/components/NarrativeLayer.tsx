import { Link } from 'react-router';
import { ArrowRight, ChevronDown } from 'lucide-react';

interface NarrativeLayerProps {
  progress: number;
  reducedMotion: boolean;
}

interface NarrativeScene {
  id: string;
  start: number;
  peakStart: number;
  peakEnd: number;
  end: number;
  kicker?: string;
  headline: string;
  body?: string;
  annotations?: Array<{ label: string; value: string }>;
  isTerminal?: boolean;
  isQuietZone?: boolean;
}

const SCENES: NarrativeScene[] = [
  {
    id: 'observatory',
    start: 0.08,
    peakStart: 0.12,
    peakEnd: 0.15,
    end: 0.18,
    kicker: 'L-BAND SPECTRAL OBSERVATORY',
    headline: 'The sky is full of signals.',
    body: 'Cosmic background radiation, orbital emissions, and ambient frequency fields.',
  },
  {
    id: 'known',
    start: 0.18,
    peakStart: 0.22,
    peakEnd: 0.28,
    end: 0.32,
    kicker: 'KNOWN POPULATION',
    headline: 'Most of them are known.',
    body: 'We have learned to recognize the familiar structures of human transmitters and astronomical harmonics.',
  },
  {
    id: 'scale',
    start: 0.36,
    peakStart: 0.4,
    peakEnd: 0.47,
    end: 0.51,
    headline: "The challenge isn't finding signals.",
    body: 'It is finding the one worth looking at.',
  },
  {
    id: 'deviation',
    start: 0.62,
    peakStart: 0.65,
    peakEnd: 0.72,
    end: 0.75,
    kicker: 'SPECTRAL DEVIATION',
    headline: "What doesn't fit?",
    body: 'A single trace departs from the learned distribution. While known carriers fade, one anomalous drift persists.',
  },
  {
    id: 'method',
    start: 0.75,
    peakStart: 0.77,
    peakEnd: 0.81,
    end: 0.83,
    kicker: 'UNSUPERVISED SCREENING',
    headline: 'AETHON looks for the difference.',
    body: 'It learns the structure of what is normally observed, then surfaces observations that fall outside it.',
  },
  {
    id: 'investigation',
    start: 0.82,
    peakStart: 0.85,
    peakEnd: 0.93,
    end: 0.95,
    headline: 'Look closer.',
    body: 'An anomaly is not an answer. It is a reason to look closer.',
    annotations: [
      { label: 'STATUS', value: 'PERSISTENT (>180s)' },
      { label: 'DRIFT RATE', value: '-0.32 Hz/s' },
      { label: 'CATALOG SIMILARITY', value: 'LOW (<0.04)' },
      { label: 'RFI PROBABILITY', value: 'UNVERIFIED' },
    ],
    isQuietZone: true,
  },
  {
    id: 'terminal',
    start: 0.95,
    peakStart: 0.97,
    peakEnd: 1.0,
    end: 1.0,
    kicker: 'CANDIDATE // REQUIRES SCIENTIFIC REVIEW',
    headline: 'AETHON',
    body: 'Observation instrument for the unclassified sky.',
    isTerminal: true,
  },
];

/**
 * Atmospheric Waveform Boundary Line (~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~)
 * Elegant undulating frequency baseline rendered with soft atmospheric gradient
 */
function AtmosphericWaveformBoundary({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className || 'w-full max-w-md h-4 opacity-75'}
      aria-hidden="true"
    >
      <path
        d="M0 10 Q 25 3, 50 10 T 100 10 T 150 10 T 200 10 T 250 10 T 300 10 T 350 10 T 400 10 T 450 10 T 500 10 T 550 10 T 600 10"
        stroke="url(#quietWaveGrad)"
        strokeWidth="1.25"
        strokeLinecap="round"
      />
      <defs>
        <linearGradient id="quietWaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#376A9B" stopOpacity="0" />
          <stop offset="15%" stopColor="#5C89B7" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#D4A359" stopOpacity="0.85" />
          <stop offset="85%" stopColor="#5C89B7" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#376A9B" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function NarrativeLayer({ progress, reducedMotion }: NarrativeLayerProps) {
  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between p-6 sm:p-12 select-none">
      {/* Narrative Scene Statements */}
      <div className="relative flex-1 flex items-center justify-center">
        {SCENES.map((scene) => {
          const isTerminal = scene.isTerminal ?? false;
          const isQuietZone = scene.isQuietZone ?? false;
          let opacity = 0;
          let translateY = 0;

          if (isTerminal) {
            if (progress >= scene.start) {
              const t = Math.min(1, (progress - scene.start) / (scene.peakStart - scene.start));
              opacity = t;
              translateY = reducedMotion ? 0 : (1 - t) * 16;
            }
          } else {
            if (progress >= scene.start && progress <= scene.end) {
              if (progress < scene.peakStart) {
                const t = (progress - scene.start) / (scene.peakStart - scene.start);
                opacity = t;
                translateY = reducedMotion ? 0 : (1 - t) * 16;
              } else if (progress <= scene.peakEnd) {
                opacity = 1;
                translateY = 0;
              } else {
                const t = (progress - scene.peakEnd) / (scene.end - scene.peakEnd);
                opacity = 1 - t;
                translateY = reducedMotion ? 0 : -t * 12;
              }
            }
          }

          if (opacity <= 0.005) return null;

          const isClickable = isTerminal && progress >= 0.95;

          // Special Custom Layout for the "Soft Atmospheric Quiet Zone" Scene
          if (isQuietZone) {
            return (
              <section
                key={scene.id}
                aria-label="Spectrogram Soft Atmospheric Quiet Zone"
                style={{
                  opacity,
                  transform: `translateY(${translateY}px)`,
                }}
                className="absolute inset-x-0 mx-auto max-w-2xl px-4 flex flex-col items-center justify-center text-center transition-opacity duration-200"
              >
                {/* 1. Header: spectrogram */}
                <div className="text-[11px] font-mono tracking-[0.28em] text-[#6A7E8F] uppercase mb-2">
                  spectrogram
                </div>

                {/* 2. Top Wavy Atmospheric Boundary (~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~) */}
                <AtmosphericWaveformBoundary className="w-full max-w-md h-3.5 mb-3" />

                {/* 3. Soft Atmospheric Quiet Zone Badge Capsule */}
                <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full border border-[#376A9B]/40 bg-[#0B141C]/80 shadow-[0_0_24px_rgba(55,106,155,0.22)] mb-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#D4A359] animate-pulse" />
                  <span className="text-[10px] font-mono tracking-widest text-[#9BB9D6] uppercase">
                    soft atmospheric quiet zone
                  </span>
                </div>

                {/* 4. The Quiet Zone Content Capsule (╭──────────────╮ Look closer. ╰──────────────╯) */}
                <div className="relative w-full max-w-lg px-8 py-7 sm:px-10 sm:py-8 rounded-2xl border border-[#233547]/80 bg-[#070B10]/75 backdrop-blur-md shadow-[0_0_60px_rgba(7,11,16,0.9),inset_0_0_40px_rgba(55,106,155,0.06)] flex flex-col items-center">
                  {/* Subtle corner fiducial marks */}
                  <div className="absolute top-2.5 left-3 text-[9px] font-mono text-[#3E566E]">
                    ┌ CH-1420
                  </div>
                  <div className="absolute top-2.5 right-3 text-[9px] font-mono text-[#D4A359]">
                    Δf/Δt: -0.32 Hz/s ┐
                  </div>

                  {/* Primary Statement in Newsreader Serif */}
                  <h2 className="text-3xl sm:text-5xl font-serif italic font-normal text-[#E3EBF2] tracking-tight mt-1">
                    {scene.headline}
                  </h2>

                  {/* Profound Narrator Observation */}
                  {scene.body && (
                    <p className="mt-3.5 text-sm sm:text-base font-normal text-[#A6B7C6] max-w-md leading-relaxed font-sans">
                      {scene.body}
                    </p>
                  )}

                  {/* Scientific Figure Annotations attached inside the quiet frame */}
                  {scene.annotations && (
                    <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 w-full pt-4 border-t border-[#1C2C3C]/80">
                      {scene.annotations.map((ann) => (
                        <div
                          key={ann.label}
                          className="px-2 py-1.5 rounded-[2px] bg-[#0E1722]/80 border border-[#213345] text-left"
                        >
                          <div className="text-[8.5px] font-mono text-[#6A7E8F] uppercase tracking-wider">
                            {ann.label}
                          </div>
                          <div className="text-[10.5px] font-mono text-[#D4A359] mt-0.5 truncate">
                            {ann.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 5. Bottom Wavy Atmospheric Boundary (~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~) */}
                <AtmosphericWaveformBoundary className="w-full max-w-md h-3.5 mt-3" />
              </section>
            );
          }

          // Standard Scene Layout
          return (
            <section
              key={scene.id}
              aria-label={scene.headline}
              style={{
                opacity,
                transform: `translateY(${translateY}px)`,
                pointerEvents: isClickable ? 'auto' : 'none',
              }}
              className="absolute inset-x-0 mx-auto max-w-2xl px-6 text-center flex flex-col items-center justify-center transition-opacity duration-150"
            >
              {/* Restrained Editorial Kicker */}
              {scene.kicker && (
                <p className="text-[11px] sm:text-xs font-mono tracking-widest text-[#6A7E8F] uppercase mb-4">
                  {scene.kicker}
                </p>
              )}

              {/* Primary Narrative Statement in Newsreader Serif */}
              <h1
                className={`tracking-tight text-[#E3EBF2] leading-tight ${
                  isTerminal
                    ? 'text-4xl sm:text-6xl md:text-7xl font-sans font-light tracking-wide'
                    : 'text-2xl sm:text-4xl md:text-5xl font-serif italic font-normal'
                }`}
              >
                {scene.headline}
              </h1>

              {/* Supporting Human Narration */}
              {scene.body && (
                <p className="mt-4 text-sm sm:text-base font-normal text-[#A6B7C6] max-w-lg leading-relaxed font-sans">
                  {scene.body}
                </p>
              )}

              {/* Terminal Action: Earned Entrance into the Observatory */}
              {isTerminal && (
                <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    to="/observatory"
                    className="inline-flex items-center gap-2.5 px-7 py-3 rounded-[3px] bg-[#376A9B] hover:bg-[#2F5E8C] text-white text-xs font-semibold cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#5C89B7] transition-all duration-200 shadow-lg shadow-[#376A9B]/20 group"
                  >
                    <span>Enter the observatory</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>

                  <Link
                    to="/model"
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-[3px] bg-[#131E27]/90 hover:bg-[#1A2834] text-[#A6B7C6] hover:text-[#E3EBF2] border border-[#213240] text-xs font-mono cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#5C89B7] transition-colors"
                  >
                    <span>Explore how it works</span>
                  </Link>
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* Initial Scroll Prompt */}
      {progress < 0.05 && (
        <div
          style={{ opacity: Math.max(0, 1 - progress * 25) }}
          className="mx-auto flex flex-col items-center gap-2 text-xs font-mono text-[#6A7E8F] transition-opacity"
        >
          <span>Scroll to begin observation</span>
          <ChevronDown className="h-4 w-4 text-[#5C89B7] animate-bounce" />
        </div>
      )}
    </div>
  );
}
