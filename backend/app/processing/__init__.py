"""Signal processing, quality assessment, and conservative RFI evaluation framework."""

from app.processing.baseline import estimate_baseline
from app.processing.config import (
    BaselineConfig,
    ChannelFlaggerConfig,
    LocalFlaggerConfig,
    ProcessingPipelineConfig,
    TimeFlaggerConfig,
    TransformationConfig,
)
from app.processing.evaluation import (
    ContaminationRegion,
    PreprocessingEvaluationMetrics,
    PreprocessingEvaluator,
    SyntheticContaminationInjector,
)
from app.processing.exceptions import (
    DimensionLimitExceededError,
    EmptyObservationError,
    InvalidProcessingConfigError,
    ProcessingError,
    TransformationError,
)
from app.processing.models import (
    FlagReason,
    GlobalStatistics,
    IndicatorEvidence,
    ProcessingResult,
    QualityMask,
    RfiAssessmentReport,
    TransformationRecord,
)
from app.processing.pipeline import ProcessingService, run_processing_pipeline
from app.processing.statistics import (
    compute_channel_statistics,
    compute_mad,
    compute_robust_statistics,
    compute_robust_z_scores,
    compute_time_statistics,
)

__all__ = [
    "BaselineConfig",
    "ChannelFlaggerConfig",
    "ContaminationRegion",
    "DimensionLimitExceededError",
    "EmptyObservationError",
    "FlagReason",
    "GlobalStatistics",
    "IndicatorEvidence",
    "InvalidProcessingConfigError",
    "LocalFlaggerConfig",
    "PreprocessingEvaluationMetrics",
    "PreprocessingEvaluator",
    "ProcessingError",
    "ProcessingPipelineConfig",
    "ProcessingResult",
    "ProcessingService",
    "QualityMask",
    "RfiAssessmentReport",
    "SyntheticContaminationInjector",
    "TimeFlaggerConfig",
    "TransformationConfig",
    "TransformationError",
    "TransformationRecord",
    "compute_channel_statistics",
    "compute_mad",
    "compute_robust_statistics",
    "compute_robust_z_scores",
    "compute_time_statistics",
    "estimate_baseline",
    "run_processing_pipeline",
]
