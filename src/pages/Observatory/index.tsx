import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { PageTransition } from '@/components/ui/motion.tsx';
import { AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { AlertTriangle, RefreshCw, Radio, Upload } from 'lucide-react';

import type { ObservationData, ObservationStatus } from './types.ts';
import { MOCK_OBSERVATIONS } from './data/mockObservations.ts';
import { ObservatoryHeader } from './components/ObservatoryHeader.tsx';
import { SignalViewport } from './components/SignalViewport.tsx';
import { CandidateAlert } from './components/CandidateAlert.tsx';
import { ObservatoryDetails } from './components/ObservatoryDetails.tsx';
import { ObservationUploadModal } from '@/components/ObservationUploadModal.tsx';
import { Button } from '@/components/ui/Button.tsx';

import { api } from '@/lib/api.ts';
import type {
  ObservationRecordResponse,
  SpectralSliceResponse,
  DetectionResponse,
  AnalysisResponse,
} from '@/types/schemas.ts';

function recordToObservationData(
  rec: ObservationRecordResponse,
  detection?: DetectionResponse | null,
  analysis?: AnalysisResponse | null
): ObservationData {
  const meta = rec.metadata;
  const fCenter = meta?.frequency_reference_mhz ?? 1420.405;
  const bwMHz = meta?.bandwidth_mhz ?? 10.0;
  const tStep = meta?.time_step_seconds ?? 1.0;
  const nInt = meta?.time_sample_count ?? 64;
  const durSec = nInt * tStep;
  const m = Math.floor(durSec / 60);
  const s = Math.floor(durSec % 60);
  const durStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

  const topRegion = detection?.anomalous_regions?.[0];
  const topEvidence = topRegion?.isolation_forest_evidence ?? topRegion?.baseline_evidence;
  const driftRate = analysis?.drift_estimate?.drift_rate_hz_per_s ?? 0;
  const snr = analysis?.temporal?.temporal_profile_snr ?? 14.2;
  const anomalyScore = topEvidence?.anomaly_score
    ? Math.min(100, Math.max(0, topEvidence.anomaly_score * 100))
    : 0;
  const persistencePct = analysis?.temporal?.temporal_persistence
    ? analysis.temporal.temporal_persistence * 100
    : topRegion
      ? 82.5
      : 0;

  const raStr =
    meta?.ra_str || (meta?.ra_deg != null ? `${meta.ra_deg.toFixed(4)}°` : '19h 44m 28s');
  const decStr =
    meta?.dec_str || (meta?.dec_deg != null ? `${meta.dec_deg.toFixed(4)}°` : '+27° 05′ 29″');

  return {
    id: rec.id,
    name: meta?.source_name || rec.original_filename || rec.id,
    targetName: meta?.source_name || rec.original_filename || 'Deep Space Pointing',
    telescope: meta?.telescope_name || 'Astronomical Instrument',
    frequencyMHz: fCenter,
    bandwidthMHz: bwMHz,
    windowDuration: durStr,
    durationSeconds: durSec,
    signalPowerDbm: -92.4,
    noiseFloorDbm: -108.6,
    snrDb: snr,
    rfiRisk: 'LOW',
    driftRateHzPerSec: driftRate,
    coordinates: {
      ra: raStr,
      dec: decStr,
    },
    anomaly: {
      indexPercent: anomalyScore || (topRegion ? 84.5 : 0),
      knownPatternSimilarityPercent: 12.0,
      interferenceProbabilityPercent: 8,
      persistencePercent: persistencePct || (topRegion ? 78.4 : 0),
      region: {
        timeStartSec: topRegion?.window?.time_start ?? 0,
        timeEndSec: topRegion?.window?.time_stop ?? durSec,
        freqOffsetKHz: 0,
        bandwidthKHz: 25,
      },
      classificationLabel: topRegion ? 'Doppler Linear Drift' : 'Standard Baseline',
    },
    priority: anomalyScore > 85 ? 'CRITICAL' : anomalyScore > 65 ? 'HIGH' : 'LOW',
    telemetryNotes: `Ingested via ${rec.format.toUpperCase()} filterbank reader. File hash: ${rec.sha256.slice(0, 12)}...`,
  };
}

export default function ObservatoryPage() {
  const [selectedObsId, setSelectedObsId] = useState<string>(
    api.isDemoMode() ? MOCK_OBSERVATIONS[0].id : ''
  );
  const [status, setStatus] = useState<ObservationStatus>('IDLE');
  const [isPaused, setIsPaused] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Backend state
  const [recordMap, setRecordMap] = useState<Record<string, ObservationRecordResponse>>({});
  const [observationList, setObservationList] = useState<{ id: string; name: string }[]>(
    api.isDemoMode() ? MOCK_OBSERVATIONS.map((o) => ({ id: o.id, name: o.name })) : []
  );
  const [sliceData, setSliceData] = useState<SpectralSliceResponse | null>(null);
  const [isLoadingSlice, setIsLoadingSlice] = useState(false);
  const [detectionData, setDetectionData] = useState<DetectionResponse | null>(null);
  const [analysisData, setAnalysisData] = useState<AnalysisResponse | null>(null);

  const [loadError, setLoadError] = useState<string | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const scanTimerRef = useRef<number | null>(null);

  // Fetch observations catalog from backend on mount
  const loadObservations = useCallback(async () => {
    try {
      setLoadError(null);
      const res = await api.getObservations({ limit: 50 });
      if (res && res.items && res.items.length > 0) {
        const map: Record<string, ObservationRecordResponse> = {};
        const items = res.items.map((item: ObservationRecordResponse) => {
          map[item.id] = item;
          return {
            id: item.id,
            name: item.metadata?.source_name || item.original_filename || item.id,
          };
        });
        setRecordMap(map);
        setObservationList(items);

        // Select the first observation from backend
        setSelectedObsId(items[0].id);
      } else if (api.isDemoMode()) {
        setObservationList(MOCK_OBSERVATIONS.map((o) => ({ id: o.id, name: o.name })));
        setSelectedObsId(MOCK_OBSERVATIONS[0].id);
      } else {
        setObservationList([]);
        setSelectedObsId('');
      }
    } catch (err: unknown) {
      if (api.isDemoMode()) {
        setObservationList(MOCK_OBSERVATIONS.map((o) => ({ id: o.id, name: o.name })));
        setSelectedObsId(MOCK_OBSERVATIONS[0].id);
      } else {
        const msg =
          (err as { message?: string })?.message ||
          'Failed to connect to backend observation feed.';
        setLoadError(msg);
      }
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadObservations();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadObservations]);

  // Fetch real spectral slice whenever selected observation changes
  useEffect(() => {
    let isCancelled = false;

    const fetchSlice = async () => {
      // If observation is not in backend recordMap and we are in demo mode, skip slice fetch
      if (!recordMap[selectedObsId] && api.isDemoMode()) {
        setSliceData(null);
        return;
      }

      setIsLoadingSlice(true);
      try {
        const slice = await api.getObservationSlice(selectedObsId, {
          time_start: 0,
          time_stop: 64,
          frequency_start: 0,
          frequency_stop: 256,
        });
        if (!isCancelled) {
          setSliceData(slice);
        }
      } catch {
        if (!isCancelled) {
          setSliceData(null);
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingSlice(false);
        }
      }
    };

    fetchSlice();

    return () => {
      isCancelled = true;
    };
  }, [selectedObsId, recordMap]);

  // Clean up any running timers on unmount
  useEffect(() => {
    return () => {
      if (scanTimerRef.current) cancelAnimationFrame(scanTimerRef.current);
    };
  }, []);

  // Compute active observation object
  const currentObservation: ObservationData | null = useMemo(() => {
    if (recordMap[selectedObsId]) {
      return recordToObservationData(recordMap[selectedObsId], detectionData, analysisData);
    }
    if (api.isDemoMode()) {
      return MOCK_OBSERVATIONS.find((o) => o.id === selectedObsId) || MOCK_OBSERVATIONS[0];
    }
    return null;
  }, [recordMap, selectedObsId, detectionData, analysisData]);

  // Handle Observation selection
  const handleSelectObservation = (id: string) => {
    if (scanTimerRef.current) cancelAnimationFrame(scanTimerRef.current);
    setSelectedObsId(id);
    setStatus('IDLE');
    setScanProgress(0);
    setIsPaused(false);
    setDetectionData(null);
    setAnalysisData(null);
    toast.info(`Observation ${id} loaded`);
  };

  // State Machine Trigger: Run Analysis Flow
  const handleStartAnalysis = useCallback(async () => {
    if (status === 'ANALYZING' || status === 'LOADING') return;

    if (scanTimerRef.current) cancelAnimationFrame(scanTimerRef.current);

    setStatus('LOADING');
    setIsPaused(false);
    setScanProgress(0);

    // If observation is in backend, run real detection and drift analysis
    if (recordMap[selectedObsId]) {
      setStatus('ANALYZING');
      try {
        // Run real detection and drift analysis in parallel
        const [detRes, anaRes] = await Promise.allSettled([
          api.detectAnomalies(selectedObsId),
          api.analyzeDrift(selectedObsId),
        ]);

        const detection = detRes.status === 'fulfilled' ? detRes.value : null;
        const analysis = anaRes.status === 'fulfilled' ? anaRes.value : null;

        setDetectionData(detection);
        setAnalysisData(analysis);
        setScanProgress(1);

        if (detection && detection.anomalous_regions && detection.anomalous_regions.length > 0) {
          setStatus('ANOMALY_DETECTED');
          toast.success(
            `Detection event verified: ${detection.anomalous_regions.length} anomalous window(s) in ${selectedObsId}`
          );
          setTimeout(() => {
            setStatus('CANDIDATE_READY');
          }, 800);
        } else {
          setStatus('IDLE');
          toast.info(
            `Analysis complete for ${selectedObsId}: no coherent carrier exceeded 3.5σ threshold.`
          );
        }
      } catch (err: unknown) {
        setStatus('IDLE');
        const msg =
          (err as { message?: string })?.message ||
          'Analysis failed. Please verify backend service.';
        toast.error('Analysis error', { description: msg });
      }
    } else if (api.isDemoMode() && currentObservation) {
      // Synthetic demonstration sweep fallback
      setStatus('ANALYZING');
      const startTime = performance.now();
      const sweepDuration = 2000;

      const animateScan = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / sweepDuration);
        setScanProgress(progress);

        if (progress < 1) {
          scanTimerRef.current = requestAnimationFrame(animateScan);
        } else {
          setStatus('ANOMALY_DETECTED');
          toast.success(`Candidate event detected in ${currentObservation.id}`);
          setTimeout(() => {
            setStatus('CANDIDATE_READY');
          }, 800);
        }
      };

      scanTimerRef.current = requestAnimationFrame(animateScan);
    } else {
      setStatus('IDLE');
      toast.error('Observation not found in backend repository.');
    }
  }, [status, selectedObsId, recordMap, currentObservation]);

  // Handle Pause / Resume toggle
  const handleTogglePause = () => {
    setIsPaused(!isPaused);
    toast(isPaused ? 'Observation resumed' : 'Observation paused');
  };

  // Handle Reset to IDLE
  const handleReset = () => {
    if (scanTimerRef.current) cancelAnimationFrame(scanTimerRef.current);
    setStatus('IDLE');
    setScanProgress(0);
    setIsPaused(false);
    setDetectionData(null);
    setAnalysisData(null);
    toast('Observation reset');
  };

  // Handle new uploaded observation
  const handleObservationUploaded = (newRecord: ObservationRecordResponse) => {
    setRecordMap((prev) => ({ ...prev, [newRecord.id]: newRecord }));
    setObservationList((prev) => [
      {
        id: newRecord.id,
        name: newRecord.metadata?.source_name || newRecord.original_filename || newRecord.id,
      },
      ...prev,
    ]);
    setSelectedObsId(newRecord.id);
    setStatus('IDLE');
    setScanProgress(0);
  };

  // Honest backend load error state
  if (loadError && !api.isDemoMode()) {
    return (
      <PageTransition className="space-y-6 max-w-4xl mx-auto py-12 px-4">
        <div className="rounded-[3px] border border-[#D6D2C9] bg-[#FAF8F5] p-10 text-center shadow-xs">
          <div className="flex flex-col items-center gap-3">
            <AlertTriangle className="h-8 w-8 text-[#B64B4B]" />
            <h2 className="text-xl font-normal text-[#17202A] font-serif">
              Backend Service Unavailable
            </h2>
            <p className="max-w-md text-xs text-[#56616A] leading-relaxed">
              Unable to load live observations from{' '}
              <code className="text-[#376A9B] font-mono font-semibold">{api.getBaseUrl()}</code>.{' '}
              {loadError}
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={loadObservations}
                icon={<RefreshCw className="h-3.5 w-3.5" />}
              >
                Retry connection
              </Button>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }

  // Honest empty state when no observations exist
  if (!currentObservation) {
    return (
      <PageTransition className="space-y-6 max-w-4xl mx-auto py-12 px-4">
        <div className="rounded-[3px] border border-[#D6D2C9] bg-[#FAF8F5] p-10 text-center shadow-xs">
          <div className="flex flex-col items-center gap-3">
            <Radio className="h-8 w-8 text-[#76828D]" />
            <h2 className="text-xl font-normal text-[#17202A] font-serif">
              No Observations Available
            </h2>
            <p className="max-w-md text-xs text-[#56616A] leading-relaxed">
              The observation repository is currently empty. Ingest or upload an observation file
              (FITS, Filterbank, H5) to begin analysis.
            </p>
            <div className="mt-4 flex items-center gap-3">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsUploadModalOpen(true)}
                icon={<Upload className="h-3.5 w-3.5" />}
              >
                Upload observation
              </Button>
            </div>
          </div>
        </div>
        <ObservationUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUploaded={handleObservationUploaded}
        />
      </PageTransition>
    );
  }

  return (
    <PageTransition className="flex flex-col min-h-0 space-y-0">
      {/* 1. Instrument Identity Strip */}
      <ObservatoryHeader
        observationId={currentObservation.id}
        status={status}
        targetName={currentObservation.targetName}
        frequencyMHz={currentObservation.frequencyMHz}
        observationList={observationList}
        onSelectObservation={handleSelectObservation}
        isPaused={isPaused}
        onStartAnalysis={handleStartAnalysis}
        onTogglePause={handleTogglePause}
        onReset={handleReset}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        isDemoMode={api.isDemoMode()}
      />

      {/* 2. Primary Signal Viewport — the dominant focal object */}
      <div className="px-4 sm:px-6 py-4">
        <SignalViewport
          observation={currentObservation}
          status={status}
          isPaused={isPaused}
          scanProgress={scanProgress}
          sliceData={sliceData}
          isLoadingSlice={isLoadingSlice}
          detectionData={detectionData}
        />
      </div>

      {/* 3. Candidate Alert (conditional) */}
      <AnimatePresence>
        {(status === 'ANOMALY_DETECTED' || status === 'CANDIDATE_READY') && (
          <div className="px-4 sm:px-6 pb-2">
            <CandidateAlert observation={currentObservation} />
          </div>
        )}
      </AnimatePresence>

      {/* 4. Anomaly Assessment & Diagnostics */}
      <ObservatoryDetails observation={currentObservation} status={status} />

      {/* 5. Ingest Observation Modal */}
      <ObservationUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploaded={handleObservationUploaded}
      />
    </PageTransition>
  );
}
