"""HTTP API request and response models for Doppler drift and temporal analysis."""

from typing import Any

from pydantic import BaseModel, Field

from app.analysis.config import AnalysisPipelineConfig
from app.analysis.schemas import AnalysisResult


class AnalysisRequestPayload(BaseModel):
    """Payload specifying bounded slice coordinates and analysis pipeline configuration."""

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
    config: AnalysisPipelineConfig = Field(
        default_factory=AnalysisPipelineConfig,
        description="Configuration for trajectory extraction, drift estimation, and search",
    )
    historical_events: list[dict[str, Any]] | None = Field(
        default=None,
        description="Optional list of historical observation events for recurrence comparison",
    )


class AnalysisResponse(AnalysisResult):
    """API response model for Doppler drift and temporal analysis."""

    pass
