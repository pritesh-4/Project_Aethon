import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader.tsx'
import { PageTransition } from '@/components/ui/motion.tsx'
import { StatMetric } from '@/components/ui/StatMetric.tsx'
import { Badge } from '@/components/ui/Badge.tsx'
import { Button } from '@/components/ui/Button.tsx'
import { SpectrumChart } from '@/components/visualization/SpectrumChart.tsx'
import { DriftRateChart } from '@/components/visualization/DriftRateChart.tsx'
import { SignalCard } from '@/features/signals/SignalCard.tsx'
import { SAMPLE_CANDIDATES } from '@/features/signals/sample-data.ts'
import { Radio, RefreshCw, Compass, Play, Pause } from 'lucide-react'
import { toast } from 'sonner'

export default function ObservatoryPage() {
  const [isStreaming, setIsStreaming] = useState(true)
  const [selectedTelescope, setSelectedTelescope] = useState('Green Bank Telescope (100m)')
  const [selectedBand, setSelectedBand] = useState('L-Band (1.42 GHz)')

  const toggleStream = () => {
    setIsStreaming(!isStreaming)
    toast(isStreaming ? 'Observatory telemetry paused' : 'Live stream re-synchronized', {
      description: isStreaming ? 'Buffer holds last 60 seconds of I/Q data' : 'Connecting to GBT backend stream',
    })
  }

  const triggerCalibration = () => {
    toast.success('Receiver Noise Calibration Complete', {
      description: 'System Temperature: 18.4 K. Baseline SNR normalized.',
    })
  }

  return (
    <PageTransition className="space-y-6">
      <PageHeader
        category="OBSERVATORY TELEMETRY SYSTEM"
        title="Main Observation Console"
        subtitle="Real-time multi-channel astronomical radio receiver telemetry, Doppler tracking, and candidate signal isolation pipeline."
        badge={
          <Badge variant={isStreaming ? 'emerald' : 'amber'}>
            {isStreaming ? 'STREAM: ONLINE' : 'STREAM: PAUSED'}
          </Badge>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={isStreaming ? 'secondary' : 'primary'}
              size="sm"
              icon={isStreaming ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              onClick={toggleStream}
            >
              {isStreaming ? 'Pause Stream' : 'Resume Stream'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={<RefreshCw className="h-3.5 w-3.5" />}
              onClick={triggerCalibration}
            >
              Calibrate Receiver
            </Button>
          </div>
        }
      />

      {/* Instrumentation Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950/80 p-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">TELESCOPE:</span>
            <select
              value={selectedTelescope}
              onChange={(e) => setSelectedTelescope(e.target.value)}
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="Green Bank Telescope (100m)">Green Bank Telescope (100m)</option>
              <option value="MeerKAT Radio Array (64-Dish)">MeerKAT Radio Array (64-Dish)</option>
              <option value="Parkes Radio Telescope (Murriyang)">Parkes Radio Telescope (Murriyang)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400">BAND:</span>
            <select
              value={selectedBand}
              onChange={(e) => setSelectedBand(e.target.value)}
              className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              <option value="L-Band (1.42 GHz)">L-Band (1.42 GHz HI Line)</option>
              <option value="S-Band (2.3 GHz)">S-Band (2.3 GHz Deep Space)</option>
              <option value="C-Band (4.8 GHz)">C-Band (4.8 GHz Methanol Maser)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-400">
          <span>SYS TEMP: <strong className="text-cyan-400">18.4 K</strong></span>
          <span>ELEV: <strong className="text-slate-200">54.2°</strong></span>
          <span>AZ: <strong className="text-slate-200">182.1°</strong></span>
        </div>
      </div>

      {/* Top Status Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatMetric
          label="Target"
          value="Proxima Cen"
          subtext="RA: 14h 29m / DEC: -62° 40′"
          icon={<Compass className="h-4 w-4" />}
          status="nominal"
        />
        <StatMetric
          label="Center Frequency"
          value="1420.405"
          unit="MHz"
          subtext="Rest frame HI line"
          status="active"
        />
        <StatMetric
          label="Peak SNR"
          value="+24.8"
          unit="dB"
          subtext="Candidate SIG-2026-089A"
          status="alert"
        />
        <StatMetric
          label="Doppler Drift"
          value="-0.32"
          unit="Hz/s"
          subtext="Consistent with non-terrestrial"
          status="warning"
        />
      </div>

      {/* Main Dual Spectrum & Drift Visualizers */}
      <div className="grid lg:grid-cols-2 gap-4">
        <SpectrumChart
          height={260}
          highlightMarkerMHz={1420.4057}
          markerLabel="SIG-2026-089A (+24.8 dB)"
        />
        <DriftRateChart height={260} driftRateHzPerSec={-0.32} />
      </div>

      {/* Live Candidates Ingestion Stream */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-slate-900 pb-2">
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-cyan-400" />
            <h2 className="text-base font-bold text-slate-200 font-sans">
              High-Confidence Candidate Signals Ingested
            </h2>
          </div>
          <span className="font-mono text-xs text-slate-400">
            {SAMPLE_CANDIDATES.length} candidates isolated in current observation window
          </span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {SAMPLE_CANDIDATES.map((candidate) => (
            <SignalCard key={candidate.id} signal={candidate} />
          ))}
        </div>
      </div>
    </PageTransition>
  )
}
