import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import type { DiscoveryObservationMeta } from '../types.ts';
import { REFERENCE_OBSERVATIONS } from '../data/mockDiscovery.ts';
import { Upload, Check, AlertCircle, Radio, Sparkles, Loader2 } from 'lucide-react';
import { api } from '@/lib/api.ts';
import { toast } from 'sonner';

export interface ObservationInputProps {
  selectedObservation: DiscoveryObservationMeta | null;
  onSelectObservation: (obs: DiscoveryObservationMeta) => void;
  catalogObservations?: DiscoveryObservationMeta[];
  disabled?: boolean;
}

const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB backend limit

export function ObservationInput({
  selectedObservation,
  onSelectObservation,
  catalogObservations,
  disabled = false,
}: ObservationInputProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const displayList =
    catalogObservations && catalogObservations.length > 0
      ? catalogObservations
      : REFERENCE_OBSERVATIONS;

  const onDrop = useCallback(
    async (acceptedFiles: File[], fileRejections: unknown[]) => {
      setErrorMsg(null);
      if (fileRejections && (fileRejections as unknown[]).length > 0) {
        setErrorMsg(
          'Unsupported format — please select a .fil or .fits astronomical observation file.'
        );
        return;
      }

      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];

      if (file.size > MAX_SIZE_BYTES) {
        setErrorMsg(
          `File exceeds maximum upload limit of 100 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB selected).`
        );
        return;
      }

      // If in demo mode, create local demonstration metadata without network call
      if (api.isDemoMode()) {
        const isFits = file.name.endsWith('.fits') || file.name.endsWith('.fit');
        const format = isFits ? 'FITS' : 'FIL';

        const customMeta: DiscoveryObservationMeta = {
          id: `OBS-${Math.floor(1000 + Math.random() * 9000)}`,
          name: file.name.replace(/\.[^/.]+$/, ''),
          format,
          samplesCount: 16384,
          durationString: '00:04:45',
          bandwidthMHz: 12.5,
          frequencyMHz: 1420.405,
          telescope: 'Local Astronomical File',
          fileSizeBytes: file.size,
          coordinates: {
            ra: '14h 29m 42s',
            dec: '-62° 40′ 46″',
          },
        };

        onSelectObservation(customMeta);
        toast.info(`Demonstration observation loaded from ${file.name}`);
        return;
      }

      // Real backend ingestion
      setIsUploading(true);
      setUploadProgress(0);

      try {
        const record = await api.uploadObservation(file, (pct: number) => {
          setUploadProgress(pct);
        });

        const meta = record.metadata;
        const durSec = (meta?.time_sample_count ?? 64) * (meta?.time_step_seconds ?? 1.0);
        const m = Math.floor(durSec / 60);
        const s = Math.floor(durSec % 60);
        const durStr = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

        const customMeta: DiscoveryObservationMeta = {
          id: record.id,
          name: meta?.source_name || record.original_filename,
          format: record.format.toUpperCase(),
          samplesCount: (meta?.time_sample_count ?? 64) * (meta?.channel_count ?? 256),
          durationString: durStr,
          bandwidthMHz: meta?.bandwidth_mhz ?? 10.0,
          frequencyMHz: meta?.frequency_reference_mhz ?? 1420.405,
          telescope: meta?.telescope_name || 'Radio Instrument Feed',
          fileSizeBytes: record.file_size_bytes,
          coordinates: {
            ra:
              meta?.ra_str || (meta?.ra_deg != null ? `${meta.ra_deg.toFixed(4)}°` : '14h 29m 42s'),
            dec:
              meta?.dec_str ||
              (meta?.dec_deg != null ? `${meta.dec_deg.toFixed(4)}°` : '-62° 40′ 46″'),
          },
        };

        onSelectObservation(customMeta);
        toast.success(`Observation ${record.id} uploaded and ready for screening!`);
      } catch (err: unknown) {
        const apiErr = err as { message?: string };
        setErrorMsg(apiErr?.message || 'Failed to upload observation file to backend.');
      } finally {
        setIsUploading(false);
      }
    },
    [onSelectObservation]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    disabled: disabled || isUploading,
    accept: {
      'application/fits': ['.fits', '.fit'],
      'application/octet-stream': ['.fil'],
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
            <span className="text-[#7E8B96]">{displayList.length} survey pointings</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {displayList.slice(0, 3).map((obs) => {
              const isSelected = selectedObservation?.id === obs.id;

              return (
                <button
                  key={obs.id}
                  type="button"
                  aria-pressed={isSelected}
                  disabled={disabled || isUploading}
                  onClick={() => onSelectObservation(obs)}
                  className={`relative flex flex-col items-start p-4 rounded-[4px] border text-left transition-all duration-180 cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#376A9B] ${
                    isSelected
                      ? 'border-[#376A9B] bg-[#FFFFFF] text-[#17202A] shadow-md ring-1 ring-[#376A9B]/30 scale-[1.01]'
                      : 'border-[#D6D2C9] bg-[#FAF8F5] text-[#56616A] hover:border-[#BCB6A8] hover:bg-[#FFFFFF] hover:shadow-2xs'
                  } ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
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
            <span className="text-[#7E8B96]">.fil · .fits · 100 MB max</span>
          </div>

          <div
            {...getRootProps()}
            className={`relative flex min-h-[110px] flex-col items-center justify-center rounded-[4px] border border-dashed transition-all duration-150 cursor-pointer p-6 text-center outline-none focus-visible:ring-2 focus-visible:ring-[#376A9B] ${
              disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''
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
              {isUploading ? (
                <motion.div
                  key="uploading-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="flex items-center gap-2 text-xs font-mono text-[#376A9B]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Uploading and calibrating observation... {uploadProgress}%</span>
                  </div>
                  <div className="w-48 h-1 bg-[#EAE7E0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#376A9B] transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </motion.div>
              ) : isDragActive ? (
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
                    <span>Upload an observation file</span>
                  </div>

                  {/* Supporting text */}
                  <div className="font-mono text-xs text-[#56616A]">
                    Breakthrough Listen .fil · FITS
                  </div>
                  <div className="text-[11px] text-[#7E8B96]">100 MB maximum stream size</div>
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
