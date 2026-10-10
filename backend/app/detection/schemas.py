"""Pydantic schemas and data containers for anomaly detection evidence and results."""

from typing import Any

from pydantic import BaseModel, Field

from app.detection.config import DetectionPipelineConfig

SCIENTIFIC_DETECTION_DISCLAIMER: str = (
    "An anomaly score describes how unusual a region appears relative to the evaluated reference "
    "distribution under the configured detector. It does not constitute proof of extraterrestrial "
    "intelligence or confirmed astronomical discovery."
)


class AnalysisWindow(BaseModel):
    """Bounded time-frequency analysis partition mapped to observation coordinates."""

    window_id: str = Field(..., description="Unique window identifier (e.g. win_t0_f0)")
    time_start: int = Field(..., description="Inclusive 0-based start time index")
    time_stop: int = Field(..., description="Exclusive 0-based stop time index")
    freq_start: int = Field(..., description="Inclusive 0-based start frequency channel index")
    freq_stop: int = Field(..., description="Exclusive 0-based stop frequency channel index")

    time_center_s: float | None = Field(
        default=None, description="Physical center timestamp in seconds from observation start"
    )
    time_span_s: float | None = Field(default=None, description="Physical duration in seconds")
    freq_center_hz: float | None = Field(
        default=None, description="Physical center frequency in Hz"
    )
    bandwidth_hz: float | None = Field(default=None, description="Physical bandwidth in Hz")

    valid_sample_count: int = Field(..., description="Number of finite unflagged samples in window")
    flagged_sample_fraction: float = Field(
        ..., description="Fraction of window cells flagged by quality mask"
    )
    quality_warning: str | None = Field(
        default=None, description="Warning if flagged fraction is high or samples incomplete"
    )


class DetectionEvidence(BaseModel):
    """Explainable evidence record emitted by a specific detector for an evaluated window."""

    detector_name: str = Field(..., description="'statistical_baseline' or 'isolation_forest'")
    anomaly_score: float = Field(..., description="Continuous score; higher is more anomalous")
    threshold_used: float = Field(..., description="Numerical cutoff used for binary decision")
    is_anomalous: bool = Field(..., description="True if anomaly_score >= threshold_used")
    score_semantics: str = Field(
        default="higher_indicates_more_anomalous",
        description="Explicit directionality documentation",
    )
    decision_rationale: str = Field(
        ..., description="Plain-language justification of threshold decision"
    )
    parameters: dict[str, Any] = Field(
        default_factory=dict, description="Configuration parameters used during evaluation"
    )


class AnomalousRegion(BaseModel):
    """Individual anomalous window detection with extracted features and detector evidence."""

    detection_id: str = Field(..., description="Unique detection identifier UUID")
    window: AnalysisWindow = Field(..., description="Window geometry and coordinate bounds")
    features: dict[str, float] = Field(
        ..., description="Extracted numerical feature vector dictionary"
    )
    baseline_evidence: DetectionEvidence | None = Field(
        default=None, description="Statistical baseline evidence if enabled"
    )
    isolation_forest_evidence: DetectionEvidence | None = Field(
        default=None, description="Isolation Forest evidence if enabled and fitted"
    )
    autoencoder_evidence: DetectionEvidence | None = Field(
        default=None, description="Real-radio autoencoder evidence if enabled"
    )
    is_anomalous: bool = Field(
        default=True, description="True if flagged by any active detector in pipeline"
    )


class MergedRegion(BaseModel):
    """Consolidated bounding region merging overlapping or contiguous anomalous windows."""

    merged_id: str = Field(..., description="Unique merged region identifier")
    time_start: int = Field(..., description="Merged inclusive start time index")
    time_stop: int = Field(..., description="Merged exclusive stop time index")
    freq_start: int = Field(..., description="Merged inclusive start frequency channel index")
    freq_stop: int = Field(..., description="Merged exclusive stop frequency channel index")

    time_center_s: float | None = None
    freq_center_hz: float | None = None
    bandwidth_hz: float | None = None

    contributing_window_ids: list[str] = Field(
        default_factory=list, description="IDs of component windows merged into this region"
    )
    max_anomaly_score: float = Field(..., description="Peak anomaly score among member windows")
    mean_anomaly_score: float = Field(
        ..., description="Average anomaly score across member windows"
    )


class DetectionResult(BaseModel):
    """Complete, traceable anomaly detection result for an observation."""

    observation_id: str = Field(..., description="Analyzed observation identifier")
    analysis_run_id: str = Field(..., description="Unique UUID for this analysis execution run")
    matrix_shape: list[int] = Field(..., description="Evaluated matrix dimensions [n_time, n_freq]")
    total_windows_evaluated: int = Field(..., description="Total analysis windows evaluated")
    anomalous_regions: list[AnomalousRegion] = Field(
        default_factory=list, description="List of detected anomalous windows"
    )
    merged_regions: list[MergedRegion] | None = Field(
        default=None, description="Optional merged regions if merging was configured"
    )
    anomalous_fraction: float = Field(
        ..., description="Fraction of evaluated windows flagged as anomalous"
    )
    pipeline_config: DetectionPipelineConfig = Field(
        ..., description="Complete configuration parameters used"
    )
    provenance: dict[str, Any] = Field(
        default_factory=dict, description="Software versions, feature schema, and timestamps"
    )
    scientific_disclaimer: str = Field(
        default=SCIENTIFIC_DETECTION_DISCLAIMER,
        description="Mandatory scientific interpretation notice",
    )
