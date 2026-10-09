"""Tests for linear de-drift array transformation."""

import numpy as np
import pytest

from app.analysis.config import DeDriftConfig
from app.analysis.dedrift import apply_linear_dedrift
from app.representation.axes import FrequencyAxisModel, TimeAxisModel


def test_dedrift_source_immutability() -> None:
    """Test that applying de-drift does not mutate the source array."""
    data = np.ones((10, 20), dtype=np.float32)
    original_copy = data.copy()

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

    config = DeDriftConfig(fill_value=0.0)
    dedrifted_arr, _ = apply_linear_dedrift(
        values=data,
        drift_rate_hz_per_s=2.0,
        time_axis=time_axis,
        frequency_axis=freq_axis,
        config=config,
    )

    np.testing.assert_array_equal(data, original_copy)
    assert dedrifted_arr is not data


def test_dedrift_aligns_positive_slope_to_vertical() -> None:
    """Test that a +1 bin/step drifting signal becomes a vertical column after de-drift."""
    n_time = 16
    n_freq = 32
    dt = 1.0
    df = 1.0
    drift_rate = 1.0  # +1 Hz/s -> 1 bin/sec

    data = np.zeros((n_time, n_freq), dtype=np.float32)
    start_bin = 8
    for t in range(n_time):
        f_bin = start_bin + t
        data[t, f_bin] = 10.0

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

    dedrifted_arr, _ = apply_linear_dedrift(
        values=data,
        drift_rate_hz_per_s=drift_rate,
        time_axis=time_axis,
        frequency_axis=freq_axis,
    )

    # In the de-drifted frame, all energy at each time step should align at reference bin 8
    for t in range(n_time):
        assert dedrifted_arr[t, start_bin] == pytest.approx(10.0)
        assert np.sum(dedrifted_arr[t, :]) == pytest.approx(10.0)


def test_dedrift_aligns_negative_slope_to_vertical() -> None:
    """Test that a -1 bin/step drifting signal becomes vertical."""
    n_time = 16
    n_freq = 32
    dt = 1.0
    df = 1.0
    drift_rate = -1.0  # -1 Hz/s

    data = np.zeros((n_time, n_freq), dtype=np.float32)
    start_bin = 20
    for t in range(n_time):
        f_bin = start_bin - t
        data[t, f_bin] = 7.5

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

    dedrifted_arr, _ = apply_linear_dedrift(
        values=data,
        drift_rate_hz_per_s=drift_rate,
        time_axis=time_axis,
        frequency_axis=freq_axis,
    )

    for t in range(n_time):
        assert dedrifted_arr[t, start_bin] == pytest.approx(7.5)


def test_dedrift_zero_drift_identity() -> None:
    """Test that de-drifting with rate 0.0 leaves data unchanged."""
    data = np.random.default_rng(42).standard_normal((10, 20)).astype(np.float32)

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

    dedrifted_arr, result = apply_linear_dedrift(
        values=data,
        drift_rate_hz_per_s=0.0,
        time_axis=time_axis,
        frequency_axis=freq_axis,
    )

    np.testing.assert_array_equal(dedrifted_arr, data)
    assert result.clipped_energy_fraction == 0.0


def test_dedrift_no_circular_wraparound() -> None:
    """Test that shifted bins falling outside the matrix boundary are clipped, not wrapped."""
    n_time = 10
    n_freq = 15
    data = np.zeros((n_time, n_freq), dtype=np.float32)
    # Energy at frequency bin 1
    data[:, 1] = 5.0

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

    # Large positive drift shifts to negative bins
    dedrifted_arr, result = apply_linear_dedrift(
        values=data,
        drift_rate_hz_per_s=2.0,  # shift = -2 * t bins
        time_axis=time_axis,
        frequency_axis=freq_axis,
        config=DeDriftConfig(fill_value=0.0),
    )

    # For t > 0, 1 - 2*t < 0 so it should be clipped out and replaced with fill_value (0.0)
    for t in range(1, n_time):
        assert dedrifted_arr[t, -1] == 0.0
        assert dedrifted_arr[t, -2] == 0.0
    assert result.clipped_energy_fraction > 0.0
