"""Unit tests for robust statistical estimators, MAD calculations, and edge-case handling."""

import numpy as np
import pytest

from app.processing.statistics import (
    NORMAL_CONSISTENCY_FACTOR,
    compute_channel_statistics,
    compute_mad,
    compute_robust_statistics,
    compute_robust_z_scores,
    compute_time_statistics,
)


def test_mad_computation_known_values() -> None:
    """compute_mad must calculate exact median absolute deviation."""
    # Data: [1, 2, 3, 4, 5, 6, 7] -> median = 4
    # |x - 4| = [3, 2, 1, 0, 1, 2, 3] -> sorted: [0, 1, 1, 2, 2, 3, 3] -> median = 2.0
    arr = np.array([1, 2, 3, 4, 5, 6, 7], dtype=float)
    assert compute_mad(arr) == 2.0

    # Normal consistency factor test
    assert pytest.approx(NORMAL_CONSISTENCY_FACTOR, 1e-4) == 1.4826


def test_mad_empty_and_constant_arrays() -> None:
    """Empty and constant arrays must return MAD = 0.0 without errors."""
    assert compute_mad(np.array([], dtype=float)) == 0.0
    assert compute_mad(np.array([42.0, 42.0, 42.0], dtype=float)) == 0.0


def test_robust_statistics_comprehensive_moments() -> None:
    """compute_robust_statistics must calculate robust and classical moments correctly."""
    data = np.arange(1, 101, dtype=float).reshape((10, 10))
    stats = compute_robust_statistics(data)

    assert stats.total_samples == 100
    assert stats.finite_samples == 100
    assert stats.non_finite_samples == 0
    assert stats.mean == 50.5
    assert stats.median == 50.5
    assert stats.min_value == 1.0
    assert stats.max_value == 100.0
    assert stats.p25 == 25.75
    assert stats.p75 == 75.25
    assert stats.mad is not None and stats.mad > 0.0
    assert stats.robust_sigma is not None and stats.robust_sigma > 0.0


def test_robust_statistics_with_mask_and_non_finite() -> None:
    """Non-finite and masked samples must be excluded from summary moment calculations."""
    data = np.array([[1.0, 2.0, np.nan], [4.0, 1000.0, 6.0]], dtype=float)
    # Mask out the 1000.0 outlier
    mask = np.array([[False, False, False], [False, True, False]], dtype=bool)

    stats = compute_robust_statistics(data, mask=mask)

    assert stats.total_samples == 6
    assert stats.finite_samples == 5
    assert stats.non_finite_samples == 1
    # Samples evaluated: [1.0, 2.0, 4.0, 6.0] -> median = 3.0
    assert stats.median == 3.0
    assert stats.mean == 3.25
    assert stats.max_value == 6.0


def test_robust_statistics_all_invalid() -> None:
    """All-NaN matrix must return safe None moments without crashing."""
    data = np.full((5, 5), np.nan)
    stats = compute_robust_statistics(data)

    assert stats.total_samples == 25
    assert stats.finite_samples == 0
    assert stats.non_finite_samples == 25
    assert stats.median is None
    assert stats.mean is None
    assert stats.mad is None


def test_channel_and_time_statistics() -> None:
    """Per-channel and per-time statistics must calculate 1D medians and MADs along each axis."""
    data = np.array(
        [
            [10.0, 20.0, 30.0],
            [12.0, 22.0, 32.0],
            [14.0, 24.0, 34.0],
            [16.0, 26.0, 36.0],
        ],
        dtype=float,
    )  # shape (4, 3): 4 time samples, 3 channels

    # Channel stats (across time, length 3)
    c_meds, c_mads, c_sigmas = compute_channel_statistics(data)
    assert len(c_meds) == 3
    assert np.allclose(c_meds, [13.0, 23.0, 33.0])
    assert len(c_mads) == 3
    assert len(c_sigmas) == 3

    # Time stats (across freq, length 4)
    t_meds, t_mads, t_sigmas = compute_time_statistics(data)
    assert len(t_meds) == 4
    assert np.allclose(t_meds, [20.0, 22.0, 24.0, 26.0])
    assert len(t_mads) == 4
    assert len(t_sigmas) == 4


def test_compute_robust_z_scores_zero_dispersion() -> None:
    """Robust z-scores on constant array must handle zero dispersion without dividing by zero."""
    arr = np.full(10, 5.0)
    z = compute_robust_z_scores(arr)
    assert np.all(np.isfinite(z))
    assert np.all(z == 0.0)
