import { useNavigate } from 'react-router';
import { ChevronLeft, ChevronRight, X, ExternalLink, Crosshair, Radio } from 'lucide-react';
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

  if (!observation) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center font-mono text-slate-500">
        <Radio className="mb-3 h-8 w-8 text-slate-600 animate-pulse" />
        <span className="text-xs uppercase tracking-wider">SELECT AN OBSERVATION SPECIMEN</span>
      </div>
    );
  }

  // Handle open observation
  const handleOpenObservation = () => {
    // If top candidate exists, navigate to analysis of that candidate or base observation
    const targetSignal = observation.candidates[0]?.signalId || observation.id;
    navigate(`/analysis/${targetSignal}`);
  };

  // Handle view candidates
  const handleViewCandidates = () => {
    navigate('/candidates');
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0E13] border-l border-slate-800/80 font-mono select-none overflow-hidden">
      {/* 1. Header: Navigation between adjacent observations */}
      <div className="border-b border-slate-800/80 bg-[#05070A] p-3 sm:p-4">
        {/* Adjacent Navigation Bar */}
        <div className="flex items-center justify-between text-[10px] text-[#84929C] mb-2 pb-2 border-b border-slate-900">
          <button
            type="button"
            onClick={onSelectPrevious}
            disabled={!hasPrevious}
            className={cn(
              'flex items-center gap-1 transition-colors cursor-pointer',
              hasPrevious
                ? 'text-cyan-400 hover:text-cyan-300'
                : 'text-slate-700 cursor-not-allowed'
            )}
            title="Previous observation"
          >
            <ChevronLeft className="h-3 w-3" />
            <span className="hidden sm:inline">PREVIOUS</span>
          </button>

          <span className="text-slate-500 font-semibold tracking-wider text-[9px]">
            OBSERVATION REGISTRY
          </span>

          <button
            type="button"
            onClick={onSelectNext}
            disabled={!hasNext}
            className={cn(
              'flex items-center gap-1 transition-colors cursor-pointer',
              hasNext ? 'text-cyan-400 hover:text-cyan-300' : 'text-slate-700 cursor-not-allowed'
            )}
            title="Next observation"
          >
            <span className="hidden sm:inline">NEXT</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {/* Observation Title & Close Button */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-slate-500">
              OBSERVATION DETAIL
            </div>
            <div className="text-lg font-bold tracking-wider text-[#66E3FF] flex items-center gap-2">
              <span>{observation.id}</span>
              <span className="text-xs text-slate-600 font-normal">//</span>
              <span className="text-xs text-[#EAF4F7] font-semibold truncate max-w-[170px]">
                {observation.targetName}
              </span>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden h-6 w-6 flex items-center justify-center rounded-[2px] border border-slate-800 bg-[#05070A] text-slate-400 hover:text-[#EAF4F7] hover:border-slate-700 transition-colors"
              title="Close drawer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Scrollable Body: Acquisition, Analysis, Mini Spectrogram, Candidates, Provenance */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* ACQUISITION Section */}
        <div className="rounded-[2px] border border-slate-800/80 bg-[#05070A] p-3 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-800/60 pb-1 flex items-center justify-between">
            <span>ACQUISITION</span>
            <span className="text-[#84929C] font-normal">{observation.telescope}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[10px]">
            <div>
              <span className="block text-[8px] uppercase tracking-wider text-slate-500">
                ACQUISITION TIME
              </span>
              <span className="text-[#EAF4F7] font-mono tabular-nums">{observation.timestamp}</span>
            </div>

            <div>
              <span className="block text-[8px] uppercase tracking-wider text-slate-500">
                COORDINATES (EQUATORIAL)
              </span>
              <span className="text-slate-300 font-mono text-[9px]">
                {observation.coordinates.ra}
                <br />
                {observation.coordinates.dec}
              </span>
            </div>

            <div>
              <span className="block text-[8px] uppercase tracking-wider text-slate-500">
                FREQUENCY
              </span>
              <span className="text-[#66E3FF] font-mono tabular-nums font-semibold">
                {observation.frequency.toFixed(4)} MHz
              </span>
            </div>

            <div>
              <span className="block text-[8px] uppercase tracking-wider text-slate-500">
                DURATION
              </span>
              <span className="text-[#EAF4F7] font-mono tabular-nums">
                {observation.durationString}
              </span>
            </div>
          </div>
        </div>

        {/* ANALYSIS Section */}
        <div className="rounded-[2px] border border-slate-800/80 bg-[#05070A] p-3 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-800/60 pb-1 flex items-center justify-between">
            <span>ANALYSIS</span>
            <span
              className={cn(
                'text-[9px] font-semibold px-1 py-0.2 rounded-[1px] border',
                observation.status === 'review'
                  ? 'border-[#FFB84D]/40 bg-[#FFB84D]/10 text-[#FFB84D]'
                  : observation.status === 'candidate'
                    ? 'border-[#66E3FF]/40 bg-[#66E3FF]/10 text-[#66E3FF]'
                    : observation.status === 'error'
                      ? 'border-[#FF5E5E]/40 bg-[#FF5E5E]/10 text-[#FF5E5E]'
                      : 'border-slate-800 text-slate-400'
              )}
            >
              {observation.status.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div>
              <span className="block text-[8px] uppercase tracking-wider text-slate-500">
                ANOMALY INDEX
              </span>
              <span className="text-lg font-bold text-[#66E3FF] tabular-nums font-mono">
                {observation.anomalyIndex.toFixed(3)}
              </span>
            </div>

            <div>
              <span className="block text-[8px] uppercase tracking-wider text-slate-500">
                ANOMALOUS REGIONS
              </span>
              <span
                className={cn(
                  'text-lg font-bold tabular-nums font-mono',
                  observation.anomalousRegions > 0 ? 'text-[#FFB84D]' : 'text-slate-400'
                )}
              >
                {observation.anomalousRegions}
              </span>
            </div>

            <div>
              <span className="block text-[8px] uppercase tracking-wider text-slate-500">
                HIGH-PRIORITY
              </span>
              <span className="text-lg font-bold text-[#FFB84D] tabular-nums font-mono">
                {observation.highPriorityCandidates}
              </span>
            </div>
          </div>

          {observation.notes && (
            <p className="text-[9px] text-[#84929C] border-t border-slate-800/40 pt-2 leading-relaxed italic">
              "{observation.notes}"
            </p>
          )}
        </div>

        {/* ACTION BUTTONS: [ OPEN OBSERVATION ] & [ VIEW CANDIDATES ] */}
        <div className="grid grid-cols-2 gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenObservation}
            icon={<ExternalLink className="h-3 w-3" />}
            className="w-full text-center justify-center"
          >
            OPEN OBSERVATION
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleViewCandidates}
            icon={<Crosshair className="h-3 w-3" />}
            className="w-full text-center justify-center"
          >
            VIEW CANDIDATES
          </Button>
        </div>

        {/* 3. MINI SIGNAL PREVIEW */}
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>SIGNAL MORPHOLOGY</span>
            <span className="text-[9px] text-slate-600">// ACTIVE SPECIMEN ONLY</span>
          </div>
          <SignalPreview observation={observation} />
        </div>

        {/* 4. CANDIDATE RELATIONSHIP TREE */}
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>CANDIDATE HIERARCHY</span>
            <span className="text-[9px] text-slate-600">// CLICK TO INVESTIGATE</span>
          </div>
          <CandidateBranchList observationId={observation.id} candidates={observation.candidates} />
        </div>

        {/* 5. TECHNICAL METADATA SPECIFICATION */}
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">
            TECHNICAL SPECIFICATIONS
          </div>
          <ObservationMetadata observation={observation} />
        </div>

        {/* 6. MODEL VERSIONING & PROVENANCE */}
        <div className="space-y-1.5 pb-2">
          <div className="text-[10px] uppercase tracking-wider text-slate-500">
            ANALYTICAL PROVENANCE
          </div>
          <ObservationProvenance observation={observation} />
        </div>
      </div>
    </div>
  );
}
