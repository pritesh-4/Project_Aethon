import { Link } from 'react-router';
import { Radio, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge.tsx';
import type { CandidateSignal } from '@/types/index.ts';
import { formatFrequency, formatSNR } from '@/lib/utils.ts';

interface SignalCardProps {
  signal: CandidateSignal;
}

export function SignalCard({ signal }: SignalCardProps) {
  const badgeMap: Record<CandidateSignal['priorityRank'], 'rose' | 'amber' | 'cyan' | 'slate'> = {
    critical: 'rose',
    high: 'amber',
    medium: 'cyan',
    low: 'slate',
  };

  const statusLabelMap: Record<
    CandidateSignal['status'],
    { label: string; variant: 'emerald' | 'amber' | 'rose' | 'cyan' | 'slate' }
  > = {
    verified: { label: 'VERIFIED CANDIDATE', variant: 'emerald' },
    candidate: { label: 'TECHNOSIGNATURE CANDIDATE', variant: 'cyan' },
    anomaly: { label: 'SPECTRAL ANOMALY', variant: 'amber' },
    rfi_noise: { label: 'TERRESTRIAL RFI', variant: 'slate' },
    raw: { label: 'RAW TELEMETRY', variant: 'slate' },
  };

  const statusInfo = statusLabelMap[signal.status];

  return (
    <div className="group relative rounded-[2px] border border-slate-800/90 bg-[#040814]/90 p-4 font-mono transition-all hover:border-cyan-800/80 hover:bg-[#070d1e]/80">
      <div className="flex items-start justify-between gap-2 border-b border-slate-900 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-[2px] border border-slate-800 bg-slate-900 text-cyan-400 group-hover:border-cyan-500/50">
            <Radio className="h-3.5 w-3.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200">{signal.id}</span>
              <Badge variant={badgeMap[signal.priorityRank]} className="text-[10px] py-0 px-1.5">
                PRIORITY: {signal.priorityRank.toUpperCase()}
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 font-sans truncate max-w-[220px]">
              {signal.name}
            </p>
          </div>
        </div>

        <Badge variant={statusInfo.variant} className="text-[10px] py-0.5 px-2">
          {statusInfo.label}
        </Badge>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-[10px] uppercase text-slate-400">Frequency</span>
          <p className="text-cyan-400 font-bold">{formatFrequency(signal.frequencyMHz)}</p>
        </div>

        <div>
          <span className="text-[10px] uppercase text-slate-400">SNR</span>
          <p className="text-slate-200 font-bold">{formatSNR(signal.snrDb)}</p>
        </div>

        <div>
          <span className="text-[10px] uppercase text-slate-400">Drift Rate</span>
          <p className="text-slate-300">
            {signal.driftRateHzPerSec > 0
              ? `+${signal.driftRateHzPerSec}`
              : signal.driftRateHzPerSec}{' '}
            Hz/s
          </p>
        </div>

        <div>
          <span className="text-[10px] uppercase text-slate-400">Anomaly Index</span>
          <p className="text-rose-400 font-bold">{(signal.anomalyScore * 100).toFixed(1)}%</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-900 pt-3 text-[11px] text-slate-400">
        <span className="truncate max-w-[190px]">{signal.telescope}</span>

        <Link
          to={`/analysis/${signal.id}`}
          className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <span>Deep Analysis</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
