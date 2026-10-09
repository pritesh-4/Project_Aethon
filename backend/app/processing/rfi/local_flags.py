"""Localized 2D time-frequency window outlier detection."""

import numpy as np
import scipy.ndimage as ndi

from app.processing.config import LocalFlaggerConfig
from app.processing.models import IndicatorEvidence, QualityMask


def flag_local_outliers(
    values: np.ndarray,
    quality_mask: QualityMask,
    config: LocalFlaggerConfig,
) -> tuple[np.ndarray, IndicatorEvidence]:
    """Identify localized impulsive time-frequency outliers using 2D moving median/MAD filtering.

    Algorithm:
        1. Replace non-finite / existing flagged values with global median for filter stability.
        2. Compute local 2D median using sliding window (window_time, window_freq).
        3. Compute local 2D MAD: median(|V - local_median|) over the local window.
        4. Detect cells where |V - local_median| / (1.4826 * local_mad) > mad_threshold.

    Returns:
        tuple containing:
            - 2D boolean mask where True indicates local outlier cell.
            - IndicatorEvidence documenting parameters, thresholds, and flagged cell counts.
    """
    n_t, n_f = values.shape
    flag_mask = np.zeros((n_t, n_f), dtype=bool)

    if not config.enabled or n_t < 3 or n_f < 3:
        evidence = IndicatorEvidence(
            indicator_name="local_flagger",
            target_type="local_cell",
            threshold_used=config.mad_threshold,
            flagged_cells_count=0,
            reason="Local flagging disabled or dimensions too small (<3x3)",
            parameters=config.model_dump(),
        )
        return flag_mask, evidence

    # Prepare sanitized input matrix for filter stability
    finite_mask = np.isfinite(values)
    valid_unflagged = finite_mask & (~quality_mask.primary_mask)

    if not np.any(valid_unflagged):
        evidence = IndicatorEvidence(
            indicator_name="local_flagger",
            target_type="local_cell",
            threshold_used=config.mad_threshold,
            flagged_cells_count=0,
            reason="No valid unflagged samples to compute local statistics",
            parameters=config.model_dump(),
        )
        return flag_mask, evidence

    global_med = float(np.median(values[valid_unflagged]))
    clean_values = np.copy(values)
    clean_values[~valid_unflagged] = global_med

    # Fast 2D moving median filter
    w_size = (config.window_time, config.window_freq)
    local_median = ndi.median_filter(clean_values, size=w_size, mode="reflect")

    # Local MAD filter: median(|clean_values - local_median|)
    abs_diff = np.abs(clean_values - local_median)
    local_mad = ndi.median_filter(abs_diff, size=w_size, mode="reflect")
    local_sigma = np.maximum(local_mad * 1.4826022, 1e-6)

    # Local z-score
    local_z = np.abs(values - local_median) / local_sigma

    # Flag cells exceeding threshold (excluding cells that were already flagged as non-finite)
    flag_mask = (local_z > config.mad_threshold) & finite_mask
    flagged_cells = int(np.count_nonzero(flag_mask))

    evidence = IndicatorEvidence(
        indicator_name="local_flagger",
        target_type="local_cell",
        threshold_used=config.mad_threshold,
        flagged_cells_count=flagged_cells,
        reason=f"Flagged {flagged_cells} local cells exceeding {config.mad_threshold} sigma",
        notes="Local outliers represent statistically unusual power relative to neighborhood.",
        parameters=config.model_dump(),
    )

    return flag_mask, evidence
