"""Domain exceptions for the synthetic signal laboratory and benchmark framework."""

from typing import Any


class SyntheticLaboratoryError(Exception):
    """Base exception for all synthetic laboratory generation and evaluation errors."""

    def __init__(
        self,
        message: str,
        code: str = "SYNTHETIC_LABORATORY_ERROR",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.details = details or {}


class InvalidSyntheticConfigError(SyntheticLaboratoryError):
    """Raised when configuration parameters violate physical or mathematical constraints."""

    def __init__(
        self,
        message: str,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            message=message,
            code="INVALID_SYNTHETIC_CONFIG",
            details=details,
        )


class SignalOutOfBoundsError(SyntheticLaboratoryError):
    """Raised when a signal is requested entirely outside observation time-frequency bounds."""

    def __init__(
        self,
        message: str,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            message=message,
            code="SIGNAL_OUT_OF_BOUNDS",
            details=details,
        )


class BenchmarkSerializationError(SyntheticLaboratoryError):
    """Raised when packaging, writing, or reading synthetic benchmark manifests fails."""

    def __init__(
        self,
        message: str,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            message=message,
            code="BENCHMARK_SERIALIZATION_ERROR",
            details=details,
        )


class EvaluationError(SyntheticLaboratoryError):
    """Raised when ground-truth evaluation or matching cannot be computed."""

    def __init__(
        self,
        message: str,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            message=message,
            code="EVALUATION_ERROR",
            details=details,
        )
