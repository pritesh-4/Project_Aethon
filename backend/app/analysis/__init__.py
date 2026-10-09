"""AETHON Phase 6 Doppler Drift and Temporal Analysis Engine package."""

from app.analysis.config import (
    AnalysisPipelineConfig,
    DeDriftConfig,
    DriftEstimationConfig,
    DriftSearchConfig,
    RecurrenceConfig,
    TemporalConfig,
    TrajectoryExtractionConfig,
)
from app.analysis.dedrift import apply_linear_dedrift
from app.analysis.drift_estimation import estimate_linear_drift
from app.analysis.drift_search import search_linear_drift_hypotheses
from app.analysis.evaluation import (
    DriftAnalysisEvaluator,
    DriftBenchmarkReport,
    DriftEvaluationItem,
)
from app.analysis.exceptions import (
    AnalysisError,
    CoordinateMetadataUnavailableError,
    DegenerateTrajectoryError,
    HypothesisLimitExceededError,
    IncompatibleObservationError,
    InsufficientTrajectoryPointsError,
    InvalidAnalysisConfigError,
)
from app.analysis.recurrence import compare_observation_events
from app.analysis.schemas import (
    SCIENTIFIC_DOPPLER_DISCLAIMER,
    AnalysisResult,
    DeDriftResult,
    DriftFitResult,
    DriftHypothesis,
    DriftSearchResult,
    FrequencyTrajectory,
    RecurrenceComparisonRecord,
    TemporalCharacterization,
    TrajectoryPoint,
)
from app.analysis.service import AnalysisService
from app.analysis.temporal import characterize_temporal_behavior
from app.analysis.trajectory import extract_frequency_trajectory

__all__ = [
    "SCIENTIFIC_DOPPLER_DISCLAIMER",
    "AnalysisError",
    "AnalysisPipelineConfig",
    "AnalysisResult",
    "AnalysisService",
    "CoordinateMetadataUnavailableError",
    "DeDriftConfig",
    "DeDriftResult",
    "DegenerateTrajectoryError",
    "DriftAnalysisEvaluator",
    "DriftBenchmarkReport",
    "DriftEstimationConfig",
    "DriftEvaluationItem",
    "DriftFitResult",
    "DriftHypothesis",
    "DriftSearchConfig",
    "DriftSearchResult",
    "FrequencyTrajectory",
    "HypothesisLimitExceededError",
    "IncompatibleObservationError",
    "InsufficientTrajectoryPointsError",
    "InvalidAnalysisConfigError",
    "RecurrenceComparisonRecord",
    "RecurrenceConfig",
    "TemporalCharacterization",
    "TemporalConfig",
    "TrajectoryExtractionConfig",
    "TrajectoryPoint",
    "apply_linear_dedrift",
    "characterize_temporal_behavior",
    "compare_observation_events",
    "estimate_linear_drift",
    "extract_frequency_trajectory",
    "search_linear_drift_hypotheses",
]
