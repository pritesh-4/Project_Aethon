import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { PageHeader } from '@/components/layout/PageHeader.tsx';
import { PageTransition } from '@/components/ui/motion.tsx';
import { Badge } from '@/components/ui/Badge.tsx';
import { SegmentedControl } from '@/components/ui/SegmentedControl.tsx';
import { SignalCard } from '@/features/signals/SignalCard.tsx';
import { SAMPLE_CANDIDATES } from '@/features/signals/sample-data.ts';
import { UploadCloud, Search, Filter, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CandidateSignal } from '@/types/index.ts';

export default function DiscoverPage() {
  const [candidates, setCandidates] = useState<CandidateSignal[]>(SAMPLE_CANDIDATES);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];
    setUploadedFileName(file.name);
    setIsProcessing(true);

    toast.info(`Ingesting radio spectrogram: ${file.name}`, {
      description: `Size: ${(file.size / 1024).toFixed(1)} KB. Commencing Polyphase Filterbank FFT...`,
    });

    // Simulate AI model inference on the uploaded signal
    setTimeout(() => {
      setIsProcessing(false);
      const newSignal: CandidateSignal = {
        id: `SIG-2026-${Math.floor(100 + Math.random() * 900)}X`,
        name: `Extracted Anomaly [${file.name.replace(/\.[^/.]+$/, '')}]`,
        frequencyMHz: 1420.735,
        bandwidthKHz: 3.8,
        snrDb: 22.4,
        driftRateHzPerSec: -0.28,
        timestamp: new Date().toISOString(),
        telescope: 'Local Ingest Buffer / GBT Archive',
        status: 'candidate',
        priorityRank: 'high',
        anomalyScore: 0.912,
        verificationStatus: 'flagged',
        mlModelVersion: 'AethonNet-v2.4-Transformer',
        coordinates: {
          ra: '18h 12m 04.1s',
          dec: '-14° 01′ 22.0″',
          constellation: 'Serpens',
        },
      };

      setCandidates((prev) => [newSignal, ...prev]);
      toast.success('Signal Processed Successfully', {
        description: `Isolated narrowband anomaly at ${newSignal.frequencyMHz} MHz (SNR: +${newSignal.snrDb} dB)`,
      });
    }, 1800);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/octet-stream': ['.fil', '.h5', '.fits', '.dat'],
      'text/csv': ['.csv'],
      'application/json': ['.json'],
    },
  });

  const filteredCandidates = candidates.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.telescope.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPriority = filterPriority === 'all' || item.priorityRank === filterPriority;

    return matchesSearch && matchesPriority;
  });

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        category="SIGNAL DISCOVERY PIPELINE"
        title="Signal Discovery & Ingestion"
        subtitle="Upload astronomical filterbank (FIL, HDF5, FITS) raw data or query candidate signals isolated across automated telescope surveys."
        badge={<Badge variant="cyan">NEURAL FFT INFERENCE READY</Badge>}
      />

      {/* File Upload Zone */}
      <div
        {...getRootProps()}
        className={`relative flex flex-col items-center justify-center rounded-[2px] border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
          isDragActive
            ? 'border-cyan-400 bg-cyan-950/30'
            : 'border-slate-800 bg-[#040814]/70 hover:border-slate-700 hover:bg-[#070d1e]/80'
        }`}
      >
        <input {...getInputProps()} />

        <div className="flex h-10 w-10 items-center justify-center rounded-[2px] border border-cyan-900/60 bg-cyan-950/40 text-cyan-400 mb-3 shadow-[0_0_12px_rgba(6,182,212,0.18)]">
          <UploadCloud className="h-5 w-5" />
        </div>

        <h3 className="text-base font-semibold text-slate-100 font-sans">
          {isDragActive
            ? 'Release radio telemetry file for ingestion'
            : 'Drop astronomical signal file here, or click to browse'}
        </h3>

        <p className="mt-1 text-xs text-slate-400 font-mono">
          Supports SIGPROC Filterbank (.fil), HDF5 (.h5), FITS (.fits), and telemetry CSV dumps
        </p>

        {uploadedFileName && (
          <div className="mt-3 flex items-center gap-2 rounded-[2px] bg-slate-900 px-3 py-1 font-mono text-xs text-cyan-300 border border-slate-700">
            {isProcessing ? (
              <span className="h-3 w-3 rounded-none border border-cyan-400 border-t-transparent animate-spin" />
            ) : (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            )}
            <span>{uploadedFileName}</span>
            {isProcessing && <span className="text-slate-400">— Running AethonNet FFT...</span>}
          </div>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-3 rounded-[2px] border border-slate-800 bg-[#040814]/90 p-3 font-mono text-xs">
        <div className="relative w-full lg:w-80">
          <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search signal ID, target, coordinates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-8 rounded-[2px] border border-slate-700/80 bg-slate-950 pl-8 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-400 focus:outline-none focus:ring-1 focus:ring-cyan-400 tracking-wider"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-cyan-500" />
            FILTER:
          </span>
          <SegmentedControl
            options={[
              { value: 'all', label: 'ALL', badge: candidates.length },
              { value: 'critical', label: 'CRITICAL' },
              { value: 'high', label: 'HIGH' },
              { value: 'medium', label: 'MEDIUM' },
              { value: 'low', label: 'RFI' },
            ]}
            value={filterPriority}
            onChange={(val) => setFilterPriority(val)}
            size="sm"
          />
        </div>
      </div>

      {/* Candidates Display */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
          <span>Showing {filteredCandidates.length} candidate discoveries</span>
          <span>Sorting: Highest Anomaly Score first</span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCandidates.map((candidate) => (
            <SignalCard key={candidate.id} signal={candidate} />
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
