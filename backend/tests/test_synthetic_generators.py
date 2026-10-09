"""Unit tests for synthetic noise background and target signal generators."""

import numpy as np
import pytest

from app.synthetic.backgrounds import generate_noise_background
from app.synthetic.config import (
    NoiseBackgroundConfig,
    ObservationGeometryConfig,
    SignalConfig,
)
from app.synthetic.exceptions import (
    InvalidSyntheticConfigError,
    SignalOutOfBoundsError,
)
from app.synthetic.signals import (
    BroadbandEmissionGenerator,
    BurstGenerator,
    DriftingToneGenerator,
    StationaryToneGenerator,
    get_signal_generator,
)


def test_background_noise_determinism_and_reproducibility() -> None:
    """Identical seeds and configurations must produce bit-for-bit identical background matrices."""
    geom = ObservationGeometryConfig(n_time=32, n_freq=64)
    bg_cfg = NoiseBackgroundConfig(background_type="gaussian", mean=0.0, std_dev=1.5)

    rng1 = np.random.default_rng(12345)
    mat1, meta1 = generate_noise_background(geom, bg_cfg, rng1)

    rng2 = np.random.default_rng(12345)
    mat2, meta2 = generate_noise_background(geom, bg_cfg, rng2)

    np.testing.assert_array_equal(mat1, mat2)
    assert meta1["empirical_mean"] == meta2["empirical_mean"]
    assert meta1["empirical_std_dev"] == meta2["empirical_std_dev"]


def test_background_noise_distinct_seeds_produce_different_samples() -> None:
    """Different random seeds must produce distinct stochastic noise realizations."""
    geom = ObservationGeometryConfig(n_time=32, n_freq=64)
    bg_cfg = NoiseBackgroundConfig(background_type="gaussian", mean=0.0, std_dev=1.0)

    mat1, _ = generate_noise_background(geom, bg_cfg, np.random.default_rng(100))
    mat2, _ = generate_noise_background(geom, bg_cfg, np.random.default_rng(200))

    assert not np.array_equal(mat1, mat2)


def test_background_noise_statistical_properties_within_tolerance() -> None:
    """Gaussian background sample mean and std should match theoretical parameters within bounds."""
    # Use moderately large sample to test statistical convergence (32 x 512 = 16384 samples)
    geom = ObservationGeometryConfig(n_time=32, n_freq=512)
    bg_cfg = NoiseBackgroundConfig(background_type="gaussian", mean=5.0, std_dev=2.0)

    mat, meta = generate_noise_background(geom, bg_cfg, np.random.default_rng(42))

    assert np.all(np.isfinite(mat))
    assert mat.shape == (32, 512)
    assert mat.dtype == np.float32

    # Standard error of mean: sigma / sqrt(N) = 2.0 / sqrt(16384) = 2.0 / 128 = 0.0156
    # 4-sigma tolerance: ~0.065
    assert abs(meta["empirical_mean"] - 5.0) < 0.1
    # Standard deviation should be close to 2.0
    assert abs(meta["empirical_std_dev"] - 2.0) < 0.1


def test_background_flat_baseline_and_time_varying_noise() -> None:
    """Verify flat baseline tilt and time-varying noise variance modulation."""
    geom = ObservationGeometryConfig(n_time=32, n_freq=64)

    # Flat baseline with spectral tilt
    bg_baseline = NoiseBackgroundConfig(
        background_type="flat_baseline",
        baseline_offset=15.0,
        baseline_slope=4.0,
        std_dev=0.5,
    )
    mat_base, _ = generate_noise_background(geom, bg_baseline, np.random.default_rng(42))
    assert np.all(np.isfinite(mat_base))
    assert np.mean(mat_base) > 10.0

    # Time-varying noise
    bg_varying = NoiseBackgroundConfig(
        background_type="time_varying_noise",
        mean=0.0,
        std_dev=1.0,
        time_variation_amplitude=0.5,
    )
    mat_var, _ = generate_noise_background(geom, bg_varying, np.random.default_rng(42))
    assert np.all(np.isfinite(mat_var))
    assert mat_var.shape == (32, 64)


