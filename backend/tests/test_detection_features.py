"""Unit tests for Phase 5 numerical feature extraction from time-frequency analysis windows."""

import numpy as np
import pytest

from app.detection.exceptions import EmptyAnalysisRegionError
from app.detection.features import (
    FEATURE_NAMES,
    FEATURE_SCHEMA_VERSION,
    extract_window_features,
    feature_dict_to_array,
)


def test_feature_schema_and_names_stability() -> None:
    """Ensure feature schema version and names remain strictly stable and documented."""
    assert FEATURE_SCHEMA_VERSION == "1.0.0"
    expected = (
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
    assert FEATURE_NAMES == expected
    assert len(FEATURE_NAMES) == 11


def test_feature_extraction_on_known_clean_noise() -> None:
    """Feature extraction on zero-mean unit-variance noise should have predictable values."""
    rng = np.random.default_rng(42)
    # Gaussian noise with mean 10.0, std 1.0
    data = rng.normal(loc=10.0, scale=1.0, size=(32, 32))
    feats = extract_window_features(data)

    assert len(feats) == 11
    assert 9.5 <= feats["median_level"] <= 10.5
    assert 0.5 <= feats["mad_dispersion"] <= 0.9
    assert 1.0 <= feats["iqr_range"] <= 1.7
    # For standard Gaussian, peak SNR in 1024 samples is typically 3 to 4.5 sigma
    assert feats["peak_snr"] > 2.0
    assert 0.0 <= feats["elevated_sample_fraction"] <= 0.05
    assert all(np.isfinite(val) for val in feats.values())


def test_feature_extraction_on_strong_narrowband_tone() -> None:
    """Narrowband tone in single channel should show high peak SNR and concentration."""
    data = np.zeros((32, 32), dtype=np.float64)
    # Background baseline
    data += 5.0
    # Add strong signal in channel 10 across all time steps
    data[:, 10] += 50.0

    feats = extract_window_features(data)

    assert feats["median_level"] == 5.0
    assert feats["channel_peak_contrast"] > 10.0
    assert feats["narrowband_concentration"] > 0.8
    assert feats["temporal_persistence"] == 1.0


def test_feature_extraction_with_mask() -> None:
    """Masked samples should be excluded from statistics."""
    data = np.ones((16, 16), dtype=np.float64) * 2.0
    # Add corrupted huge outlier
    data[0, 0] = 999999.0

    mask = np.zeros((16, 16), dtype=bool)
    mask[0, 0] = True

    feats = extract_window_features(data, window_mask=mask)
    assert feats["median_level"] == 2.0
    assert feats["mad_dispersion"] == 0.0
    assert feats["peak_snr"] == 0.0


def test_feature_extraction_all_masked_raises_error() -> None:
    """Completely masked or non-finite window should raise EmptyAnalysisRegionError."""
    data = np.full((16, 16), np.nan)
    with pytest.raises(EmptyAnalysisRegionError):
        extract_window_features(data)

    data_finite = np.ones((8, 8))
    full_mask = np.ones((8, 8), dtype=bool)
    with pytest.raises(EmptyAnalysisRegionError):
        extract_window_features(data_finite, window_mask=full_mask)


def test_feature_dict_to_array_ordering() -> None:
    """feature_dict_to_array must return ordered array matching FEATURE_NAMES exactly."""
    sample_dict = {name: float(idx * 2) for idx, name in enumerate(FEATURE_NAMES)}
    arr = feature_dict_to_array(sample_dict)

    assert arr.shape == (11,)
    assert arr.dtype == np.float64
    for idx, name in enumerate(FEATURE_NAMES):
        assert arr[idx] == sample_dict[name]
