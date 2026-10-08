import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import type { DiscoveryObservationMeta } from '../types.ts';
import { REFERENCE_OBSERVATIONS } from '../data/mockDiscovery.ts';
import { Upload, Check, AlertCircle, FileText } from 'lucide-react';

export interface ObservationInputProps {
  selectedObservation: DiscoveryObservationMeta | null;
  onSelectObservation: (obs: DiscoveryObservationMeta) => void;
  disabled?: boolean;
}

export function ObservationInput({
  selectedObservation,
  onSelectObservation,
  disabled = false,
}: ObservationInputProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: unknown[]) => {
      setErrorMsg(null);
      if (fileRejections && (fileRejections as unknown[]).length > 0) {
        setErrorMsg('Unsupported format — please select a CSV, JSON, or FITS observation file.');
        return;
      }

      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];

      const isJson = file.name.endsWith('.json');
      const isFits = file.name.endsWith('.fits') || file.name.endsWith('.fit');
      const format = isFits ? 'FITS' : isJson ? 'JSON' : 'CSV';

      const customMeta: DiscoveryObservationMeta = {
        id: `OBS-${Math.floor(1000 + Math.random() * 9000)}`,
        name: file.name.replace(/\.[^/.]+$/, ''),
        format,
        samplesCount: Math.floor(120000 + Math.random() * 60000),
        durationString: '00:04:45',
        bandwidthMHz: 12.5,
        frequencyMHz: 1420.405,
        telescope: 'Custom Astronomical Feed',
        fileSizeBytes: file.size,
        coordinates: {
          ra: '14h 29m 42s',
          dec: '-62° 40′ 46″',
        },
      };

      onSelectObservation(customMeta);
    },
    [onSelectObservation]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    disabled,
    accept: {
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      'application/fits': ['.fits', '.fit'],
      'text/plain': ['.txt'],
    },
  });

  return (
    <section className="space-y-4 font-sans">
      {/* Primary Question Header */}
      <div>
        <h2 className="text-base sm:text-lg font-medium tracking-tight text-[#E6E4DD]">
          Select an astronomical observation
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-[#9A9C96]">
          Choose a reference radio survey observation or upload a data file to configure screening.
        </p>
      </div>

      {/* Reference Observations Selection */}
      <div className="space-y-2">
        <span className="block text-xs font-medium text-[#9A9C96]">Reference observations</span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {REFERENCE_OBSERVATIONS.map((obs) => {
            const isSelected = selectedObservation?.id === obs.id;

            return (
              <button
                key={obs.id}
                type="button"
                aria-pressed={isSelected}
                disabled={disabled}
                onClick={() => onSelectObservation(obs)}
                className={`relative flex flex-col items-start p-3.5 rounded-[2px] border text-left transition-all cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A] ${
                  isSelected
                    ? 'border-[#D4864A] bg-[#241A14] text-[#E6E4DD]'
                    : 'border-[#262C28] bg-[#141715] text-[#9A9C96] hover:border-[#363C38] hover:bg-[#1A1E1B] hover:text-[#E6E4DD]'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#D4864A] font-mono">{obs.id}</span>
                  {isSelected && (
                    <span className="inline-flex items-center gap-1 rounded-[2px] bg-[#D4864A]/20 px-1.5 py-0.5 text-[10px] font-medium text-[#D4864A]">
                      <Check className="h-2.5 w-2.5" />
                      Selected
                    </span>
                  )}
                </div>

                <span className="mt-1.5 text-xs font-medium text-[#E6E4DD] line-clamp-1">
                  {obs.name}
                </span>

                <div className="mt-2 flex items-center gap-3 text-[11px] text-[#9A9C96] font-mono">
                  <span>{obs.frequencyMHz.toFixed(2)} MHz</span>
                  <span>•</span>
                  <span>{obs.durationString}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Upload Bay */}
      <div className="space-y-2">
        <span className="block text-xs font-medium text-[#9A9C96]">Or upload observation file</span>

        <div
          {...getRootProps()}
          className={`relative flex min-h-[120px] sm:min-h-[140px] flex-col items-center justify-center rounded-[2px] border border-dashed transition-all duration-150 cursor-pointer select-none p-5 text-center outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A] ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          } ${
            isDragActive
              ? 'border-[#D4864A] bg-[#D4864A]/10'
              : errorMsg
                ? 'border-[#C84A4A]/60 bg-[#C84A4A]/10'
                : 'border-[#262C28] bg-[#141715] hover:border-[#363C38] hover:bg-[#1A1E1B]'
          }`}
        >
          <input {...getInputProps()} aria-label="Upload observation file" />

          <AnimatePresence mode="wait">
            {isDragActive ? (
              <motion.div
                key="drag-active"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-2 text-[#D4864A]"
              >
                <Upload className="h-5 w-5 text-[#D4864A]" />
                <span className="text-xs font-medium">Release to load observation</span>
              </motion.div>
            ) : errorMsg ? (
              <motion.div
                key="error-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-2 text-[#C84A4A]"
              >
                <AlertCircle className="h-5 w-5 text-[#C84A4A]" />
                <span className="text-xs font-medium">{errorMsg}</span>
                <span className="text-xs text-[#9A9C96]">Drop a valid CSV, JSON, or FITS file</span>
              </motion.div>
            ) : (
              <motion.div
                key="idle-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-2 text-center"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-[2px] border border-[#262C28] bg-[#1A1E1B] text-[#D4864A]">
                  <Upload className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="text-xs font-medium text-[#E6E4DD]">
                    Drop observation file here, or browse files
                  </span>
                  <span className="mt-0.5 block text-xs text-[#9A9C96]">
                    Accepts CSV, JSON, or FITS time-frequency data
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Selected Observation Summary Strip */}
      {selectedObservation && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-[2px] border border-[#262C28] bg-[#141715] px-4 py-3 text-xs">
          <div className="flex items-center gap-2.5">
            <FileText className="h-4 w-4 text-[#D4864A] shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#D4864A] font-mono">
                  {selectedObservation.id}
                </span>
                <span className="text-[#363C38]">•</span>
                <span className="font-medium text-[#E6E4DD]">{selectedObservation.name}</span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#9A9C96] font-mono">
                <span>{selectedObservation.frequencyMHz.toFixed(2)} MHz</span>
                <span>•</span>
                <span>Bandwidth: {selectedObservation.bandwidthMHz.toFixed(1)} MHz</span>
                <span>•</span>
                <span>Duration: {selectedObservation.durationString}</span>
                <span>•</span>
                <span>{selectedObservation.telescope}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="rounded-[2px] border border-[#529E72]/40 bg-[#141F18] px-2 py-0.5 text-[11px] font-medium text-[#529E72]">
              Ready for screening
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
