"""Window generator partitioning canonical observations into bounded analysis regions."""

import numpy as np

from app.detection.config import WindowConfig
from app.detection.exceptions import (
    DetectionDimensionLimitExceededError,
    InvalidDetectionConfigError,
)
from app.detection.schemas import AnalysisWindow
from app.processing.models import QualityMask
from app.representation.axes import FrequencyAxisModel, TimeAxisModel


def generate_analysis_windows(
    values: np.ndarray,
    quality_mask: QualityMask,
    time_axis: TimeAxisModel | None = None,
    frequency_axis: FrequencyAxisModel | None = None,
    config: WindowConfig | None = None,
    max_windows_limit: int = 20_000,
) -> list[tuple[AnalysisWindow, np.ndarray, np.ndarray]]:
    """Partition a canonical 2D observation into bounded analysis windows without full array copies.

    Args:
        values: 2D numpy array of shape (n_time, n_freq).
        quality_mask: Multi-condition QualityMask aligned with values.
        time_axis: Optional TimeAxisModel for physical time calculations.
        frequency_axis: Optional FrequencyAxisModel for physical frequency calculations.
        config: WindowConfig specifying sizes, strides, and sample requirements.
        max_windows_limit: Maximum permissible windows to guard against memory exhaustion.

    Returns:
        list of tuples: (AnalysisWindow metadata, window_values_view, window_mask_view).

    Raises:
        InvalidDetectionConfigError: If input values are not 2D.
        DetectionDimensionLimitExceededError: If window count exceeds max_windows_limit.
    """
    if values.ndim != 2:
        raise InvalidDetectionConfigError(
            f"Observation array must be exactly 2D, got shape {values.shape}"
        )

    cfg = config or WindowConfig()
    n_t, n_f = values.shape

    if n_t < 2 or n_f < 2:
        return []

    # Estimate expected window counts
    t_steps = max(1, (n_t - cfg.time_size + cfg.time_stride) // cfg.time_stride)
    f_steps = max(1, (n_f - cfg.freq_size + cfg.freq_stride) // cfg.freq_stride)
    estimated_windows = t_steps * f_steps

    if estimated_windows > max_windows_limit:
        raise DetectionDimensionLimitExceededError(
            f"Estimated analysis windows ({estimated_windows}) exceed limit of {max_windows_limit}",
            details={"estimated_windows": estimated_windows, "limit": max_windows_limit},
        )

    results: list[tuple[AnalysisWindow, np.ndarray, np.ndarray]] = []
    primary_mask = quality_mask.primary_mask

    # Step through time
    t_start = 0
    win_idx = 0

    while t_start < n_t:
        t_stop = min(n_t, t_start + cfg.time_size)
        if (t_stop - t_start) < 2:
            break

        f_start = 0
        while f_start < n_f:
            f_stop = min(n_f, f_start + cfg.freq_size)
            if (f_stop - f_start) < 2:
                break

            # Bounded view slices (zero-copy)
            w_vals = values[t_start:t_stop, f_start:f_stop]
            w_mask = primary_mask[t_start:t_stop, f_start:f_stop]

            total_cells = (t_stop - t_start) * (f_stop - f_start)
            finite_mask = np.isfinite(w_vals)
            valid_mask = finite_mask & (~w_mask)
            valid_count = int(np.count_nonzero(valid_mask))
            flagged_count = int(np.count_nonzero(w_mask))
            flagged_frac = float(flagged_count / total_cells)
            valid_frac = float(valid_count / total_cells)

            warning = None
            if valid_frac < cfg.min_valid_sample_fraction:
                warning = (
                    f"Valid sample fraction ({valid_frac:.2f}) is below "
                    f"configured minimum ({cfg.min_valid_sample_fraction:.2f})"
                )

            # Physical coordinates
            t_center_s = None
            t_span_s = None
            if time_axis and time_axis.sampling_interval_seconds is not None:
                dt = time_axis.sampling_interval_seconds
                t_span_s = round((t_stop - t_start) * dt, 6)
                t_center_s = round((t_start + (t_stop - t_start) / 2.0) * dt, 6)

            f_center_hz = None
            bw_hz = None
            if (
                frequency_axis
                and frequency_axis.reference_frequency_hz is not None
                and frequency_axis.channel_spacing_hz is not None
            ):
                f0 = frequency_axis.reference_frequency_hz
                df = abs(frequency_axis.channel_spacing_hz)
                bw_hz = round((f_stop - f_start) * df, 3)
                f_center_hz = round(f0 + (f_start + (f_stop - f_start) / 2.0) * df, 3)

            window_id = f"win_t{t_start}_f{f_start}"
            win_schema = AnalysisWindow(
                window_id=window_id,
                time_start=t_start,
                time_stop=t_stop,
                freq_start=f_start,
                freq_stop=f_stop,
                time_center_s=t_center_s,
                time_span_s=t_span_s,
                freq_center_hz=f_center_hz,
                bandwidth_hz=bw_hz,
                valid_sample_count=valid_count,
                flagged_sample_fraction=round(flagged_frac, 6),
                quality_warning=warning,
            )

            results.append((win_schema, w_vals, w_mask))
            win_idx += 1
            if win_idx > max_windows_limit:
                raise DetectionDimensionLimitExceededError(
                    f"Partitioning exceeded window limit of {max_windows_limit}"
                )

            if f_stop >= n_f:
                break
            f_start += cfg.freq_stride

        if t_stop >= n_t:
            break
        t_start += cfg.time_stride

    return results
