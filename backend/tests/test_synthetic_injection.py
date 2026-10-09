"""Unit tests for synthetic signal injection and canonical contract compliance."""

import numpy as np
import pytest

from app.representation.models import CanonicalSlice
from app.synthetic.backgrounds import generate_noise_background
from app.synthetic.config import (
    NoiseBackgroundConfig,
    ObservationGeometryConfig,
    SignalConfig,
)
from app.synthetic.injection import inject_signals


def test_injection_preserves_untouched_background_and_modifies_only_intended_support() -> None:
    """Injection must preserve background and alter only the mathematical signal support."""
    geom = ObservationGeometryConfig(
        n_time=16,
        n_freq=64,
        sampling_interval_s=1.0,
        f_min_hz=1000.0,
        f_step_hz=10.0,
    )
    bg_cfg = NoiseBackgroundConfig(mean=0.0, std_dev=1.0)
    bg_mat, bg_meta = generate_noise_background(geom, bg_cfg, np.random.default_rng(42))

    # Single tone at channel 20, active for t in [2, 8)
    sig_cfg = SignalConfig(
        signal_id="test_tone_01",
        family="stationary_tone",
        f_start_hz=1000.0 + 20 * 10.0,
        snr=10.0,
        t_start_s=2.0,
        duration_s=6.0,
    )

    res = inject_signals(
        background_matrix=bg_mat,
        background_metadata=bg_meta,
        geometry=geom,
        injections=[sig_cfg],
        dataset_id="ds_test",
        observation_id="obs_test_01",
    )

    # 1. Untouched background is identical to original
    np.testing.assert_array_equal(res.untouched_background, bg_mat)

    # 2. Diff between combined and background
    diff = res.canonical_slice.values - bg_mat

    # Check non-zero cells in diff
    support_coords = np.argwhere(diff != 0)
    assert len(support_coords) == 6  # 6 time steps
    assert np.all(support_coords[:, 1] == 20)
    assert set(support_coords[:, 0]) == set(range(2, 8))

    # Check that outside support, diff is exactly 0.0
    mask_outside = np.ones((16, 64), dtype=bool)
    mask_outside[2:8, 20] = False
    assert np.all(diff[mask_outside] == 0.0)


def test_injection_multiple_signals_retains_distinct_ids() -> None:
    """Injecting multiple signals must maintain distinct ground-truth records without collisions."""
    geom = ObservationGeometryConfig(
        n_time=20,
        n_freq=80,
        sampling_interval_s=1.0,
        f_min_hz=500.0,
        f_step_hz=5.0,
    )
    bg_cfg = NoiseBackgroundConfig(std_dev=1.0)
    bg_mat, bg_meta = generate_noise_background(geom, bg_cfg, np.random.default_rng(42))

    sig1 = SignalConfig(
        signal_id="sig_alpha",
        family="stationary_tone",
        f_start_hz=500.0 + 10 * 5.0,
        snr=12.0,
    )
    sig2 = SignalConfig(
        signal_id="sig_beta",
        family="drifting_tone",
        f_start_hz=500.0 + 40 * 5.0,
        drift_rate_hz_per_s=10.0,
        snr=15.0,
    )

    res = inject_signals(
        background_matrix=bg_mat,
        background_metadata=bg_meta,
        geometry=geom,
        injections=[sig1, sig2],
        dataset_id="ds_multi",
        observation_id="obs_multi_01",
    )

    assert not res.ground_truth.is_negative_control
    assert res.ground_truth.target_count == 2
    assert len(res.ground_truth.signals) == 2
    assert res.ground_truth.signals[0].signal_id == "sig_alpha"
    assert res.ground_truth.signals[1].signal_id == "sig_beta"
    assert len(res.isolated_signals) == 2


def test_negative_control_injection() -> None:
    """Negative controls (empty injection list) must produce valid background-only slices."""
    geom = ObservationGeometryConfig(n_time=10, n_freq=30)
    bg_cfg = NoiseBackgroundConfig(std_dev=1.0)
    bg_mat, bg_meta = generate_noise_background(geom, bg_cfg, np.random.default_rng(42))

    res = inject_signals(
        background_matrix=bg_mat,
        background_metadata=bg_meta,
        geometry=geom,
        injections=[],
        dataset_id="ds_neg",
        observation_id="obs_neg_01",
    )

    assert res.ground_truth.is_negative_control
    assert res.ground_truth.target_count == 0
    assert len(res.ground_truth.signals) == 0
    np.testing.assert_array_equal(res.canonical_slice.values, bg_mat)


def test_injection_snr_and_canonical_slice_structure() -> None:
    """Verify exact peak SNR amplitude calculation and canonical slice compliance."""
    geom = ObservationGeometryConfig(
        n_time=8,
        n_freq=32,
        sampling_interval_s=0.5,
        f_min_hz=1420.0e6,
        f_step_hz=1000.0,
    )
    # Background with std_dev = 2.5
    bg_cfg = NoiseBackgroundConfig(mean=0.0, std_dev=2.5)
    bg_mat, bg_meta = generate_noise_background(geom, bg_cfg, np.random.default_rng(42))

    # Requested SNR = 6.0 => A = 6.0 * 2.5 = 15.0
    sig = SignalConfig(
        family="stationary_tone",
        f_start_hz=1420.0e6 + 5 * 1000.0,
        snr=6.0,
    )

    res = inject_signals(
        background_matrix=bg_mat,
        background_metadata=bg_meta,
        geometry=geom,
        injections=[sig],
        dataset_id="ds_snr",
        observation_id="obs_snr_01",
    )

    gt = res.ground_truth.signals[0]
    assert pytest.approx(gt.peak_amplitude, 1e-4) == 15.0
    assert pytest.approx(gt.effective_snr, 1e-4) == 6.0
    assert gt.snr_convention == "peak_amplitude_over_noise_std_dev"

    # Canonical slice validation
    slice_obj = res.canonical_slice
    assert isinstance(slice_obj, CanonicalSlice)
    assert slice_obj.observation_id == "obs_snr_01"
    assert slice_obj.shape == (8, 32)
    assert slice_obj.values.shape == (8, 32)
    assert slice_obj.time_axis.sample_count == 8
    assert slice_obj.frequency_axis.channel_count == 32
    assert slice_obj.frequency_axis.source_ordering == "ascending"
