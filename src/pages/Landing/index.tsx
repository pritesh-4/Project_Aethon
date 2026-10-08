import { useRef } from 'react';
import { useScroll, useSpring, useReducedMotion } from 'motion/react';
import { AstronomicalSignalCanvas } from './components/AstronomicalSignalCanvas.tsx';
import { NarrativeOrchestrator } from './components/NarrativeOrchestrator.tsx';
import { LandingHeader } from './components/LandingHeader.tsx';

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Single primary scroll-progress orchestration system
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  const shouldReduceMotion = useReducedMotion();

  // Spring-based smoothing for continuous, fluid trackpad and mouse-wheel response
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 85,
    damping: 24,
    restDelta: 0.0001,
  });

  // Respect prefers-reduced-motion by bypassing physics spring delay if active
  const progress = shouldReduceMotion ? scrollYProgress : smoothProgress;

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-[#06080B] text-[#E6EDF2]"
      style={{ height: '460vh' }}
    >
      {/* Sticky Viewport Shell */}
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#06080B] flex flex-col justify-between">
        {/* Subtle deep-space background radial gradient */}
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(91,216,245,0.04),rgba(6,8,11,0.95))] pointer-events-none z-0"
          aria-hidden="true"
        />

        {/* 1. Persistent Top Header with Narrative-Aware Quiet Controls */}
        <LandingHeader scrollYProgress={progress} />

        {/* 2. Persistent Signal Canvas (The Protagonist Carrier) */}
        <AstronomicalSignalCanvas scrollYProgress={progress} />

        {/* 3. Single Continuous Narrative Timeline (6 Data-Driven Chapters) */}
        <NarrativeOrchestrator scrollYProgress={progress} />
      </div>
    </div>
  );
}
