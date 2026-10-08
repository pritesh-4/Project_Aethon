import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  ExternalLink,
  ListFilter,
  Radio,
} from 'lucide-react';
import type { ArchivedObservation } from '../types.ts';
import { Button } from '@/components/ui/Button.tsx';
import { SignalPreview } from './SignalPreview.tsx';
import { CandidateBranchList } from './CandidateBranchList.tsx';
import { ObservationMetadata } from './ObservationMetadata.tsx';
import { ObservationProvenance } from './ObservationProvenance.tsx';
import { Badge } from '@/components/ui/Badge.tsx';
import { cn } from '@/lib/utils.ts';

export interface ObservationDrawerProps {
  observation: ArchivedObservation | null;
  onClose?: () => void;
  onSelectPrevious?: () => void;
  onSelectNext?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export function ObservationDrawer({
  observation,
  onClose,
  onSelectPrevious,
  onSelectNext,
  hasPrevious = false,
  hasNext = false,
}: ObservationDrawerProps) {
  const navigate = useNavigate();
  const [showProvenance, setShowProvenance] = useState(false);

  if (!observation) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-[#9A9C96]">
        <Radio className="mb-3 h-6 w-6 text-[#666963]" />
        <span className="text-xs">
          Select an observation from the ledger to inspect specimen record
        </span>
      </div>
    );
  }

  const handleOpenAnalysis = () => {
    const targetSignal = observation.candidates[0]?.signalId || observation.id;
    navigate(`/analysis/${targetSignal}`);
  };

  const handleViewCandidates = () => {
    navigate('/candidates');
  };

  const renderStatusBadge = () => {
    switch (observation.status) {
      case 'review':
        return <Badge variant="copper">Under review</Badge>;
      case 'candidate':
        return <Badge variant="copper">Candidate event</Badge>;
      case 'error':
        return <Badge variant="rose">Failed</Badge>;
      case 'archived':
        return <Badge variant="neutral">Archived</Badge>;
      case 'analyzed':
      default:
        return <Badge variant="slate">Analyzed</Badge>;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#141715] border-l border-[#242825] select-none overflow-hidden">
      {/* 1. Header: Navigation between adjacent observations */}
      <div className="border-b border-[#242825] bg-[#101211] p-3 sm:p-4 space-y-2">
        {/* Navigation Step Bar */}
        <div className="flex items-center justify-between text-[11px] text-[#9A9C96] pb-2 border-b border-[#242825]">
          <button
            type="button"
            onClick={onSelectPrevious}
            disabled={!hasPrevious}
            className={cn(
              'flex items-center gap-1 transition-colors cursor-pointer py-1 px-1.5 rounded-[2px] outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A]',
              hasPrevious
                ? 'text-[#9A9C96] hover:text-[#E6E4DD]'
                : 'text-[#666963]/50 cursor-not-allowed'
            )}
            title="Previous observation"
            aria-label="Previous observation"
          >
            <ChevronLeft className="h-3 w-3" />
            <span>Previous</span>
          </button>

          <span className="text-xs text-[#9A9C96]">Observation specimen record</span>

          <button
            type="button"
            onClick={onSelectNext}
            disabled={!hasNext}
            className={cn(
              'flex items-center gap-1 transition-colors cursor-pointer py-1 px-1.5 rounded-[2px] outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A]',
              hasNext
                ? 'text-[#9A9C96] hover:text-[#E6E4DD]'
                : 'text-[#666963]/50 cursor-not-allowed'
            )}
            title="Next observation"
            aria-label="Next observation"
          >
            <span>Next</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {/* Observation ID & Target Header */}
        <div className="flex items-start justify-between gap-3 pt-1">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-medium font-mono text-[#E6E4DD]">{observation.id}</h2>
              {renderStatusBadge()}
            </div>
            <p className="text-xs text-[#9A9C96] mt-0.5 truncate max-w-[280px]">
              {observation.targetName}
            </p>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden h-8 w-8 flex items-center justify-center rounded-[2px] border border-[#242825] bg-[#1A1E1B] text-[#9A9C96] hover:text-[#E6E4DD] hover:border-[#D4864A]/50 transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A]"
              title="Close drawer"
              aria-label="Close drawer"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Scrollable Detail Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Action Buttons: Directly to Analysis & Candidates */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAnalysis}
            icon={<ExternalLink className="h-3 w-3" />}
            className="w-full text-center justify-center"
          >
            Investigate in analysis
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleViewCandidates}
            icon={<ListFilter className="h-3 w-3" />}
            className="w-full text-center justify-center"
          >
            Triage in candidates
          </Button>
        </div>

        {/* Observation Parameters */}
        <div className="rounded-[2px] border border-[#242825] bg-[#101211] p-3 space-y-2">
          <div className="text-xs text-[#9A9C96] font-medium border-b border-[#242825] pb-1.5 flex items-center justify-between">
            <span>Observational context</span>
            <span className="text-[#E6E4DD] font-normal">{observation.telescope}</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div>
              <span className="block text-[10px] text-[#666963]">Acquisition timestamp</span>
              <span className="text-[#E6E4DD] font-mono tabular-nums">{observation.timestamp}</span>
            </div>

            <div>
              <span className="block text-[10px] text-[#666963]">Coordinates (RA / Dec)</span>
              <span className="text-[#C9C8C0] font-mono text-[11px]">
                {observation.coordinates.ra} · {observation.coordinates.dec}
              </span>
            </div>

            <div>
              <span className="block text-[10px] text-[#666963]">Center frequency</span>
              <span className="text-[#D4864A] font-mono tabular-nums font-medium">
                {observation.frequency.toFixed(4)} MHz
              </span>
            </div>

            <div>
              <span className="block text-[10px] text-[#666963]">Duration & samples</span>
              <span className="text-[#E6E4DD] font-mono tabular-nums">
                {observation.durationString} ({observation.sampleCount.toLocaleString()} pts)
              </span>
            </div>
          </div>

          {observation.notes && (
            <div className="border-t border-[#242825] pt-2 text-xs text-[#9A9C96] leading-relaxed">
              <span className="text-[#E6E4DD] font-medium">Log note:</span> {observation.notes}
            </div>
          )}
        </div>

        {/* Surfaced Candidates Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-[#9A9C96]">
            <span className="font-medium text-[#E6E4DD]">
              Surfaced candidates ({observation.candidates.length})
            </span>
          </div>
          <CandidateBranchList observationId={observation.id} candidates={observation.candidates} />
        </div>

        {/* Signal Morphology */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-[#E6E4DD]">Spectrogram slice</div>
          <SignalPreview observation={observation} />
        </div>

        {/* Progressive Disclosure: Candidate Provenance & Specifications */}
        <div className="pt-2 border-t border-[#242825]">
          <button
            type="button"
            onClick={() => setShowProvenance((prev) => !prev)}
            aria-expanded={showProvenance}
            aria-controls="provenance-section"
            className="flex items-center justify-between w-full text-xs text-[#9A9C96] hover:text-[#E6E4DD] py-1.5 transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A]"
          >
            <span>Ingestion & analysis provenance</span>
            <ChevronDown
              className={cn('h-3.5 w-3.5 transition-transform', showProvenance && 'rotate-180')}
            />
          </button>

          {showProvenance && (
            <div
              id="provenance-section"
              className="space-y-3 pt-2 pb-1 animate-in fade-in duration-200"
            >
              <ObservationProvenance observation={observation} />
              <ObservationMetadata observation={observation} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
