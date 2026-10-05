import { useState, useEffect, useRef, useCallback } from 'react';
import { PageTransition } from '@/components/ui/motion.tsx';
import { AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

import type { ObservationStatus } from './types.ts';
import { MOCK_OBSERVATIONS } from './data/mockObservations.ts';
import { ObservatoryHeader } from './components/ObservatoryHeader.tsx';
import { ObservationControls } from './components/ObservationControls.tsx';
import { SignalViewport } from './components/SignalViewport.tsx';
import { TelemetryStrip } from './components/TelemetryStrip.tsx';
import { AnomalyPanel } from './components/AnomalyPanel.tsx';
import { PipelineStatus } from './components/PipelineStatus.tsx';
import { CandidateAlert } from './components/CandidateAlert.tsx';

export default function ObservatoryPage() {
  const [selectedObsId, setSelectedObsId] = useState<string>(MOCK_OBSERVATIONS[0].id);
  const [status, setStatus] = useState<ObservationStatus>('IDLE');
  const [isPaused, setIsPaused] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Active observation reference
  const currentObservation =
    MOCK_OBSERVATIONS.find((o) => o.id === selectedObsId) || MOCK_OBSERVATIONS[0];

  const scanTimerRef = useRef<number | null>(null);

  // Clean up any running timers on unmount
  useEffect(() => {
    return () => {
      if (scanTimerRef.current) cancelAnimationFrame(scanTimerRef.current);
    };
  }, []);

  // Handle Observation selection
  const handleSelectObservation = (id: string) => {
    if (scanTimerRef.current) cancelAnimationFrame(scanTimerRef.current);
    setSelectedObsId(id);
    setStatus('IDLE');
    setScanProgress(0);
    setIsPaused(false);
    toast.info(`Observation record ${id} loaded into receiver buffer`, {
      description: 'Aperture channelization and coordinate frames synchronized.',
    });
  };

  // State Machine Trigger: Run Analysis Flow
  const handleStartAnalysis = useCallback(() => {
    if (status === 'ANALYZING' || status === 'LOADING') return;

    if (scanTimerRef.current) cancelAnimationFrame(scanTimerRef.current);

    // Step 1: LOADING (buffer ingestion)
    setStatus('LOADING');
    setIsPaused(false);
    setScanProgress(0);

    setTimeout(() => {
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
          toast.success(`Anomalous Signal Isolated [${currentObservation.id}]`, {
            description: `Peak SNR: +${currentObservation.snrDb} dB | Anomaly Index: ${currentObservation.anomaly.indexPercent}%`,
          });

          // Step 4: CANDIDATE READY (after brief verification delay)
          setTimeout(() => {
            setStatus('CANDIDATE_READY');
          }, 800);
        }
      };

      scanTimerRef.current = requestAnimationFrame(animateScan);
    }, 600);
  }, [status, currentObservation]);

  // Handle Load Observation action
  const handleLoadObservation = () => {
    if (scanTimerRef.current) cancelAnimationFrame(scanTimerRef.current);
    setStatus('LOADING');
    setScanProgress(0);
    setTimeout(() => {
      setStatus('IDLE');
      toast.success(`Observation ${currentObservation.id} buffer reloaded`, {
        description: `${currentObservation.windowDuration} elapsed integration ready for analysis.`,
      });
    }, 500);
  };

  // Handle Pause / Resume toggle
  const handleTogglePause = () => {
    setIsPaused(!isPaused);
    toast(isPaused ? 'Observatory playback resumed' : 'Observatory playback paused');
  };

  // Handle Reset to IDLE
  const handleReset = () => {
    if (scanTimerRef.current) cancelAnimationFrame(scanTimerRef.current);
    setStatus('IDLE');
    setScanProgress(0);
    setIsPaused(false);
    toast('Observatory pipeline reset to initial standby state');
  };

  return (
    <PageTransition className="space-y-4">
      {/* 1. Top Observatory Technical Header */}
      <ObservatoryHeader
        observationId={currentObservation.id}
        status={status}
        targetName={currentObservation.targetName}
        telescope={currentObservation.telescope}
        observationList={MOCK_OBSERVATIONS.map((o) => ({ id: o.id, name: o.name }))}
        onSelectObservation={handleSelectObservation}
      />

      {/* 2. Observation Instrument Controls */}
      <ObservationControls
        observation={currentObservation}
        status={status}
        isPaused={isPaused}
        onLoadObservation={handleLoadObservation}
        onStartAnalysis={handleStartAnalysis}
        onTogglePause={handleTogglePause}
        onReset={handleReset}
      />

      {/* 3. Primary Signal Viewport (The Dominant Scientific Hero) */}
      <SignalViewport
        observation={currentObservation}
        status={status}
        isPaused={isPaused}
        scanProgress={scanProgress}
      />

      {/* 4. Horizontal Telemetry Strip */}
      <TelemetryStrip observation={currentObservation} />

      {/* 5. Restrained Candidate Event Banner (Appears on Anomaly / Candidate Detection) */}
      <AnimatePresence>
        {(status === 'ANOMALY_DETECTED' || status === 'CANDIDATE_READY') && (
          <CandidateAlert observation={currentObservation} />
        )}
      </AnimatePresence>

      {/* 6. Analytical Section: Anomaly Panel + Processing Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Anomaly Panel (7 cols) */}
        <div className="lg:col-span-7">
          <AnomalyPanel observation={currentObservation} status={status} />
        </div>

        {/* Right: Processing Pipeline (5 cols) */}
        <div className="lg:col-span-5">
          <PipelineStatus status={status} />
        </div>
      </div>
    </PageTransition>
  );
}
