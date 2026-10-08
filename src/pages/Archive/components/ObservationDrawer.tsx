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
      <div className="flex h-full flex-col items-center justify-center p-8 text-center font-mono text-[#7F8B95]">
        <Radio className="mb-3 h-6 w-6 text-slate-600" />
        <span className="text-xs">Select an observation to view record details</span>
      </div>
    );
  }

  // Navigate to analysis of primary candidate or observation
  const handleOpenAnalysis = () => {
    const targetSignal = observation.candidates[0]?.signalId || observation.id;
    navigate(`/analysis/${targetSignal}`);
  };

  // Navigate to candidate triage
  const handleViewCandidates = () => {
    navigate('/candidates');
  };

  const renderStatusBadge = () => {
    switch (observation.status) {
      case 'review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border border-[#E8AE50]/40 bg-[#E8AE50]/10 text-[#E8AE50]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E8AE50]" />
            <span>Under review</span>
          </span>
        );
      case 'candidate':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border border-[#5BD8F5]/30 bg-[#5BD8F5]/10 text-[#5BD8F5]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5BD8F5]" />
            <span>Candidate event</span>
          </span>
        );
      case 'error':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border border-[#D95C5C]/40 bg-[#D95C5C]/10 text-[#D95C5C]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#D95C5C]" />
            <span>Failed</span>
          </span>
        );
      case 'archived':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border border-[#1C2630] bg-[#10161D] text-[#7F8B95]">
            <span className="h-1.5 w-1.5 rounded-full border border-slate-600" />
            <span>Archived</span>
          </span>
        );
      case 'analyzed':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border border-[#1C2630] bg-[#10161D] text-[#7F8B95]">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-600" />
            <span>Analyzed</span>
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0F14] border-l border-[#1C2630] font-mono select-none overflow-hidden">
      {/* 1. Header: Navigation between adjacent observations */}
      <div className="border-b border-[#1C2630] bg-[#06080B] p-3 sm:p-4 space-y-2">
        {/* Navigation Step Bar */}
        <div className="flex items-center justify-between text-[11px] text-[#7F8B95] pb-2 border-b border-[#1C2630]">
          <button
            type="button"
            onClick={onSelectPrevious}
            disabled={!hasPrevious}
            className={cn(
              'flex items-center gap-1 transition-colors cursor-pointer py-1 px-1.5 rounded outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5]',
              hasPrevious
                ? 'text-[#5BD8F5] hover:text-[#5BD8F5]/80'
                : 'text-slate-700 cursor-not-allowed'
            )}
            title="Previous observation"
            aria-label="Previous observation"
          >
            <ChevronLeft className="h-3 w-3" />
            <span>Previous</span>
          </button>

          <span className="text-xs text-[#7F8B95]">Observation record</span>

          <button
            type="button"
            onClick={onSelectNext}
            disabled={!hasNext}
            className={cn(
              'flex items-center gap-1 transition-colors cursor-pointer py-1 px-1.5 rounded outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5]',
              hasNext
                ? 'text-[#5BD8F5] hover:text-[#5BD8F5]/80'
                : 'text-slate-700 cursor-not-allowed'
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
              <h2 className="text-base font-semibold tracking-wider text-[#5BD8F5]">
                {observation.id}
              </h2>
              {renderStatusBadge()}
            </div>
            <p className="text-xs text-[#7F8B95] mt-0.5 truncate max-w-[280px]">
              {observation.targetName}
            </p>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden h-8 w-8 flex items-center justify-center rounded border border-[#1C2630] bg-[#06080B] text-[#7F8B95] hover:text-[#E6EDF2] hover:border-slate-700 transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5]"
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
            Investigate in Analysis
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleViewCandidates}
            icon={<ListFilter className="h-3 w-3" />}
            className="w-full text-center justify-center"
          >
            Triage in Candidates
          </Button>
        </div>

        {/* Observation Parameters (The Physical Record) */}
        <div className="rounded border border-[#1C2630] bg-[#06080B] p-3 space-y-2">
          <div className="text-xs text-[#7F8B95] font-medium border-b border-[#1C2630] pb-1 flex items-center justify-between">
            <span>Observational context</span>
            <span className="text-[#E6EDF2] font-normal">{observation.telescope}</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 text-[11px]">
            <div>
              <span className="block text-[9px] text-[#7F8B95]">Acquisition Date</span>
              <span className="text-[#E6EDF2] font-mono tabular-nums">{observation.timestamp}</span>
            </div>

            <div>
              <span className="block text-[9px] text-[#7F8B95]">Coordinates (RA / Dec)</span>
              <span className="text-[#E6EDF2] font-mono text-[10px]">
                {observation.coordinates.ra} · {observation.coordinates.dec}
              </span>
            </div>

            <div>
              <span className="block text-[9px] text-[#7F8B95]">Center Frequency</span>
              <span className="text-[#5BD8F5] font-mono tabular-nums font-medium">
                {observation.frequency.toFixed(4)} MHz
              </span>
            </div>

            <div>
              <span className="block text-[9px] text-[#7F8B95]">Duration & Samples</span>
              <span className="text-[#E6EDF2] font-mono tabular-nums">
                {observation.durationString} ({observation.sampleCount.toLocaleString()} pts)
              </span>
            </div>
          </div>

          {observation.notes && (
            <div className="border-t border-[#1C2630] pt-2 text-[10px] text-[#7F8B95] leading-relaxed">
              <strong className="text-[#E6EDF2]">Observer Log:</strong> {observation.notes}
            </div>
          )}
        </div>

        {/* Surfaced Candidates Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-[#7F8B95]">
            <span className="font-medium text-xs">
              Surfaced candidates ({observation.candidates.length})
            </span>
          </div>
          <CandidateBranchList observationId={observation.id} candidates={observation.candidates} />
        </div>

        {/* Signal Morphology (Spectrogram recording) */}
        <div className="space-y-1.5">
          <div className="text-xs font-medium text-[#7F8B95]">Signal morphology</div>
          <SignalPreview observation={observation} />
        </div>

        {/* Progressive Disclosure: Candidate Provenance & Specifications */}
        <div className="pt-2 border-t border-[#1C2630]">
          <button
            type="button"
            onClick={() => setShowProvenance((prev) => !prev)}
            aria-expanded={showProvenance}
            aria-controls="provenance-section"
            className="flex items-center justify-between w-full text-xs text-[#7F8B95] hover:text-[#5BD8F5] py-1.5 transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-[#5BD8F5]"
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
