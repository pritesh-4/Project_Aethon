"""Data models and schemas for candidate management, assessments, and dossiers."""

from datetime import UTC, datetime
from enum import StrEnum
from typing import Any

from pydantic import BaseModel, Field

SCIENTIFIC_CANDIDATE_DISCLAIMER: str = (
    "A candidate record represents an anomalous signal region aggregated for scientific "
    "investigation. It does not constitute verified extraterrestrial intelligence or confirmed "
    "astronomical discovery. Candidate priority scores are operational triage heuristics."
)


class CandidateStatus(StrEnum):
    """Lifecycle status of a scientific candidate record."""

    UNREVIEWED = "unreviewed"
    UNDER_REVIEW = "under_review"
    NEEDS_MORE_DATA = "needs_more_data"
    LIKELY_INTERFERENCE = "likely_interference"
    INTERESTING = "interesting"
    DISMISSED = "dismissed"


class PriorityBand(StrEnum):
    """Operational priority band assigned by candidate assessment."""

    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    EXCEPTIONAL = "exceptional"


class EvidenceType(StrEnum):
    """Categories of supporting or contradicting evidence."""

    DETECTION = "detection"
    QUALITY = "quality"
    DRIFT = "drift"
    TEMPORAL = "temporal"
    RECURRENCE = "recurrence"


class EvidenceItem(BaseModel):
    """Individual evidence record linked to an upstream analysis or detection module."""

    evidence_id: str = Field(..., description="Unique evidence record identifier")
    evidence_type: EvidenceType = Field(..., description="Category of evidence")
    source_observation_id: str = Field(
        ..., description="Observation ID where evidence was produced"
    )
    producing_module: str = Field(
        ..., description="Name of upstream module (e.g. 'detection', 'drift')"
    )
    run_id: str | None = Field(default=None, description="Analysis execution UUID")
    method_and_version: str = Field(..., description="Method name and schema/algorithm version")
    scores_or_parameters: dict[str, Any] = Field(
        default_factory=dict, description="Numerical scores, thresholds, or measured parameters"
    )
    time_frequency_bounds: dict[str, Any] | None = Field(
        default=None, description="Time/frequency boundary coordinates of the evidence"
    )
    is_supportive: bool = Field(
        default=True, description="True if evidence supports candidacy; False if contradictory"
    )
    quality_or_limitations: str | None = Field(
        default=None, description="Explicit caveats, uncertainty notes, or data quality limitations"
    )
    created_at_utc: str = Field(
        default_factory=lambda: datetime.now(UTC).isoformat(),
        description="Timestamp when evidence was ingested",
    )


class CandidateAssessment(BaseModel):
    """Versioned scoring evaluation and priority ranking of a candidate."""

    assessment_id: str = Field(..., description="Unique assessment record UUID")
    candidate_id: str = Field(..., description="Target candidate identifier UUID")
    version: int = Field(..., description="Monotonically increasing assessment version integer")
    created_at_utc: str = Field(
        default_factory=lambda: datetime.now(UTC).isoformat(),
        description="Timestamp when assessment was computed",
    )
    policy_name: str = Field(..., description="Name of the scoring policy used")
    policy_version: str = Field(..., description="Version of the scoring policy algorithm")
    overall_score: float = Field(
        ..., ge=0.0, le=100.0, description="Normalized investigation priority score [0.0, 100.0]"
    )
    priority_band: PriorityBand = Field(..., description="Triage priority category")
    component_contributions: dict[str, float] = Field(
        ..., description="Breakdown of points contributed by individual evidence categories"
    )
    contributing_evidence_ids: list[str] = Field(
        default_factory=list, description="IDs of evidence records that factored into scoring"
    )
    missing_evidence: list[str] = Field(
        default_factory=list, description="List of expected evidence categories not available"
    )
    detector_disagreement: bool = Field(
        default=False, description="True if baseline and Isolation Forest detectors diverged"
    )
    explanation: str = Field(..., description="Human-readable rationale for assigned score")
    warnings: list[str] = Field(default_factory=list, description="Scientific and quality warnings")


