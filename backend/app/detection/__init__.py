"""AETHON Phase 5 Scientific Anomaly Detection Engine package."""

from app.detection.baseline import StatisticalBaselineDetector
from app.detection.config import (
    DetectionPipelineConfig,
    IsolationForestConfig,
    StatisticalBaselineConfig,
    WindowConfig,
)
from app.detection.evaluation import (
    DetectionBenchmarkEvaluator,
    DetectionBenchmarkReport,
    DetectionMetricsSummary,
    EvaluationSample,
)
from app.detection.exceptions import (
    DetectionDimensionLimitExceededError,
    DetectionError,
    EmptyAnalysisRegionError,
    InvalidDetectionConfigError,
    InvalidModelArtifactError,
    ModelNotFittedError,
)
from app.detection.features import (
    FEATURE_NAMES,
    FEATURE_SCHEMA_VERSION,
    extract_window_features,
    feature_dict_to_array,
)
from app.detection.isolation_forest import IsolationForestDetector
from app.detection.regions import merge_anomalous_windows
from app.detection.schemas import (
    SCIENTIFIC_DETECTION_DISCLAIMER,
    AnalysisWindow,
    AnomalousRegion,
    DetectionEvidence,
    DetectionResult,
    MergedRegion,
)
from app.detection.service import DetectionService
from app.detection.windows import generate_analysis_windows

__all__ = [
    "FEATURE_NAMES",
    "FEATURE_SCHEMA_VERSION",
    "SCIENTIFIC_DETECTION_DISCLAIMER",
    "AnalysisWindow",
    "AnomalousRegion",
    "DetectionBenchmarkEvaluator",
    "DetectionBenchmarkReport",
    "DetectionDimensionLimitExceededError",
    "DetectionError",
    "DetectionEvidence",
    "DetectionMetricsSummary",
    "DetectionPipelineConfig",
    "DetectionResult",
    "DetectionService",
    "EmptyAnalysisRegionError",
    "EvaluationSample",
    "InvalidDetectionConfigError",
    "InvalidModelArtifactError",
    "IsolationForestConfig",
    "IsolationForestDetector",
    "MergedRegion",
    "ModelNotFittedError",
    "StatisticalBaselineConfig",
    "StatisticalBaselineDetector",
    "WindowConfig",
    "extract_window_features",
    "feature_dict_to_array",
    "generate_analysis_windows",
    "merge_anomalous_windows",
]
