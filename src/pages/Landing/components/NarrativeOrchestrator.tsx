import { Link } from 'react-router';
import { motion, useTransform, useReducedMotion, type MotionValue } from 'motion/react';
import { ArrowRight, ChevronDown } from 'lucide-react';

interface NarrativeScene {
  id: string;
  start: number;
  peakStart: number;
  peakEnd: number;
  end: number;
  tag?: string;
  title: string;
  subtitle?: string;
  telemetryTag?: string;
  isTerminal?: boolean;
}

const NARRATIVE_SCENES: NarrativeScene[] = [
  {
    id: 'silence',
    start: 0.0,
    peakStart: 0.04,
    peakEnd: 0.11,
    end: 0.15,
    tag: 'SIMULATED OBSERVATION',
    title: 'The sky is full of signals.',
    subtitle: 'Cosmic background noise and ambient radio frequency emission.',
  },
  {
    id: 'known',
    start: 0.15,
    peakStart: 0.18,
    peakEnd: 0.26,
    end: 0.3,
    tag: 'SPECTRAL SURVEY',
    title: 'Most are already known.',
    subtitle: 'Transmitters, satellites, and predictable orbital harmonics.',
  },
  {
    id: 'overwhelm',
    start: 0.3,
    peakStart: 0.33,
    peakEnd: 0.41,
    end: 0.45,
    tag: 'SPECTRAL CONGESTION',
    title: 'Among the signals,',
    subtitle: 'some patterns remain unexplained.',
  },
  {
    id: 'deviation',
    start: 0.45,
    peakStart: 0.5,
    peakEnd: 0.58,
    end: 0.63,
    tag: 'ANOMALOUS COHERENCE',
    title: "Something doesn't fit.",
    subtitle: 'A single trace breaks orbital symmetry. AETHON looks closer.',
  },
  {
    id: 'investigation',
    start: 0.63,
    peakStart: 0.66,
    peakEnd: 0.76,
    end: 0.81,
    tag: 'SPECTROTEMPORAL ISOLATION',
    title: 'Anomaly is not an answer.',
    subtitle: 'It is a reason to look closer.',
    telemetryTag: 'CH-1420.405 MHz · DRIFT: -0.32 Hz/s · ISOLATION: 99.4%',
  },
  {
    id: 'candidate',
    start: 0.81,
    peakStart: 0.85,
    peakEnd: 1.0,
    end: 1.0,
    tag: 'CANDIDATE EVENT // UNVERIFIED DRIFT',
    title: 'AETHON',
    subtitle: 'Intelligence for the unclassified sky.',
    isTerminal: true,
  },
];

interface SceneItemProps {
  scene: NarrativeScene;
  progress: MotionValue<number>;
  shouldReduceMotion: boolean;
}

