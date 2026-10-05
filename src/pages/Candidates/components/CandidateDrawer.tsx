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
      className="relative flex flex-col h-full rounded border border-[#1C2630] bg-[#0B0F14] select-none overflow-hidden shadow-xl"
    >
      {/* 1. Drawer Header */}
      <div className="flex items-start justify-between border-b border-[#1C2630] bg-[#0B0F14] p-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                isHigh
                  ? 'border border-[#E8AE50]/40 bg-[#E8AE50]/10 text-[#E8AE50]'
                  : 'border border-[#7F8B95]/40 bg-[#7F8B95]/10 text-[#7F8B95]'
              }`}
            >
              Priority: {candidate.priority.toLowerCase()}
            </span>
          </div>

          <div className="flex items-baseline gap-2.5">
            <h3 className="text-lg font-semibold text-[#E6EDF2] font-mono">{candidate.id}</h3>
            <span className="text-xs text-[#7F8B95]">{candidate.targetName}</span>
          </div>

          <div className="flex items-center gap-2 text-xs text-[#7F8B95]">
            <span className="text-[#5BD8F5] font-medium">Unclassified candidate</span>
            <span>•</span>
            <span className="font-mono">f: {candidate.frequencyMHz.toFixed(4)} MHz</span>
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close candidate workspace"
          className="rounded border border-[#1C2630] bg-[#10161D] p-1.5 text-[#7F8B95] hover:border-[#5BD8F5]/40 hover:text-[#E6EDF2] transition-colors cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 2. Screening Subsystem Strip */}
      <div className="flex items-center justify-between border-b border-[#1C2630] bg-[#06080B] px-4 py-2 text-xs text-[#7F8B95]">
        <div className="flex items-center gap-1.5 text-[#5BD8F5]">
          <CheckCircle2 className="h-3.5 w-3.5" />
          <span>Automated screening complete</span>
        </div>
        <div className="flex items-center gap-1.5 text-[#7F8B95]">
          <Clock className="h-3.5 w-3.5 text-[#7F8B95]" />
          <span>Human review pending</span>
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
      <div className="border-t border-[#1C2630] bg-[#0B0F14] p-4 space-y-3">
        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>

          <Link to={`/analysis/${candidate.id}`}>
            <Button variant="primary" size="md" withArrow>
              Inspect candidate
            </Button>
          </Link>
        </div>

        {/* Scientific Disclaimer Note */}
        <div className="border-t border-[#1C2630] pt-2 flex items-start gap-1.5 text-[11px] text-[#7F8B95] leading-tight">
          <ShieldAlert className="h-3.5 w-3.5 text-[#E8AE50] shrink-0 mt-0.5" />
          <span>
            Candidate events represent observations that deviate from learned distributions and
            require independent scientific verification.
          </span>
        </div>
      </div>
    </motion.div>
  );
}
