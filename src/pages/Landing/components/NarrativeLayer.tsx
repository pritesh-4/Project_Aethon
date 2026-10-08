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
}

const SCENES: NarrativeScene[] = [
  {
    id: 'observatory',
    start: 0.02,
    peakStart: 0.05,
    peakEnd: 0.12,
    end: 0.15,
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
    start: 0.65,
    peakStart: 0.68,
    peakEnd: 0.74,
    end: 0.77,
    kicker: 'SPECTRAL DEVIATION',
    headline: "What doesn't fit?",
    body: 'A single trace departs from the learned distribution. While known carriers fade, one anomalous drift persists.',
  },
  {
    id: 'method',
    start: 0.78,
    peakStart: 0.81,
    peakEnd: 0.86,
    end: 0.89,
    kicker: 'UNSUPERVISED SCREENING',
    headline: 'AETHON looks for the difference.',
    body: 'It learns the structure of what is normally observed, then surfaces observations that fall outside it.',
  },
  {
    id: 'investigation',
    start: 0.88,
    peakStart: 0.9,
    peakEnd: 0.94,
    end: 0.96,
    kicker: 'SPECTROTEMPORAL WATERFALL',
    headline: 'Look closer.',
    body: 'An anomaly is not an answer. It is a reason to look closer.',
    annotations: [
      { label: 'STATUS', value: 'PERSISTENT (>180s)' },
      { label: 'DRIFT RATE', value: '-0.32 Hz/s' },
      { label: 'CATALOG SIMILARITY', value: 'LOW (<0.04)' },
      { label: 'RFI PROBABILITY', value: 'UNVERIFIED' },
    ],
  },
  {
    id: 'terminal',
    start: 0.94,
    peakStart: 0.96,
    peakEnd: 1.0,
    end: 1.0,
    kicker: 'CANDIDATE // REQUIRES SCIENTIFIC REVIEW',
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

              {/* Scientific Figure Annotations attached to the visualization */}
              {scene.annotations && (
                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2 w-full max-w-lg">
                  {scene.annotations.map((ann) => (
                    <div
                      key={ann.label}
                      className="px-2.5 py-1.5 rounded-[2px] bg-[#0E1620]/80 border border-[#213240] text-left"
                    >
                      <div className="text-[9px] font-mono text-[#6A7E8F] uppercase tracking-wider">
                        {ann.label}
                      </div>
                      <div className="text-[11px] font-mono text-[#D4A359] mt-0.5 truncate">
                        {ann.value}
                      </div>
                    </div>
                  ))}
                </div>
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
