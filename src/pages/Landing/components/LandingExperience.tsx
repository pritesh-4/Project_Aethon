import { useEffect, useRef, useState, useCallback } from 'react';
import Lenis from 'lenis';
import { SceneCanvas } from './SceneCanvas.tsx';
import { NarrativeLayer } from './NarrativeLayer.tsx';
import { LandingNavigation } from './LandingNavigation.tsx';
import { WebGLFallback } from './WebGLFallback.tsx';
import { observatoryAudio } from '@/lib/audio-synth.ts';

export function LandingExperience() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [velocity, setVelocity] = useState(0);
  const [hasWebGLError, setHasWebGLError] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // Listen for reduced motion preference changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const listener = (e: MediaQueryListEvent) => {
      setReducedMotion(e.matches);
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  const handleWebGLError = useCallback(() => {
    setHasWebGLError(true);
  }, []);

  // Initialize smooth Lenis scroll controller
  useEffect(() => {
    const lenis = new Lenis({
      duration: reducedMotion ? 0.3 : 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.5,
    });

    let rafId: number;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    // Scroll listener updates normalized narrative progress [0, 1]
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const normalizedP = docHeight > 0 ? Math.max(0, Math.min(1, scrollY / docHeight)) : 0;
      const vel = Math.max(-2, Math.min(2, lenis.velocity * 0.005));

      setProgress(normalizedP);
      setVelocity(vel);

      // Keep audio synth updated
      observatoryAudio.updateNarrativeProgress(normalizedP);
    };

    lenis.on('scroll', handleScroll);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
      observatoryAudio.updateNarrativeProgress(0);
    };
  }, [reducedMotion]);

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-[#070B10] text-[#E3EBF2]"
      style={{ height: '560vh' }}
    >
      {/* Sticky Fullscreen Observation Shell */}
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#070B10] flex flex-col justify-between select-none">
        {/* Subtle deep-space vignette gradient */}
        <div
          className="absolute inset-0 bg-[radial-gradient(ellipse_75%_75%_at_50%_-10%,rgba(55,106,155,0.08),rgba(7,11,16,0.98))] pointer-events-none z-0"
          aria-hidden="true"
        />

        {/* 1. Minimal Persistent Top Navigation Bar */}
        <LandingNavigation progress={progress} />

        {/* 2. Persistent 3D WebGL World (or Graceful Fallback) */}
        {!hasWebGLError ? (
          <SceneCanvas
            progress={progress}
            velocity={velocity}
            reducedMotion={reducedMotion}
            onWebGLError={handleWebGLError}
          />
        ) : (
          <WebGLFallback progress={progress} />
        )}

        {/* 3. Single Continuous Narrative Editorial Layer */}
        <NarrativeLayer progress={progress} reducedMotion={reducedMotion} />
      </div>
    </div>
  );
}
