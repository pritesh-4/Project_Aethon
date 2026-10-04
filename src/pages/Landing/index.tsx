import { Link } from 'react-router';
import { Radio, Activity, Compass, ShieldAlert, Cpu, ArrowRight, Zap, Target } from 'lucide-react';
import { Button } from '@/components/ui/Button.tsx';
import { Badge } from '@/components/ui/Badge.tsx';
import { StatMetric } from '@/components/ui/StatMetric.tsx';
import { SpectrumChart } from '@/components/visualization/SpectrumChart.tsx';
import { PageTransition } from '@/components/ui/motion.tsx';

export default function LandingPage() {
  return (
    <PageTransition className="space-y-12">
      {/* Hero Mission Section */}
      <section className="relative overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/80 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <Badge variant="cyan">DEEP SPACE RADIO ASTRONOMY</Badge>
            <Badge variant="outline">SETI & TRANSIENT ASTROPHYSICS</Badge>
            <span className="font-mono text-xs text-slate-400">
              MISSION CODE: <span className="text-slate-300">AE-2026-X</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-100 font-sans leading-tight">
            Autonomous Discovery of <span className="text-cyan-400 font-mono">Deep-Space</span>{' '}
            Radio Anomalies
          </h1>

          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed font-sans">
            AETHON deploys deep neural transformer encoders and real-time Doppler drift filtering
            across terabytes of high-cadence radio telescope telemetry to isolate anomalous
            technosignature candidates from terrestrial interference.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link to="/observatory">
              <Button variant="primary" size="lg" icon={<Activity className="h-4 w-4" />}>
                Launch Observatory Console
              </Button>
            </Link>
            <Link to="/discover">
              <Button variant="secondary" size="lg" icon={<Radio className="h-4 w-4" />}>
                Inspect Candidates
              </Button>
            </Link>
            <Link to="/model">
              <Button variant="outline" size="lg" icon={<Cpu className="h-4 w-4" />}>
                ML Architecture
              </Button>
            </Link>
          </div>
        </div>

        {/* Live Observatory Telemetry Bar */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-900">
          <StatMetric
            label="Monitored Channels"
            value="1.24"
            unit="Billion"
            subtext="L-Band & S-Band"
            status="nominal"
            icon={<Target className="h-4 w-4" />}
          />
          <StatMetric
            label="Inference Latency"
            value="14.2"
            unit="ms/frame"
            subtext="Edge TensorRT"
            status="active"
            icon={<Zap className="h-4 w-4" />}
          />
          <StatMetric
            label="RFI Rejection"
            value="99.98"
            unit="%"
            subtext="Terrestrial Filter"
            status="nominal"
            icon={<ShieldAlert className="h-4 w-4" />}
          />
          <StatMetric
            label="Flagged Signals"
            value="4"
            unit="Active"
            subtext="Pending Verification"
            status="alert"
            icon={<Radio className="h-4 w-4" />}
          />
        </div>
      </section>

      {/* Live Spectral Preview Instrumentation */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold font-sans text-slate-100 flex items-center gap-2">
              <Compass className="h-5 w-5 text-cyan-400" />
              Live Aperture Feed: 1420.405 MHz (HI Neutral Hydrogen Line)
            </h2>
            <p className="text-xs font-mono text-slate-400">
              Target: Proxima Centauri | Telescope: Green Bank 100m Dish | Cadence: 1.0s
            </p>
          </div>
          <Link
            to="/observatory"
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 hover:text-cyan-300"
          >
            <span>Full Spectrogram</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <SpectrumChart
          height={260}
          highlightMarkerMHz={1420.4057}
          markerLabel="Candidate SIG-2026-089A (+24.8 dB)"
        />
      </section>

      {/* 3-Pillar Science Architecture */}
      <section className="grid md:grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-5 backdrop-blur-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded border border-cyan-900/60 bg-cyan-950/40 text-cyan-400 mb-3">
            <Radio className="h-4 w-4" />
          </div>
          <h3 className="text-base font-semibold text-slate-100 font-sans">
            Ultra-Wideband Channelization
          </h3>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed font-sans">
            Polyphase filterbanks split raw gigabit I/Q telemetry streams into millions of 3.8 Hz
            channels, capturing faint narrow-band transmissions.
          </p>
        </div>

        <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-5 backdrop-blur-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded border-cyan-900/60 bg-cyan-950/40 text-cyan-400 mb-3 border">
            <Cpu className="h-4 w-4" />
          </div>
          <h3 className="text-base font-semibold text-slate-100 font-sans">
            Transformer Anomaly Isolation
          </h3>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed font-sans">
            Multi-head self-attention models learn the background cosmic noise distribution and
            isolate non-stochastic, carrier-modulated transients.
          </p>
        </div>

        <div className="rounded-lg border border-slate-800/80 bg-slate-950/60 p-5 backdrop-blur-sm">
          <div className="flex h-9 w-9 items-center justify-center rounded border-emerald-900/60 bg-emerald-950/40 text-emerald-400 mb-3 border">
            <Activity className="h-4 w-4" />
          </div>
          <h3 className="text-base font-semibold text-slate-100 font-sans">
            Doppler Drift Verification
          </h3>
          <p className="mt-2 text-xs text-slate-400 leading-relaxed font-sans">
            Automatic tracking of topocentric orbital accelerations ensures signals originate from
            celestial coordinates rather than low-Earth orbit satellites.
          </p>
        </div>
      </section>
    </PageTransition>
  );
}
