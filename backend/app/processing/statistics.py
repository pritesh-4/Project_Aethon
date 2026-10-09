"""Robust statistical estimators and distribution characterization utilities."""

import numpy as np

from app.processing.models import GlobalStatistics

# Consistency factor to make MAD an asymptotically unbiased estimator of standard deviation
# for a normal distribution: 1 / norm.ppf(0.75) ≈ 1.482602218505602
NORMAL_CONSISTENCY_FACTOR: float = 1.482602218505602


def compute_mad(arr: np.ndarray, median: float | None = None) -> float:
    """Compute the Median Absolute Deviation (MAD) of a 1D or flattened numeric array.

    Formula:
        MAD = median(|x - median(x)|)

    Args:
        arr: 1D array of finite numeric samples.
        median: Pre-computed median of arr, or None to calculate automatically.

    Returns:
        float: Empirical median absolute deviation. Returns 0.0 if arr is empty or constant.
    """
    if arr.size == 0:
        return 0.0
    med = float(np.median(arr)) if median is None else median
    return float(np.median(np.abs(arr - med)))


def compute_robust_statistics(
    data: np.ndarray,
    mask: np.ndarray | None = None,
) -> GlobalStatistics:
    """Compute comprehensive robust and sample statistics over finite, unmasked elements.

    Args:
        data: 2D numpy observation array.
        mask: Optional boolean mask where True indicates excluded / flagged samples.

    Returns:
        GlobalStatistics model capturing robust and classical moments.
    """
    total_samples = int(data.size)
    finite_mask = np.isfinite(data)
    finite_samples = int(np.count_nonzero(finite_mask))
    non_finite_samples = total_samples - finite_samples

    # Filter to valid (finite and unflagged) samples
    if mask is not None:
        valid_mask = finite_mask & (~mask)
    else:
        valid_mask = finite_mask

    valid_elements = data[valid_mask]

    if valid_elements.size == 0:
        return GlobalStatistics(
            total_samples=total_samples,
            finite_samples=finite_samples,
            non_finite_samples=non_finite_samples,
            estimator_notes="No finite unflagged samples available to compute statistics.",
        )

    mean_val = float(np.mean(valid_elements))
    std_val = float(np.std(valid_elements))
    med_val = float(np.median(valid_elements))
    mad_val = compute_mad(valid_elements, median=med_val)
    robust_sigma_val = mad_val * NORMAL_CONSISTENCY_FACTOR
    p25_val = float(np.percentile(valid_elements, 25))
    p75_val = float(np.percentile(valid_elements, 75))
    min_val = float(np.min(valid_elements))
    max_val = float(np.max(valid_elements))

    notes = (
        f"Calculated over {valid_elements.size}/{total_samples} valid samples. "
        "Robust sigma assumes standard normal consistency factor (1.4826 * MAD)."
    )

    return GlobalStatistics(
        total_samples=total_samples,
        finite_samples=finite_samples,
        non_finite_samples=non_finite_samples,
        mean=round(mean_val, 6),
        std_dev=round(std_val, 6),
        median=round(med_val, 6),
        mad=round(mad_val, 6),
        robust_sigma=round(robust_sigma_val, 6),
        p25=round(p25_val, 6),
        p75=round(p75_val, 6),
        min_value=round(min_val, 6),
        max_value=round(max_val, 6),
        estimator_notes=notes,
    )


def compute_channel_statistics(
    data: np.ndarray,
    mask: np.ndarray | None = None,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Compute per-frequency-channel median, MAD, and robust sigma across time samples.

    Matrix layout: data[time_index, frequency_index] (Axis 0 = Time, Axis 1 = Frequency)

    Returns:
        tuple of (medians, mads, robust_sigmas) as 1D arrays of length n_freq.
    """
    _n_t, n_f = data.shape
    medians = np.zeros(n_f, dtype=np.float64)
    mads = np.zeros(n_f, dtype=np.float64)

    for c in range(n_f):
        col = data[:, c]
        valid_mask = np.isfinite(col)
        if mask is not None:
            valid_mask = valid_mask & (~mask[:, c])

        col_valid = col[valid_mask]
        if col_valid.size > 0:
            col_med = float(np.median(col_valid))
            medians[c] = col_med
            mads[c] = compute_mad(col_valid, median=col_med)
        else:
            medians[c] = np.nan
            mads[c] = np.nan

    robust_sigmas = mads * NORMAL_CONSISTENCY_FACTOR
    return medians, mads, robust_sigmas


def compute_time_statistics(
    data: np.ndarray,
    mask: np.ndarray | None = None,
) -> tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Compute per-time-sample median, MAD, and robust sigma across frequency channels.

    Matrix layout: data[time_index, frequency_index] (Axis 0 = Time, Axis 1 = Frequency)

    Returns:
        tuple of (medians, mads, robust_sigmas) as 1D arrays of length n_time.
    """
    n_t, _n_f = data.shape
    medians = np.zeros(n_t, dtype=np.float64)
    mads = np.zeros(n_t, dtype=np.float64)

    for t in range(n_t):
        row = data[t, :]
        valid_mask = np.isfinite(row)
        if mask is not None:
            valid_mask = valid_mask & (~mask[t, :])

        row_valid = row[valid_mask]
        if row_valid.size > 0:
            row_med = float(np.median(row_valid))
            medians[t] = row_med
            mads[t] = compute_mad(row_valid, median=row_med)
        else:
            medians[t] = np.nan
            mads[t] = np.nan

    robust_sigmas = mads * NORMAL_CONSISTENCY_FACTOR
    return medians, mads, robust_sigmas


def compute_robust_z_scores(
    arr: np.ndarray,
    center: float | None = None,
    scale: float | None = None,
    epsilon: float = 1e-12,
) -> np.ndarray:
    """Compute robust modified z-scores: z = (x - center) / max(scale, epsilon)."""
    c = float(np.median(arr[np.isfinite(arr)])) if center is None else center
    if scale is None:
        valid = arr[np.isfinite(arr)]
        s = compute_mad(valid, median=c) * NORMAL_CONSISTENCY_FACTOR
    else:
        s = scale

    safe_scale = max(s, epsilon)
    return (arr - c) / safe_scale
