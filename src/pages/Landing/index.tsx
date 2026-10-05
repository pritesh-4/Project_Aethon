import { useState, useRef, useEffect, useCallback } from 'react';
import { useScroll, useMotionValueEvent } from 'motion/react';
import { AstronomicalSignalCanvas } from './components/AstronomicalSignalCanvas.tsx';
import { TelemetryOverlay } from './components/TelemetryOverlay.tsx';
import { NarrativeSection1 } from './components/NarrativeSection1.tsx';
import { NarrativeSection2 } from './components/NarrativeSection2.tsx';
import { NarrativeSection3 } from './components/NarrativeSection3.tsx';
import { NarrativeSection4 } from './components/NarrativeSection4.tsx';
import { NarrativeSection5 } from './components/NarrativeSection5.tsx';
import { NarrativeSection6 } from './components/NarrativeSection6.tsx';

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  });

  useMotionValueEvent(scrollYProgress, 'change', (latest) => {
    const clamped = Math.max(0, Math.min(1, latest));
    setProgress(clamped);

    // Compute active section index
    if (clamped < 0.18) {
      setCurrentSectionIndex(0);
    } else if (clamped < 0.38) {
      setCurrentSectionIndex(1);
    } else if (clamped < 0.58) {
      setCurrentSectionIndex(2);
    } else if (clamped < 0.78) {
      setCurrentSectionIndex(3);
    } else if (clamped < 0.9) {
      setCurrentSectionIndex(4);
    } else {
      setCurrentSectionIndex(5);
    }
  });

  const handleNavigateToSection = useCallback((sectionIndex: number) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const maxScroll = container.scrollHeight - window.innerHeight;

    const targets = [0.0, 0.25, 0.46, 0.67, 0.83, 0.98];
    const targetProg = targets[sectionIndex] ?? 0;
    const targetScrollY = container.offsetTop + maxScroll * targetProg;

    window.scrollTo({
      top: targetScrollY,
      behavior: 'smooth',
    });
  }, []);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        // Proceed forward
        if (e.key === ' ' && e.shiftKey) {
          e.preventDefault();
          window.scrollBy({ top: -window.innerHeight * 0.75, behavior: 'smooth' });
        } else {
          e.preventDefault();
          window.scrollBy({ top: window.innerHeight * 0.75, behavior: 'smooth' });
        }
      } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        window.scrollBy({ top: -window.innerHeight * 0.75, behavior: 'smooth' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full bg-[#02040a] text-slate-100"
      style={{ height: '650vh' }}
    >
      {/* Sticky Viewport Shell */}
      <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#02040a]">
        {/* Deep space background subtle texture */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(14,165,233,0.06),rgba(2,4,10,0.95))] pointer-events-none z-0" />

        {/* The Single Core Animation Canvas */}
        <AstronomicalSignalCanvas progress={progress} />

        {/* Narrative Sections Overlay */}
        <div className="relative z-10 h-full w-full">
          {progress < 0.22 && <NarrativeSection1 progress={progress} />}
          {progress >= 0.16 && progress < 0.41 && <NarrativeSection2 progress={progress} />}
          {progress >= 0.36 && progress < 0.61 && <NarrativeSection3 progress={progress} />}
          {progress >= 0.56 && progress < 0.81 && <NarrativeSection4 progress={progress} />}
          {progress >= 0.76 && progress < 0.92 && <NarrativeSection5 progress={progress} />}
          {progress >= 0.88 && <NarrativeSection6 progress={progress} />}
        </div>

        {/* Scientific Telemetry & Index Navigation Overlay */}
        <TelemetryOverlay
          progress={progress}
          currentSectionIndex={currentSectionIndex}
          onNavigateToSection={handleNavigateToSection}
        />
      </div>
    </div>
  );
}
