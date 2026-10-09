"""Input data validation and foundational quality mask initialization."""

import numpy as np

from app.processing.config import MAX_PROCESSING_CELLS
from app.processing.exceptions import (
    DimensionLimitExceededError,
    EmptyObservationError,
    InvalidProcessingConfigError,
)
from app.processing.models import FlagReason, QualityMask


def validate_observation_input(values: np.ndarray) -> None:
    """Validate matrix geometry, dimensionality, and cell safety limits."""
    if not isinstance(values, np.ndarray):
        raise InvalidProcessingConfigError(
            f"Input values must be a numpy ndarray, got {type(values).__name__}"
        )

    if values.ndim != 2:
        raise InvalidProcessingConfigError(
            f"Input matrix must be 2D (time, freq), got {values.ndim}D shape {values.shape}",
            details={"shape": list(values.shape)},
        )

    n_t, n_f = values.shape
    if n_t <= 0 or n_f <= 0:
        raise EmptyObservationError(
            f"Observation dimensions must be strictly positive, got ({n_t}, {n_f})",
            details={"shape": [n_t, n_f]},
        )

    total_cells = n_t * n_f
    if total_cells > MAX_PROCESSING_CELLS:
        raise DimensionLimitExceededError(
            f"Cells ({total_cells}) exceed safety limit of {MAX_PROCESSING_CELLS}",
            details={"total_cells": total_cells, "limit": MAX_PROCESSING_CELLS},
        )

    if not np.any(np.isfinite(values)):
        raise EmptyObservationError("Matrix contains zero finite samples; cannot be processed.")


def initialize_quality_mask(values: np.ndarray) -> QualityMask:
    """Create initial QualityMask marking non-finite (NaN, Inf) samples."""
    non_finite_mask = ~np.isfinite(values)
    mask = QualityMask(primary_mask=np.copy(non_finite_mask))
    if np.any(non_finite_mask):
        mask.add_reason_flag(FlagReason.NON_FINITE.value, non_finite_mask)
    return mask
