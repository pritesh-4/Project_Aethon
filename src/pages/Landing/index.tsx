import { useRef } from 'react';
import { useScroll } from 'motion/react';
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

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-[#06080B] text-[#E6EDF2]"
      style={{ height: '500vh' }}
    >
      {/* Sticky Viewport Shell */}
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#06080B] flex flex-col justify-between">
        {/* Subtle deep-space background radial gradient */}
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(91,216,245,0.04),rgba(6,8,11,0.95))] pointer-events-none z-0"
          aria-hidden="true"
        />

        {/* 1. Persistent Top Header with Hardware-Accelerated Scroll Progress */}
        <LandingHeader scrollYProgress={scrollYProgress} />

        {/* 2. Persistent Signal Canvas (The Primary Animated Hero) */}
        <AstronomicalSignalCanvas scrollYProgress={scrollYProgress} />

        {/* 3. Single Narrative Position (5 Mutually Exclusive Scroll States) */}
        <NarrativeOrchestrator scrollYProgress={scrollYProgress} />
      </div>
    </div>
  );
}
