import { useParams, Link } from 'react-router';
import { PageHeader } from '@/components/layout/PageHeader.tsx';
import { PageTransition } from '@/components/ui/motion.tsx';
import { Badge } from '@/components/ui/Badge.tsx';
import { Button } from '@/components/ui/Button.tsx';
import { StatMetric } from '@/components/ui/StatMetric.tsx';
import { SpectrumChart } from '@/components/visualization/SpectrumChart.tsx';
import { DriftRateChart } from '@/components/visualization/DriftRateChart.tsx';
import { SAMPLE_CANDIDATES } from '@/features/signals/sample-data.ts';
import { formatFrequency, formatSNR } from '@/lib/utils.ts';
import { ArrowLeft, CheckCircle, XCircle, Download, Compass, Cpu, Radio } from 'lucide-react';
import { toast } from 'sonner';

export default function AnalysisPage() {
  const { signalId } = useParams<{ signalId: string }>();

  // Find candidate by ID or fall back to primary sample candidate
  const signal =
    SAMPLE_CANDIDATES.find((s) => s.id.toLowerCase() === signalId?.toLowerCase()) ||
    SAMPLE_CANDIDATES[0];

  const confirmCandidate = () => {
    toast.success(`Signal ${signal.id} Marked as Verified Technosignature Candidate`, {
      description: 'Dispatched to Breakthrough Listen & SETI Institute alert queue.',
    });
  };

  const rejectAsRfi = () => {
    toast.error(`Signal ${signal.id} Flagged as Terrestrial RFI`, {
      description: 'Transferred to terrestrial transmitter interference fingerprint library.',
    });
  };

  const exportTelemetry = () => {
    const jsonBlob = new Blob([JSON.stringify(signal, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(jsonBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${signal.id}-telemetry.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.info(`Exported telemetry JSON for ${signal.id}`);
  };

  return (
    <PageTransition className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          to="/discover"
          className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Return to Discovery Feed</span>
        </Link>
      </div>

      <PageHeader
        category="DEEP SPECTRAL ANALYSIS DOSSIER"
        title={`${signal.id} — ${signal.name}`}
        subtitle={`Candidate isolated via ${signal.telescope} using ${signal.mlModelVersion} anomaly pipeline.`}
        badge={
          <Badge variant={signal.priorityRank === 'critical' ? 'rose' : 'cyan'}>
            CONFIDENCE: {(signal.anomalyScore * 100).toFixed(1)}%
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Download className="h-3.5 w-3.5" />}
              onClick={exportTelemetry}
            >
              Export JSON
            </Button>
            <Button
              variant="danger"
              size="sm"
              icon={<XCircle className="h-3.5 w-3.5" />}
              onClick={rejectAsRfi}
            >
              Flag as RFI
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<CheckCircle className="h-3.5 w-3.5" />}
              onClick={confirmCandidate}
            >
              Verify Candidate
            </Button>
          </div>
        }
      />

      {/* Primary Signal Parameters */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatMetric
          label="Center Frequency"
          value={formatFrequency(signal.frequencyMHz)}
          subtext={`Channel Bandwidth: ${signal.bandwidthKHz} kHz`}
          status="active"
          icon={<Radio className="h-4 w-4" />}
        />
        <StatMetric
          label="Signal to Noise"
          value={formatSNR(signal.snrDb)}
          subtext="Detection Threshold: >10.0 dB"
          status="alert"
        />
        <StatMetric
          label="Drift Rate"
          value={
            signal.driftRateHzPerSec > 0 ? `+${signal.driftRateHzPerSec}` : signal.driftRateHzPerSec
          }
          unit="Hz/s"
          subtext="Topocentric Doppler shift"
          status="warning"
        />
        <StatMetric
          label="Neural Anomaly Score"
          value={(signal.anomalyScore * 100).toFixed(1)}
          unit="%"
          subtext="Cosine Distance: 0.942"
          status="active"
          icon={<Cpu className="h-4 w-4" />}
        />
      </div>

      {/* Spectral Visualizers */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <SpectrumChart
            height={280}
            highlightMarkerMHz={signal.frequencyMHz}
            markerLabel={`${signal.id} (${formatSNR(signal.snrDb)})`}
          />
        </div>
        <div className="space-y-2">
          <DriftRateChart height={280} driftRateHzPerSec={signal.driftRateHzPerSec} />
        </div>
      </div>

      {/* Celestial Coordinates & ML Classification Breakdown */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-lg border border-slate-800/80 bg-slate-950/70 p-5 font-mono text-xs">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-3">
            <Compass className="h-4 w-4 text-cyan-400" />
            <h3 className="font-bold text-slate-200 uppercase tracking-wider">
              Aperture & Celestial Coordinates
            </h3>
          </div>

          <div className="space-y-2 text-slate-300">
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Right Ascension (RA):</span>
              <span className="text-cyan-300">{signal.coordinates.ra}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Declination (DEC):</span>
              <span className="text-cyan-300">{signal.coordinates.dec}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Constellation:</span>
              <span>{signal.coordinates.constellation || 'Unmapped'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-900">
              <span className="text-slate-400">Receiving Telescope:</span>
              <span className="text-slate-100">{signal.telescope}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Observation Timestamp:</span>
              <span className="text-slate-400">{signal.timestamp}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-slate-800/80 bg-slate-950/70 p-5 font-mono text-xs">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-3">
            <Cpu className="h-4 w-4 text-emerald-400" />
            <h3 className="font-bold text-slate-200 uppercase tracking-wider">
              ML Classification Probabilities
            </h3>
          </div>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-cyan-300">Extraterrestrial Technosignature Candidate</span>
                <span className="font-bold text-cyan-400">89.4%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-400 rounded-full" style={{ width: '89.4%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-300">Natural Pulsar / FRB Dispersion</span>
                <span className="text-slate-400">7.2%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: '7.2%' }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-slate-300">Terrestrial / Satellite RFI</span>
                <span className="text-slate-400">3.4%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: '3.4%' }} />
              </div>
            </div>

            <p className="pt-2 text-[11px] text-slate-400 border-t border-slate-900 leading-relaxed font-sans">
              Model notes: Significant negative Doppler drift (-0.32 Hz/s) matches orbital motion of
              Proxima b around Proxima Centauri with high confidence. Low terrestrial correlation.
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
