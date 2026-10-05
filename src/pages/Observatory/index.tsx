import { useState, useEffect, useRef, useCallback } from 'react';
import { PageTransition } from '@/components/ui/motion.tsx';
import { AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

import type { ObservationStatus } from './types.ts';
import { MOCK_OBSERVATIONS } from './data/mockObservations.ts';
import { ObservatoryHeader } from './components/ObservatoryHeader.tsx';
import { SignalViewport } from './components/SignalViewport.tsx';
import { CandidateAlert } from './components/CandidateAlert.tsx';
import { ObservatoryDetails } from './components/ObservatoryDetails.tsx';

export default function ObservatoryPage() {
  const [selectedObsId, setSelectedObsId] = useState<string>(MOCK_OBSERVATIONS[0].id);
  const [status, setStatus] = useState<ObservationStatus>('IDLE');
  const [isPaused, setIsPaused] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Active observation reference
  const currentObservation =
    MOCK_OBSERVATIONS.find((o) => o.id === selectedObsId) || MOCK_OBSERVATIONS[0];

  const scanTimerRef = useRef<number | null>(null);
  const timeoutsRef = useRef<number[]>([]);

  const safeTimeout = useCallback((cb: () => void, ms: number) => {
    const id = window.setTimeout(cb, ms);
    timeoutsRef.current.push(id);
    return id;
  }, []);

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
  }, []);

  // Clean up any running timers on unmount
  useEffect(() => {
    return () => {
      if (scanTimerRef.current) cancelAnimationFrame(scanTimerRef.current);
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  // Handle Observation selection
  const handleSelectObservation = (id: string) => {
    if (scanTimerRef.current) cancelAnimationFrame(scanTimerRef.current);
    clearAllTimeouts();
    setSelectedObsId(id);
    setStatus('IDLE');
    setScanProgress(0);
    setIsPaused(false);
    toast.info(`Observation ${id} loaded`);
  };

  // State Machine Trigger: Run Analysis Flow
  const handleStartAnalysis = useCallback(() => {
    if (status === 'ANALYZING' || status === 'LOADING') return;

    if (scanTimerRef.current) cancelAnimationFrame(scanTimerRef.current);
    clearAllTimeouts();

    // Step 1: LOADING (buffer ingestion)
    setStatus('LOADING');
    setIsPaused(false);
    setScanProgress(0);

    safeTimeout(() => {
      // Step 2: ANALYZING (scanning sweep across spectrogram)
      setStatus('ANALYZING');
      const startTime = performance.now();
      const sweepDuration = 2400; // 2.4s sweep

      const animateScan = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / sweepDuration);
        setScanProgress(progress);

        if (progress < 1) {
          scanTimerRef.current = requestAnimationFrame(animateScan);
        } else {
          // Step 3: ANOMALY DETECTED
          setStatus('ANOMALY_DETECTED');
          toast.success(`Candidate event detected in ${currentObservation.id}`);

          // Step 4: CANDIDATE READY (after brief verification delay)
          safeTimeout(() => {
            setStatus('CANDIDATE_READY');
          }, 800);
        }
      };

      scanTimerRef.current = requestAnimationFrame(animateScan);
    }, 600);
  }, [status, currentObservation, clearAllTimeouts, safeTimeout]);

  // Handle Pause / Resume toggle
  const handleTogglePause = () => {
    setIsPaused(!isPaused);
    toast(isPaused ? 'Observation resumed' : 'Observation paused');
  };

  // Handle Reset to IDLE
  const handleReset = () => {
    if (scanTimerRef.current) cancelAnimationFrame(scanTimerRef.current);
    clearAllTimeouts();
    setStatus('IDLE');
    setScanProgress(0);
    setIsPaused(false);
    toast('Observation reset');
  };

  return (
    <PageTransition className="space-y-4">
      {/* 1. Unified Observatory Header & Action Bar */}
      <ObservatoryHeader
        observationId={currentObservation.id}
        status={status}
        targetName={currentObservation.targetName}
        telescope={currentObservation.telescope}
        observationList={MOCK_OBSERVATIONS.map((o) => ({ id: o.id, name: o.name }))}
        onSelectObservation={handleSelectObservation}
        isPaused={isPaused}
        onStartAnalysis={handleStartAnalysis}
        onTogglePause={handleTogglePause}
        onReset={handleReset}
      />

      {/* 2. Primary Signal Viewport (The Dominant Scientific Hero) */}
      <SignalViewport
        observation={currentObservation}
        status={status}
        isPaused={isPaused}
        scanProgress={scanProgress}
      />

      {/* 3. Candidate Event Alert Banner (Conditional on Detection) */}
      <AnimatePresence>
        {(status === 'ANOMALY_DETECTED' || status === 'CANDIDATE_READY') && (
          <CandidateAlert observation={currentObservation} />
        )}
      </AnimatePresence>

      {/* 4. Supporting Information Group: 3 Key Metrics + Progressive Diagnostics */}
      <ObservatoryDetails observation={currentObservation} status={status} />
    </PageTransition>
  );
}
