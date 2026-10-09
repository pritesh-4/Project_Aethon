"""Synthetic signal laboratory and benchmark framework for AETHON."""

from app.synthetic.backgrounds import generate_noise_background
from app.synthetic.config import (
    NoiseBackgroundConfig,
    ObservationGeometryConfig,
    SignalConfig,
    SyntheticDatasetConfig,
)
from app.synthetic.dataset import (
    BenchmarkDatasetGenerator,
    BenchmarkManifest,
    load_benchmark_dataset,
)
from app.synthetic.evaluation import (
    BenchmarkEvaluationResult,
    BenchmarkEvaluator,
    CandidatePrediction,
    ToyThresholdBaselineDetector,
    compute_box_iou,
)
from app.synthetic.exceptions import (
    BenchmarkSerializationError,
    EvaluationError,
    InvalidSyntheticConfigError,
    SignalOutOfBoundsError,
    SyntheticLaboratoryError,
)
from app.synthetic.ground_truth import InjectedSignalGroundTruth, ObservationGroundTruth
from app.synthetic.injection import InjectionResult, inject_signals
from app.synthetic.setigen_adapter import SetigenAdapter
from app.synthetic.signals import get_signal_generator

__all__ = [
    "BenchmarkDatasetGenerator",
    "BenchmarkEvaluationResult",
    "BenchmarkEvaluator",
    "BenchmarkManifest",
    "BenchmarkSerializationError",
    "CandidatePrediction",
    "EvaluationError",
    "InjectedSignalGroundTruth",
    "InjectionResult",
    "InvalidSyntheticConfigError",
    "NoiseBackgroundConfig",
    "ObservationGeometryConfig",
    "ObservationGroundTruth",
    "SetigenAdapter",
    "SignalConfig",
    "SignalOutOfBoundsError",
    "SyntheticDatasetConfig",
    "SyntheticLaboratoryError",
    "ToyThresholdBaselineDetector",
    "compute_box_iou",
    "generate_noise_background",
    "get_signal_generator",
    "inject_signals",
    "load_benchmark_dataset",
]
