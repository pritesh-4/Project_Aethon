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
  const fCenterStr =
    record.frequencyMHz != null ? `${record.frequencyMHz.toFixed(3)} MHz` : 'Unavailable';
  const bwStr =
    record.bandwidthKHz != null ? `${record.bandwidthKHz.toFixed(1)} kHz` : 'Unavailable';
  const durStr =
    record.durationSeconds != null ? `${record.durationSeconds.toFixed(1)}s` : 'Unavailable';
  const snrStr = record.snrDb != null ? `${record.snrDb.toFixed(1)} dB` : 'Not measured';
  const driftStr =
    record.driftRateHzPerSec != null
      ? `${record.driftRateHzPerSec > 0 ? '+' : ''}${record.driftRateHzPerSec.toFixed(2)} Hz/s`
      : 'Not measured';
  const anomStr =
    record.anomalyIndex != null ? `${record.anomalyIndex.toFixed(3)} / 1.000` : 'Not evaluated';
  const rfiStr =
    record.interferenceProbability != null
      ? `${(record.interferenceProbability * 100).toFixed(1)}%`
      : 'Not evaluated';
  const persistStr =
    record.persistence != null ? `${(record.persistence * 100).toFixed(1)}%` : 'Not evaluated';

  return {
    observation: {
      question: 'What was observed?',
      summary: `Astronomical observation candidate isolated from source ${record.targetName} at center frequency ${fCenterStr}.`,
      metrics: [
        { label: 'Center frequency', value: fCenterStr, hint: 'Target radio window' },
        { label: 'Bandwidth', value: bwStr, hint: 'Isolated candidate window' },
        { label: 'Duration', value: durStr, hint: 'Candidate window span' },
        { label: 'Signal-to-noise', value: snrStr, hint: 'Temporal / feature SNR' },
      ],
      evidence: [
        {
          title: 'Observation origin',
          text: `Acquired by ${record.telescope || 'telescope'} at coordinates RA ${record.coordinates.ra || 'Unavailable'}, Dec ${record.coordinates.dec || 'Unavailable'}.`,
        },
        {
          title: 'Target region bounds',
          text: `Target region indexed in observation ${record.observationId}.`,
        },
      ],
    },
    representation: {
      question: 'How is it characterised?',
      summary:
        'Spectral regions are channelized into time-frequency matrices. The operational pipeline extracts statistical window moments and evaluates adaptive primary and secondary RFI flags.',
      metrics: [
        {
          label: 'Representation method',
          value: 'Statistical moments',
          hint: 'Window mean, variance, skew, kurtosis',
        },
        { label: 'RFI evaluation', value: rfiStr, hint: 'Flagged sample fraction' },
        { label: 'Learned embeddings', value: 'Not evaluated', hint: 'Offline research track' },
        { label: 'Attention weights', value: 'Not evaluated', hint: 'Not in baseline' },
      ],
      evidence: [
        {
          title: 'Moment-based feature extraction',
          text: 'The statistical detector computes distributional moments across local frequency and time windows to isolate anomalies.',
        },
        {
          title: 'RFI mask thresholding',
          text: 'Spectral samples exceeding adaptive radiometric thresholds are masked prior to anomaly scoring.',
        },
      ],
    },
    comparison: {
      question: 'Does this signal fit known catalog populations?',
      summary:
        'Catalog cross-matching against external pulsar (ATNF) or orbital satellite ephemerides is not currently evaluated by the backend service.',
      metrics: [
        {
          label: 'Nearest catalog profile',
          value: 'Not evaluated',
          hint: 'No active cross-match endpoint',
        },
        { label: 'Cosine distance', value: 'Not evaluated', hint: 'Requires learned embedding' },
        { label: 'Catalog similarity', value: 'Not evaluated', hint: 'Not computed' },
        { label: 'Flagged RFI fraction', value: rfiStr, hint: 'Mask flagged fraction' },
      ],
      evidence: [
        {
          title: 'Catalog matching limitation',
          text: 'Operational backend does not perform automatic matching against astronomical or satellite catalogs.',
        },
      ],
    },
    anomaly: {
      question: 'Why was this candidate flagged?',
      summary: `Flagged by unsupervised Isolation Forest and statistical baseline detectors with anomaly score ${anomStr} and fitted Doppler drift ${driftStr}.`,
      metrics: [
        { label: 'Anomaly score', value: anomStr, hint: 'Isolation Forest / baseline score' },
        { label: 'Doppler drift rate', value: driftStr, hint: 'Doppler drift regression' },
        { label: 'Temporal persistence', value: persistStr, hint: 'Temporal continuity' },
        { label: 'Priority band', value: record.priority, hint: 'Candidate triage classification' },
      ],
      evidence: [
        {
          title: 'Statistical anomaly detection',
          text: 'Window feature vector departed from baseline background distributions.',
        },
        {
          title: 'Doppler drift estimate',
          text: `Trajectory regression yielded ${driftStr}.`,
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