def test_background_invalid_config_rejection() -> None:
    """Invalid noise configurations must raise InvalidSyntheticConfigError."""
    with pytest.raises(InvalidSyntheticConfigError) as exc_info:
        NoiseBackgroundConfig(std_dev=-1.0)
    assert "std_dev must be strictly positive" in str(exc_info.value)

    with pytest.raises(InvalidSyntheticConfigError):
        NoiseBackgroundConfig(time_variation_amplitude=1.5)


def test_observation_geometry_resource_limits_and_validation() -> None:
    """Observation geometry must enforce strictly positive dimensions and safety cell caps."""
    with pytest.raises(InvalidSyntheticConfigError):
        ObservationGeometryConfig(n_time=0)

    with pytest.raises(InvalidSyntheticConfigError):
        ObservationGeometryConfig(n_freq=-5)

    with pytest.raises(InvalidSyntheticConfigError):
        ObservationGeometryConfig(sampling_interval_s=0.0)

    with pytest.raises(InvalidSyntheticConfigError):
        ObservationGeometryConfig(f_step_hz=-100.0)

    # Test exceeding safety ceiling
    with pytest.raises(InvalidSyntheticConfigError) as exc_limit:
        ObservationGeometryConfig(n_time=8000, n_freq=8000)
    assert "exceeds safety limit" in str(exc_limit.value)


def test_stationary_tone_generator_and_ground_truth() -> None:
    """Stationary tone generator must place power precisely at target frequency channel."""
    geom = ObservationGeometryConfig(
        n_time=16,
        n_freq=64,
        sampling_interval_s=1.0,
        f_min_hz=1000.0,
        f_step_hz=10.0,
    )
    target_f = 1000.0 + 25 * 10.0  # Channel 25

    sig_cfg = SignalConfig(
        family="stationary_tone",
        f_start_hz=target_f,
        snr=8.0,
        t_start_s=2.0,
        duration_s=10.0,
    )
    noise_sigma = 2.0
    generator = StationaryToneGenerator()
    res = generator.generate(geom, sig_cfg, noise_sigma)

    assert res.signal_matrix.shape == (16, 64)
    # Check that ONLY channel 25 has non-zero values
    non_zero_coords = np.argwhere(res.signal_matrix > 0)
    assert len(non_zero_coords) == 10  # 10 time steps (t=2 to t=12)
    assert np.all(non_zero_coords[:, 1] == 25)

    # Check amplitude: SNR=8, sigma=2 => A=16.0
    assert pytest.approx(res.peak_amplitude, 1e-4) == 16.0
    assert pytest.approx(res.effective_snr, 1e-4) == 8.0
    assert res.bounding_box == (2, 12, 25, 26)
    assert not res.is_clipped


def test_drifting_tone_positive_and_negative_drift() -> None:
    """Drifting tone generator must track linear frequency trajectory without wrap-around."""
    geom = ObservationGeometryConfig(
        n_time=10,
        n_freq=50,
        sampling_interval_s=1.0,
        f_min_hz=100.0,
        f_step_hz=10.0,
    )
    generator = DriftingToneGenerator()

    # Positive drift: +20 Hz/s = +2 channels per time sample
    # t=0: chan 10 (f=200); t=1: chan 12 (f=220); t=2: chan 14; ...
    cfg_pos = SignalConfig(
        family="drifting_tone",
        f_start_hz=200.0,
        drift_rate_hz_per_s=20.0,
        snr=10.0,
        t_start_s=0.0,
        duration_s=5.0,
    )
    res_pos = generator.generate(geom, cfg_pos, noise_std_dev=1.0)
    assert len(res_pos.time_indices) == 5
    assert res_pos.frequency_indices == [10, 12, 14, 16, 18]
    assert not res_pos.is_clipped

    # Negative drift with boundary clipping
    # Starts at chan 3 (f=130), drift = -20 Hz/s (-2 chans/s)
    # t=0 -> chan 3; t=1 -> chan 1; t=2 -> chan -1 (CLIPPED, must NOT wrap to channel 49!)
    cfg_neg = SignalConfig(
        family="drifting_tone",
        f_start_hz=130.0,
        drift_rate_hz_per_s=-20.0,
        snr=10.0,
        t_start_s=0.0,
        duration_s=5.0,
    )
    res_neg = generator.generate(geom, cfg_neg, noise_std_dev=1.0)
    assert res_neg.is_clipped
    assert res_neg.clipped_samples > 0
    assert res_pos.signal_matrix.shape == (10, 50)
    # Crucial check: must NOT wrap around to high channels
    assert np.all(res_neg.signal_matrix[:, 40:] == 0.0)


