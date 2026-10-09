"""Domain exceptions for AETHON Doppler drift and temporal analysis engine."""

from typing import Any


class AnalysisError(Exception):
    """Base exception for all temporal and drift analysis errors."""

    def __init__(
        self,
        message: str,
        code: str = "ANALYSIS_ERROR",
        status_code: int = 400,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}


class InvalidAnalysisConfigError(AnalysisError):
    """Raised when analysis configuration parameters or search grids violate safety bounds."""

    def __init__(
        self,
        message: str,
        code: str = "INVALID_ANALYSIS_CONFIG",
        status_code: int = 422,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, status_code=status_code, details=details)


class InsufficientTrajectoryPointsError(AnalysisError):
    """Raised when a candidate region contains fewer valid points than required for fitting."""

    def __init__(
        self,
        message: str,
        code: str = "INSUFFICIENT_TRAJECTORY_POINTS",
        status_code: int = 400,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, status_code=status_code, details=details)


class DegenerateTrajectoryError(AnalysisError):
    """Raised when trajectory coordinates are singular or non-invertible for regression."""

    def __init__(
        self,
        message: str,
        code: str = "DEGENERATE_TRAJECTORY",
        status_code: int = 400,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, status_code=status_code, details=details)


class CoordinateMetadataUnavailableError(AnalysisError):
    """Raised when physical drift estimation in Hz/s is requested without valid axis metadata."""

    def __init__(
        self,
        message: str,
        code: str = "COORDINATE_METADATA_UNAVAILABLE",
        status_code: int = 400,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, status_code=status_code, details=details)


class HypothesisLimitExceededError(AnalysisError):
    """Raised when the configured drift search grid exceeds computational safety ceilings."""

    def __init__(
        self,
        message: str,
        code: str = "HYPOTHESIS_LIMIT_EXCEEDED",
        status_code: int = 413,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, status_code=status_code, details=details)


class IncompatibleObservationError(AnalysisError):
    """Raised when attempting recurrence comparison on observations with incompatible axes."""

    def __init__(
        self,
        message: str,
        code: str = "INCOMPATIBLE_OBSERVATIONS",
        status_code: int = 400,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, status_code=status_code, details=details)
