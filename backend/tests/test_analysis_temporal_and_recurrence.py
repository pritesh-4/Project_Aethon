"""Tests for temporal characterization and recurrence analysis."""

from datetime import UTC, datetime

import numpy as np
import pytest

from app.analysis.config import RecurrenceConfig
from app.analysis.recurrence import compare_observation_events
from app.analysis.schemas import FrequencyTrajectory, TrajectoryPoint
from app.analysis.temporal import characterize_temporal_behavior
from app.representation.axes import TimeAxisModel


def test_temporal_characterization_continuous_signal() -> None:
    """Test temporal metrics on a continuous trajectory."""
    points = [
        TrajectoryPoint(
            time_index=t,
            freq_index=10,
            time_s=float(t * 2.0),
            freq_hz=1420.0e6,
            amplitude=50.0,
            snr=15.0,
            is_valid=True,
        )
        for t in range(10)
    ]
    trajectory = FrequencyTrajectory(
        points=points,
        total_points=10,
        valid_points=10,
        extraction_method="peak_power",
    )
    values = np.ones((10, 32), dtype=np.float32)
    time_axis = TimeAxisModel(
        sample_count=10,
        sampling_interval_seconds=2.0,
        reference_time_seconds=0.0,
        unit="s",
        is_valid=True,
    )

    result = characterize_temporal_behavior(
        values=values,
        trajectory=trajectory,
        time_axis=time_axis,
    )

    assert result.observed_duration_s == pytest.approx(18.0)  # (9 - 0) * 2.0
    assert result.valid_time_fraction == pytest.approx(1.0)
    assert result.max_consecutive_gap_s == 0.0


def test_temporal_characterization_with_gaps() -> None:
    """Test temporal metrics when a trajectory has gaps (missing points)."""
    # Active at t=0, 1, then gap at t=2, 3, 4, then active at t=5, 6
    active_times = [0, 1, 5, 6]
    points = [
        TrajectoryPoint(
            time_index=t,
            freq_index=10,
            time_s=float(t),
            freq_hz=1420.0e6,
            amplitude=20.0,
            snr=10.0,
            is_valid=True,
        )
        for t in active_times
    ]
    trajectory = FrequencyTrajectory(
        points=points,
        total_points=4,
        valid_points=4,
        extraction_method="peak_power",
    )
    values = np.zeros((10, 32), dtype=np.float32)
    time_axis = TimeAxisModel(
        sample_count=10,
        sampling_interval_seconds=1.0,
        reference_time_seconds=0.0,
        unit="s",
        is_valid=True,
    )

    result = characterize_temporal_behavior(
        values=values,
        trajectory=trajectory,
        time_axis=time_axis,
    )

    assert result.observed_duration_s == pytest.approx(6.0)  # (6 - 0) * 1.0
    assert result.valid_time_fraction == pytest.approx(4 / 7.0, abs=1e-3)
    assert result.max_consecutive_gap_s == 3.0  # gaps at steps 2, 3, 4


def test_recurrence_compatible_events() -> None:
    """Test that two observations of the same target within frequency tolerance match."""
    config = RecurrenceConfig(
        max_frequency_separation_hz=500.0,
        max_time_separation_days=30.0,
        min_target_match_confidence=0.5,
    )

    event_a = {
        "observation_id": "obs-001",
        "center_frequency_hz": 1420405751.0,
        "drift_rate_hz_per_s": 0.15,
        "source_name": "Voyager-1",
        "start_time_utc": datetime(2026, 1, 1, 12, 0, tzinfo=UTC).isoformat(),
    }
    event_b = {
        "observation_id": "obs-002",
        "center_frequency_hz": 1420405800.0,  # 49 Hz diff (< 500 Hz tolerance)
        "drift_rate_hz_per_s": 0.18,
        "source_name": "Voyager-1",
        "start_time_utc": datetime(2026, 1, 5, 12, 0, tzinfo=UTC).isoformat(),  # 4 days diff
    }

    result = compare_observation_events(
        event_a=event_a,
        event_b=event_b,
        config=config,
    )

    assert result.is_compatible is True
    assert result.frequency_delta_hz == pytest.approx(49.0)
    assert result.time_delta_days == pytest.approx(4.0)
    assert result.compatibility_score > 0.7


def test_recurrence_incompatible_frequency() -> None:
    """Test that events beyond frequency tolerance are marked incompatible."""
    config = RecurrenceConfig(max_frequency_separation_hz=100.0)

    event_a = {
        "observation_id": "obs-001",
        "center_frequency_hz": 1420000000.0,
        "source_name": "Target-A",
    }
    event_b = {
        "observation_id": "obs-002",
        "center_frequency_hz": 1420001000.0,  # 1000 Hz diff (> 100 Hz tolerance)
        "source_name": "Target-A",
    }

    result = compare_observation_events(
        event_a=event_a,
        event_b=event_b,
        config=config,
    )

    assert result.is_compatible is False
    assert result.frequency_delta_hz == pytest.approx(1000.0)


def test_recurrence_different_source_names() -> None:
    """Test that events on different targets generate source warning."""
    config = RecurrenceConfig(min_target_match_confidence=0.8)

    event_a = {
        "observation_id": "obs-001",
        "center_frequency_hz": 1420000000.0,
        "source_name": "Target-Alpha",
    }
    event_b = {
        "observation_id": "obs-002",
        "center_frequency_hz": 1420000010.0,
        "source_name": "Target-Beta",
    }

    result = compare_observation_events(
        event_a=event_a,
        event_b=event_b,
        config=config,
    )

    assert any("Source names differ" in w for w in result.warnings)
