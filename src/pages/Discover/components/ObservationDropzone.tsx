import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import type { DiscoveryObservationMeta } from '../types.ts';
import { REFERENCE_OBSERVATIONS } from '../data/mockDiscovery.ts';
import { Upload, Database, AlertCircle } from 'lucide-react';

export interface ObservationDropzoneProps {
  onObservationLoaded: (obs: DiscoveryObservationMeta) => void;
}

export function ObservationDropzone({ onObservationLoaded }: ObservationDropzoneProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: unknown[]) => {
      setErrorMsg(null);
      if (fileRejections && (fileRejections as unknown[]).length > 0) {
        setErrorMsg('UNSUPPORTED FORMAT — Please provide CSV or JSON telemetry data');
        return;
      }

      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];

      // Build observation meta from uploaded file
      const isJson = file.name.endsWith('.json');
      const mockMeta: DiscoveryObservationMeta = {
        id: `AET-${Math.floor(4000 + Math.random() * 5000)}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        format: isJson ? 'JSON' : 'CSV',
        samplesCount: Math.floor(100000 + Math.random() * 80000),
        durationString: '00:04:12',
        bandwidthMHz: 12.5,
        frequencyMHz: 1420.405,
        telescope: 'Local Ingestion Stream / Aperture Buffer',
        fileSizeBytes: file.size,
        coordinates: {
          ra: '14h 29m 42s',
          dec: '-62° 40′ 46″',
        },
      };

      onObservationLoaded(mockMeta);
    },
    [onObservationLoaded]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
    },
  });

  return (
    <div className="space-y-4">
      {/* Primary Observation Input Bay */}
      <div
        {...getRootProps()}
        className={`relative flex min-h-[220px] sm:min-h-[260px] flex-col items-center justify-center rounded-[2px] border transition-all duration-200 cursor-pointer select-none observatory-grid-bg p-6 text-center ${
          isDragActive
            ? 'border-[#66E3FF] bg-[#06b6d4]/10 shadow-[0_0_24px_rgba(102,227,255,0.15)]'
            : errorMsg
              ? 'border-[#FF5E5E]/70 bg-rose-950/20'
              : 'border-slate-800 bg-[#0A0E13]/80 hover:border-slate-700 hover:bg-[#0E141D]/90'
        }`}
      >
        <input {...getInputProps()} aria-label="Drop observation telemetry file or select file" />

        {/* Technical Corner Markers */}
        <span className="pointer-events-none absolute -left-[1px] -top-[1px] h-2 w-2 border-l border-t border-slate-600" />
        <span className="pointer-events-none absolute -right-[1px] -top-[1px] h-2 w-2 border-r border-t border-slate-600" />
        <span className="pointer-events-none absolute -left-[1px] -bottom-[1px] h-2 w-2 border-l border-b border-slate-600" />
        <span className="pointer-events-none absolute -right-[1px] -bottom-[1px] h-2 w-2 border-r border-b border-slate-600" />

        {/* Dynamic Center Visual Feedback */}
        <AnimatePresence mode="wait">
          {isDragActive ? (
            <motion.div
              key="drag-active"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center gap-2 font-mono text-[#66E3FF]"
            >
              <Upload className="h-7 w-7 animate-bounce text-[#66E3FF]" />
              <span className="text-xs font-bold uppercase tracking-widest">
                RELEASE TO LOAD OBSERVATION
              </span>
              <span className="text-[10px] text-cyan-300">AETHON PFB INGESTION READY</span>
            </motion.div>
          ) : errorMsg ? (
            <motion.div
              key="error-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2 font-mono text-[#FF5E5E]"
            >
              <AlertCircle className="h-6 w-6 text-[#FF5E5E]" />
              <span className="text-xs font-bold uppercase tracking-wider">{errorMsg}</span>
              <span className="text-[10px] text-slate-400">
                Click or drag a valid CSV / JSON radio telemetry file
              </span>
            </motion.div>
          ) : (
            <motion.div
              key="idle-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3 font-mono"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded-[2px] border border-slate-800 bg-[#05070A] text-slate-400">
                <Upload className="h-4 w-4 text-[#66E3FF]" />
              </div>

              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-[#EAF4F7]">
                  AWAITING OBSERVATION DATA
                </span>
                <span className="mt-1 block text-[11px] text-[#84929C]">
                  Drop radio spectral observation or click to browse filesystem
                </span>
              </div>

              {/* Format Capabilities List */}
              <div className="mt-2 flex flex-wrap items-center justify-center gap-2 text-[10px]">
                <span className="rounded-[1px] border border-slate-800 bg-slate-900/60 px-2 py-0.5 text-slate-300">
                  CURRENTLY SUPPORTED:{' '}
                  <strong className="text-cyan-400 font-normal">CSV · JSON</strong>
                </span>
                <span className="rounded-[1px] border border-slate-800/60 bg-slate-950/40 px-2 py-0.5 text-slate-500">
                  PLANNED ARCHIVE: <span className="text-slate-500">FITS* · HDF5* · FIL*</span>
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick-Load Reference Astronomical Datasets */}
      <div className="rounded-[2px] border border-slate-800/80 bg-[#0A0E13] p-3 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2 mb-2.5">
          <div className="flex items-center gap-2">
            <Database className="h-3 w-3 text-[#66E3FF]" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
              OR SELECT CALIBRATED REFERENCE OBSERVATION
            </span>
          </div>
          <span className="text-[10px] text-slate-500">SETI & BREAKTHROUGH LISTEN ARCHIVE</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {REFERENCE_OBSERVATIONS.map((ref) => (
            <button
              key={ref.id}
              type="button"
              onClick={() => onObservationLoaded(ref)}
              className="flex flex-col items-start gap-1 rounded-[2px] border border-slate-800 bg-[#05070A]/80 p-2.5 text-left transition-colors hover:border-[#66E3FF]/60 hover:bg-[#0d1627] group cursor-pointer"
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-xs font-bold text-[#66E3FF] group-hover:text-cyan-300">
                  {ref.id}
                </span>
                <span className="text-[9px] text-slate-500 font-mono uppercase">
                  {ref.format} • {(ref.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>
              <span className="text-[11px] text-slate-300 font-sans truncate w-full">
                {ref.name}
              </span>
              <span className="text-[10px] text-slate-500">
                f: {ref.frequencyMHz.toFixed(2)} MHz • {ref.durationString}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