function NarrativeSceneItem({ scene, progress, shouldReduceMotion }: SceneItemProps) {
  const isTerminal = scene.isTerminal ?? false;

  // Dimensional interpolation: smooth entry, breathing room, clean exit
  const opacity = useTransform(
    progress,
    isTerminal
      ? [scene.start, scene.peakStart, 1.0]
      : [scene.start, scene.peakStart, scene.peakEnd, scene.end],
    isTerminal ? [0, 1, 1] : [0, 1, 1, 0]
  );

  const y = useTransform(
    progress,
    isTerminal
      ? [scene.start, scene.peakStart, 1.0]
      : [scene.start, scene.peakStart, scene.peakEnd, scene.end],
    shouldReduceMotion
      ? isTerminal
        ? [0, 0, 0]
        : [0, 0, 0, 0]
      : isTerminal
        ? [18, 0, 0]
        : [18, 0, 0, -12]
  );

  const blurVal = useTransform(
    progress,
    isTerminal
      ? [scene.start, scene.peakStart, 1.0]
      : [scene.start, scene.peakStart, scene.peakEnd, scene.end],
    shouldReduceMotion
      ? isTerminal
        ? [0, 0, 0]
        : [0, 0, 0, 0]
      : isTerminal
        ? [6, 0, 0]
        : [6, 0, 0, 4]
  );

  const filter = useTransform(blurVal, (b) => (b <= 0.1 ? 'none' : `blur(${b.toFixed(1)}px)`));

  // Pointer interaction active only for final terminal CTA scene
  const pointerEvents = useTransform(progress, (v) => (isTerminal && v >= 0.84 ? 'auto' : 'none'));

  // Eliminate GPU compositor overhead when scene is fully hidden
  const visibility = useTransform(opacity, (o) => (o > 0.005 ? 'visible' : 'hidden'));

  return (
    <motion.div
      style={{
        opacity,
        y,
        filter,
        pointerEvents,
        visibility,
      }}
      className="absolute inset-x-0 mx-auto px-4 max-w-2xl text-center flex flex-col items-center justify-center select-none"
    >
      {/* Restrained tag */}
      {scene.tag && (
        <p className="text-[11px] sm:text-xs font-mono tracking-widest text-[#7F8B95] uppercase mb-3">
          {scene.tag}
        </p>
      )}

      {/* Primary Narrative Statement */}
      <h2
        className={`tracking-tight text-[#E6EDF2] leading-tight font-light ${
          isTerminal
            ? 'text-3xl sm:text-5xl md:text-6xl font-normal'
            : 'text-2xl sm:text-4xl md:text-5xl'
        }`}
      >
        {scene.title}
      </h2>

      {/* Subtitle / Context phrase */}
      {scene.subtitle && (
        <p className="mt-3 text-sm sm:text-base font-light text-[#7F8B95] max-w-lg leading-relaxed">
          {scene.subtitle}
        </p>
      )}

      {/* Technical Telemetry Tag (Scene 5) */}
      {scene.telemetryTag && (
        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded bg-[#10161D]/80 border border-[#172230] text-[11px] font-mono text-[#E8AE50]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#E8AE50] animate-pulse" />
          <span>{scene.telemetryTag}</span>
        </div>
      )}

      {/* Terminal Action Beats (Scene 6) */}
      {isTerminal && (
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/observatory"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-[4px] bg-[#10161D] text-[#5BD8F5] border border-[#5BD8F5]/70 hover:bg-[#15202B] hover:border-[#5BD8F5] hover:shadow-[0_0_24px_rgba(91,216,245,0.25)] transition-all text-xs font-mono font-medium cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5]"
          >
            <span>Enter the observatory</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>

          <Link
            to="/candidates"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-mono text-[#7F8B95] hover:text-[#E6EDF2] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5] rounded hover:bg-[#10161D]/60"
          >
            <span>Review candidate events</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      )}
    </motion.div>
  );
}

interface NarrativeOrchestratorProps {
  scrollYProgress: MotionValue<number>;
}

export function NarrativeOrchestrator({ scrollYProgress }: NarrativeOrchestratorProps) {
  const shouldReduceMotion = useReducedMotion();

  // Gentle initial scroll cue fading out upon first touch (0.00 -> 0.03)
  const scrollHintOpacity = useTransform(scrollYProgress, [0.0, 0.03], [0.65, 0]);

  return (
    <div className="absolute inset-0 flex items-center justify-center p-6 select-none pointer-events-none z-20 font-sans">
      <div className="relative w-full max-w-2xl text-center flex items-center justify-center min-h-[300px]">
        {NARRATIVE_SCENES.map((scene) => (
          <NarrativeSceneItem
            key={scene.id}
            scene={scene}
            progress={scrollYProgress}
            shouldReduceMotion={shouldReduceMotion ?? false}
          />
        ))}
      </div>

      {/* Gentle Initial Scroll Indicator */}
      <motion.div
        style={{ opacity: scrollHintOpacity }}
        className="absolute bottom-10 inset-x-0 mx-auto flex flex-col items-center gap-1.5 text-[11px] text-[#7F8B95] font-mono pointer-events-none"
      >
        <span>Scroll to explore</span>
        <ChevronDown className="h-3.5 w-3.5 text-[#5BD8F5]/80 animate-bounce" />
      </motion.div>
    </div>
  );
}
