"""Exceptions for canonical representation and spectral slicing."""

from typing import Any


class RepresentationError(Exception):
    """Base exception for scientific representation and slicing failures."""

    def __init__(
        self,
        message: str,
        code: str = "REPRESENTATION_ERROR",
        status_code: int = 422,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}


class SliceCellLimitExceededError(RepresentationError):
    """Raised when requested slice cells exceed configured MAX_SLICE_CELLS."""

    def __init__(
        self,
        requested_cells: int,
        max_cells: int,
        details: dict[str, Any] | None = None,
    ) -> None:
        msg = (
            f"Requested slice volume ({requested_cells:,} cells) exceeds "
            f"maximum configured limit of {max_cells:,} cells."
        )
        merged = {"requested_cells": requested_cells, "max_cells": max_cells}
        if details:
            merged.update(details)
        super().__init__(
            message=msg,
            code="SLICE_CELL_LIMIT_EXCEEDED",
            status_code=422,
            details=merged,
        )


class InvalidSliceBoundsError(RepresentationError):
    """Raised when slice bounds are inverted, negative, or exceed observation dimensions."""

    def __init__(
        self,
        message: str,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            message=message,
            code="INVALID_SLICE_BOUNDS",
            status_code=422,
            details=details,
        )


class UnsupportedSliceLayoutError(RepresentationError):
    """Raised when source file layout cannot be mapped to canonical time-frequency axes."""

    def __init__(
        self,
        message: str,
        details: dict[str, Any] | None = None,
    ) -> None:
        super().__init__(
            message=message,
            code="UNSUPPORTED_SLICE_LAYOUT",
            status_code=422,
            details=details,
        )


class ObservationFileNotFoundError(RepresentationError):
    """Raised when source observation file is missing from persistent storage."""

    def __init__(
        self,
        observation_id: str,
        details: dict[str, Any] | None = None,
    ) -> None:
        merged = {"observation_id": observation_id}
        if details:
            merged.update(details)
        super().__init__(
            message=f"Raw observation file for ID '{observation_id}' was not found in storage.",
            code="OBSERVATION_FILE_NOT_FOUND",
            status_code=404,
            details=merged,
        )
