"""Domain exceptions for signal processing and RFI quality assessment."""

from typing import Any


class ProcessingError(Exception):
    """Base exception for all processing, quality-assessment, and RFI flagging errors."""

    def __init__(
        self,
        message: str,
        code: str = "PROCESSING_ERROR",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.details = details or {}


class InvalidProcessingConfigError(ProcessingError):
    """Raised when processing configuration parameters violate mathematical constraints."""

    def __init__(
        self,
        message: str,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            message=message,
            code="INVALID_PROCESSING_CONFIG",
            details=details,
        )


class EmptyObservationError(ProcessingError):
    """Raised when an input array has 0 valid elements or contains only non-finite values."""

    def __init__(
        self,
        message: str,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            message=message,
            code="EMPTY_OBSERVATION_DATA",
            details=details,
        )


class DimensionLimitExceededError(ProcessingError):
    """Raised when input array dimensions exceed safety limits for numerical processing."""

    def __init__(
        self,
        message: str,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            message=message,
            code="PROCESSING_DIMENSION_LIMIT_EXCEEDED",
            details=details,
        )


class TransformationError(ProcessingError):
    """Raised when an optional mathematical transformation cannot be applied reliably."""

    def __init__(
        self,
        message: str,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            message=message,
            code="TRANSFORMATION_ERROR",
            details=details,
        )
