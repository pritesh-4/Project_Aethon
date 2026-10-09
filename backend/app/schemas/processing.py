"""API response and request schemas for observation signal processing and RFI quality assessment."""

from pydantic import BaseModel, Field

from app.processing.config import ProcessingPipelineConfig
from app.processing.models import (
    GlobalStatistics,
    RfiAssessmentReport,
    TransformationRecord,
)


class ProcessingRequestPayload(BaseModel):
    """Optional request payload for controlling bounded slice retrieval and processing."""

    time_start: int = Field(default=0, ge=0, description="Start time index")
    time_stop: int | None = Field(default=None, ge=1, description="Stop time index")
    frequency_start: int = Field(default=0, ge=0, description="Start frequency channel index")
    frequency_stop: int | None = Field(
        default=None, ge=1, description="Stop frequency channel index"
    )
    config: ProcessingPipelineConfig = Field(
        default_factory=ProcessingPipelineConfig,
        description="Detailed configuration for flaggers, baseline, and transformations",
    )


class ProcessedObservationResponse(BaseModel):
    """API response schema for processed observation slice and RFI assessment."""

    observation_id: str = Field(..., description="Target observation identifier")
    matrix_shape: list[int] = Field(..., description="Processed matrix shape [n_time, n_freq]")
    statistics: GlobalStatistics = Field(..., description="Robust statistical moments")
    rfi_report: RfiAssessmentReport = Field(
        ..., description="Explainable RFI and quality assessment report"
    )
    primary_mask_flagged_count: int = Field(
        ..., description="Total cells flagged across all conditions"
    )
    primary_mask_flagged_fraction: float = Field(
        ..., description="Fraction of matrix cells flagged"
    )
    reason_flag_counts: dict[str, int] = Field(
        default_factory=dict,
        description="Cell count broken down by specific flag reason",
    )
    sample_value_semantics: str = Field(default="uncalibrated_detector_power")
    sample_value_unit: str | None = None
    has_transformed_values: bool = Field(default=False)
    transformed_values: list[list[float | None]] | None = Field(
        default=None,
        description="Optional 2D transformed numerical matrix (None if no transformations enabled)",
    )
    transformation_history: list[TransformationRecord] = Field(default_factory=list)
    pipeline_version: str = Field(default="1.0.0")
    warnings: list[str] = Field(default_factory=list)
