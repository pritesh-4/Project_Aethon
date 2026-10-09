"""Robust background and baseline estimation utilities."""

from typing import Any

import numpy as np
import scipy.ndimage as ndi

from app.processing.config import BaselineConfig
from app.processing.models import QualityMask
from app.processing.statistics import compute_channel_statistics


def estimate_baseline(
    values: np.ndarray,
    quality_mask: QualityMask,
    config: BaselineConfig,
) -> tuple[np.ndarray | None, dict[str, Any]]:
    """Estimate a 2D background baseline matrix without mutating input values.

    Methods:
        - "per_channel_median": Computes median across unflagged time samples for each channel,
          broadcasting the 1D spectrum across all time rows: B[t, c] = median_t'(V[t', c]).
        - "moving_median_2d": Applies 2D moving median filter across unflagged values.
        - "none": Skips baseline estimation, returning None.

    Args:
        values: 2D numpy observation array (n_time, n_freq).
        quality_mask: QualityMask providing unflagged sample exclusion.
        config: Baseline estimation parameters.

    Returns:
        tuple containing:
            - 2D baseline ndarray of shape (n_time, n_freq), or None if method is "none".
            - Metadata dictionary recording configuration, sample counts, and estimator provenance.
    """
    if config.method == "none":
        return None, {"method": "none", "notes": "Baseline estimation disabled."}

    n_t, _n_f = values.shape
    mask_to_use = quality_mask.primary_mask if config.exclude_flagged else None

    if config.method == "per_channel_median":
        channel_meds, _, _ = compute_channel_statistics(values, mask=mask_to_use)

        # Fallback for channels with zero unflagged samples
        valid_meds = channel_meds[np.isfinite(channel_meds)]
        global_fallback = float(np.median(valid_meds)) if valid_meds.size > 0 else 0.0
        clean_channel_meds = np.where(np.isfinite(channel_meds), channel_meds, global_fallback)

        # Broadcast across time: shape (n_time, n_freq)
        baseline_2d = np.tile(clean_channel_meds.astype(values.dtype), (n_t, 1))

        metadata = {
            "method": "per_channel_median",
            "exclude_flagged": config.exclude_flagged,
            "fallback_used_channels": int(np.count_nonzero(~np.isfinite(channel_meds))),
            "global_fallback_value": round(global_fallback, 6),
            "estimator": "median across unflagged time samples per frequency channel",
        }
        return baseline_2d, metadata

    elif config.method == "moving_median_2d":
        finite_mask = np.isfinite(values)
        valid_unflagged = finite_mask & (
            ~quality_mask.primary_mask if config.exclude_flagged else True
        )

        valid_vals = values[valid_unflagged]
        global_med = float(np.median(valid_vals)) if valid_vals.size > 0 else 0.0

        clean_vals = np.copy(values)
        clean_vals[~valid_unflagged] = global_med

        w_size = (config.window_time, config.window_freq)
        baseline_2d = ndi.median_filter(clean_vals, size=w_size, mode="reflect")

        metadata = {
            "method": "moving_median_2d",
            "window_time": config.window_time,
            "window_freq": config.window_freq,
            "exclude_flagged": config.exclude_flagged,
            "estimator": "2D separable moving median filter",
        }
        return baseline_2d, metadata

    return None, {"method": "unsupported", "notes": f"Method '{config.method}' not recognized."}
