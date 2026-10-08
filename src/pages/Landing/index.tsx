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
      className="relative w-full bg-[#0D141A] text-[#E3EBF2]"
      style={{ height: '460vh' }}
    >
      {/* Sticky Viewport Shell */}
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#0D141A] flex flex-col justify-between">
        {/* Subtle deep-space background radial gradient */}
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(55,106,155,0.06),rgba(13,20,26,0.98))] pointer-events-none z-0"
          aria-hidden="true"
        />

        {/* 1. Persistent Top Header with Narrative-Aware Quiet Controls */}
        <LandingHeader scrollYProgress={progress} />

        {/* 2. Persistent Signal Canvas (The Protagonist Carrier) */}
        <AstronomicalSignalCanvas scrollYProgress={progress} />

        {/* 3. Single Continuous Narrative Timeline */}
        <NarrativeOrchestrator scrollYProgress={progress} />
      </div>
    </div>
  );
}
