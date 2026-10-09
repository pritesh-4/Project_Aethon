"""Integration tests verifying SetigenAdapter functionality and canonical conversion."""

import numpy as np

from app.synthetic.config import (
    NoiseBackgroundConfig,
    ObservationGeometryConfig,
    SignalConfig,
)
from app.synthetic.setigen_adapter import SetigenAdapter


def test_setigen_adapter_generates_canonical_slice_and_ground_truth() -> None:
    """SetigenAdapter must generate frames conforming to AETHON's canonical slice contract."""
    geom = ObservationGeometryConfig(
        n_time=16,
        n_freq=64,
        sampling_interval_s=1.0,
        f_min_hz=1420.0e6,
        f_step_hz=1000.0,
    )
    bg = NoiseBackgroundConfig(mean=0.0, std_dev=1.0)
    sig = SignalConfig(
        signal_id="stg_sig_test",
        family="drifting_tone",
        f_start_hz=1420.0e6 + 20 * 1000.0,
        drift_rate_hz_per_s=500.0,  # 0.5 channels per sec
        snr=15.0,
        t_start_s=0.0,
        duration_s=16.0,
    )

    adapter = SetigenAdapter()
    slice_obj, obs_gt = adapter.generate_observation(
        geometry=geom,
        background=bg,
        signals=[sig],
        dataset_id="ds_stg",
        observation_id="obs_stg_01",
    )

    # 1. Check canonical slice dimensions
    assert slice_obj.values.shape == (16, 64)
    assert slice_obj.time_axis.sample_count == 16
    assert slice_obj.frequency_axis.channel_count == 64
    assert slice_obj.source_format == "setigen_synthetic_frame"
    assert slice_obj.reader_backend == "setigen_adapter"

    # 2. Check ground truth
    assert not obs_gt.is_negative_control
    assert obs_gt.target_count == 1
    gt_sig = obs_gt.signals[0]
    assert gt_sig.signal_id == "stg_sig_test"
    assert len(gt_sig.frequency_trajectory_hz) == 16
    assert gt_sig.drift_rate_hz_per_s == 500.0


def test_setigen_adapter_negative_control() -> None:
    """SetigenAdapter must produce clean negative control frames when given an empty signal list."""
    geom = ObservationGeometryConfig(n_time=8, n_freq=32)
    bg = NoiseBackgroundConfig(mean=0.0, std_dev=1.0)

    adapter = SetigenAdapter()
    slice_obj, obs_gt = adapter.generate_observation(
        geometry=geom,
        background=bg,
        signals=[],
        dataset_id="ds_stg_neg",
        observation_id="obs_stg_neg",
    )

    assert obs_gt.is_negative_control
    assert obs_gt.target_count == 0
    assert len(obs_gt.signals) == 0
    assert slice_obj.shape == (8, 32)
    assert np.all(np.isfinite(slice_obj.values))
