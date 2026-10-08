import { useState } from 'react';
import type { SignalAnalysisRecord, AnalysisStageId } from '../types.ts';
import { ChevronDown, ChevronRight } from 'lucide-react';

export interface StageExplanationPanelProps {
  record: SignalAnalysisRecord;
  activeStage: AnalysisStageId;
}

interface StageContent {
  question: string;
  summary: string;
  metrics: { label: string; value: string; hint: string }[];
  evidence: { title: string; text: string }[];
}

function buildContent(record: SignalAnalysisRecord): Record<AnalysisStageId, StageContent> {
  return {
    observation: {
      question: 'What was observed?',
      summary: `A continuous narrowband radio emission isolated during pointings of ${record.targetName} at ${record.frequencyMHz.toFixed(2)} MHz. The signal emerges distinctly above system thermal noise and persists across the duration of the observation.`,
      metrics: [
        {
          label: 'Center frequency',
          value: `${record.frequencyMHz.toFixed(3)} MHz`,
          hint: 'Target radio window',
        },
        {
          label: 'Bandwidth',
          value: `${record.bandwidthKHz} kHz`,
          hint: 'Narrowband profile',
        },
        {
          label: 'Duration',
          value: `${record.durationSeconds.toFixed(1)}s`,
          hint: 'Continuous emission',
        },
        { label: 'Signal-to-noise', value: `${record.snrDb} dB`, hint: 'Above 3σ detection floor' },
      ],
      evidence: [
        {
          title: 'Celestial pointing origin',
          text: `Acquired by ${record.telescope} at coordinates RA ${record.coordinates.ra}, Dec ${record.coordinates.dec}.`,
        },
        {
          title: 'Spatial multi-beam confirmation',
          text: 'Signal is present exclusively during on-target beam pointing and absent in adjacent off-target reference beams.',
        },
      ],
    },
    representation: {
      question: 'How is it encoded?',
      summary:
        'Raw complex voltages are channelized into high-cadence time-frequency patches and mapped into a learned 768-dimensional latent manifold, preserving fine spectral continuity and phase structure.',
      metrics: [
        { label: 'Latent dimension', value: '768-d vector space', hint: 'Continuous embedding' },
        { label: 'Time cadence', value: '0.5s window', hint: 'Temporal resolution' },
        { label: 'Channels', value: '4,096 PFB channels', hint: 'Polyphase filterbank' },
        { label: 'Reconstruction loss', value: '0.042 residual', hint: 'Autoencoder loss' },
      ],
      evidence: [
        {
          title: 'Manifold projection',
          text: 'Frequency drift trajectories map as smooth geodesic paths in latent space rather than discontinuous noise spikes.',
        },
        {
          title: 'Feature preservation',
          text: 'Extracted tokens retain phase coherence, dispersion profile, and duration without heuristic template matching.',
        },
      ],
    },
    comparison: {
      question: 'Does this signal fit the known population?',
      summary: `Cross-referenced against cataloged natural astrophysical emitters (pulsars, fast radio bursts, masers) and known terrestrial transmitters. The signal exhibits divergence from natural sources (${(record.knownPatternSimilarity * 100).toFixed(1)}% match).`,
      metrics: [
        {
          label: 'Nearest catalog profile',
          value: record.comparison.nearestKnownPattern,
          hint: 'Astrophysical catalog',
        },
        {
          label: 'Cosine distance',
          value: record.comparison.cosineDistance.toFixed(3),
          hint: 'High divergence (> 0.85)',
        },
        {
          label: 'Catalog similarity',
          value: `${(record.knownPatternSimilarity * 100).toFixed(1)}%`,
          hint: 'Low match to natural pulsars',
        },
        {
          label: 'Terrestrial RFI risk',
          value: `${(record.interferenceProbability * 100).toFixed(1)}%`,
          hint: 'Low interference probability',
        },
      ],
      evidence: [
        {
          title: 'Divergence from natural pulsars',
          text: 'Natural pulsars produce broadband harmonic pulses. This candidate displays an un-pulsed continuous monochromatic carrier.',
        },
        {
          title: 'Distinction from orbital satellites',
          text: 'Low-Earth orbit satellites exhibit non-linear S-curve Doppler shifts; this candidate exhibits a steady linear drift rate.',
        },
      ],
    },
    anomaly: {
      question: 'Why is this unusual?',
      summary: `Prioritized because it deviates significantly from expected Gaussian thermal background noise (+4.8σ residual) while maintaining a persistent Doppler drift (${record.driftRateHzPerSec.toFixed(2)} Hz/s) across all observation pointings.`,
      metrics: [
        {
          label: 'Anomaly index',
          value: `${record.anomalyIndex.toFixed(3)} / 1.000`,
          hint: 'Statistical deviance score',
        },
        {
          label: 'Residual divergence',
          value: '+4.8σ from baseline',
          hint: 'Latent reconstruction residual',
        },
        {
          label: 'Doppler drift rate',
          value: `${record.driftRateHzPerSec > 0 ? '+' : ''}${record.driftRateHzPerSec.toFixed(2)} Hz/s`,
          hint: 'Non-terrestrial acceleration',
        },
        {
          label: 'Temporal persistence',
          value: `${(record.persistence * 100).toFixed(1)}%`,
          hint: 'Maintained across 4 pointings',
        },
      ],
      evidence: [
        {
          title: 'Low similarity to learned profiles',
          text: `Shows only ${(record.knownPatternSimilarity * 100).toFixed(1)}% alignment with cataloged natural radio sources.`,
        },
        {
          title: 'Persistent temporal structure',
          text: 'Maintains carrier phase coherence across all 4 ON/OFF target cycles without fading or dispersion smearing.',
        },
        {
          title: 'Low estimated interference',
          text: `Drift rate (${record.driftRateHzPerSec.toFixed(2)} Hz/s) excludes fixed ground transmitters, with low cross-match to known orbital satellites (${(record.interferenceProbability * 100).toFixed(1)}%).`,
        },
      ],
    },
  };
}

