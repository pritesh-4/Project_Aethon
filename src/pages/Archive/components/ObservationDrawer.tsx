import { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  ExternalLink,
  Crosshair,
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
  const [showSpecs, setShowSpecs] = useState(false);

  if (!observation) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center font-mono text-slate-500">
        <Radio className="mb-3 h-8 w-8 text-slate-600" />
        <span className="text-xs">Select an observation to view details</span>
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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'review':
        return 'Under review';
      case 'candidate':
        return 'Candidate';
      case 'error':
        return 'Failed';
      case 'archived':
        return 'Archived';
      case 'analyzed':
      default:
        return 'Analyzed';
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0B0F14] border-l border-[#1C2630] font-mono select-none overflow-hidden">
      {/* 1. Header: Navigation between adjacent observations */}
      <div className="border-b border-[#1C2630] bg-[#06080B] p-3 sm:p-4">
        {/* Adjacent Navigation Bar */}
        <div className="flex items-center justify-between text-[10px] text-[#7F8B95] mb-2 pb-2 border-b border-[#1C2630]">
          <button
            type="button"
            onClick={onSelectPrevious}
            disabled={!hasPrevious}
            className={cn(
              'flex items-center gap-1 transition-colors cursor-pointer',
              hasPrevious
                ? 'text-[#5BD8F5] hover:text-[#5BD8F5]/80'
                : 'text-slate-700 cursor-not-allowed'
            )}
            title="Previous observation"
          >
            <ChevronLeft className="h-3 w-3" />
            <span className="hidden sm:inline">Previous</span>
          </button>

          <span className="text-slate-500 font-medium text-[9px]">Observation registry</span>

          <button
            type="button"
            onClick={onSelectNext}
            disabled={!hasNext}
            className={cn(
              'flex items-center gap-1 transition-colors cursor-pointer',
              hasNext
                ? 'text-[#5BD8F5] hover:text-[#5BD8F5]/80'
                : 'text-slate-700 cursor-not-allowed'
            )}
            title="Next observation"
          >
            <span className="hidden sm:inline">Next</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>

        {/* Observation Title & Close Button */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-[10px] text-slate-500">Observation detail</div>
            <div className="text-lg font-semibold tracking-wider text-[#5BD8F5] flex items-center gap-2">
              <span>{observation.id}</span>
              <span className="text-xs text-slate-600 font-normal">·</span>
              <span className="text-xs text-[#E6EDF2] font-medium truncate max-w-[170px]">
                {observation.targetName}
              </span>
            </div>
          </div>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="lg:hidden h-6 w-6 flex items-center justify-center rounded-[2px] border border-[#1C2630] bg-[#06080B] text-slate-400 hover:text-[#E6EDF2] hover:border-slate-700 transition-colors"
              title="Close drawer"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Acquisition Section */}
        <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-3 space-y-2">
          <div className="text-[10px] text-slate-500 font-semibold border-b border-[#1C2630] pb-1 flex items-center justify-between">
            <span>Acquisition</span>
            <span className="text-[#7F8B95] font-normal">{observation.telescope}</span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-[10px]">
            <div>
              <span className="block text-[8px] text-slate-500">Acquisition time</span>
              <span className="text-[#E6EDF2] font-mono tabular-nums">{observation.timestamp}</span>
            </div>

            <div>
              <span className="block text-[8px] text-slate-500">Coordinates (Equatorial)</span>
              <span className="text-slate-300 font-mono text-[9px]">
                {observation.coordinates.ra}
                <br />
                {observation.coordinates.dec}
              </span>
            </div>

            <div>
              <span className="block text-[8px] text-slate-500">Frequency</span>
              <span className="text-[#5BD8F5] font-mono tabular-nums font-semibold">
                {observation.frequency.toFixed(4)} MHz
              </span>
            </div>

            <div>
              <span className="block text-[8px] text-slate-500">Duration</span>
              <span className="text-[#E6EDF2] font-mono tabular-nums">
                {observation.durationString}
              </span>
            </div>
          </div>
        </div>

        {/* Analysis Section */}
        <div className="rounded-[2px] border border-[#1C2630] bg-[#06080B] p-3 space-y-2">
          <div className="text-[10px] text-slate-500 font-semibold border-b border-[#1C2630] pb-1 flex items-center justify-between">
            <span>Analysis</span>
            <span
              className={cn(
                'text-[9px] font-medium px-1.5 py-0.5 rounded-[1px] border',
                observation.status === 'review'
                  ? 'border-[#E8AE50]/40 bg-[#E8AE50]/10 text-[#E8AE50]'
                  : observation.status === 'candidate'
                    ? 'border-[#5BD8F5]/40 bg-[#5BD8F5]/10 text-[#5BD8F5]'
                    : observation.status === 'error'
                      ? 'border-[#D95C5C]/40 bg-[#D95C5C]/10 text-[#D95C5C]'
                      : 'border-[#1C2630] text-slate-400'
              )}
            >
              {getStatusLabel(observation.status)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[10px]">
            <div>
              <span className="block text-[8px] text-slate-500">Anomaly index</span>
              <span className="text-lg font-bold text-[#5BD8F5] tabular-nums font-mono">
                {observation.anomalyIndex.toFixed(3)}
              </span>
            </div>

            <div>
              <span className="block text-[8px] text-slate-500">Anomalous regions</span>
              <span
                className={cn(
                  'text-lg font-bold tabular-nums font-mono',
                  observation.anomalousRegions > 0 ? 'text-[#E8AE50]' : 'text-slate-400'
                )}
              >
                {observation.anomalousRegions}
              </span>
            </div>

            <div>
              <span className="block text-[8px] text-slate-500">High priority</span>
              <span className="text-lg font-bold text-[#E8AE50] tabular-nums font-mono">
                {observation.highPriorityCandidates}
              </span>
            </div>
          </div>

          {observation.notes && (
            <p className="text-[9px] text-[#7F8B95] border-t border-[#1C2630] pt-2 leading-relaxed italic">
              "{observation.notes}"
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenObservation}
            icon={<ExternalLink className="h-3 w-3" />}
            className="w-full text-center justify-center"
          >
            Open observation
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleViewCandidates}
            icon={<Crosshair className="h-3 w-3" />}
            className="w-full text-center justify-center"
          >
            View candidates
          </Button>
        </div>

        {/* 3. Signal Preview */}
        <div className="space-y-1.5">
          <div className="text-[10px] text-slate-500">Signal morphology</div>
          <SignalPreview observation={observation} />
        </div>

        {/* 4. Candidate List */}
        <div className="space-y-1.5">
          <div className="text-[10px] text-slate-500">Candidate events</div>
          <CandidateBranchList observationId={observation.id} candidates={observation.candidates} />
        </div>

        {/* 5. Progressive Disclosure: Technical specifications & provenance */}
        <div className="pt-2 border-t border-[#1C2630]">
          <button
            type="button"
            onClick={() => setShowSpecs((prev) => !prev)}
            className="flex items-center justify-between w-full text-[11px] text-[#7F8B95] hover:text-[#E6EDF2] py-1.5 transition-colors cursor-pointer"
          >
            <span>Technical specifications & provenance</span>
            <ChevronDown
              className={cn('h-3.5 w-3.5 transition-transform', showSpecs && 'rotate-180')}
            />
          </button>
          {showSpecs && (
            <div className="space-y-4 pt-3 pb-2">
              <ObservationMetadata observation={observation} />
              <ObservationProvenance observation={observation} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
