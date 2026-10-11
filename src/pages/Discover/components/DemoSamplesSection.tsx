import { useState, useEffect } from 'react';
import { Sparkles, Radio, Loader2, CheckCircle2, AlertTriangle, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api.ts';
import type { DemoSampleInfo } from '@/types/schemas.ts';
import type { DiscoveryObservationMeta } from '../types.ts';
import { toast } from 'sonner';
import { mapObservationToDiscoveryMeta } from '../utils.ts';

export interface DemoSamplesSectionProps {
  selectedObservationId: string | null;
  onObservationSelected: (obs: DiscoveryObservationMeta) => void;
  disabled?: boolean;
}

const DEFAULT_DEMO_SAMPLES: DemoSampleInfo[] = [
  {
    id: 'synthetic-drifting-beacon',
    name: 'AETHON Signal Lab — Synthetic Drifting Beacon',
    label: 'SYNTHETIC DEMO',
    format: '.fil',
    target: 'SYNTH-BEACON-01',
    telescope: 'Green Bank Telescope (GBT)',
    description:
      'Deterministic Gaussian noise with an injected narrowband drifting tone beacon (seed 42, peak SNR ~15.0). Designed for guaranteed offline end-to-end testing of signal processing, anomaly detection, and Doppler drift.',
    is_synthetic: true,
    seed: 42,
    file_size_bytes: 8382,
    channel_count: 64,
    time_sample_count: 32,
    frequency_mhz: 1420.0,
    bandwidth_mhz: 3.2,
    source_url: null,
    provenance_note:
      'Controlled synthetic data generated locally by AETHON Signal Lab for demonstrating the scientific pipeline. Not evidence of a real astronomical signal.',
  },
  {
    id: 'real-gbt-hip35136',
    name: 'Green Bank Telescope — HIP 35136',
    label: 'REAL GBT DATA',
    format: '.fil',
    target: 'HIP35136',
    telescope: 'Green Bank Telescope (GBT)',
    description:
      'Authentic Breakthrough Listen primary observation from the Green Bank Telescope (GBT) pointing at HIP 35136 (L-band, 1.34 GHz). Compact validated filterbank sample from Berkeley SETI tutorial.',
    is_synthetic: false,
    seed: null,
    file_size_bytes: 9342,
    channel_count: 70,
    time_sample_count: 32,
    frequency_mhz: 1340.2,
    bandwidth_mhz: 0.2003,
    source_url: 'https://github.com/UCBerkeleySETI/breakthrough',
    provenance_note:
      'Authentic observation from Breakthrough Listen / UC Berkeley SETI Research Center (GBT filterbank tutorial observation).',
  },
];

export function DemoSamplesSection({
  selectedObservationId,
  onObservationSelected,
  disabled = false,
}: DemoSamplesSectionProps) {
  const [samples, setSamples] = useState<DemoSampleInfo[]>(DEFAULT_DEMO_SAMPLES);
  const [loadingSampleId, setLoadingSampleId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch updated catalog metadata if backend is running
  useEffect(() => {
    let isCancelled = false;
    const fetchSamples = async () => {
      try {
        const remoteSamples = await api.getDemoSamples();
        if (!isCancelled && remoteSamples && remoteSamples.length > 0) {
          setSamples(remoteSamples);
        }
      } catch {
        // Fallback to static defaults is automatic
      }
    };
    void fetchSamples();
    return () => {
      isCancelled = true;
    };
  }, []);

  const handleLoadDemo = async (sample: DemoSampleInfo) => {
    setLoadingSampleId(sample.id);
    setErrorMsg(null);

    try {
      const res = await api.loadDemoSample(sample.id);
      const customMeta = mapObservationToDiscoveryMeta(
        res.observation,
        sample.is_synthetic ? 'AETHON Signal Lab (Synthetic Demo)' : 'Breakthrough Listen / GBT'
      );

      onObservationSelected(customMeta);

      const statusNote = res.is_duplicate
        ? 'Deduplicated observation reused safely from local storage.'
        : `Ingested ${sample.format} sample in ${res.duration_seconds.toFixed(2)}s.`;

      toast.success(`${sample.name} loaded into AETHON!`, {
        description: statusNote,
      });
    } catch (err: unknown) {
      const msg =
        (err as { message?: string })?.message || 'Failed to load demo observation into AETHON.';
      setErrorMsg(msg);
      toast.error('Demo sample loading failed', { description: msg });
    } finally {
      setLoadingSampleId(null);
    }
  };

  return (
    <div className="p-4 rounded-[4px] border border-[#B6CDE2] bg-[#F7FAFD] space-y-3.5 shadow-2xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E1EBF5] pb-2.5">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-[#376A9B]" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#17202A] tracking-tight uppercase font-mono">
                Ready-to-Use Demo Samples
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-[#3D7D54] bg-[#EFF7F2] px-1.5 py-0.5 rounded-[2px] border border-[#B2D8C0]">
                <CheckCircle2 className="h-2.5 w-2.5" />
                100% OFFLINE AVAILABLE
              </span>
            </div>
            <p className="text-[11px] text-[#56616A] mt-0.5">
              Explore the entire spectral analysis and anomaly pipeline instantly without waiting
              for remote archive queries.
            </p>
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-2.5 rounded-[2px] border border-[#E5B5B5] bg-[#FDF0F0] text-xs text-[#B64B4B] flex items-center gap-2">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Demo Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {samples.map((sample) => {
          const isLoadingThis = loadingSampleId === sample.id;
          const isCurrentlySelected = selectedObservationId === sample.id;

          return (
            <div
              key={sample.id}
              className={`flex flex-col justify-between p-3.5 rounded-[4px] border bg-[#FFFFFF] transition-all duration-150 relative ${
                sample.is_synthetic
                  ? 'border-[#C8DCEF] hover:border-[#376A9B]'
                  : 'border-[#D6D2C9] hover:border-[#376A9B]'
              }`}
            >
              <div className="space-y-2">
                {/* Header: Title and Badges */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold font-mono text-[#17202A]">
                        {sample.name}
                      </span>
                    </div>
                    <div className="text-[10px] font-mono text-[#7E8B96] mt-0.5">
                      Target: {sample.target} · {sample.telescope}
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded-[2px] border uppercase shrink-0 ${
                      sample.is_synthetic
                        ? 'text-[#92400E] bg-[#FEF3C7] border-[#FDE68A]'
                        : 'text-[#376A9B] bg-[#EAF1F8] border-[#B6CDE2]'
                    }`}
                  >
                    {sample.label}
                  </span>
                </div>

                {/* Description */}
                <p className="text-[11px] text-[#56616A] leading-relaxed line-clamp-3">
                  {sample.description}
                </p>

                {/* Technical Specs Tags */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono text-[#56616A] pt-1">
                  <span className="px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#EAE7E0]">
                    {sample.format}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#EAE7E0]">
                    {(sample.file_size_bytes / 1024).toFixed(1)} KB
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#EAE7E0]">
                    {sample.channel_count} ch × {sample.time_sample_count} steps
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#EAE7E0]">
                    {sample.frequency_mhz.toFixed(1)} MHz
                  </span>
                </div>

                {/* Synthetic Disclaimer or Real Source Attribution */}
                {sample.is_synthetic ? (
                  <div className="p-2 rounded-[2px] bg-[#FEF8F0] border border-[#F6E1C5] text-[10px] text-[#8C5E28] flex items-start gap-1.5 leading-snug">
                    <Radio className="h-3 w-3 shrink-0 mt-0.5 text-[#B45309]" />
                    <span>
                      Controlled synthetic test signal with known ground truth beacon. Designed for
                      verifying algorithm sensitivity.
                    </span>
                  </div>
                ) : (
                  <div className="p-2 rounded-[2px] bg-[#F4F8FA] border border-[#D0E2EC] text-[10px] text-[#2F5A7C] flex items-start justify-between gap-1.5 leading-snug">
                    <span>
                      Authentic SETI observational data from Green Bank Telescope L-band receiver.
                    </span>
                    {sample.source_url && (
                      <a
                        href={sample.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-[#376A9B] hover:underline shrink-0"
                      >
                        Source <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-[#EAE7E0] mt-3">
                <button
                  type="button"
                  disabled={isLoadingThis || disabled}
                  onClick={() => handleLoadDemo(sample)}
                  className={`w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-[3px] text-xs font-mono font-semibold transition-all cursor-pointer disabled:opacity-50 ${
                    isCurrentlySelected
                      ? 'bg-[#EFF7F2] border border-[#B2D8C0] text-[#3D7D54]'
                      : 'bg-[#376A9B] hover:bg-[#2A547C] text-white border border-[#376A9B] shadow-2xs'
                  }`}
                >
                  {isLoadingThis ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Ingesting into pipeline...</span>
                    </>
                  ) : isCurrentlySelected ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-[#3D7D54]" />
                      <span>Active In Pipeline</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>
                        {sample.is_synthetic ? 'Load Demo & Analyse' : 'Load Real Sample & Analyse'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
