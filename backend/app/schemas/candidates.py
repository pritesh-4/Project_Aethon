"""HTTP API request and response schemas for candidate management."""

from typing import Any

from pydantic import BaseModel, Field

from app.candidates.schemas import (
    Candidate,
    CandidateStatus,
    ReviewRecord,
)
from app.candidates.scoring import CandidateScoringConfig


class CreateCandidateRequest(BaseModel):
    """Payload to create a new candidate or group into an existing candidate."""

    observation_id: str = Field(..., description="Source observation identifier UUID")
    target_region: dict[str, Any] = Field(
        ...,
        description="Region bounding indices {time_start, time_stop, freq_start, freq_stop}",
        examples=[{"time_start": 0, "time_stop": 16, "freq_start": 100, "freq_stop": 150}],
    )
    detection_id: str | None = Field(
        default=None, description="Optional upstream detection identifier"
    )
    physical_coordinates: dict[str, Any] | None = Field(
        default=None, description="Optional center frequency (Hz), bandwidth (Hz), duration (s)"
    )
    scoring_config: CandidateScoringConfig | None = Field(
        default=None, description="Optional custom scoring weights and parameters"
    )
    is_synthetic: bool = Field(
        default=False,
        description="Whether candidate originates from synthetic laboratory benchmark",
    )


class CandidateResponse(Candidate):
    """API response model representing a single candidate record."""

    pass


class CandidateListResponse(BaseModel):
    """Paginated list of candidate records."""

    items: list[Candidate]
    total: int
    limit: int
    offset: int


class AssessCandidateRequest(BaseModel):
    """Payload to request re-assessment of a candidate under a scoring policy."""

    scoring_config: CandidateScoringConfig | None = Field(
        default=None, description="Optional custom scoring configuration"
    )


class ReviewCandidateRequest(BaseModel):
    """Payload to perform a human or automated triage review action."""

    new_status: CandidateStatus = Field(..., description="Target status for candidate transition")
    reviewer_id: str = Field(default="analyst", description="Identifier of the reviewer")
    notes: str = Field(default="", description="Scientific justification or triage commentary")
    action: str = Field(default="status_transition", description="Review action description")
    evidence_references: list[str] | None = Field(
        default=None, description="Optional list of evidence IDs cited in review"
    )


class ReviewCandidateResponse(BaseModel):
    """Response returned upon successfully recording a candidate review."""

    candidate: Candidate
    review: ReviewRecord
