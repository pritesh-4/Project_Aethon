"""Tests for linear frequency drift hypothesis search."""

import numpy as np
import pytest

from app.analysis.config import DriftSearchConfig
from app.analysis.drift_search import search_linear_drift_hypotheses
from app.analysis.exceptions import HypothesisLimitExceededError
from app.representation.axes import FrequencyAxisModel, TimeAxisModel


def test_drift_search_recovers_known_slope() -> None:
    """Test that hypothesis search finds the maximum-scoring rate for an injected slope."""
    n_time = 32
    n_freq = 64
    dt = 1.0  # seconds
    df = 1.0  # Hz
    drift_hz_per_sec = 2.0  # +2 Hz/s -> 2 bins per second

    data = np.zeros((n_time, n_freq), dtype=np.float32)
    start_bin = 10
    for t_idx in range(n_time):
        f_bin = round(start_bin + drift_hz_per_sec * (t_idx * dt) / df)
        if 0 <= f_bin < n_freq:
            data[t_idx, f_bin] = 10.0

    time_axis = TimeAxisModel(
        sample_count=n_time,
        sampling_interval_seconds=dt,
        reference_time_seconds=0.0,
        unit="s",
        is_valid=True,
    )
    freq_axis = FrequencyAxisModel(
        channel_count=n_freq,
        reference_frequency_hz=1420e6,
        channel_spacing_hz=df,
        unit="Hz",
        is_valid=True,
    )

    config = DriftSearchConfig(
        min_drift_hz_per_sec=-5.0,
        max_drift_hz_per_sec=5.0,
        step_hz_per_sec=1.0,
        max_hypotheses=50,
    )

    result = search_linear_drift_hypotheses(
        values=data,
        time_axis=time_axis,
        frequency_axis=freq_axis,
        config=config,
    )

    assert result.best_drift_rate_hz_per_s == pytest.approx(2.0, abs=0.1)
    assert not result.is_on_boundary
    assert result.hypotheses_evaluated == 11
    assert result.best_score > 0.0


def test_drift_search_detects_boundary_winner() -> None:
    """Test that is_on_boundary is set to True when best rate is at search limits."""
    n_time = 20
    n_freq = 64
    dt = 1.0
    df = 1.0
    # Signal drifts fast: +10 Hz/s
    data = np.zeros((n_time, n_freq), dtype=np.float32)
    for t in range(n_time):
        f = round(5 + 10.0 * t)
        if 0 <= f < n_freq:
            data[t, f] = 15.0

    time_axis = TimeAxisModel(
        sample_count=n_time,
        sampling_interval_seconds=dt,
        reference_time_seconds=0.0,
        unit="s",
        is_valid=True,
    )
    freq_axis = FrequencyAxisModel(
        channel_count=n_freq,
        reference_frequency_hz=1420e6,
        channel_spacing_hz=df,
        unit="Hz",
        is_valid=True,
    )

    # Grid only searches [-2.0, 2.0]
    config = DriftSearchConfig(
        min_drift_hz_per_sec=-2.0,
        max_drift_hz_per_sec=2.0,
        step_hz_per_sec=1.0,
        max_hypotheses=10,
    )

    result = search_linear_drift_hypotheses(
        values=data,
        time_axis=time_axis,
        frequency_axis=freq_axis,
        config=config,
    )

    assert result.is_on_boundary is True
    assert result.best_drift_rate_hz_per_s in (-2.0, 2.0)


def test_drift_search_exceeding_hypothesis_limit_raises() -> None:
    """Test that asking for too fine a grid raises HypothesisLimitExceededError."""
    data = np.zeros((10, 20), dtype=np.float32)
    time_axis = TimeAxisModel(
        sample_count=10,
        sampling_interval_seconds=1.0,
        reference_time_seconds=0.0,
        unit="s",
        is_valid=True,
    )
    freq_axis = FrequencyAxisModel(
        channel_count=20,
        reference_frequency_hz=1420e6,
        channel_spacing_hz=1.0,
        unit="Hz",
        is_valid=True,
    )

    config = DriftSearchConfig(
        min_drift_hz_per_sec=-100.0,
        max_drift_hz_per_sec=100.0,
        step_hz_per_sec=0.01,  # 20,001 hypotheses
        max_hypotheses=500,
    )

    with pytest.raises(HypothesisLimitExceededError):
        search_linear_drift_hypotheses(
            values=data,
            time_axis=time_axis,
            frequency_axis=freq_axis,
            config=config,
        )


def test_drift_search_stationary_signal() -> None:
    """Test that stationary 0 Hz/s tone scores highest at 0.0 Hz/s hypothesis."""
    n_time = 25
    n_freq = 50
    data = np.zeros((n_time, n_freq), dtype=np.float32)
    data[:, 25] = 20.0  # vertical stationary ridge

    time_axis = TimeAxisModel(
        sample_count=n_time,
        sampling_interval_seconds=1.0,
        reference_time_seconds=0.0,
        unit="s",
        is_valid=True,
    )
    freq_axis = FrequencyAxisModel(
        channel_count=n_freq,
        reference_frequency_hz=1420e6,
        channel_spacing_hz=1.0,
        unit="Hz",
        is_valid=True,
    )

    config = DriftSearchConfig(
        min_drift_hz_per_sec=-3.0,
        max_drift_hz_per_sec=3.0,
        step_hz_per_sec=1.0,
    )

    result = search_linear_drift_hypotheses(
        values=data,
        time_axis=time_axis,
        frequency_axis=freq_axis,
        config=config,
    )

    assert result.best_drift_rate_hz_per_s == pytest.approx(0.0, abs=1e-5)
    assert not result.is_on_boundary
