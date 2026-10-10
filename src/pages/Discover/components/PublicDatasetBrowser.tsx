import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Database,
  ExternalLink,
  Download,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Info,
  Radio,
} from 'lucide-react';
import { api } from '@/lib/api.ts';
import type {
  PublicDatasetItem,
  PublicDatasetStatusResponse,
  ObservationRecordResponse,
} from '@/types/schemas.ts';
import type { DiscoveryObservationMeta } from '../types.ts';
import { toast } from 'sonner';

export interface PublicDatasetBrowserProps {
  selectedObservationId: string | null;
  onObservationImported: (obs: DiscoveryObservationMeta) => void;
  disabled?: boolean;
}

const SEARCH_PRESETS = [
  { label: 'Voyager 1', query: 'VOYAGER1' },
  { label: '3C123 (Calibrator)', query: '3C123' },
  { label: 'HIP 35136', query: 'HIP35136' },
  { label: 'Alpha Centauri', query: 'ALPHACEN' },
  { label: 'TIC 441462736', query: 'TIC 441462736' },
];

export function PublicDatasetBrowser({
  selectedObservationId,
  onObservationImported,
  disabled = false,
}: PublicDatasetBrowserProps) {
  // Provider Health & Status
  const [providerStatus, setProviderStatus] = useState<PublicDatasetStatusResponse | null>(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Search & Filter State
  const [targetQuery, setTargetQuery] = useState('VOYAGER1');
  const [telescopeFilter, setTelescopeFilter] = useState('');
  const [formatFilter, setFormatFilter] = useState('');
  const [maxSizeMb, setMaxSizeMb] = useState<number>(80);

  // Available metadata options from upstream
  const [availableTelescopes, setAvailableTelescopes] = useState<string[]>([]);
  const [availableFormats, setAvailableFormats] = useState<string[]>([]);

  // Results State
  const [items, setItems] = useState<PublicDatasetItem[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [wasSearched, setWasSearched] = useState(false);

  // Inspection & Import State
  const [selectedItem, setSelectedItem] = useState<PublicDatasetItem | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgressText, setImportProgressText] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // 1. Interactive Connection Check for Refresh Button
  const checkStatus = useCallback(async () => {
    setIsCheckingStatus(true);
    setStatusError(null);
    try {
      const st = await api.getPublicDatasetStatus();
      setProviderStatus(st);
      if (!st.available) {
        setStatusError(
          st.message || 'Breakthrough Listen Open Data Archive is currently unreachable or offline.'
        );
      }
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ||
        'Failed to query Breakthrough Listen archive status.';
      setStatusError(msg);
      setProviderStatus(null);
    } finally {
      setIsCheckingStatus(false);
    }
  }, []);

  // 2. Perform Catalogue Search
  const handleSearch = useCallback(
    async (newOffset = 0, append = false) => {
      const trimmedTarget = targetQuery.trim();
      if (!trimmedTarget) {
        setSearchError('Target name is required by the Breakthrough Listen archive.');
        return;
      }

      setIsSearching(true);
      setSearchError(null);
      setImportError(null);
      setWasSearched(true);

      try {
        const queryParams = {
          target: trimmedTarget,
          telescope: telescopeFilter || undefined,
          file_type: formatFilter || undefined,
          limit: 25,
          offset: newOffset,
          max_size_mb: maxSizeMb > 0 ? maxSizeMb : undefined,
        };

        const res = await api.queryPublicDatasets(queryParams);

        if (append) {
          setItems((prev) => [...prev, ...res.items]);
        } else {
          setItems(res.items);
          // Auto-select first compatible item if none selected
          const firstCompatible = res.items.find(
            (it) => it.is_compatible && it.is_within_size_limit
          );
          setSelectedItem(firstCompatible || res.items[0] || null);
        }
        setTotalResults(res.total);
        setHasMore(res.has_more);
        setOffset(newOffset);

        if (res.items.length === 0 && !append) {
          setSelectedItem(null);
        }
      } catch (err: unknown) {
        const msg =
          (err as { message?: string })?.message ||
          'Failed to retrieve records from Breakthrough Listen catalogue.';
        setSearchError(msg);
        if (!append) {
          setItems([]);
          setSelectedItem(null);
        }
      } finally {
        setIsSearching(false);
      }
    },
    [targetQuery, telescopeFilter, formatFilter, maxSizeMb]
  );

  // 3. Initialize Provider Status, Filters, and Initial Default Query on Mount
  useEffect(() => {
    let isCancelled = false;

    const initArchive = async () => {
      setIsCheckingStatus(true);
      setStatusError(null);

      try {
        const [stRes, telRes, ftRes] = await Promise.allSettled([
          api.getPublicDatasetStatus(),
          api.getPublicDatasetTelescopes(),
          api.getPublicDatasetFileTypes(),
        ]);

        if (isCancelled) return;

        let isArchiveOnline = false;
        if (stRes.status === 'fulfilled') {
          const st = stRes.value;
          setProviderStatus(st);
          isArchiveOnline = st.available;
          if (!st.available) {
            setStatusError(
              st.message ||
                'Breakthrough Listen Open Data Archive is currently unreachable or offline.'
            );
          }
        } else {
          setStatusError('Failed to query Breakthrough Listen archive status.');
          setProviderStatus(null);
        }

        if (telRes.status === 'fulfilled' && telRes.value.telescopes) {
          setAvailableTelescopes(telRes.value.telescopes);
        }
        if (ftRes.status === 'fulfilled' && ftRes.value.file_types) {
          setAvailableFormats(ftRes.value.file_types);
        }

        // Auto-run initial query if provider is active
        if (isArchiveOnline) {
          setIsSearching(true);
          setWasSearched(true);
          try {
            const res = await api.queryPublicDatasets({
              target: 'VOYAGER1',
              limit: 25,
              offset: 0,
              max_size_mb: 80,
            });
            if (!isCancelled) {
              setItems(res.items);
              const firstCompat = res.items.find(
                (it) => it.is_compatible && it.is_within_size_limit
              );
              setSelectedItem(firstCompat || res.items[0] || null);
              setTotalResults(res.total);
              setHasMore(res.has_more);
            }
          } catch (qErr: unknown) {
            if (!isCancelled) {
              setSearchError(
                (qErr as { message?: string })?.message ||
                  'Failed to retrieve records from Breakthrough Listen catalogue.'
              );
            }
          } finally {
            if (!isCancelled) {
              setIsSearching(false);
            }
          }
        }
      } catch {
        if (!isCancelled) {
          setStatusError('Failed to initialize connection to Breakthrough Listen archive.');
        }
      } finally {
        if (!isCancelled) {
          setIsCheckingStatus(false);
        }
      }
    };

    void initArchive();

    return () => {
      isCancelled = true;
    };
  }, []);

  // 4. One-Click Safe Remote Import into AETHON Pipeline
  const handleImport = async (item: PublicDatasetItem) => {
    if (!item.is_compatible) {
      toast.error('Unsupported file format', {
        description: item.compatibility_reason || 'File cannot be processed by AETHON adapters.',
      });
      return;
    }

    if (!item.is_within_size_limit) {
      toast.error('File size ceiling exceeded', {
        description:
          item.size_reason ||
          `File size exceeds maximum permitted limit (${(item.size_bytes / (1024 * 1024)).toFixed(1)} MB).`,
      });
      return;
    }

    setIsImporting(true);
    setImportError(null);
    setImportProgressText('Connecting to Breakthrough Listen archive...');

    try {
      setImportProgressText('Streaming observation into bounded staging & computing SHA-256...');

      const importRes = await api.importPublicDataset({
        url: item.url,
        target: item.target,
        telescope: item.telescope,
        expected_md5sum: item.md5sum ?? undefined,
        expected_size_bytes: item.size_bytes,
      });

      const record: ObservationRecordResponse = importRes.observation;
      const meta = record.metadata;
      const durSec =
        meta?.time_sample_count != null && meta?.time_step_seconds != null
          ? meta.time_sample_count * meta.time_step_seconds
          : null;
      const durStr =
        durSec != null
          ? `${Math.floor(durSec / 60)
              .toString()
              .padStart(2, '0')}:${Math.floor(durSec % 60)
              .toString()
              .padStart(2, '0')}`
          : null;

      const customMeta: DiscoveryObservationMeta = {
        id: record.id,
        name: meta?.source_name || item.target || record.original_filename,
        format: record.format.toUpperCase(),
        samplesCount:
          meta?.time_sample_count != null && meta?.channel_count != null
            ? meta.time_sample_count * meta.channel_count
            : null,
        durationString: durStr,
        bandwidthMHz: meta?.bandwidth_mhz ?? null,
        frequencyMHz: meta?.frequency_reference_mhz ?? item.center_freq_mhz ?? null,
        telescope: meta?.telescope_name || item.telescope || null,
        fileSizeBytes: record.file_size_bytes,
        coordinates: {
          ra:
            meta?.ra_str ||
            (meta?.ra_deg != null
              ? `${meta.ra_deg.toFixed(4)}°`
              : item.ra_deg != null
                ? `${item.ra_deg.toFixed(4)}°`
                : null),
          dec:
            meta?.dec_str ||
            (meta?.dec_deg != null
              ? `${meta.dec_deg.toFixed(4)}°`
              : item.dec_deg != null
                ? `${item.dec_deg.toFixed(4)}°`
                : null),
        },
        provenanceSource: 'Breakthrough Listen Open Data Archive',
      };

      onObservationImported(customMeta);

      const statusNote = importRes.is_duplicate
        ? 'Deduplicated observation reused from local storage.'
        : `Ingested ${(importRes.bytes_downloaded / (1024 * 1024)).toFixed(1)} MB in ${importRes.duration_seconds.toFixed(1)}s.`;

      toast.success(`Observation ${record.id} loaded into AETHON!`, {
        description: statusNote,
      });
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message ||
        'Failed to import observation from public archive.';
      setImportError(msg);
      toast.error('Dataset import failed', { description: msg });
    } finally {
      setIsImporting(false);
      setImportProgressText(null);
    }
  };

  const maxImportMbDisplay = providerStatus
    ? Math.round(providerStatus.max_import_bytes / (1024 * 1024))
    : 80;

  return (
    <div className="space-y-4 font-sans select-none">
      {/* 1. Archive Status & Provenance Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-[4px] border border-[#D6D2C9] bg-[#FAF8F5]">
        <div className="flex items-center gap-2.5">
          <Database className="h-4 w-4 text-[#376A9B]" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#17202A] tracking-tight">
                Breakthrough Listen Open Data Archive
              </span>
              {providerStatus?.available ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#3D7D54] bg-[#EFF7F2] px-1.5 py-0.5 rounded-[2px] border border-[#B2D8C0]">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  ONLINE
                </span>
              ) : isCheckingStatus ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#7E8B96] bg-[#FFFFFF] px-1.5 py-0.5 rounded-[2px] border border-[#D6D2C9]">
                  <Loader2 className="h-2.5 w-2.5 animate-spin" />
                  CHECKING
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#B64B4B] bg-[#FDF0F0] px-1.5 py-0.5 rounded-[2px] border border-[#E5B5B5]">
                  <AlertCircle className="h-2.5 w-2.5" />
                  UNAVAILABLE
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#56616A] mt-0.5">
              Live scientific radio-astronomy observations from UC Berkeley SETI Research Center ·
              Max import ceiling: {maxImportMbDisplay} MiB
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={checkStatus}
            disabled={isCheckingStatus || disabled}
            className="inline-flex items-center gap-1 text-[11px] font-mono text-[#56616A] hover:text-[#17202A] px-2 py-1 rounded-[2px] border border-[#D6D2C9] bg-[#FFFFFF] hover:bg-[#F4F1EA] transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh archive connection status"
          >
            <RefreshCw className={`h-3 w-3 ${isCheckingStatus ? 'animate-spin' : ''}`} />
            Check Connection
          </button>
          <a
            href="https://seti.berkeley.edu/opendata"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-mono text-[#376A9B] hover:text-[#2A547C] px-2 py-1 rounded-[2px] border border-[#B6CDE2] bg-[#FFFFFF] hover:bg-[#EAF1F8] transition-colors"
          >
            Archive Web
            <ExternalLink className="h-2.5 w-2.5" />
          </a>
        </div>
      </div>

      {/* Provider Error / Offline Warning */}
      {statusError && (
        <div className="p-3 rounded-[4px] border border-[#E5B5B5] bg-[#FDF0F0] text-xs text-[#B64B4B] flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-semibold">Public Archive Notice:</span>
            <p className="text-[11px] leading-relaxed">{statusError}</p>
            <p className="text-[11px] text-[#56616A]">
              Manual file upload and locally stored observations remain fully operational.
            </p>
          </div>
        </div>
      )}

      {/* 2. Filter & Query Controls */}
      <div className="p-4 rounded-[4px] border border-[#D6D2C9] bg-[#FFFFFF] space-y-3.5 shadow-2xs">
        {/* Preset Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-[11px] font-mono text-[#7E8B96] uppercase mr-1">Presets:</span>
          {SEARCH_PRESETS.map((p) => (
            <button
              key={p.query}
              type="button"
              disabled={isSearching || disabled}
              onClick={() => {
                setTargetQuery(p.query);
              }}
              className={`px-2 py-1 rounded-[2px] text-[11px] font-mono border transition-all cursor-pointer ${
                targetQuery === p.query
                  ? 'border-[#376A9B] bg-[#EAF1F8] text-[#376A9B] font-semibold'
                  : 'border-[#D6D2C9] bg-[#FAF8F5] text-[#56616A] hover:border-[#BCB6A8] hover:bg-[#FFFFFF]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearch(0, false);
          }}
          className="grid grid-cols-1 sm:grid-cols-12 gap-2.5"
        >
          {/* Target Query */}
          <div className="sm:col-span-4 relative">
            <label
              htmlFor="target-input"
              className="block text-[10px] font-mono text-[#7E8B96] uppercase mb-1"
            >
              Target Identifier *
            </label>
            <div className="relative">
              <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7E8B96]" />
              <input
                id="target-input"
                type="text"
                value={targetQuery}
                onChange={(e) => setTargetQuery(e.target.value)}
                placeholder="e.g. VOYAGER1, 3C123"
                disabled={isSearching || disabled}
                className="w-full pl-8 pr-3 py-1.5 text-xs font-mono border border-[#D6D2C9] rounded-[2px] bg-[#FAF8F5] text-[#17202A] placeholder-[#9AA5B1] focus:bg-[#FFFFFF] focus:border-[#376A9B] focus:outline-none focus:ring-1 focus:ring-[#376A9B]"
              />
            </div>
          </div>

          {/* Telescope Filter */}
          <div className="sm:col-span-3">
            <label
              htmlFor="telescope-select"
              className="block text-[10px] font-mono text-[#7E8B96] uppercase mb-1"
            >
              Telescope
            </label>
            <select
              id="telescope-select"
              value={telescopeFilter}
              onChange={(e) => setTelescopeFilter(e.target.value)}
              disabled={isSearching || disabled}
              className="w-full px-2.5 py-1.5 text-xs font-mono border border-[#D6D2C9] rounded-[2px] bg-[#FAF8F5] text-[#17202A] focus:bg-[#FFFFFF] focus:border-[#376A9B] focus:outline-none"
            >
              <option value="">All Telescopes</option>
              {availableTelescopes.length > 0 ? (
                availableTelescopes.map((tel) => (
                  <option key={tel} value={tel}>
                    {tel}
                  </option>
                ))
              ) : (
                <>
                  <option value="GBT">Green Bank Telescope (GBT)</option>
                  <option value="Parkes">Parkes Observatory</option>
                  <option value="APF">Automated Planet Finder (APF)</option>
                </>
              )}
            </select>
          </div>

          {/* Format Filter */}
          <div className="sm:col-span-3">
            <label
              htmlFor="format-select"
              className="block text-[10px] font-mono text-[#7E8B96] uppercase mb-1"
            >
              File Format
            </label>
            <select
              id="format-select"
              value={formatFilter}
              onChange={(e) => setFormatFilter(e.target.value)}
              disabled={isSearching || disabled}
              className="w-full px-2.5 py-1.5 text-xs font-mono border border-[#D6D2C9] rounded-[2px] bg-[#FAF8F5] text-[#17202A] focus:bg-[#FFFFFF] focus:border-[#376A9B] focus:outline-none"
            >
              <option value="">All Formats</option>
              {availableFormats.length > 0 ? (
                availableFormats.map((fmt) => (
                  <option key={fmt} value={fmt}>
                    {fmt}
                  </option>
                ))
              ) : (
                <>
                  <option value="filterbank">Filterbank (.fil)</option>
                  <option value="fits">FITS (.fits)</option>
                  <option value="HDF5">HDF5 (.h5)</option>
                  <option value="baseband data">Baseband (.raw)</option>
                </>
              )}
            </select>
          </div>

          {/* Search Button */}
          <div className="sm:col-span-2 flex items-end">
            <button
              type="submit"
              disabled={isSearching || disabled}
              className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-[2px] border border-[#376A9B] bg-[#376A9B] text-white text-xs font-semibold hover:bg-[#2A547C] transition-all cursor-pointer disabled:opacity-50"
            >
              {isSearching ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="h-3 w-3" />
                  <span>Search</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Supplementary Filter & Guidance */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-[#7E8B96] font-mono pt-1 border-t border-[#EAE7E0]">
          <div className="flex items-center gap-2">
            <span>Size ceiling filter:</span>
            <input
              type="range"
              min="5"
              max="80"
              step="5"
              value={maxSizeMb}
              onChange={(e) => setMaxSizeMb(Number(e.target.value))}
              className="w-24 accent-[#376A9B] cursor-pointer"
            />
            <span className="text-[#17202A] font-medium">{maxSizeMb} MB</span>
          </div>
          <div className="text-[10px] text-[#56616A]">
            Compatible: Filterbank (.fil) & FITS (.fits) under 80 MiB
          </div>
        </div>
      </div>

      {/* 3. Search Errors or Empty States */}
      {searchError && (
        <div className="p-4 rounded-[4px] border border-[#E5B5B5] bg-[#FDF0F0] text-xs text-[#B64B4B] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{searchError}</span>
          </div>
          <button
            type="button"
            onClick={() => handleSearch(0, false)}
            className="text-[11px] font-mono underline hover:text-[#882E2E] cursor-pointer shrink-0"
          >
            Retry Search
          </button>
        </div>
      )}

      {/* 4. Results List and Inspection View */}
      {wasSearched && !searchError && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Results List (7 cols) */}
          <div className="lg:col-span-7 space-y-2.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[#7E8B96] uppercase tracking-wider font-semibold">
                Catalogue Results ({items.length} of {totalResults})
              </span>
              <span className="text-[#7E8B96]">Target: {targetQuery}</span>
            </div>

            {items.length === 0 && !isSearching ? (
              <div className="p-8 rounded-[4px] border border-[#D6D2C9] bg-[#FAF8F5] text-center space-y-2">
                <Info className="h-5 w-5 text-[#7E8B96] mx-auto" />
                <div className="text-xs font-semibold text-[#17202A]">
                  No matching observations found
                </div>
                <p className="text-[11px] text-[#56616A] max-w-sm mx-auto">
                  The Breakthrough Listen catalogue returned no entries for target &ldquo;
                  {targetQuery}&rdquo; with the selected filters. Try searching for
                  &ldquo;VOYAGER1&rdquo; or &ldquo;3C123&rdquo;.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                {items.map((item) => {
                  const isSelected = selectedItem?.id === item.id;
                  const isIngested = selectedObservationId === item.id;
                  const sizeMb = (item.size_bytes / (1024 * 1024)).toFixed(1);

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedItem(item)}
                      className={`p-3 rounded-[4px] border text-left transition-all duration-150 cursor-pointer relative ${
                        isSelected
                          ? 'border-[#376A9B] bg-[#FFFFFF] shadow-2xs ring-1 ring-[#376A9B]/30'
                          : 'border-[#D6D2C9] bg-[#FAF8F5] hover:border-[#BCB6A8] hover:bg-[#FFFFFF]'
                      }`}
                    >
                      {/* Active indicator bar */}
                      {isSelected && (
                        <div className="absolute top-0 bottom-0 left-0 w-[3px] bg-[#376A9B] rounded-l-[4px]" />
                      )}

                      {/* Header Row */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold font-mono text-[#17202A]">
                              {item.target}
                            </span>
                            <span className="text-[10px] font-mono text-[#7E8B96] px-1 py-0.2 rounded border border-[#EAE7E0] bg-[#FFFFFF]">
                              {item.telescope}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-[#7E8B96] mt-0.5">
                            {item.utc
                              ? item.utc.slice(0, 19).replace('T', ' ')
                              : 'UTC timestamp unavailable'}
                            {item.mjd != null ? ` · MJD ${item.mjd.toFixed(2)}` : ''}
                          </div>
                        </div>

                        {/* Status Badges */}
                        <div className="flex flex-col items-end gap-1">
                          {isIngested ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#376A9B] bg-[#EAF1F8] px-1.5 py-0.5 rounded-[2px] border border-[#B6CDE2] font-semibold">
                              <CheckCircle2 className="h-2.5 w-2.5" />
                              INGESTED
                            </span>
                          ) : item.is_compatible && item.is_within_size_limit ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#3D7D54] bg-[#EFF7F2] px-1.5 py-0.5 rounded-[2px] border border-[#B2D8C0]">
                              COMPATIBLE
                            </span>
                          ) : !item.is_compatible ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#B64B4B] bg-[#FDF0F0] px-1.5 py-0.5 rounded-[2px] border border-[#E5B5B5]">
                              UNSUPPORTED FORMAT
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#D97706] bg-[#FEF3C7] px-1.5 py-0.5 rounded-[2px] border border-[#FDE68A]">
                              OVERSIZED ({sizeMb} MB)
                            </span>
                          )}
                          <span className="text-[10px] font-mono text-[#56616A]">
                            {sizeMb} MB · {item.file_type}
                          </span>
                        </div>
                      </div>

                      {/* Technical Specs Row */}
                      <div className="mt-2 pt-2 border-t border-[#EAE7E0] grid grid-cols-3 gap-2 text-[10px] font-mono text-[#56616A]">
                        <div>
                          <span className="text-[#7E8B96]">Center Freq: </span>
                          <span className="text-[#17202A] font-medium">
                            {item.center_freq_mhz != null
                              ? `${item.center_freq_mhz.toFixed(2)} MHz`
                              : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#7E8B96]">Coords: </span>
                          <span className="text-[#17202A] font-medium">
                            {item.ra_deg != null && item.dec_deg != null
                              ? `${item.ra_deg.toFixed(2)}°, ${item.dec_deg.toFixed(2)}°`
                              : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[#7E8B96]">Grade: </span>
                          <span className="text-[#17202A] font-medium">
                            {item.quality || 'Standard'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Load More Button */}
                {hasMore && (
                  <button
                    type="button"
                    disabled={isSearching || disabled}
                    onClick={() => handleSearch(offset + 25, true)}
                    className="w-full py-2 rounded-[2px] border border-[#D6D2C9] bg-[#FFFFFF] hover:bg-[#FAF8F5] text-xs font-mono text-[#376A9B] font-medium cursor-pointer transition-colors"
                  >
                    {isSearching
                      ? 'Loading additional records...'
                      : 'Load more records from archive'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Selected Record Inspection & Action (5 cols) */}
          <div className="lg:col-span-5">
            {selectedItem ? (
              <div className="p-4 rounded-[4px] border border-[#B6CDE2] bg-[#FFFFFF] space-y-3.5 shadow-xs sticky top-4">
                <div className="flex items-center justify-between border-b border-[#EAF1F8] pb-2.5">
                  <div className="flex items-center gap-1.5">
                    <Radio className="h-3.5 w-3.5 text-[#376A9B]" />
                    <span className="text-[11px] font-mono uppercase tracking-wider text-[#376A9B] font-semibold">
                      Observation Inspection
                    </span>
                  </div>
                  <a
                    href={selectedItem.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] font-mono text-[#7E8B96] hover:text-[#376A9B]"
                    title="Inspect upstream record source"
                  >
                    Source Link
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>

                <div>
                  <div className="text-base font-bold font-mono text-[#17202A]">
                    {selectedItem.target}
                  </div>
                  <div className="text-xs text-[#56616A] font-mono mt-0.5">
                    {selectedItem.telescope} · {selectedItem.file_type}
                  </div>
                </div>

                {/* Metadata Details Table */}
                <div className="space-y-1.5 text-xs font-mono border-t border-b border-[#EAE7E0] py-2.5">
                  <div className="flex justify-between">
                    <span className="text-[#7E8B96]">Center Frequency:</span>
                    <span className="text-[#17202A] font-medium">
                      {selectedItem.center_freq_mhz != null
                        ? `${selectedItem.center_freq_mhz.toFixed(4)} MHz`
                        : 'Unavailable'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7E8B96]">File Size:</span>
                    <span className="text-[#17202A] font-medium">
                      {(selectedItem.size_bytes / (1024 * 1024)).toFixed(2)} MB (
                      {selectedItem.size_bytes.toLocaleString()} bytes)
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7E8B96]">Right Ascension:</span>
                    <span className="text-[#17202A] font-medium">
                      {selectedItem.ra_deg != null ? `${selectedItem.ra_deg.toFixed(4)}°` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7E8B96]">Declination:</span>
                    <span className="text-[#17202A] font-medium">
                      {selectedItem.dec_deg != null ? `${selectedItem.dec_deg.toFixed(4)}°` : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7E8B96]">UTC Time:</span>
                    <span className="text-[#17202A] font-medium">
                      {selectedItem.utc ? selectedItem.utc.slice(0, 19).replace('T', ' ') : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7E8B96]">Upstream Checksum:</span>
                    <span
                      className="text-[#17202A] font-mono text-[10px] truncate max-w-[140px]"
                      title={selectedItem.md5sum ?? undefined}
                    >
                      {selectedItem.md5sum || 'Not published'}
                    </span>
                  </div>
                </div>

                {/* Compatibility Validation Notice */}
                {!selectedItem.is_compatible && (
                  <div className="p-2.5 rounded-[2px] border border-[#E5B5B5] bg-[#FDF0F0] text-[11px] text-[#B64B4B] space-y-1">
                    <div className="font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3" />
                      Incompatible format for direct ingestion
                    </div>
                    <p>{selectedItem.compatibility_reason}</p>
                  </div>
                )}

                {selectedItem.is_compatible && !selectedItem.is_within_size_limit && (
                  <div className="p-2.5 rounded-[2px] border border-[#FDE68A] bg-[#FEF3C7] text-[11px] text-[#92400E] space-y-1">
                    <div className="font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="h-3 w-3" />
                      File size exceeds 80 MiB ceiling
                    </div>
                    <p>{selectedItem.size_reason}</p>
                  </div>
                )}

                {/* Import Error Message */}
                {importError && (
                  <div className="p-2.5 rounded-[2px] border border-[#E5B5B5] bg-[#FDF0F0] text-[11px] text-[#B64B4B]">
                    <span className="font-semibold">Import failed: </span>
                    {importError}
                  </div>
                )}

                {/* One-Click Action Button */}
                <div className="pt-2">
                  <button
                    type="button"
                    disabled={
                      !selectedItem.is_compatible ||
                      !selectedItem.is_within_size_limit ||
                      isImporting ||
                      disabled
                    }
                    onClick={() => handleImport(selectedItem)}
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-[3px] border border-[#376A9B] bg-[#376A9B] hover:bg-[#2A547C] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>{importProgressText || 'Importing observation...'}</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        <span>Load into AETHON & Inspect</span>
                      </>
                    )}
                  </button>

                  <p className="text-[10px] text-[#7E8B96] text-center mt-2 leading-tight">
                    Downloads real astronomical data into bounded storage, verifies integrity, and
                    links directly to spectral analysis.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-[4px] border border-[#D6D2C9] bg-[#FAF8F5] text-center text-xs text-[#56616A]">
                Select an observation card to inspect metadata and import into AETHON.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
