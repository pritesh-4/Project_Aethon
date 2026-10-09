"""Ingestion-specific exceptions conforming to AETHON error semantics."""

from typing import Any


class IngestionError(Exception):
    """Base exception for observation ingestion failures."""

    def __init__(
        self,
        message: str,
        code: str = "INGESTION_ERROR",
        status_code: int = 400,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}


class UnsupportedFormatError(IngestionError):
    """Raised when an uploaded file format or extension is not supported."""

    def __init__(
        self,
        message: str = (
            "Unsupported observation file format. Supported formats are .fil, .fits, .fit."
        ),
        details: dict[str, Any] | None = None,
    ) -> None:

        super().__init__(
            message=message,
            code="UNSUPPORTED_FORMAT",
            status_code=400,
            details=details,
        )


class EmptyFileError(IngestionError):
    """Raised when an uploaded file contains zero bytes."""

    def __init__(
        self,
        message: str = "Uploaded observation file is empty (0 bytes).",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            message=message,
            code="EMPTY_FILE",
            status_code=400,
            details=details,
        )


class FileSizeExceededError(IngestionError):
    """Raised when an uploaded file exceeds the maximum permissible upload size."""

    def __init__(
        self,
        message: str = "Uploaded file exceeds maximum configured upload size limit.",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            message=message,
            code="FILE_SIZE_EXCEEDED",
            status_code=413,
            details=details,
        )


class InvalidFileContentError(IngestionError):
    """Raised when file content is malformed, corrupted, or violates format specifications."""

    def __init__(
        self,
        message: str = "File content is invalid or corrupted.",
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            message=message,
            code="INVALID_FILE_CONTENT",
            status_code=422,
            details=details,
        )


class UnsupportedFitsLayoutError(InvalidFileContentError):
    """Raised when a FITS file is valid container syntax but lacks supported radio data layout."""

    def __init__(
        self,
        message: str = (
            "FITS container does not contain a supported radio observation layout. "
            "Supported layouts: 1) Radio Spectral Image (NAXIS>=2 with frequency/time axes) "
            "or 2) Radio Binary Table (e.g. PSRFITS/SDFITS with SUBINT, DATA, and DAT_FREQ)."
        ),
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            message=message,
            details=details,
        )
        self.code = "UNSUPPORTED_FITS_LAYOUT"
        self.status_code = 422


class ObservationNotFoundError(IngestionError):
    """Raised when an observation record cannot be found by its identifier."""

    def __init__(
        self,
        observation_id: str,
        message: str | None = None,
        details: dict[str, Any] | None = None,
    ) -> None:
        msg = message or f"Observation '{observation_id}' was not found."
        merged_details = {"observation_id": observation_id}
        if details:
            merged_details.update(details)
        super().__init__(
            message=msg,
            code="NOT_FOUND",
            status_code=404,
            details=merged_details,
        )
