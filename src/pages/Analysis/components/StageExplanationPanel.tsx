import type { SignalAnalysisRecord, AnalysisStageId } from '../types.ts';
import { HelpCircle, CheckCircle2 } from 'lucide-react';

export interface StageExplanationPanelProps {
  record: SignalAnalysisRecord;
  activeStage: AnalysisStageId;
}

export function StageExplanationPanel({ record, activeStage }: StageExplanationPanelProps) {
  interface StageContent {
    question: string;
    summary: string;
    metrics: { label: string; value: string; hint: string }[];
    evidence: { title: string; text: string }[];
  }

  const content: Record<AnalysisStageId, StageContent> = {
    observation: {
      question: 'What is the signal?',
      summary: `A continuous narrowband radio signal detected during targeted pointings of ${record.targetName} at ${record.frequencyMHz.toFixed(2)} MHz. The signal emerges clearly above system thermal noise and persists across the duration of the observation.`,
      metrics: [
        {
          label: 'Center frequency',
          value: `${record.frequencyMHz.toFixed(3)} MHz`,
          hint: 'L-Band radio window',
        },
        {
          label: 'Bandwidth',
          value: `${record.bandwidthKHz} kHz`,
          hint: 'Monochromatic narrowband',
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
          text: `Detected by ${record.telescope} at coordinates RA ${record.coordinates.ra}, Dec ${record.coordinates.dec}.`,
        },
        {
          title: 'Spatial multi-beam confirmation',
          text: 'Signal is present exclusively during on-target beam pointing and completely absent in adjacent off-target reference beam.',
        },
      ],
    },
    representation: {
      question: 'How was it represented?',
      summary:
        'Instead of using handcrafted heuristic rules, AETHON channelizes raw complex voltages into high-cadence time-frequency patches and maps them into a learned 768-dimensional latent embedding space, enabling unbiased anomaly detection.',
      metrics: [
        { label: 'Latent space', value: '768-d vector space', hint: 'Learned representation' },
        { label: 'Time cadence', value: '0.5s / window', hint: 'High temporal resolution' },
        { label: 'Channels', value: '4,096 PFB channels', hint: 'Polyphase filterbank' },
        { label: 'Reconstruction loss', value: '0.042 residual', hint: 'Autoencoder loss' },
      ],
      evidence: [
        {
          title: 'Manifold projection',
          text: 'Continuous frequency drift trajectories form continuous geodesic paths in latent space rather than disjointed noise spikes.',
        },
        {
          title: 'Unsupervised feature extraction',
          text: 'Learned tokens capture phase coherence, bandwidth dispersion, and temporal continuity without pre-programmed classification templates.',
        },
      ],
    },
    comparison: {
      question: 'How does it compare against known radio sources?',
      summary: `The signal was cross-matched against cataloged natural astrophysical emitters (pulsars, fast radio bursts, masers) and terrestrial transmitters (orbital satellites, radar). It shows strong divergence from natural sources (${(record.knownPatternSimilarity * 100).toFixed(1)}% similarity).`,
      metrics: [
        {
          label: 'Nearest known catalog',
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
          text: 'Natural pulsars emit broadband harmonic pulses. This candidate exhibits an un-pulsed, continuous monochromatic carrier.',
        },
        {
          title: 'Distinction from orbital satellites',
          text: 'Low-Earth orbit satellites display non-linear S-curve Doppler shifts; this signal displays a steady linear barycentric drift slope.',
        },
      ],
    },
    anomaly: {
      question: 'Why is it anomalous?',
      summary: `The signal was prioritized because it deviates significantly from expected Gaussian thermal background noise (+4.8σ residual) while maintaining continuous non-terrestrial Doppler drift (${record.driftRateHzPerSec.toFixed(2)} Hz/s) across all observation pointings.`,
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
          hint: 'Persistent across 4 cycles',
        },
      ],
      evidence: [
        {
          title: 'Low similarity to learned patterns',
          text: `Shows only ${(record.knownPatternSimilarity * 100).toFixed(1)}% alignment with cataloged natural radio sources.`,
        },
        {
          title: 'Persistent temporal structure',
          text: 'Maintains carrier phase coherence across all 4 ON/OFF target cycles without fading or dispersion smearing.',
        },
        {
          title: 'Low estimated interference',
          text: `Doppler drift rate (${record.driftRateHzPerSec.toFixed(2)} Hz/s) eliminates ground transmitters, and cross-match with orbital satellite beacons is minimal (${(record.interferenceProbability * 100).toFixed(1)}%).`,
        },
      ],
    },
  };

  const current = content[activeStage];

  return (
    <div className="rounded border border-[#1C2630] bg-[#0B0F14] p-5 select-none space-y-4 shadow-sm">
      {/* Guiding Question & Summary */}
      <div className="space-y-1.5 border-b border-[#1C2630] pb-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-[#5BD8F5]" />
          <h2 className="text-sm font-semibold tracking-tight text-[#E6EDF2]">
            {current.question}
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-[#7F8B95] leading-relaxed">{current.summary}</p>
      </div>

      {/* Relevant Evidence Metrics (Only 4 relevant metrics per stage) */}
      <div>
        <span className="block text-[11px] font-semibold text-[#7F8B95] uppercase tracking-wider mb-2.5">
          Decision-relevant metrics
        </span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {current.metrics.map((m) => (
            <div
              key={m.label}
              className="rounded border border-[#1C2630] bg-[#10161D] p-3 text-xs space-y-0.5"
            >
              <span className="block text-[11px] text-[#7F8B95] truncate">{m.label}</span>
              <span className="block font-semibold font-mono text-sm text-[#5BD8F5]">
                {m.value}
              </span>
              <span className="block text-[10px] text-[#7F8B95] truncate">{m.hint}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Human-Readable Evidence ("Why flagged / supported facts") */}
      <div className="pt-1">
        <span className="block text-[11px] font-semibold text-[#E6EDF2] uppercase tracking-wider mb-2.5">
          Verified evidence
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {current.evidence.map((ev) => (
            <div
              key={ev.title}
              className="rounded border border-[#1C2630] bg-[#06080B] p-3 space-y-1"
            >
              <div className="flex items-center gap-1.5 font-medium text-[#E6EDF2]">
                <CheckCircle2 className="h-3.5 w-3.5 text-[#5BD8F5] shrink-0" />
                <span>{ev.title}</span>
              </div>
              <p className="text-[11px] text-[#7F8B95] leading-relaxed pl-5">{ev.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