class ReviewRecord(BaseModel):
    """Audit log entry documenting human or automated evaluation of a candidate."""

    review_id: str = Field(..., description="Unique review record identifier UUID")
    candidate_id: str = Field(..., description="Target candidate identifier UUID")
    created_at_utc: str = Field(
        default_factory=lambda: datetime.now(UTC).isoformat(),
        description="Timestamp of review action",
    )
    action: str = Field(
        ..., description="Action taken: 'status_transition', 'annotation', 'triage'"
    )
    previous_status: CandidateStatus = Field(..., description="Status prior to action")
    new_status: CandidateStatus = Field(..., description="Status resulting from action")
    reviewer_id: str = Field(
        ..., description="Identifier of the reviewer or automated workflow pipeline"
    )
    notes: str = Field(default="", description="Reviewer rationale, triage notes, or disposition")
    evidence_references: list[str] = Field(
        default_factory=list, description="IDs of specific evidence items referenced in review"
    )


class Candidate(BaseModel):
    """Authoritative scientific candidate record aggregating detections and multi-phase evidence."""

    candidate_id: str = Field(..., description="Stable, immutable candidate identifier UUID")
    created_at_utc: str = Field(
        default_factory=lambda: datetime.now(UTC).isoformat(),
        description="Timestamp when candidate was created",
    )
    updated_at_utc: str = Field(
        default_factory=lambda: datetime.now(UTC).isoformat(),
        description="Timestamp when candidate was last modified",
    )
    status: CandidateStatus = Field(
        default=CandidateStatus.UNREVIEWED, description="Current investigation lifecycle status"
    )
    source_observation_ids: list[str] = Field(
        ..., description="List of source observation identifiers associated with candidate"
    )
    associated_detection_ids: list[str] = Field(
        default_factory=list,
        description="IDs of upstream detector windows/regions grouped into candidate",
    )
    processing_run_ids: list[str] = Field(
        default_factory=list, description="IDs of Phase 4 processing operations"
    )
    analysis_run_ids: list[str] = Field(
        default_factory=list, description="IDs of Phase 6 Doppler/temporal analysis runs"
    )
    target_region: dict[str, Any] = Field(
        ..., description="Bounding matrix indices: time_start, time_stop, freq_start, freq_stop"
    )
    physical_coordinates: dict[str, Any] = Field(
        default_factory=dict,
        description="Physical center frequency (Hz), bandwidth (Hz), time center (s), duration (s)",
    )
    current_assessment: CandidateAssessment | None = Field(
        default=None, description="Most recent versioned assessment score and breakdown"
    )
    evidence_items: list[EvidenceItem] = Field(
        default_factory=list, description="List of associated evidence records"
    )
    review_history: list[ReviewRecord] = Field(
        default_factory=list, description="Complete chronological audit trail of review actions"
    )
    schema_version: str = Field(default="1.0.0", description="Candidate record schema version")
    is_synthetic: bool = Field(
        default=False, description="True if candidate originated from synthetic benchmark injection"
    )
    provenance: dict[str, Any] = Field(
        default_factory=dict, description="Metadata linking candidate to software and environment"
    )
    warnings: list[str] = Field(default_factory=list, description="Aggregated data warnings")
    scientific_disclaimer: str = Field(
        default=SCIENTIFIC_CANDIDATE_DISCLAIMER, description="Mandatory scientific disclaimer"
    )


class CandidateDossier(BaseModel):
    """Reproducible, exportable scientific case file snapshot."""

    dossier_id: str = Field(..., description="Unique dossier snapshot identifier UUID")
    generated_at_utc: str = Field(
        default_factory=lambda: datetime.now(UTC).isoformat(),
        description="Timestamp when dossier was compiled",
    )
    candidate_id: str = Field(..., description="Target candidate identifier UUID")
    assessment_version: int = Field(..., description="Version of assessment frozen in this dossier")
    candidate: Candidate = Field(..., description="Frozen candidate record state")
    assessment: CandidateAssessment = Field(..., description="Frozen candidate assessment")
    executive_summary: str = Field(..., description="Executive summary of findings and uncertainty")
    reproducibility_appendix: dict[str, Any] = Field(
        ..., description="Complete parameters, versions, and checksums for independent reproduction"
    )
    scientific_disclaimer: str = Field(
        default=SCIENTIFIC_CANDIDATE_DISCLAIMER, description="Mandatory scientific disclaimer"
    )
