"""Unit tests for scientific coordinate axis modeling and coordinate computation."""

from app.representation.axes import FrequencyAxisModel, TimeAxisModel


def test_frequency_axis_ascending_coordinates() -> None:
    """Test channel center calculation for canonical ascending frequency axis."""
    axis = FrequencyAxisModel(
        channel_count=32,
        reference_frequency_hz=1_420_000_000.0,
        channel_spacing_hz=25_000.0,
        reference_channel_index=0,
        unit="Hz",
        source_ordering="ascending",
        is_valid=True,
    )
    # Channel 0 center
    assert axis.compute_channel_center_hz(0) == 1_420_000_000.0
    # Channel 1 center
    assert axis.compute_channel_center_hz(1) == 1_420_025_000.0
    # Channel 31 center
    assert axis.compute_channel_center_hz(31) == 1_420_775_000.0

    # Half-open slice [0, 4)
    centers = axis.compute_channel_centers_hz(0, 4)
    assert centers is not None
    assert len(centers) == 4
    assert centers == [
        1_420_000_000.0,
        1_420_025_000.0,
        1_420_050_000.0,
        1_420_075_000.0,
    ]


def test_frequency_axis_handles_negative_spacing_cleanly() -> None:
    """Channel spacing in FrequencyAxisModel uses absolute spacing in canonical space."""
    axis = FrequencyAxisModel(
        channel_count=10,
        reference_frequency_hz=1_500_000_000.0,
        channel_spacing_hz=-1_000_000.0,  # Negative source spacing
        unit="Hz",
        source_ordering="descending",
        is_valid=True,
    )
    # Canonical channels must still advance with positive frequency steps
    centers = axis.compute_channel_centers_hz(0, 3)
    assert centers == [
        1_500_000_000.0,
        1_501_000_000.0,
        1_502_000_000.0,
    ]


def test_frequency_axis_invalid_or_incomplete_metadata() -> None:
    """Invalid or missing frequency metadata returns None instead of fabricating values."""
    axis_missing = FrequencyAxisModel(
        channel_count=16,
        reference_frequency_hz=None,
        channel_spacing_hz=None,
        is_valid=False,
    )
    assert axis_missing.compute_channel_center_hz(0) is None
    assert axis_missing.compute_channel_centers_hz(0, 5) is None


def test_time_axis_relative_coordinates() -> None:
    """Test relative elapsed time coordinate computation from sampling interval."""
    axis = TimeAxisModel(
        sample_count=100,
        sampling_interval_seconds=0.25,
        reference_time_seconds=0.0,
        start_mjd=59000.0,
        start_time_utc="2020-05-31T00:00:00.000",
        unit="s",
        is_valid=True,
    )
    assert axis.compute_relative_time_seconds(0) == 0.0
    assert axis.compute_relative_time_seconds(1) == 0.25
    assert axis.compute_relative_time_seconds(4) == 1.0

    times = axis.compute_relative_times_seconds(2, 5)
    assert times is not None
    assert len(times) == 3
    assert times == [0.5, 0.75, 1.0]


def test_time_axis_incomplete_metadata() -> None:
    """Missing time sampling interval returns None for coordinates."""
    axis = TimeAxisModel(
        sample_count=50,
        sampling_interval_seconds=None,
        is_valid=False,
    )
    assert axis.compute_relative_time_seconds(0) is None
    assert axis.compute_relative_times_seconds(0, 10) is None
