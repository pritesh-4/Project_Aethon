import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, X, AlertCircle, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { api } from '@/lib/api.ts';
import type { ObservationRecordResponse } from '@/types/schemas.ts';
import { toast } from 'sonner';

export interface ObservationUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploaded: (observation: ObservationRecordResponse) => void;
}

const MAX_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB backend limit

export function ObservationUploadModal({
  isOpen,
  onClose,
  onUploaded,
}: ObservationUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resetState = useCallback(() => {
    setSelectedFile(null);
    setIsUploading(false);
    setUploadProgress(0);
    setErrorMessage(null);
  }, []);

  const handleClose = () => {
    if (isUploading) return;
    resetState();
    onClose();
  };

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: unknown[]) => {
    setErrorMessage(null);

    if (fileRejections && (fileRejections as unknown[]).length > 0) {
      setErrorMessage(
        'Unsupported format — please select a Breakthrough Listen .fil or FITS file.'
      );
      return;
    }

    if (acceptedFiles.length === 0) return;
    const file = acceptedFiles[0];

    if (file.size > MAX_SIZE_BYTES) {
      setErrorMessage(
        `File exceeds maximum upload limit of 100 MB (${(file.size / (1024 * 1024)).toFixed(1)} MB selected).`
      );
      return;
    }

    setSelectedFile(file);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    disabled: isUploading,
    accept: {
      'application/fits': ['.fits', '.fit'],
      'application/octet-stream': ['.fil'],
    },
  });

  const handleUpload = async () => {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    setUploadProgress(0);
    setErrorMessage(null);

    try {
      const record = await api.uploadObservation(selectedFile, (pct: number) => {
        setUploadProgress(pct);
      });

      toast.success(`Observation ${record.id} successfully ingested!`, {
        description: `Source: ${record.metadata?.source_name || record.original_filename} (${record.metadata?.telescope_name || 'Observatory'})`,
      });

      onUploaded(record);
      handleClose();
    } catch (err: unknown) {
      const apiErr = err as { message?: string; details?: unknown };
      const detailStr = typeof apiErr?.details === 'string' ? apiErr.details : '';
      setErrorMessage(
        apiErr?.message ||
          detailStr ||
          'Failed to upload observation. Please check backend connection.'
      );
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="upload-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none font-sans animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) handleClose();
      }}
    >
      <div className="relative w-full max-w-lg rounded-[3px] border border-[#D6D2C9] bg-[#FAF8F5] shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#D6D2C9] bg-[#EAE7E0] p-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#76828D] uppercase tracking-wider">
              <span>RAW DATA INGESTION</span>
              <span>/</span>
              <span>CALIBRATION</span>
            </div>
            <h2 id="upload-modal-title" className="text-lg font-semibold text-[#17202A] mt-0.5">
              Ingest Astronomical Observation
            </h2>
            <p className="text-xs text-[#56616A] mt-1 leading-relaxed">
              Upload Breakthrough Listen <code className="font-mono text-[#376A9B]">.fil</code>{' '}
              filterbank or <code className="font-mono text-[#376A9B]">.fits</code> observations to
              calibrate and persist in the central database.
            </p>
          </div>

          <button
            type="button"
            onClick={handleClose}
            disabled={isUploading}
            aria-label="Close dialog"
            className="h-7 w-7 flex items-center justify-center rounded-[2px] text-[#76828D] hover:text-[#17202A] hover:bg-[#D6D2C9]/60 transition-colors cursor-pointer disabled:opacity-30"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Dropzone */}
          {!selectedFile ? (
            <div
              {...getRootProps()}
              className={`relative flex min-h-[160px] flex-col items-center justify-center rounded-[3px] border border-dashed transition-all duration-150 cursor-pointer p-6 text-center outline-none focus-visible:ring-2 focus-visible:ring-[#376A9B] ${
                isDragActive
                  ? 'border-[#376A9B] bg-[#EAF1F8]'
                  : errorMessage
                    ? 'border-[#B64B4B] bg-[#FDF0F0]'
                    : 'border-[#D6D2C9] bg-[#FAF8F5] hover:border-[#376A9B] hover:bg-[#FFFFFF]'
              }`}
            >
              <input {...getInputProps()} aria-label="Drop observation file here" />

              <div className="flex flex-col items-center gap-2">
                <div className="h-10 w-10 rounded-full bg-[#EAF1F8] flex items-center justify-center text-[#376A9B]">
                  <Upload className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-[#17202A]">
                    Click to select or drag and drop observation file
                  </div>
                  <div className="font-mono text-[11px] text-[#56616A]">.fil · .fits · .fit</div>
                  <div className="text-[10px] text-[#7E8B96]">Up to 100 MB max stream payload</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[3px] border border-[#B6CDE2] bg-[#FFFFFF] p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <FileText className="h-5 w-5 text-[#376A9B] shrink-0" />
                  <div>
                    <div className="text-xs font-bold font-mono text-[#17202A] line-clamp-1">
                      {selectedFile.name}
                    </div>
                    <div className="text-[11px] font-mono text-[#56616A]">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Ready for ingestion
                    </div>
                  </div>
                </div>

                {!isUploading && (
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-xs font-mono text-[#B64B4B] hover:underline cursor-pointer"
                  >
                    Change
                  </button>
                )}
              </div>

              {/* Progress bar */}
              {isUploading && (
                <div className="space-y-1.5 pt-2 border-t border-[#EAE7E0]">
                  <div className="flex items-center justify-between text-[11px] font-mono text-[#56616A]">
                    <span className="flex items-center gap-1.5 text-[#376A9B]">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      {uploadProgress < 100
                        ? 'Uploading payload to server...'
                        : 'Ingesting and computing spectral moments...'}
                    </span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-[#EAE7E0] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#376A9B] transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error display */}
          <AnimatePresence>
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-start gap-2 p-3 rounded-[3px] border border-[#F3C4C4] bg-[#FDF0F0] text-xs text-[#B64B4B]"
              >
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{errorMessage}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-2 border-t border-[#D6D2C9] bg-[#EAE7E0] px-5 py-3">
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            state={isUploading ? 'loading' : 'idle'}
            loadingText="Ingesting..."
            icon={<CheckCircle2 className="h-3.5 w-3.5" />}
          >
            Start Ingestion
          </Button>
        </div>
      </div>
    </div>
  );
}
