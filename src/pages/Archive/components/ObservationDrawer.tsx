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
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-[#767973] font-sans">
        <Radio className="mb-3 h-5 w-5 text-[#555852]" />
        <span className="text-xs font-mono">
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

  const renderStatusTag = () => {
    switch (observation.status) {
      case 'review':
        return (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#D4864A] bg-[#221B16] px-1.5 py-0.5 rounded-[2px] border border-[#D4864A]/30">
            REVIEW
          </span>
        );
      case 'candidate':
        return (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#E6E4DD] bg-[#1C1F1D] px-1.5 py-0.5 rounded-[2px] border border-[#242825]">
            CANDIDATE
          </span>
        );
      case 'error':
        return (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#C84A4A] bg-[#241414] px-1.5 py-0.5 rounded-[2px] border border-[#C84A4A]/30">
            FAIL
          </span>
        );
      case 'archived':
        return (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#767973] bg-[#121413] px-1.5 py-0.5 rounded-[2px] border border-[#242825]">
            ARCHIVED
          </span>
        );
      case 'analyzed':
      default:
        return (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#848780] bg-[#141F18] px-1.5 py-0.5 rounded-[2px] border border-[#529E72]/30">
            ANALYZED
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#101211] border-l border-[#242825] select-none overflow-hidden font-sans">
      {/* 1. Header: Navigation between adjacent observations */}
      <div className="border-b border-[#242825] bg-[#0C0E0D] p-3 space-y-2">
        {/* Navigation Step Bar */}
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#767973] pb-2 border-b border-[#242825]">
          <button
            type="button"
            onClick={onSelectPrevious}
            disabled={!hasPrevious}
            className={cn(
              'flex items-center gap-1 transition-colors cursor-pointer py-0.5 px-1 rounded-[2px] outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A]',
              hasPrevious
                ? 'text-[#9A9C96] hover:text-[#E6E4DD]'
                : 'text-[#444741] cursor-not-allowed'
            )}
            title="Previous observation"
            aria-label="Previous observation"
          >
            <ChevronLeft className="h-3 w-3" />
            <span>PREV</span>
          </button>

          <span className="text-[#848780]">Specimen Record</span>

          <button
            type="button"
            onClick={onSelectNext}
            disabled={!hasNext}
            className={cn(
              'flex items-center gap-1 transition-colors cursor-pointer py-0.5 px-1 rounded-[2px] outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A]',
              hasNext ? 'text-[#9A9C96] hover:text-[#E6E4DD]' : 'text-[#444741] cursor-not-allowed'
            )}
            title="Next observation"
            aria-label="Next observation"
          >
            <span>NEXT</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {/* Observation ID & Target Header */}
        <div className="flex items-start justify-between gap-3 pt-0.5">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold font-mono text-[#E6E4DD]">{observation.id}</h2>
              {renderStatusTag()}
            </div>
            <p className="text-xs text-[#848780] mt-0.5 truncate max-w-[280px]">
              {observation.targetName}
            </p>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden h-7 w-7 flex items-center justify-center rounded-[2px] border border-[#242825] bg-[#141715] text-[#9A9C96] hover:text-[#E6E4DD] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A]"
              title="Close drawer"
              aria-label="Close drawer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Scrollable Detail Body */}
      <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
        {/* Action Buttons: Directly to Analysis & Candidates */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAnalysis}
            icon={<ExternalLink className="h-3 w-3" />}
            className="w-full text-center justify-center text-xs"
          >
            Inspect in analysis
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleViewCandidates}
            icon={<ListFilter className="h-3 w-3" />}
            className="w-full text-center justify-center text-xs"
          >
            Triage in candidates
          </Button>
        </div>

        {/* Observation Parameters — Ruled Telemetry */}
        <div className="border-t border-b border-[#242825] py-2.5 space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#767973] flex items-center justify-between">
            <span>Context</span>
            <span className="text-[#C9C8C0] font-normal">{observation.telescope}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="block text-[10px] text-[#666963] font-mono">Timestamp</span>
              <span className="text-[#E6E4DD] font-mono tabular-nums text-[11px]">
                {observation.timestamp}
              </span>
            </div>

            <div>
              <span className="block text-[10px] text-[#666963] font-mono">Coordinates</span>
              <span className="text-[#C9C8C0] font-mono text-[11px]">
                {observation.coordinates.ra} · {observation.coordinates.dec}
              </span>
            </div>

            <div>
              <span className="block text-[10px] text-[#666963] font-mono">Center freq</span>
              <span className="text-[#D4864A] font-mono tabular-nums text-[11px] font-medium">
                {observation.frequency.toFixed(4)} MHz
              </span>
            </div>

            <div>
              <span className="block text-[10px] text-[#666963] font-mono">Duration / pts</span>
              <span className="text-[#E6E4DD] font-mono tabular-nums text-[11px]">
                {observation.durationString} ({observation.sampleCount.toLocaleString()})
              </span>
            </div>
          </div>

          {observation.notes && (
            <div className="border-t border-[#1F2321] pt-1.5 text-xs text-[#848780] leading-relaxed">
              <span className="text-[#A0A29C] font-mono text-[11px]">NOTE:</span>{' '}
              {observation.notes}
            </div>
          )}
        </div>

        {/* Surfaced Candidates Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#767973]">
              Surfaced Candidates ({observation.candidates.length})
            </span>
          </div>
          <CandidateBranchList observationId={observation.id} candidates={observation.candidates} />
        </div>

        {/* Signal Morphology */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-mono uppercase tracking-wider text-[#767973]">
            Spectrogram Slice
          </div>
          <SignalPreview observation={observation} />
        </div>

        {/* Progressive Disclosure: Candidate Provenance & Specifications */}
        <div className="pt-2 border-t border-[#242825]">
          <button
            type="button"
            onClick={() => setShowProvenance((prev) => !prev)}
            aria-expanded={showProvenance}
            aria-controls="provenance-section"
            className="flex items-center justify-between w-full text-xs text-[#848780] hover:text-[#E6E4DD] py-1 transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#D4864A]"
          >
            <span className="text-[11px] font-mono uppercase tracking-wider">
              Provenance & Specifications
            </span>
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
