import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import type { DiscoveryObservationMeta } from '../types.ts';
import { REFERENCE_OBSERVATIONS } from '../data/mockDiscovery.ts';
import { Upload, Check, AlertCircle, Radio } from 'lucide-react';

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
    <section className="space-y-4 font-sans select-none">
      {/* Primary Section Header */}
      <div className="border-b border-[#242825] pb-2.5">
        <h2 className="text-sm font-medium tracking-tight text-[#E6E4DD]">Input Data Stream</h2>
        <p className="mt-0.5 text-xs text-[#9A9C96]">
          Select a catalogued survey observation or mount a local radio telescope dataset.
        </p>
      </div>

      {/* Reference Observations Segmented Selector */}
      <div className="space-y-1.5">
        <span className="block text-[11px] font-mono uppercase tracking-wider text-[#767973]">
          Catalogued Observations
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#242825] border border-[#242825] bg-[#101211] rounded-[2px] overflow-hidden">
          {REFERENCE_OBSERVATIONS.map((obs) => {
            const isSelected = selectedObservation?.id === obs.id;

            return (
              <button
                key={obs.id}
                type="button"
                aria-pressed={isSelected}
                disabled={disabled}
                onClick={() => onSelectObservation(obs)}
                className={`relative flex flex-col items-start p-3.5 text-left transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A] ${
                  isSelected
                    ? 'bg-[#1D1815] text-[#E6E4DD]'
                    : 'text-[#9A9C96] hover:bg-[#151816] hover:text-[#E6E4DD]'
                } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                <div className="flex w-full items-center justify-between gap-2">
                  <span
                    className={`text-xs font-semibold font-mono ${isSelected ? 'text-[#D4864A]' : 'text-[#A0A29C]'}`}
                  >
                    {obs.id}
                  </span>
                  {isSelected && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#D4864A]">
                      <Check className="h-2.5 w-2.5" />
                      ACTIVE
                    </span>
                  )}
                </div>

                <span className="mt-1 text-xs font-medium text-[#E6E4DD] line-clamp-1">
                  {obs.name}
                </span>

                <div className="mt-2 flex items-center gap-2.5 text-[11px] text-[#767973] font-mono">
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
      <div className="space-y-1.5">
        <span className="block text-[11px] font-mono uppercase tracking-wider text-[#767973]">
          Or Ingest Local File
        </span>

        <div
          {...getRootProps()}
          className={`relative flex min-h-[90px] flex-col items-center justify-center rounded-[2px] border border-dashed transition-all duration-150 cursor-pointer p-4 text-center outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A] ${
            disabled ? 'opacity-50 cursor-not-allowed' : ''
          } ${
            isDragActive
              ? 'border-[#D4864A] bg-[#D4864A]/10'
              : errorMsg
                ? 'border-[#C84A4A]/60 bg-[#C84A4A]/10'
                : 'border-[#242825] bg-[#0E100F] hover:border-[#383E3A]'
          }`}
        >
          <input {...getInputProps()} aria-label="Upload observation file" />

          <AnimatePresence mode="wait">
            {isDragActive ? (
              <motion.div
                key="drag-active"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-xs text-[#D4864A]"
              >
                <Upload className="h-4 w-4 animate-bounce" />
                <span>Drop observation payload to ingest</span>
              </motion.div>
            ) : errorMsg ? (
              <motion.div
                key="error-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2 text-xs text-[#E56B6F]"
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            ) : (
              <motion.div
                key="idle-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 text-center sm:text-left"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-[2px] border border-[#242825] bg-[#141715] text-[#D4864A] shrink-0">
                  <Upload className="h-3.5 w-3.5" />
                </div>
                <div>
                  <span className="text-xs text-[#C9C8C0]">
                    Drop FITS, HDF5, CSV, or JSON observation file, or click to browse
                  </span>
                  <span className="block text-[11px] text-[#666963] font-mono mt-0.5">
                    Maximum single stream buffer: 250 MB
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Selected Observation Summary Strip */}
      {selectedObservation && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-b border-[#242825] bg-[#101211] px-3.5 py-2.5 text-xs">
          <div className="flex items-center gap-2">
            <Radio className="h-3.5 w-3.5 text-[#D4864A] shrink-0" />
            <div className="flex flex-wrap items-center gap-x-2.5 text-xs">
              <span className="font-semibold text-[#D4864A] font-mono">
                {selectedObservation.id}
              </span>
              <span className="text-[#363C38]">•</span>
              <span className="font-medium text-[#E6E4DD]">{selectedObservation.name}</span>
              <span className="text-[#363C38]">•</span>
              <span className="text-[#848780] font-mono text-[11px]">
                {selectedObservation.frequencyMHz.toFixed(2)} MHz (BW:{' '}
                {selectedObservation.bandwidthMHz.toFixed(1)} MHz)
              </span>
              <span className="text-[#363C38]">•</span>
              <span className="text-[#848780] font-mono text-[11px]">
                {selectedObservation.telescope}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#529E72] bg-[#141F18] px-1.5 py-0.5 rounded-[2px] border border-[#529E72]/30">
              BUFFER READY
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
