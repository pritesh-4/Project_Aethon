"""Unit tests for raw data immutability, baseline estimation, and optional transformations."""

import numpy as np

from app.processing.baseline import estimate_baseline
from app.processing.config import (
    BaselineConfig,
    ProcessingPipelineConfig,
    TransformationConfig,
)
from app.processing.pipeline import run_processing_pipeline
from app.processing.quality import initialize_quality_mask
from app.processing.transformations import apply_transformations
from app.representation.axes import FrequencyAxisModel, TimeAxisModel


def _create_axes(n_t: int, n_f: int) -> tuple[TimeAxisModel, FrequencyAxisModel]:
    t_axis = TimeAxisModel(sample_count=n_t, sampling_interval_seconds=1.0)
    f_axis = FrequencyAxisModel(
        channel_count=n_f, reference_frequency_hz=1420.0e6, channel_spacing_hz=1000.0
    )
    return t_axis, f_axis


def test_raw_data_immutability_guarantee() -> None:
    """Processing pipeline must never modify the input array in-place."""
    rng = np.random.default_rng(42)
    original = rng.standard_normal((16, 32))
    input_copy = np.copy(original)

    t_axis, f_axis = _create_axes(16, 32)
    # Enable all transformations
    cfg = ProcessingPipelineConfig(
        transformations=TransformationConfig(
            subtract_channel_background=True,
            robust_standardization=True,
            apply_mask_in_output=True,
        )
    )

    res = run_processing_pipeline(original, "test_immutability", t_axis, f_axis, cfg)

    # 1. The input array passed to function is unmodified
    np.testing.assert_array_equal(original, input_copy)

    # 2. The raw_values in result is identical to input
    np.testing.assert_array_equal(res.raw_values, input_copy)

    # 3. Transformed values are different
    assert res.transformed_values is not None
    assert not np.array_equal(res.transformed_values, input_copy)


def test_baseline_estimation_per_channel_and_moving_median() -> None:
    """estimate_baseline must produce accurate 2D background estimates."""
    rng = np.random.default_rng(42)
    # Add known DC channel offsets: channel c has baseline 10.0 + c
    n_t, n_f = 20, 10
    noise = rng.standard_normal((n_t, n_f))
    offsets = np.arange(10, 20, dtype=float)
    data = noise + offsets

    mask = initialize_quality_mask(data)

    # 1. Per-channel median
    cfg_chan = BaselineConfig(method="per_channel_median")
    baseline_chan, meta_chan = estimate_baseline(data, mask, cfg_chan)

    assert baseline_chan is not None
    assert baseline_chan.shape == (20, 10)
    # Channel medians should be close to offsets
    assert np.allclose(baseline_chan[0, :], offsets, atol=0.8)
    assert meta_chan["method"] == "per_channel_median"

    # 2. Moving median 2D
    cfg_mov = BaselineConfig(method="moving_median_2d", window_time=5, window_freq=5)
    baseline_mov, meta_mov = estimate_baseline(data, mask, cfg_mov)

    assert baseline_mov is not None
    assert baseline_mov.shape == (20, 10)
    assert meta_mov["method"] == "moving_median_2d"

    # 3. None
    cfg_none = BaselineConfig(method="none")
    baseline_none, meta_none = estimate_baseline(data, mask, cfg_none)
    assert baseline_none is None
    assert meta_none["method"] == "none"


def test_optional_transformations_and_manifest_ledger() -> None:
    """apply_transformations must record each operation in the transformation history."""
    rng = np.random.default_rng(42)
    data = rng.standard_normal((10, 20)) + 50.0  # DC offset of 50
    mask = initialize_quality_mask(data)
    mask.primary_mask[0, 0] = True  # Flag one cell

    baseline_2d = np.full((10, 20), 50.0)

    cfg = TransformationConfig(
        subtract_channel_background=True,
        robust_standardization=True,
        apply_mask_in_output=True,
    )

    transformed, history, semantics, unit = apply_transformations(
        data, mask, cfg, baseline_2d=baseline_2d
    )

    assert transformed is not None
    assert len(history) == 3
    assert history[0].operation == "subtract_channel_background"
    assert history[1].operation == "robust_standardization"
    assert history[2].operation == "apply_mask_in_output"

    # Flagged sample [0, 0] must be NaN in masked output
    assert np.isnan(transformed[0, 0])
    # Unflagged samples must be finite
    assert np.all(np.isfinite(transformed[1:, :]))
    assert semantics == "robust_standardized_z_score"
    assert unit == "dimensionless_sigma"


def test_disabled_transformations_returns_none() -> None:
    """When all transformations are False, transformed array is None and raw data untouched."""
    data = np.ones((5, 5))
    mask = initialize_quality_mask(data)
    cfg = TransformationConfig()

    transformed, history, semantics, unit = apply_transformations(data, mask, cfg)

    assert transformed is None
    assert history == []
    assert semantics == "uncalibrated_detector_power"
    assert unit is None
