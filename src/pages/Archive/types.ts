export type ArchiveStatus = 'analyzed' | 'candidate' | 'review' | 'archived' | 'error';

export type CandidatePriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ArchivedCandidateEvent {
  id: string; // e.g. "C01"
  fullId: string; // e.g. "AET-04721-C01"
  signalId: string; // for router navigation to /analysis/:signalId
  label: string; // e.g. "C01"
  priority: CandidatePriority;
  frequencyMHz: number;
  bandwidthKHz: number;
  driftRateHzPerSec: number;
  snrDb: number;
  anomalyScore: number;
  classification?: string;
}

export interface ArchivedObservation {
  id: string; // e.g. "AET-04721"
  date: string; // "YYYY-MM-DD"
  timestamp: string; // e.g. "2026-10-05 14:42:18 UTC"
  targetName: string;
  telescope: string;
  coordinates: {
    ra: string;
    dec: string;
  };
  frequency: number; // Center frequency in MHz (e.g. 1420.37)
  bandwidth: number; // Bandwidth in MHz (e.g. 12.5)
  duration: number; // Duration in seconds (e.g. 272)
  durationString: string; // "00:04:32"
  sampleCount: number; // e.g. 148320
  anomalousRegions: number; // e.g. 17
  highPriorityCandidates: number; // e.g. 4
  anomalyIndex: number; // 0.000 to 1.000
  status: ArchiveStatus;
  topCandidate?: string; // e.g. "AET-04721-C01"
  candidates: ArchivedCandidateEvent[];
  modelVersion: string; // e.g. "0.1.0"
  modelName: string; // e.g. "AETHON-CORE"
  analysisMode: string; // e.g. "STANDARD DISCOVERY"
  pipelineStatus: string; // e.g. "SYNCHRONIZED" | "CORRUPTED_BUFFER"
  analysisTimeMs: number; // e.g. 6400
  provenance: {
    ingestedTime: string;
    preprocessedTime: string;
    analyzedTime: string;
    candidatesGeneratedTime: string;
  };
  notes?: string;
}

export type ArchiveSortOption =
  'newest' | 'oldest' | 'anomalyIndex' | 'candidateCount' | 'priority';

export interface ArchiveFilterState {
  searchQuery: string;
  dateFilter: string; // 'ALL' | YYYY-MM-DD
  statusFilter: string; // 'ALL' | ArchiveStatus
  anomalyFilter: 'ALL' | 'ANOMALOUS' | 'HIGH' | 'NONE';
  priorityFilter: 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW';
  sortBy: ArchiveSortOption;
}

export interface ArchiveSummaryStats {
  totalObservations: number;
  analyzed: number;
  candidateEvents: number;
  flaggedForReview: number;
  anomalous: number;
  highPriority: number;
}
