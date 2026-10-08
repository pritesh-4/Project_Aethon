import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import type { DiscoveryObservationMeta } from '../types.ts';
import { REFERENCE_OBSERVATIONS } from '../data/mockDiscovery.ts';
import { Upload, Check, AlertCircle, Radio, Sparkles } from 'lucide-react';

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
        setErrorMsg('Unsupported format — please select a FITS, HDF5, CSV, or JSON file.');
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
    <section className="space-y-6 font-sans select-none">
      {/* Role 2: Primary Section Heading (24-28px) */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-medium tracking-tight text-[#E6E4DD]">
          Choose what AETHON should examine
        </h2>
        <p className="text-sm text-[#9A9C96] leading-relaxed">
          Select a catalogued survey observation from the repository, or upload a raw radio
          frequency stream.
        </p>
      </div>

      {/* Two Visibly Separate Acquisition Modes */}
      <div className="space-y-5">
        {/* ==================================================== */}
        {/* PATH A: EXISTING CATALOGUED OBSERVATIONS */}
        {/* ==================================================== */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#848780] uppercase tracking-wider font-semibold">
              PATH A · Existing Observations
            </span>
            <span className="text-[#666963]">3 calibrated sky targets</span>
          </div>

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
                  className={`relative flex flex-col items-start p-4 rounded-[3px] border text-left transition-all duration-150 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#D4864A] ${
                    isSelected
                      ? 'border-[#D4864A] bg-[#221B16] text-[#E6E4DD] shadow-sm'
                      : 'border-[#242825] bg-[#101211] text-[#9A9C96] hover:border-[#383E3A] hover:bg-[#141715] hover:text-[#E6E4DD]'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {/* Active selection bar indicator */}
                  {isSelected && (
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-[#D4864A]" />
                  )}

                  {/* Header: Large ID + Selection State */}
                  <div className="flex w-full items-center justify-between gap-2">
                    <span
                      className={`text-sm font-semibold font-mono tracking-tight ${
                        isSelected ? 'text-[#D4864A]' : 'text-[#E6E4DD]'
                      }`}
                    >
                      {obs.id}
                    </span>

                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[#D4864A] bg-[#332219] px-1.5 py-0.5 rounded-[2px] border border-[#D4864A]/30">
                        <Check className="h-3 w-3" />
                        Selected
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#555852] uppercase">
                        Available
                      </span>
                    )}
                  </div>

                  {/* Target Name (Role 4: Prominent) */}
                  <span className="mt-2 text-sm font-medium text-[#E6E4DD] line-clamp-1">
                    {obs.name}
                  </span>

                  {/* Machine Data (Role 5: Monospace) */}
                  <div className="mt-3 pt-2.5 border-t border-[#242825] w-full flex items-center justify-between text-xs text-[#848780] font-mono">
                    <span>{obs.frequencyMHz.toFixed(2)} MHz</span>
                    <span className="text-[#444741]">·</span>
                    <span>{obs.durationString}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Explicit Path Separator */}
        <div className="relative flex items-center justify-center my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#242825]" />
          </div>
          <div className="relative px-3 bg-[#0F1110] text-[11px] font-mono uppercase tracking-widest text-[#666963]">
            OR
          </div>
        </div>

        {/* ==================================================== */}
        {/* PATH B: UPLOAD RAW OBSERVATION */}
        {/* ==================================================== */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#848780] uppercase tracking-wider font-semibold">
              PATH B · Local Data Ingestion
            </span>
            <span className="text-[#666963]">Direct file mount</span>
          </div>

          <div
            {...getRootProps()}
            className={`relative flex min-h-[110px] flex-col items-center justify-center rounded-[3px] border border-dashed transition-all duration-150 cursor-pointer p-5 text-center outline-none focus-visible:ring-2 focus-visible:ring-[#D4864A] ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            } ${
              isDragActive
                ? 'border-[#D4864A] bg-[#D4864A]/10'
                : errorMsg
                  ? 'border-[#C84A4A] bg-[#C84A4A]/10'
                  : 'border-[#242825] bg-[#101211] hover:border-[#3E4540] hover:bg-[#131614]'
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
                  className="flex flex-col items-center gap-1.5 text-xs text-[#D4864A]"
                >
                  <Upload className="h-5 w-5 animate-bounce" />
                  <span className="font-medium">Drop observation file to ingest immediately</span>
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
                  className="flex flex-col items-center gap-2"
                >
                  {/* 1. Action First */}
                  <div className="flex items-center gap-2 text-sm font-medium text-[#E6E4DD]">
                    <Upload className="h-4 w-4 text-[#D4864A]" />
                    <span>Upload observation</span>
                  </div>

                  {/* 2. Supported Formats */}
                  <div className="font-mono text-xs text-[#848780]">FITS · HDF5 · CSV · JSON</div>

                  {/* 3. Technical Limitation */}
                  <div className="text-[11px] text-[#666963]">250 MB maximum stream size</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ==================================================== */}
      {/* VISUALLY DOMINANT SELECTED OBSERVATION SUMMARY */}
      {/* ==================================================== */}
      {selectedObservation && (
        <div className="mt-6 p-4 sm:p-5 rounded-[3px] border border-[#D4864A]/40 bg-[#1A1613] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#D4864A]/20 pb-3">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-[#D4864A]" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#D4864A] font-semibold">
                Active Target For Screening
              </span>
            </div>

            <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#529E72] bg-[#142318] px-2 py-0.5 rounded-[2px] border border-[#529E72]/40 self-start sm:self-auto">
              <Sparkles className="h-3 w-3" />
              READY TO SCREEN
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <div className="text-xl sm:text-2xl font-mono font-bold text-[#E6E4DD]">
                {selectedObservation.id}
              </div>
              <div className="text-sm font-medium text-[#C9C8C0] mt-0.5">
                {selectedObservation.name}
              </div>
            </div>

            <div className="text-xs text-[#848780] font-mono">{selectedObservation.telescope}</div>
          </div>

          {/* Machine Telemetry Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#D4864A]/20 text-xs font-mono">
            <div>
              <span className="block text-[10px] text-[#848780] uppercase">Center Frequency</span>
              <span className="text-[#E6E4DD] text-xs font-semibold">
                {selectedObservation.frequencyMHz.toFixed(4)} MHz
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-[#848780] uppercase">Bandwidth</span>
              <span className="text-[#E6E4DD] text-xs font-semibold">
                {selectedObservation.bandwidthMHz.toFixed(1)} MHz
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-[#848780] uppercase">Duration</span>
              <span className="text-[#E6E4DD] text-xs font-semibold">
                {selectedObservation.durationString}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-[#848780] uppercase">Coordinates</span>
              <span className="text-[#E6E4DD] text-xs font-semibold">
                {selectedObservation.coordinates.ra} · {selectedObservation.coordinates.dec}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
