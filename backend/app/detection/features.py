"""Interpretable numerical feature extraction for time-frequency analysis windows."""

import numpy as np

from app.detection.exceptions import EmptyAnalysisRegionError
from app.processing.models import GlobalStatistics
from app.processing.statistics import compute_mad

FEATURE_SCHEMA_VERSION: str = "1.0.0"

FEATURE_NAMES: tuple[str, ...] = (
    "median_level",
    "mad_dispersion",
    "robust_sigma",
    "iqr_range",
    "upper_quantile_contrast",
    "peak_snr",
    "elevated_sample_fraction",
    "channel_peak_contrast",
    "narrowband_concentration",
    "temporal_persistence",
    "temporal_variability",
)

NORMAL_CONSISTENCY_FACTOR: float = 1.482602218505602


def extract_window_features(
    window_data: np.ndarray,
    window_mask: np.ndarray | None = None,
    global_stats: GlobalStatistics | None = None,
) -> dict[str, float]:
    """Extract 11 interpretable, distribution-free numerical features from a window.

    Args:
        window_data: 2D numpy array of shape (n_time, n_freq).
        window_mask: Optional 2D boolean mask where True indicates excluded / flagged cells.
        global_stats: Optional pre-computed global observation statistics for reference.

    Returns:
        dict[str, float]: Mapping of feature names in FEATURE_NAMES to finite float values.

    Raises:
        EmptyAnalysisRegionError: If the window contains no finite unmasked samples.
    """
    finite_mask = np.isfinite(window_data)
    if window_mask is not None:
        valid_mask = finite_mask & (~window_mask)
    else:
        valid_mask = finite_mask

    valid_samples = window_data[valid_mask]
    if valid_samples.size == 0:
        raise EmptyAnalysisRegionError(
            "Window contains zero valid finite samples for feature extraction."
        )

    n_t, n_f = window_data.shape

    # 1. Intensity moments
    med_val = float(np.median(valid_samples))
    mad_val = compute_mad(valid_samples, median=med_val)
    robust_sigma = mad_val * NORMAL_CONSISTENCY_FACTOR
    denom_sigma = max(1e-12, robust_sigma)

    p25 = float(np.percentile(valid_samples, 25))
    p75 = float(np.percentile(valid_samples, 75))
    p95 = float(np.percentile(valid_samples, 95))
    max_val = float(np.max(valid_samples))

    iqr_range = max(0.0, p75 - p25)
    upper_quantile_contrast = max(0.0, (p95 - med_val) / denom_sigma)
    peak_snr = max(0.0, (max_val - med_val) / denom_sigma)

    elevated_count = np.count_nonzero(valid_samples > (med_val + 3.0 * denom_sigma))
    elevated_sample_fraction = float(elevated_count / valid_samples.size)

    # 2. Frequency distribution moments
    # Compute per-channel medians across finite valid time steps
    sanitized_2d = np.copy(window_data)
    sanitized_2d[~valid_mask] = med_val

    chan_medians = np.median(sanitized_2d, axis=0)
    max_chan_med = float(np.max(chan_medians))
    channel_peak_contrast = max(0.0, (max_chan_med - med_val) / denom_sigma)

    # Narrowband concentration: power in peak channel divided by total window power
    # Use positive energy relative to window median
    pos_energy = np.maximum(0.0, sanitized_2d - med_val)
    chan_energy = np.sum(pos_energy, axis=0)
    total_energy = float(np.sum(chan_energy))
    if total_energy > 1e-12:
        narrowband_concentration = float(np.max(chan_energy) / total_energy)
    else:
        narrowband_concentration = 1.0 / max(1, n_f)

    # 3. Temporal moments
    # Persistence: in peak frequency channel, fraction of time steps elevated
    peak_chan_idx = int(np.argmax(chan_medians))
    peak_col = sanitized_2d[:, peak_chan_idx]
    elevated_t_count = np.count_nonzero(peak_col > (med_val + 2.0 * denom_sigma))
    temporal_persistence = float(elevated_t_count / max(1, n_t))

    # Temporal variability: MAD of time-integration profile across channels
    time_profile = np.median(sanitized_2d, axis=1)
    time_profile_med = float(np.median(time_profile))
    time_profile_mad = compute_mad(time_profile, median=time_profile_med)
    temporal_variability = float(time_profile_mad / max(1e-12, abs(time_profile_med)))

    features = {
        "median_level": round(med_val, 6),
        "mad_dispersion": round(mad_val, 6),
        "robust_sigma": round(robust_sigma, 6),
        "iqr_range": round(iqr_range, 6),
        "upper_quantile_contrast": round(upper_quantile_contrast, 6),
        "peak_snr": round(peak_snr, 6),
        "elevated_sample_fraction": round(elevated_sample_fraction, 6),
        "channel_peak_contrast": round(channel_peak_contrast, 6),
        "narrowband_concentration": round(narrowband_concentration, 6),
        "temporal_persistence": round(temporal_persistence, 6),
        "temporal_variability": round(temporal_variability, 6),
    }

    return features


def feature_dict_to_array(feature_dict: dict[str, float]) -> np.ndarray:
    """Convert feature dictionary to ordered 1D numpy vector according to FEATURE_NAMES."""
    return np.array([feature_dict[name] for name in FEATURE_NAMES], dtype=np.float64)
