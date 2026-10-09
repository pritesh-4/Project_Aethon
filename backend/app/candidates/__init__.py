"""Candidate management, evidence aggregation, and scientific case files package."""

from app.candidates.dossier import generate_candidate_dossier
from app.candidates.eligibility import EligibilityResult, check_candidate_eligibility
from app.candidates.evidence import (
    create_analysis_evidence,
    create_detection_evidence,
    create_quality_evidence,
)
from app.candidates.exceptions import (
    AssessmentNotFoundError,
    CandidateError,
    CandidateNotFoundError,
    DossierGenerationError,
    IneligibleDetectionError,
    InvalidCandidateStateTransitionError,
    InvalidScoringPolicyError,
)
from app.candidates.grouping import find_matching_candidate, merge_into_candidate
from app.candidates.pdf import generate_candidate_pdf
from app.candidates.repository import CandidateRepository
from app.candidates.review import validate_and_apply_review
from app.candidates.schemas import (
    SCIENTIFIC_CANDIDATE_DISCLAIMER,
    Candidate,
    CandidateAssessment,
    CandidateDossier,
    CandidateStatus,
    EvidenceItem,
    EvidenceType,
    PriorityBand,
    ReviewRecord,
)
from app.candidates.scoring import CandidateScoringConfig, assess_candidate_evidence
from app.candidates.service import CandidateService

__all__ = [
    "SCIENTIFIC_CANDIDATE_DISCLAIMER",
    "AssessmentNotFoundError",
    "Candidate",
    "CandidateAssessment",
    "CandidateDossier",
    "CandidateError",
    "CandidateNotFoundError",
    "CandidateRepository",
    "CandidateScoringConfig",
    "CandidateService",
    "CandidateStatus",
    "DossierGenerationError",
    "EligibilityResult",
    "EvidenceItem",
    "EvidenceType",
    "IneligibleDetectionError",
    "InvalidCandidateStateTransitionError",
    "InvalidScoringPolicyError",
    "PriorityBand",
    "ReviewRecord",
    "assess_candidate_evidence",
    "check_candidate_eligibility",
    "create_analysis_evidence",
    "create_detection_evidence",
    "create_quality_evidence",
    "find_matching_candidate",
    "generate_candidate_dossier",
    "generate_candidate_pdf",
    "merge_into_candidate",
    "validate_and_apply_review",
]
