import { Link } from 'react-router';
import { motion } from 'motion/react';
import type { CandidateSignalData } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import { CandidateSignalPreview } from './CandidateSignalPreview.tsx';
import { AnomalyScale } from './AnomalyScale.tsx';
import { CandidateEvidence } from './CandidateEvidence.tsx';
import { SignalMorphologyComparison } from './SignalMorphologyComparison.tsx';
import { RepresentationSpace } from './RepresentationSpace.tsx';
import { CandidateMetadata } from './CandidateMetadata.tsx';
import { X, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';

export interface CandidateDrawerProps {
  candidate: CandidateSignalData;
  onClose: () => void;
}

export function CandidateDrawer({ candidate, onClose }: CandidateDrawerProps) {
  const isHigh = candidate.priority === 'HIGH';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="relative flex flex-col h-full rounded-[2px] border border-cyan-800/80 bg-[#080D1A]/95 backdrop-blur-md font-mono select-none overflow-hidden shadow-2xl"
    >
      {/* Corner Technical Accents */}
      <span className="pointer-events-none absolute -left-[1px] -top-[1px] h-2 w-2 border-l border-t border-[#66E3FF]" />
      <span className="pointer-events-none absolute -right-[1px] -top-[1px] h-2 w-2 border-r border-t border-[#66E3FF]" />

      {/* 1. Drawer Header */}
      <div className="flex items-start justify-between border-b border-slate-800/80 bg-[#0A0E13] p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-[#84929C] uppercase tracking-wider">
              CANDIDATE EVENT //
            </span>
            <span
              className={`rounded-[1px] px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider ${
                isHigh
                  ? 'border border-amber-500/80 bg-amber-950/60 text-[#FFB84D]'
                  : 'border border-cyan-800/80 bg-cyan-950/60 text-[#66E3FF]'
              }`}
            >
              INVESTIGATION PRIORITY: {candidate.priority}
            </span>
          </div>

          <div className="flex items-baseline gap-2.5">
            <h3 className="text-xl font-bold text-[#EAF4F7] tracking-wider">{candidate.id}</h3>
            <span className="text-xs text-slate-400 font-sans">{candidate.targetName}</span>
          </div>

          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-[#66E3FF] font-semibold tracking-wider uppercase">
              UNCLASSIFIED PATTERN
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-400">f: {candidate.frequencyMHz.toFixed(4)} MHz</span>
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close candidate workspace"
          className="rounded-[2px] border border-slate-800 bg-slate-900/80 p-1.5 text-slate-400 hover:border-slate-700 hover:text-slate-200 transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 2. Automated vs Human Screening Subsystem Strip */}
      <div className="flex items-center justify-between border-b border-slate-800/70 bg-[#05070A] px-4 py-2 text-[10px] text-[#84929C]">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <CheckCircle2 className="h-3 w-3" />
          <span>AUTOMATED SCREENING: COMPLETE</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="h-3 w-3 text-cyan-400" />
          <span>HUMAN REVIEW: PENDING</span>
        </div>
      </div>

      {/* 3. Scrollable Scientific Workspace Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(100vh-280px)]">
        {/* Signal Spectrogram Preview */}
        <CandidateSignalPreview candidate={candidate} />

        {/* Anomaly Scale */}
        <AnomalyScale score={candidate.anomalyIndex} priority={candidate.priority} />

        {/* Measurable Scientific Evidence Factors */}
        <CandidateEvidence candidate={candidate} />

        {/* Signal Morphology Comparison */}
        <SignalMorphologyComparison candidate={candidate} />

        {/* Latent-Space Manifold View */}
        <RepresentationSpace candidate={candidate} />

        {/* Candidate Profile Metadata */}
        <CandidateMetadata candidate={candidate} />
      </div>

      {/* 4. Drawer Footer Actions & Disclaimer */}
      <div className="border-t border-slate-800/80 bg-[#0A0E13] p-4 space-y-3">
        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            CLOSE PREVIEW
          </Button>

          <Link to={`/analysis/${candidate.id}`}>
            <Button
              variant="primary"
              size="md"
              withArrow
              cornerAccents
              className="shadow-[0_0_14px_rgba(102,227,255,0.25)]"
            >
              INVESTIGATE CANDIDATE →
            </Button>
          </Link>
        </div>

        {/* Scientific Disclaimer Note */}
        <div className="border-t border-slate-800/60 pt-2 flex items-start gap-1.5 text-[9px] text-[#84929C] leading-tight">
          <ShieldAlert className="h-3 w-3 text-amber-500/80 shrink-0 mt-0.5" />
          <span>
            <strong className="text-slate-300">ANOMALY ≠ DISCOVERY:</strong> Candidate events
            represent observations that deviate from learned or expected signal patterns and require
            independent scientific verification.
          </span>
        </div>
      </div>
    </motion.div>
  );
}