export function StageExplanationPanel({ record, activeStage }: StageExplanationPanelProps) {
  const [showMeasurements, setShowMeasurements] = useState(false);
  const current = buildContent(record)[activeStage];

  return (
    <div className="select-none font-sans space-y-4">
      {/* Editorial Scientific Question & Interpretation */}
      <div className="space-y-2 pb-2">
        <h2 className="text-xl font-normal tracking-tight text-[#17202A] font-serif">
          {current.question}
        </h2>
        <p className="text-xs text-[#56616A] leading-relaxed">{current.summary}</p>
      </div>

      {/* Explanatory Evidence First (Per Rule 24) */}
      <div className="border-t border-[#D6D2C9] pt-3.5 space-y-2.5">
        <span className="block text-[11px] font-mono uppercase tracking-wider text-[#76828D] font-semibold">
          Screening Evidence
        </span>

        <div className="space-y-2.5 text-xs">
          {current.evidence.map((ev) => (
            <div key={ev.title} className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#376A9B] mt-1.5 shrink-0" />
              <div className="min-w-0">
                <span className="font-semibold text-[#17202A] block">{ev.title}</span>
                <p className="text-[11px] text-[#56616A] leading-relaxed mt-0.5">{ev.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progressive Disclosure — [ Inspect measurements ] */}
      <div className="border-t border-[#D6D2C9] pt-2.5">
        <button
          type="button"
          aria-expanded={showMeasurements}
          onClick={() => setShowMeasurements(!showMeasurements)}
          className="flex items-center justify-between w-full text-xs font-mono text-[#56616A] hover:text-[#17202A] py-1.5 transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#376A9B]"
        >
          <span>{showMeasurements ? 'HIDE MEASUREMENTS' : 'INSPECT MEASUREMENTS'}</span>
          {showMeasurements ? (
            <ChevronDown className="h-3.5 w-3.5 text-[#376A9B]" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-[#76828D]" />
          )}
        </button>

        {showMeasurements && (
          <div className="mt-2 divide-y divide-[#D6D2C9] border border-[#D6D2C9] bg-[#EAE7E0] rounded-[2px] p-3 text-xs font-mono space-y-1 animate-in fade-in duration-150">
            {current.metrics.map((m) => (
              <div key={m.label} className="flex items-baseline justify-between py-1.5 gap-2">
                <span className="text-[#56616A] text-[11px]">{m.label}</span>
                <span className="text-[#17202A] text-right font-semibold">{m.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
