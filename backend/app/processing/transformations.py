"""Optional, reproducible preprocessing transformations with traceable manifests."""

import numpy as np

from app.processing.config import TransformationConfig
from app.processing.models import QualityMask, TransformationRecord
from app.processing.statistics import compute_mad


def apply_transformations(
    values: np.ndarray,
    quality_mask: QualityMask,
    config: TransformationConfig,
    baseline_2d: np.ndarray | None = None,
) -> tuple[np.ndarray | None, list[TransformationRecord], str, str | None]:
    """Execute requested mathematical transformations, documenting every operation in a manifest.

    Guarantees:
        - Input values array is NEVER mutated; operations produce fresh derived copies.
        - If no transformations are enabled, returns (None, [], original_semantics, original_unit).

    Returns:
        tuple containing:
            - Transformed 2D numpy array or None if no transformations were enabled.
            - List of TransformationRecord entries documenting the sequential processing history.
            - Resulting sample_value_semantics string.
            - Resulting sample_value_unit string (or None).
    """
    history: list[TransformationRecord] = []
    semantics = "uncalibrated_detector_power"
    unit: str | None = None

    # Check if any transformation was requested
    any_active = (
        config.subtract_channel_background
        or config.robust_standardization
        or config.apply_mask_in_output
    )
    if not any_active:
        return None, history, semantics, unit

    # Start with a fresh derived copy
    transformed = np.copy(values)
    step_idx = 1

    # Step A: Per-channel background subtraction
    if config.subtract_channel_background:
        if baseline_2d is not None:
            transformed = transformed - baseline_2d
            semantics = "baseline_subtracted_power"
            unit = "relative_power"
            history.append(
                TransformationRecord(
                    step_index=step_idx,
                    operation="subtract_channel_background",
                    parameters={"baseline_available": True},
                    input_shape=list(values.shape),
                    output_shape=list(transformed.shape),
                    sample_value_semantics=semantics,
                    sample_value_unit=unit,
                    notes="Subtracted estimated 2D baseline: V' = V - B.",
                )
            )
            step_idx += 1

    # Step B: Robust standardization
    if config.robust_standardization:
        unflagged_mask = np.isfinite(transformed) & (~quality_mask.primary_mask)
        unflagged_vals = transformed[unflagged_mask]

        if unflagged_vals.size > 0:
            med_val = float(np.median(unflagged_vals))
            mad_val = compute_mad(unflagged_vals, median=med_val)
            robust_sigma = max(1e-12, mad_val * 1.4826022)

            transformed = (transformed - med_val) / robust_sigma
            semantics = "robust_standardized_z_score"
            unit = "dimensionless_sigma"

            history.append(
                TransformationRecord(
                    step_index=step_idx,
                    operation="robust_standardization",
                    parameters={
                        "median": round(med_val, 6),
                        "robust_sigma": round(robust_sigma, 6),
                    },
                    input_shape=list(values.shape),
                    output_shape=list(transformed.shape),
                    sample_value_semantics=semantics,
                    sample_value_unit=unit,
                    notes="Standardized using robust median and MAD: V' = (V - med) / sigma_MAD.",
                )
            )
            step_idx += 1

    # Step C: Masked view in output
    if config.apply_mask_in_output:
        transformed[quality_mask.primary_mask] = np.nan
        history.append(
            TransformationRecord(
                step_index=step_idx,
                operation="apply_mask_in_output",
                parameters={"flagged_cells_masked": quality_mask.flagged_count},
                input_shape=list(values.shape),
                output_shape=list(transformed.shape),
                sample_value_semantics=semantics,
                sample_value_unit=unit,
                notes="Replaced flagged samples with NaN in optional transformed array.",
            )
        )

    return transformed, history, semantics, unit
