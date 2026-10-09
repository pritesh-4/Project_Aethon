"""Domain exceptions for candidate management and evidence aggregation."""

from typing import Any


class CandidateError(Exception):
    """Base exception for all candidate management and dossier errors."""

    def __init__(self, message: str, details: dict[str, Any] | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.details = details or {}


class CandidateNotFoundError(CandidateError):
    """Raised when a candidate ID does not exist in repository."""

    pass


class IneligibleDetectionError(CandidateError):
    """Raised when a detection or region fails candidate eligibility criteria."""

    pass


class InvalidCandidateStateTransitionError(CandidateError):
    """Raised when an illegal lifecycle state transition is requested."""

    pass


class InvalidScoringPolicyError(CandidateError):
    """Raised when scoring policy configuration is malformed or unsupported."""

    pass


class AssessmentNotFoundError(CandidateError):
    """Raised when a requested assessment version does not exist."""

    pass


class DossierGenerationError(CandidateError):
    """Raised when case file or PDF dossier synthesis fails."""

    pass
