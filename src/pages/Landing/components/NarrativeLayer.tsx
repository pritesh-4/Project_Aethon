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
    kicker: 'L-band spectral observatory',
    headline: 'The sky is full of signals',
    body: 'Cosmic background radiation, orbital emissions, and ambient frequency fields.',
  },
  {
    id: 'known',
    start: 0.18,
    peakStart: 0.22,
    peakEnd: 0.28,
    end: 0.32,
    kicker: 'Known population',
    headline: 'Most of them are known',
    body: 'We have learned to recognize the familiar structures of human transmitters and astronomical harmonics.',
  },
  {
    id: 'scale',
    start: 0.36,
    peakStart: 0.4,
    peakEnd: 0.47,
    end: 0.51,
    headline: "The challenge isn't finding signals",
    body: 'It is finding the one worth looking at.',
  },
  {
    id: 'deviation',
    start: 0.62,
    peakStart: 0.65,
    peakEnd: 0.72,
    end: 0.75,
    kicker: 'Spectral deviation',
    headline: "What doesn't fit?",
    body: 'A single trace departs from the learned distribution. While known carriers fade, one anomalous drift persists.',
  },
  {
    id: 'method',
    start: 0.75,
    peakStart: 0.77,
    peakEnd: 0.81,
    end: 0.83,
    kicker: 'Unsupervised screening',
    headline: 'Aethon looks for the difference',
    body: 'It learns the structure of what is normally observed, then surfaces observations that fall outside it.',
  },
  {
    id: 'investigation',
    start: 0.82,
    peakStart: 0.85,
    peakEnd: 0.93,
    end: 0.95,
    kicker: 'Observatory quiet zone',
    headline: 'Look closer',
    body: 'An anomaly is not an answer. It is a reason to look closer.',
    annotations: [
      { label: 'Status', value: 'Persistent (>180s)' },
      { label: 'Drift rate', value: '-0.32 Hz/s' },
      { label: 'Catalog similarity', value: 'Low (<0.04)' },
      { label: 'RFI probability', value: 'Unverified' },
    ],
    isQuietZone: true,
  },
  {
    id: 'terminal',
    start: 0.95,
    peakStart: 0.97,
    peakEnd: 1.0,
    end: 1.0,
    kicker: 'Candidate · Requires scientific review',
    headline: 'AETHON',
    body: 'Observation instrument for the unclassified sky.',
    isTerminal: true,
  },
];

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

          // Clean Quiet Zone Scene Layout
          if (isQuietZone) {
            return (
              <section
                key={scene.id}
                aria-label="Spectrogram quiet zone"
                style={{
                  opacity,
                  transform: `translateY(${translateY}px)`,
                }}
                className="absolute inset-x-0 mx-auto max-w-xl px-4 flex flex-col items-center justify-center text-center transition-opacity duration-200"
              >
                {/* 1. Kicker */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#D4A359]" />
                  <span className="text-[11px] font-mono text-[#8CA0B2]">
                    Spectrogram · Quiet zone
                  </span>
                </div>

                {/* 2. Quiet Zone Instrument Card */}
                <div className="relative w-full px-6 py-6 sm:px-8 sm:py-7 rounded-[4px] border border-[#213240] bg-[#0D141A]/95 shadow-md flex flex-col items-center">
                  {/* Subtle corner fiducial marks */}
                  <div className="absolute top-2.5 left-3 text-[10px] font-mono text-[#4F677E]">
                    CH-1420
                  </div>
                  <div className="absolute top-2.5 right-3 text-[10px] font-mono text-[#D4A359] tabular-nums">
                    Δf/Δt: -0.32 Hz/s
                  </div>

                  {/* Primary Statement */}
                  <h2 className="text-2xl sm:text-4xl font-sans font-medium text-[#E3EBF2] tracking-tight mt-1">
                    {scene.headline}
                  </h2>

                  {/* Body Copy */}
                  {scene.body && (
                    <p className="mt-2.5 text-sm sm:text-base font-normal text-[#A6B7C6] max-w-md leading-relaxed font-sans">
                      {scene.body}
                    </p>
                  )}

                  {/* Scientific Annotations */}
                  {scene.annotations && (
                    <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2 w-full pt-4 border-t border-[#1C2C3C]">
                      {scene.annotations.map((ann) => (
                        <div
                          key={ann.label}
                          className="px-2.5 py-1.5 rounded-[2px] bg-[#131E27] border border-[#213240] text-left"
                        >
                          <div className="text-[10px] font-mono text-[#6A7E8F]">{ann.label}</div>
                          <div className="text-[11px] font-mono text-[#D4A359] mt-0.5 truncate tabular-nums">
                            {ann.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
              {/* Restrained Kicker */}
              {scene.kicker && (
                <p className="text-xs font-mono text-[#7E8B96] mb-3">{scene.kicker}</p>
              )}

              {/* Primary Narrative Statement */}
              <h1
                className={`tracking-tight text-[#E3EBF2] leading-tight ${
                  isTerminal
                    ? 'text-4xl sm:text-6xl md:text-7xl font-sans font-normal tracking-tight'
                    : 'text-2xl sm:text-4xl md:text-5xl font-sans font-medium'
                }`}
              >
                {scene.headline}
              </h1>

              {/* Supporting Narration */}
              {scene.body && (
                <p className="mt-3 text-sm sm:text-base font-normal text-[#A6B7C6] max-w-lg leading-relaxed font-sans">
                  {scene.body}
                </p>
              )}

              {/* Terminal Action */}
              {isTerminal && (
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link
                    to="/observatory"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[2px] bg-[#376A9B] hover:bg-[#2F5E8C] text-white text-xs font-medium cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#5C89B7] transition-colors shadow-xs group"
                  >
                    <span>Enter observatory</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>

                  <Link
                    to="/model"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-[2px] bg-[#131E27] hover:bg-[#182632] text-[#A6B7C6] hover:text-[#E3EBF2] border border-[#213240] text-xs font-mono cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#5C89B7] transition-colors"
                  >
                    <span>Explore method</span>
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
          className="mx-auto flex flex-col items-center gap-1.5 text-xs font-mono text-[#7E8B96] transition-opacity"
        >
          <span>Scroll to observe</span>
          <ChevronDown className="h-3.5 w-3.5 text-[#5C89B7]" />
        </div>
      )}
    </div>
  );
}