def test_burst_generator_and_broadband_emission() -> None:
    """Verify localized bursts and multi-channel broadband emissions."""
    geom = ObservationGeometryConfig(
        n_time=20,
        n_freq=50,
        sampling_interval_s=1.0,
        f_min_hz=100.0,
        f_step_hz=5.0,
    )

    # Burst
    burst_gen = BurstGenerator()
    burst_cfg = SignalConfig(
        family="burst",
        f_start_hz=150.0,  # chan 10
        bandwidth_hz=20.0,  # 4 channels
        t_start_s=5.0,
        duration_s=3.0,
        snr=15.0,
    )
    res_burst = burst_gen.generate(geom, burst_cfg, 1.0)
    assert res_burst.bounding_box[0] == 5
    assert res_burst.bounding_box[1] == 8
    assert res_burst.support_cells_count > 0

    # Broadband emission
    bb_gen = BroadbandEmissionGenerator()
    bb_cfg = SignalConfig(
        family="broadband_emission",
        f_start_hz=120.0,
        bandwidth_hz=50.0,  # 10 channels wide
        t_start_s=2.0,
        duration_s=10.0,
        amplitude=25.0,
        shape_profile="gaussian",
    )
    res_bb = bb_gen.generate(geom, bb_cfg, 1.0)
    assert res_bb.peak_amplitude == 25.0
    assert len(res_bb.frequency_indices) >= 10


def test_boundary_edge_placements() -> None:
    """Signals positioned at channel 0 and channel N-1 must succeed without error."""
    geom = ObservationGeometryConfig(n_time=8, n_freq=32, f_min_hz=100.0, f_step_hz=10.0)
    gen = StationaryToneGenerator()

    # Lower edge: Channel 0
    res_low = gen.generate(
        geom,
        SignalConfig(family="stationary_tone", f_start_hz=100.0, snr=5.0),
        1.0,
    )
    assert res_low.frequency_indices == [0]
    assert res_low.signal_matrix[0, 0] > 0

    # Upper edge: Channel 31
    f_high = 100.0 + 31 * 10.0
    res_high = gen.generate(
        geom,
        SignalConfig(family="stationary_tone", f_start_hz=f_high, snr=5.0),
        1.0,
    )
    assert res_high.frequency_indices == [31]
    assert res_high.signal_matrix[0, 31] > 0


def test_out_of_bounds_signal_raises_error() -> None:
    """A signal placed completely outside the band must raise SignalOutOfBoundsError."""
    geom = ObservationGeometryConfig(n_time=8, n_freq=32, f_min_hz=100.0, f_step_hz=10.0)
    gen = StationaryToneGenerator()

    # 1000.0 Hz maps to channel 90, far outside 0..31
    with pytest.raises(SignalOutOfBoundsError):
        gen.generate(
            geom,
            SignalConfig(family="stationary_tone", f_start_hz=1000.0, snr=5.0),
            1.0,
        )


def test_get_signal_generator_registry_dispatch() -> None:
    """Signal generator registry must dispatch to proper classes and reject unsupported families."""
    assert isinstance(get_signal_generator("stationary_tone"), StationaryToneGenerator)
    assert isinstance(get_signal_generator("drifting_tone"), DriftingToneGenerator)

    with pytest.raises(InvalidSyntheticConfigError):
        get_signal_generator("unknown_unsupported_family")
