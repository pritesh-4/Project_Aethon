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
    <section className="space-y-4">
      {/* Primary Question Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-medium tracking-tight text-[#E6EDF2]">
          What observation should AETHON investigate?
        </h2>
        <p className="mt-1 text-xs sm:text-sm text-[#7F8B95]">
          Choose a reference astronomical observation or upload a data file to configure analysis.
        </p>
      </div>

      {/* Reference Observations Selection */}
      <div className="space-y-2">
        <span className="block text-xs font-medium text-[#7F8B95]">Reference observations</span>
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
                className={`relative flex flex-col items-start p-3.5 rounded border text-left transition-all cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5] ${
                  isSelected
                    ? 'border-[#5BD8F5] bg-[#5BD8F5]/10 text-[#E6EDF2] ring-1 ring-[#5BD8F5]/30'
                    : 'border-[#1C2630] bg-[#0B0F14] text-[#7F8B95] hover:border-[#1C2630]/80 hover:bg-[#10161D] hover:text-[#E6EDF2]'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-[#5BD8F5] font-mono">{obs.id}</span>
                  {isSelected && (
                    <span className="inline-flex items-center gap-1 rounded bg-[#5BD8F5]/20 px-1.5 py-0.5 text-[10px] font-medium text-[#5BD8F5]">
                      <Check className="h-2.5 w-2.5" />
                      Selected
                    </span>
                  )}
                </div>

                <span className="mt-1.5 text-xs font-medium text-[#E6EDF2] line-clamp-1">
                  {obs.name}
                </span>

                <div className="mt-2 flex items-center gap-3 text-[11px] text-[#7F8B95] font-mono">
                  <span>{obs.frequencyMHz.toFixed(2)} MHz</span>
                  <span>•</span>
                  <span>{obs.durationString}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Generous & Simple Upload Bay */}
      <div className="space-y-2">
        <span className="block text-xs font-medium text-[#7F8B95]">Or upload observation file</span>

        <div
          {...getRootProps()}
          className={`relative flex min-h-[140px] sm:min-h-[160px] flex-col items-center justify-center rounded border border-dashed transition-all duration-200 cursor-pointer select-none p-6 text-center outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5] focus-visible:ring-offset-1 focus-visible:ring-offset-[#06080B] ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          } ${
            isDragActive
              ? 'border-[#5BD8F5] bg-[#5BD8F5]/10'
              : errorMsg
                ? 'border-[#D95C5C]/60 bg-[#D95C5C]/10'
                : 'border-[#1C2630] bg-[#0B0F14] hover:border-[#5BD8F5]/40 hover:bg-[#10161D]'
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
                className="flex flex-col items-center gap-2 text-[#5BD8F5]"
              >
                <Upload className="h-6 w-6 text-[#5BD8F5]" />
                <span className="text-xs font-medium">Release to load observation</span>
              </motion.div>
            ) : errorMsg ? (
              <motion.div
                key="error-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-2 text-[#D95C5C]"
              >
                <AlertCircle className="h-5 w-5 text-[#D95C5C]" />
                <span className="text-xs font-medium">{errorMsg}</span>
                <span className="text-xs text-[#7F8B95]">Drop a valid CSV, JSON, or FITS file</span>
              </motion.div>
            ) : (
              <motion.div
                key="idle-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-2 text-center"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded border border-[#1C2630] bg-[#10161D] text-[#5BD8F5]">
                  <Upload className="h-4 w-4" />
                </div>
                <div>
                  <span className="text-xs font-medium text-[#E6EDF2]">
                    Drop observation file here, or browse files
                  </span>
                  <span className="mt-0.5 block text-xs text-[#7F8B95]">
                    Accepts CSV, JSON, or FITS time-frequency data
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Selected Observation Summary Pill/Strip */}
      {selectedObservation && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded border border-[#1C2630] bg-[#0B0F14] px-4 py-3 text-xs">
          <div className="flex items-center gap-2.5">
            <FileText className="h-4 w-4 text-[#5BD8F5] shrink-0" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-[#5BD8F5] font-mono">
                  {selectedObservation.id}
                </span>
                <span className="text-[#7F8B95]">•</span>
                <span className="font-medium text-[#E6EDF2]">{selectedObservation.name}</span>
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#7F8B95] font-mono">
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
            <span className="rounded border border-[#5BD8F5]/30 bg-[#5BD8F5]/10 px-2 py-0.5 text-[11px] font-medium text-[#5BD8F5]">
              Ready for analysis
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
