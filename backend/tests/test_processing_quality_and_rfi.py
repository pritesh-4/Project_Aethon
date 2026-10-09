"""Unit tests for input quality checks, safety caps, and statistical RFI indicators."""

import numpy as np
import pytest

from app.processing.config import (
    ChannelFlaggerConfig,
    LocalFlaggerConfig,
    ProcessingPipelineConfig,
    TimeFlaggerConfig,
)
from app.processing.exceptions import (
    DimensionLimitExceededError,
    EmptyObservationError,
    InvalidProcessingConfigError,
)
from app.processing.models import FlagReason
from app.processing.quality import initialize_quality_mask, validate_observation_input
from app.processing.rfi import assess_rfi
from app.processing.rfi.channel_flags import flag_suspicious_channels
from app.processing.rfi.local_flags import flag_local_outliers
from app.processing.rfi.time_flags import flag_suspicious_time_samples


def test_input_validation_and_safety_limits() -> None:
    """Input validation must enforce 2D shape, positive dimensions, and cell ceilings."""
    # Non-array
    with pytest.raises(InvalidProcessingConfigError):
        validate_observation_input([[1, 2], [3, 4]])  # type: ignore[arg-type]

    # 1D or 3D
    with pytest.raises(InvalidProcessingConfigError):
        validate_observation_input(np.ones(10))

    with pytest.raises(InvalidProcessingConfigError):
        validate_observation_input(np.ones((2, 2, 2)))

    # Zero dimensions
    with pytest.raises(EmptyObservationError):
        validate_observation_input(np.empty((0, 10)))

    # Exceeding cell limits
    with pytest.raises(DimensionLimitExceededError):
        validate_observation_input(np.empty((5000, 5000)))


def test_initialize_quality_mask_identifies_non_finite() -> None:
    """initialize_quality_mask must mark NaNs and Infs with reason NON_FINITE."""
    data = np.ones((4, 4), dtype=float)
    data[0, 1] = np.nan
    data[2, 3] = np.inf

    mask = initialize_quality_mask(data)
    assert mask.flagged_count == 2
    assert mask.primary_mask[0, 1] is np.True_
    assert mask.primary_mask[2, 3] is np.True_
    assert FlagReason.NON_FINITE.value in mask.reason_masks
    assert np.count_nonzero(mask.reason_masks[FlagReason.NON_FINITE.value]) == 2


def test_flag_suspicious_channels() -> None:
    """Channel flagger must identify persistent elevated power in specific channels."""
    rng = np.random.default_rng(42)
    # 20 time steps, 50 frequency channels of Gaussian noise N(0, 1)
    values = rng.standard_normal((20, 50))

    # Inject persistent carrier in channel 25
    values[:, 25] += 15.0

    mask = initialize_quality_mask(values)
    config = ChannelFlaggerConfig(mad_threshold=4.0)

    chan_mask, flagged_chans, evidence = flag_suspicious_channels(values, mask, config)

    assert 25 in flagged_chans
    assert np.all(chan_mask[:, 25])
    assert evidence.flagged_cells_count == 20
    assert "channel_flagger" in evidence.indicator_name


def test_flag_suspicious_time_samples() -> None:
    """Time flagger must identify broadband transient power bursts across channels."""
    rng = np.random.default_rng(42)
    values = rng.standard_normal((25, 40))

    # Inject broadband burst at time index 12
    values[12, :] += 18.0

    mask = initialize_quality_mask(values)
    config = TimeFlaggerConfig(mad_threshold=4.0)

    time_mask, flagged_times, evidence = flag_suspicious_time_samples(values, mask, config)

    assert 12 in flagged_times
    assert np.all(time_mask[12, :])
    assert evidence.flagged_cells_count == 40


def test_flag_local_outliers() -> None:
    """Local flagger must identify isolated impulsive power spikes."""
    rng = np.random.default_rng(42)
    values = rng.standard_normal((15, 30))

    # Inject single impulse spike at (7, 14)
    values[7, 14] += 25.0

    mask = initialize_quality_mask(values)
    config = LocalFlaggerConfig(window_time=5, window_freq=5, mad_threshold=5.0)

    local_mask, evidence = flag_local_outliers(values, mask, config)

    assert local_mask[7, 14] is np.True_
    assert evidence.flagged_cells_count >= 1


def test_clean_control_false_alarm_rate() -> None:
    """Clean Gaussian background must not be systematically over-flagged."""
    rng = np.random.default_rng(100)
    values = rng.standard_normal((32, 64))

    mask = initialize_quality_mask(values)
    cfg = ProcessingPipelineConfig()

    report = assess_rfi(values, mask, cfg)

    # In clean standard Gaussian noise with 4.5 sigma thresholds, false alarm rate is < 2%
    assert report.flagged_fraction < 0.02


def test_multiple_flag_reasons_coexist_independently() -> None:
    """Multiple independent flag conditions must coexist within QualityMask reason layers."""
    values = np.zeros((10, 20), dtype=float)
    # 1. Non-finite
    values[0, 0] = np.nan
    # 2. Channel 5 persistent
    values[:, 5] = 20.0
    # 3. Time 8 broadband
    values[8, :] = 20.0

    mask = initialize_quality_mask(values)
    cfg = ProcessingPipelineConfig()

    report = assess_rfi(values, mask, cfg)

    assert FlagReason.NON_FINITE.value in mask.reason_masks
    assert FlagReason.SUSPICIOUS_CHANNEL.value in mask.reason_masks
    assert FlagReason.SUSPICIOUS_TIME_SAMPLE.value in mask.reason_masks
    assert 5 in report.flagged_channels
    assert 8 in report.flagged_time_samples
