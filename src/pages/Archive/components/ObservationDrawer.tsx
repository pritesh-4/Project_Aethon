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
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-[#76828D] font-sans bg-[#FAF8F5] border-l border-[#D6D2C9]">
        <Radio className="mb-3 h-5 w-5 text-[#B8B3A8]" />
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
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#9E6E20] bg-[#FDF6E9] px-2 py-0.5 rounded-[2px] border border-[#E8CFA0] font-semibold">
            REVIEW
          </span>
        );
      case 'candidate':
        return (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#376A9B] bg-[#FAF8F5] px-2 py-0.5 rounded-[2px] border border-[#376A9B]/40 font-semibold">
            CANDIDATE
          </span>
        );
      case 'error':
        return (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#B64B4B] bg-[#FDF2F2] px-2 py-0.5 rounded-[2px] border border-[#F5C2C2] font-semibold">
            FAIL
          </span>
        );
      case 'archived':
        return (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#76828D] bg-[#F4F1EA] px-2 py-0.5 rounded-[2px] border border-[#D6D2C9]">
            ARCHIVED
          </span>
        );
      case 'analyzed':
      default:
        return (
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#3D7D54] bg-[#F2F8F4] px-2 py-0.5 rounded-[2px] border border-[#C2E0CC] font-semibold">
            ANALYZED
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF8F5] border-l border-[#D6D2C9] select-none overflow-hidden font-sans">
      {/* 1. Header: Navigation between adjacent observations */}
      <div className="border-b border-[#D6D2C9] bg-[#EAE7E0] p-3 space-y-2">
        {/* Navigation Step Bar */}
        <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-[#56616A] pb-2 border-b border-[#D6D2C9]">
          <button
            type="button"
            onClick={onSelectPrevious}
            disabled={!hasPrevious}
            className={cn(
              'flex items-center gap-1 transition-colors cursor-pointer py-0.5 px-1.5 rounded-[2px] outline-none focus-visible:ring-1 focus-visible:ring-[#376A9B]',
              hasPrevious
                ? 'text-[#56616A] hover:text-[#17202A] hover:bg-[#D6D2C9]/50'
                : 'text-[#B8B3A8] cursor-not-allowed'
            )}
            title="Previous observation"
            aria-label="Previous observation"
          >
            <ChevronLeft className="h-3 w-3" />
            <span>PREV</span>
          </button>

          <span className="text-[#17202A] font-semibold">Specimen Record</span>

          <button
            type="button"
            onClick={onSelectNext}
            disabled={!hasNext}
            className={cn(
              'flex items-center gap-1 transition-colors cursor-pointer py-0.5 px-1.5 rounded-[2px] outline-none focus-visible:ring-1 focus-visible:ring-[#376A9B]',
              hasNext
                ? 'text-[#56616A] hover:text-[#17202A] hover:bg-[#D6D2C9]/50'
                : 'text-[#B8B3A8] cursor-not-allowed'
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
              <h2 className="text-base font-semibold font-mono text-[#17202A]">{observation.id}</h2>
              {renderStatusTag()}
            </div>
            <p className="text-xs text-[#56616A] mt-0.5 truncate max-w-[280px]">
              {observation.targetName}
            </p>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden h-7 w-7 flex items-center justify-center rounded-[2px] border border-[#D6D2C9] bg-[#FAF8F5] text-[#56616A] hover:text-[#17202A] transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#376A9B]"
              title="Close drawer"
              aria-label="Close drawer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Scrollable Detail Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Action Buttons: Directly to Analysis & Candidates */}
        <div className="grid grid-cols-2 gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenAnalysis}
            icon={<ExternalLink className="h-3.5 w-3.5" />}
            className="w-full text-center justify-center text-xs font-semibold"
          >
            Inspect in analysis
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleViewCandidates}
            icon={<ListFilter className="h-3.5 w-3.5" />}
            className="w-full text-center justify-center text-xs font-medium"
          >
            Triage in candidates
          </Button>
        </div>

        {/* Observation Parameters — Ruled Telemetry */}
        <div className="border-t border-b border-[#D6D2C9] py-3 space-y-2.5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#76828D] flex items-center justify-between">
            <span>Context</span>
            <span className="text-[#17202A] font-semibold">{observation.telescope}</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-xs">
            <div>
              <span className="block text-[11px] text-[#76828D] font-mono">Timestamp</span>
              <span className="text-[#17202A] font-mono tabular-nums text-xs font-medium">
                {observation.timestamp}
              </span>
            </div>

            <div>
              <span className="block text-[11px] text-[#76828D] font-mono">Coordinates</span>
              <span className="text-[#17202A] font-mono text-xs">
                {observation.coordinates.ra} · {observation.coordinates.dec}
              </span>
            </div>

            <div>
              <span className="block text-[11px] text-[#76828D] font-mono">Center freq</span>
              <span className="text-[#376A9B] font-mono tabular-nums text-xs font-semibold">
                {observation.frequency.toFixed(4)} MHz
              </span>
            </div>

            <div>
              <span className="block text-[11px] text-[#76828D] font-mono">Duration / pts</span>
              <span className="text-[#17202A] font-mono tabular-nums text-xs font-medium">
                {observation.durationString} ({observation.sampleCount.toLocaleString()})
              </span>
            </div>
          </div>

          {observation.notes && (
            <div className="border-t border-[#D6D2C9] pt-2 text-xs text-[#56616A] leading-relaxed">
              <span className="text-[#17202A] font-mono text-[11px] font-semibold">NOTE:</span>{' '}
              {observation.notes}
            </div>
          )}
        </div>

        {/* Surfaced Candidates Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#76828D] font-semibold">
              Surfaced Candidates ({observation.candidates.length})
            </span>
          </div>
          <CandidateBranchList observationId={observation.id} candidates={observation.candidates} />
        </div>

        {/* Signal Morphology Viewport (Embedded Dark Instrument) */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#76828D] font-semibold">
            Spectrogram Slice
          </div>
          <SignalPreview observation={observation} />
        </div>

        {/* Progressive Disclosure: Candidate Provenance & Specifications */}
        <div className="pt-2 border-t border-[#D6D2C9]">
          <button
            type="button"
            onClick={() => setShowProvenance((prev) => !prev)}
            aria-expanded={showProvenance}
            aria-controls="provenance-section"
            className="flex items-center justify-between w-full text-xs text-[#56616A] hover:text-[#17202A] py-1 transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#376A9B]"
          >
            <span className="text-[11px] font-mono uppercase tracking-wider">
              Provenance & Specifications
            </span>
            <ChevronDown
              className={cn(
                'h-3.5 w-3.5 transition-transform text-[#76828D]',
                showProvenance && 'rotate-180'
              )}
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
