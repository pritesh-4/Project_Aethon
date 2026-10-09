"""HTTP API request and response models for scientific anomaly detection endpoints."""

from pydantic import BaseModel, Field

from app.detection.config import DetectionPipelineConfig
from app.detection.schemas import DetectionResult


class DetectionRequestPayload(BaseModel):
    """Payload specifying bounded slice coordinates and detection pipeline configuration."""

    time_start: int | None = Field(
        default=None, ge=0, description="Optional start time index for bounded analysis"
    )
    time_stop: int | None = Field(
        default=None, ge=1, description="Optional exclusive stop time index"
    )
    frequency_start: int | None = Field(
        default=None, ge=0, description="Optional start frequency channel index"
    )
    frequency_stop: int | None = Field(
        default=None, ge=1, description="Optional exclusive stop frequency channel index"
    )
    config: DetectionPipelineConfig = Field(
        default_factory=DetectionPipelineConfig,
        description="Configuration for window partitioning, baseline, and Isolation Forest",
    )


class DetectionResponse(DetectionResult):
    """API response model for observation anomaly detection."""

    pass
