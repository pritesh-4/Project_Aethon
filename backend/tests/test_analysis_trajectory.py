"""Unit tests for frequency trajectory and ridge extraction."""

import numpy as np
import pytest

from app.analysis.config import TrajectoryExtractionConfig
from app.analysis.exceptions import InvalidAnalysisConfigError
from app.analysis.trajectory import extract_frequency_trajectory
from app.processing.models import QualityMask
from app.representation.axes import FrequencyAxisModel, TimeAxisModel


def test_trajectory_extraction_stationary_carrier() -> None:
    """Stationary tone at fixed channel should produce constant frequency trajectory."""
    n_t, n_f = 32, 64
    data = np.ones((n_t, n_f), dtype=np.float64) * 5.0
    target_chan = 20
    data[:, target_chan] += 50.0  # Strong stationary carrier

    t_axis = TimeAxisModel(sampling_interval_seconds=0.5, sample_count=n_t)
    f_axis = FrequencyAxisModel(
        reference_frequency_hz=1.42e9, channel_spacing_hz=1e3, channel_count=n_f
    )

    traj = extract_frequency_trajectory(
        values=data,
        time_axis=t_axis,
        frequency_axis=f_axis,
    )

    assert traj.total_points == n_t
    assert traj.valid_points == n_t
    for pt in traj.points:
        assert pt.is_valid
        assert pt.freq_index == target_chan
        assert pt.freq_hz == 1.42e9 + target_chan * 1e3
        assert pt.snr > 10.0


def test_trajectory_extraction_drifting_signal() -> None:
    """Drifting signal should track channel changes linearly across time steps."""
    n_t, n_f = 20, 64
    data = np.ones((n_t, n_f), dtype=np.float64) * 2.0
    start_chan = 10
    drift_chans_per_step = 1

    for t in range(n_t):
        chan = start_chan + t * drift_chans_per_step
        data[t, chan] += 30.0

    t_axis = TimeAxisModel(sampling_interval_seconds=1.0, sample_count=n_t)
    f_axis = FrequencyAxisModel(
        reference_frequency_hz=1.0e9, channel_spacing_hz=100.0, channel_count=n_f
    )

    traj = extract_frequency_trajectory(
        values=data,
        time_axis=t_axis,
        frequency_axis=f_axis,
    )

    assert traj.valid_points == n_t
    for t, pt in enumerate(traj.points):
        assert pt.is_valid
        assert pt.freq_index == start_chan + t


def test_trajectory_extraction_respects_quality_mask() -> None:
    """Masked samples must be excluded from trajectory extraction."""
    n_t, n_f = 16, 32
    data = np.ones((n_t, n_f), dtype=np.float64) * 2.0
    data[:, 10] += 20.0

    # Mask out time steps 4 and 5 completely
    mask = np.zeros((n_t, n_f), dtype=bool)
    mask[4:6, :] = True
    q_mask = QualityMask(primary_mask=mask)

    traj = extract_frequency_trajectory(
        values=data,
        quality_mask=q_mask,
    )

    assert traj.total_points == 16
    assert traj.valid_points == 14
    assert not traj.points[4].is_valid
    assert not traj.points[5].is_valid


def test_trajectory_extraction_low_snr_rejection() -> None:
    """Noise-only data without prominent carrier should yield zero valid points."""
    rng = np.random.default_rng(42)
    data = rng.normal(loc=1.0, scale=0.1, size=(20, 32))

    cfg = TrajectoryExtractionConfig(snr_threshold=15.0)
    traj = extract_frequency_trajectory(values=data, config=cfg)

    assert traj.total_points == 20
    assert traj.valid_points == 0


def test_trajectory_extraction_invalid_shape_raises_error() -> None:
    """1D or 3D arrays must raise InvalidAnalysisConfigError."""
    with pytest.raises(InvalidAnalysisConfigError):
        extract_frequency_trajectory(values=np.ones(10))
