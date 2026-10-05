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
        setErrorMsg('Unsupported format — please provide a CSV or JSON observation file');
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
        telescope: 'Simulated Observation Stream',
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
        className={`relative flex min-h-[200px] sm:min-h-[220px] flex-col items-center justify-center rounded border transition-all duration-200 cursor-pointer select-none p-6 text-center ${
          isDragActive
            ? 'border-[#5BD8F5] bg-[#5BD8F5]/10'
            : errorMsg
              ? 'border-[#D95C5C]/60 bg-[#D95C5C]/10'
              : 'border-[#1C2630] bg-[#0B0F14] hover:border-[#5BD8F5]/40 hover:bg-[#10161D]'
        }`}
      >
        <input {...getInputProps()} aria-label="Drop observation file or select file" />

        {/* Dynamic Center Visual Feedback */}
        <AnimatePresence mode="wait">
          {isDragActive ? (
            <motion.div
              key="drag-active"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center gap-2 text-[#5BD8F5]"
            >
              <Upload className="h-6 w-6 text-[#5BD8F5]" />
              <span className="text-xs font-medium">Release file to load observation</span>
            </motion.div>
          ) : errorMsg ? (
            <motion.div
              key="error-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-2 text-[#D95C5C]"
            >
              <AlertCircle className="h-6 w-6 text-[#D95C5C]" />
              <span className="text-xs font-medium">{errorMsg}</span>
              <span className="text-xs text-[#7F8B95]">Click or drag a valid CSV or JSON file</span>
            </motion.div>
          ) : (
            <motion.div
              key="idle-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-3"
            >
              <div className="flex h-9 w-9 items-center justify-center rounded border border-[#1C2630] bg-[#10161D] text-[#7F8B95]">
                <Upload className="h-4 w-4 text-[#5BD8F5]" />
              </div>

              <div>
                <span className="block text-xs font-medium text-[#E6EDF2]">
                  Drop observation file here, or click to browse
                </span>
                <span className="mt-1 block text-xs text-[#7F8B95]">
                  Supports radio time-series and spectrogram matrices
                </span>
              </div>

              {/* Supported formats */}
              <div className="mt-1 flex items-center gap-2 text-xs text-[#7F8B95]">
                <span>Supported formats: CSV, JSON</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick-Load Reference Astronomical Datasets */}
      <div className="rounded border border-[#1C2630] bg-[#0B0F14] p-3 text-xs">
        <div className="flex items-center justify-between border-b border-[#1C2630] pb-2 mb-2.5">
          <div className="flex items-center gap-2">
            <Database className="h-3.5 w-3.5 text-[#5BD8F5]" />
            <span className="text-xs font-medium text-[#E6EDF2]">Demonstration observations</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {REFERENCE_OBSERVATIONS.map((ref) => (
            <button
              key={ref.id}
              type="button"
              onClick={() => onObservationLoaded(ref)}
              className="flex flex-col items-start gap-1 rounded border border-[#1C2630] bg-[#06080B] p-2.5 text-left transition-colors hover:border-[#5BD8F5]/40 hover:bg-[#10161D] group cursor-pointer"
            >
              <div className="flex w-full items-center justify-between">
                <span className="text-xs font-semibold text-[#5BD8F5] font-mono">{ref.id}</span>
                <span className="text-[10px] text-[#7F8B95] font-mono">
                  {ref.format} • {(ref.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB
                </span>
              </div>
              <span className="text-xs text-[#E6EDF2] truncate w-full">{ref.name}</span>
              <span className="text-[11px] text-[#7F8B95] font-mono">
                {ref.frequencyMHz.toFixed(2)} MHz • {ref.durationString}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
