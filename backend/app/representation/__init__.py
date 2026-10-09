"""Canonical scientific data representation package."""

from app.representation.axes import FrequencyAxisModel, TimeAxisModel
from app.representation.exceptions import (
    InvalidSliceBoundsError,
    ObservationFileNotFoundError,
    RepresentationError,
    SliceCellLimitExceededError,
    UnsupportedSliceLayoutError,
)
from app.representation.models import CanonicalSlice
from app.representation.service import SliceService

__all__ = [
    "CanonicalSlice",
    "FrequencyAxisModel",
    "InvalidSliceBoundsError",
    "ObservationFileNotFoundError",
    "RepresentationError",
    "SliceCellLimitExceededError",
    "SliceService",
    "TimeAxisModel",
    "UnsupportedSliceLayoutError",
]
