"""Domain exceptions for AETHON anomaly detection engine."""

from typing import Any


class DetectionError(Exception):
    """Base exception for all anomaly detection errors."""

    def __init__(
        self,
        message: str,
        code: str = "DETECTION_ERROR",
        status_code: int = 400,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}


class InvalidDetectionConfigError(DetectionError):
    """Raised when detection parameters or window geometries violate safety constraints."""

    def __init__(
        self,
        message: str,
        code: str = "INVALID_DETECTION_CONFIG",
        status_code: int = 422,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, status_code=status_code, details=details)


class EmptyAnalysisRegionError(DetectionError):
    """Raised when an input observation or window contains insufficient finite samples."""

    def __init__(
        self,
        message: str,
        code: str = "EMPTY_ANALYSIS_REGION",
        status_code: int = 400,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, status_code=status_code, details=details)


class ModelNotFittedError(DetectionError):
    """Raised when scoring is requested from an unfitted detector."""

    def __init__(
        self,
        message: str,
        code: str = "MODEL_NOT_FITTED",
        status_code: int = 400,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, status_code=status_code, details=details)


class DetectionDimensionLimitExceededError(DetectionError):
    """Raised when window count or matrix dimensions exceed safety ceilings."""

    def __init__(
        self,
        message: str,
        code: str = "DETECTION_LIMIT_EXCEEDED",
        status_code: int = 413,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, status_code=status_code, details=details)


class InvalidModelArtifactError(DetectionError):
    """Raised when attempting to load a corrupted or untrusted model artifact."""

    def __init__(
        self,
        message: str,
        code: str = "INVALID_MODEL_ARTIFACT",
        status_code: int = 400,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message, code=code, status_code=status_code, details=details)
