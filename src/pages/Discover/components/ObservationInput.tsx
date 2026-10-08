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
      {/* Primary Section Heading */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#17202A]">
          Choose what AETHON should examine
        </h2>
        <p className="text-sm text-[#56616A] leading-relaxed">
          Select a catalogued survey observation from the repository, or upload a raw radio
          frequency data file.
        </p>
      </div>

      {/* Two Visibly Separate Acquisition Modes */}
      <div className="space-y-5">
        {/* ==================================================== */}
        {/* PATH A: EXISTING CATALOGUED OBSERVATIONS */}
        {/* ==================================================== */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#7E8B96] uppercase tracking-wider font-semibold">
              Select observation
            </span>
            <span className="text-[#7E8B96]">3 calibrated survey pointings</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {REFERENCE_OBSERVATIONS.map((obs) => {
              const isSelected = selectedObservation?.id === obs.id;

              return (
                <button
                  key={obs.id}
                  type="button"
                  aria-pressed={isSelected}
                  disabled={disabled}
                  onClick={() => onSelectObservation(obs)}
                  className={`relative flex flex-col items-start p-4 rounded-[4px] border text-left transition-all duration-180 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#376A9B] ${
                    isSelected
                      ? 'border-[#376A9B] bg-[#FFFFFF] text-[#17202A] shadow-md ring-1 ring-[#376A9B]/30 scale-[1.01]'
                      : 'border-[#D6D2C9] bg-[#FAF8F5] text-[#56616A] hover:border-[#BCB6A8] hover:bg-[#FFFFFF] hover:shadow-2xs'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {/* Active selection bar indicator */}
                  {isSelected && (
                    <div className="absolute top-0 left-0 right-0 h-[3px] bg-[#376A9B] rounded-t-[4px]" />
                  )}

                  {/* Header: Large ID + Selection State */}
                  <div className="flex w-full items-center justify-between gap-2">
                    <span
                      className={`text-base font-bold font-mono tracking-tight ${
                        isSelected ? 'text-[#376A9B]' : 'text-[#17202A]'
                      }`}
                    >
                      {obs.id}
                    </span>

                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-wider text-[#376A9B] bg-[#EAF1F8] px-2 py-0.5 rounded-[2px] border border-[#B6CDE2] font-semibold">
                        <Check className="h-3 w-3" />
                        Selected
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono text-[#7E8B96] uppercase px-1.5 py-0.5 rounded-[2px] border border-[#D6D2C9] bg-[#FAF8F5]">
                        Select
                      </span>
                    )}
                  </div>

                  {/* Target Name */}
                  <span className="mt-2 text-sm font-semibold text-[#17202A] line-clamp-1">
                    {obs.name}
                  </span>

                  {/* Machine Data */}
                  <div className="mt-3 pt-2.5 border-t border-[#D6D2C9] w-full flex items-center justify-between text-xs text-[#56616A] font-mono">
                    <span>{obs.frequencyMHz.toFixed(2)} MHz</span>
                    <span className="text-[#BCB6A8]">·</span>
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
            <div className="w-full border-t border-[#D6D2C9]" />
          </div>
          <div className="relative px-3 bg-[#F4F1EA] text-[11px] font-mono uppercase tracking-widest text-[#7E8B96]">
            OR
          </div>
        </div>

        {/* ==================================================== */}
        {/* PATH B: UPLOAD RAW OBSERVATION */}
        {/* ==================================================== */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-[#7E8B96] uppercase tracking-wider font-semibold">
              Upload observation file
            </span>
            <span className="text-[#7E8B96]">FITS · HDF5 · CSV · JSON</span>
          </div>

          <div
            {...getRootProps()}
            className={`relative flex min-h-[110px] flex-col items-center justify-center rounded-[4px] border border-dashed transition-all duration-150 cursor-pointer p-6 text-center outline-none focus-visible:ring-2 focus-visible:ring-[#376A9B] ${
              disabled ? 'opacity-50 cursor-not-allowed' : ''
            } ${
              isDragActive
                ? 'border-[#376A9B] bg-[#EAF1F8]'
                : errorMsg
                  ? 'border-[#B64B4B] bg-[#FDF0F0]'
                  : 'border-[#D6D2C9] bg-[#FAF8F5] hover:border-[#376A9B] hover:bg-[#FFFFFF]'
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
                  className="flex flex-col items-center gap-1.5 text-xs text-[#376A9B]"
                >
                  <Upload className="h-5 w-5 animate-bounce" />
                  <span className="font-semibold">Drop observation file to ingest immediately</span>
                </motion.div>
              ) : errorMsg ? (
                <motion.div
                  key="error-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-xs text-[#B64B4B]"
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
                  {/* Action First */}
                  <div className="flex items-center gap-2 text-sm font-semibold text-[#17202A]">
                    <Upload className="h-4 w-4 text-[#376A9B]" />
                    <span>Upload a data file</span>
                  </div>

                  {/* Supporting text */}
                  <div className="font-mono text-xs text-[#56616A]">FITS · HDF5 · CSV · JSON</div>
                  <div className="text-[11px] text-[#7E8B96]">250 MB maximum stream size</div>
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
        <div className="mt-6 p-5 rounded-[4px] border border-[#B6CDE2] bg-[#FFFFFF] space-y-3.5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#EAF1F8] pb-3">
            <div className="flex items-center gap-2">
              <Radio className="h-4 w-4 text-[#376A9B]" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#376A9B] font-semibold">
                Active Target For Screening
              </span>
            </div>

            <span className="inline-flex items-center gap-1.5 text-xs font-mono text-[#3D7D54] bg-[#EFF7F2] px-2 py-0.5 rounded-[2px] border border-[#B2D8C0] self-start sm:self-auto font-medium">
              <Sparkles className="h-3 w-3" />
              READY TO SCREEN
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
            <div>
              <div className="text-xl sm:text-2xl font-mono font-bold text-[#17202A]">
                {selectedObservation.id}
              </div>
              <div className="text-sm font-medium text-[#56616A] mt-0.5">
                {selectedObservation.name}
              </div>
            </div>

            <div className="text-xs text-[#7E8B96] font-mono">{selectedObservation.telescope}</div>
          </div>

          {/* Machine Telemetry Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-[#EAE7E0] text-xs font-mono">
            <div>
              <span className="block text-[10px] text-[#7E8B96] uppercase">Center Frequency</span>
              <span className="text-[#17202A] text-xs font-semibold">
                {selectedObservation.frequencyMHz.toFixed(4)} MHz
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-[#7E8B96] uppercase">Bandwidth</span>
              <span className="text-[#17202A] text-xs font-semibold">
                {selectedObservation.bandwidthMHz.toFixed(1)} MHz
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-[#7E8B96] uppercase">Duration</span>
              <span className="text-[#17202A] text-xs font-semibold">
                {selectedObservation.durationString}
              </span>
            </div>
            <div>
              <span className="block text-[10px] text-[#7E8B96] uppercase">Coordinates</span>
              <span className="text-[#17202A] text-xs font-semibold">
                {selectedObservation.coordinates.ra} · {selectedObservation.coordinates.dec}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
