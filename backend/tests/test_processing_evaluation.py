"""Tests for synthetic contamination injection and preprocessing evaluation."""

import numpy as np

from app.processing.config import ProcessingPipelineConfig
from app.processing.evaluation import (
    PreprocessingEvaluationMetrics,
    PreprocessingEvaluator,
    SyntheticContaminationInjector,
)
from app.processing.pipeline import run_processing_pipeline
from app.representation.axes import FrequencyAxisModel, TimeAxisModel
from app.synthetic.backgrounds import generate_noise_background
from app.synthetic.config import (
    NoiseBackgroundConfig,
    ObservationGeometryConfig,
    SignalConfig,
)
from app.synthetic.injection import inject_signals


def _create_axes(n_t: int, n_f: int) -> tuple[TimeAxisModel, FrequencyAxisModel]:
    t_axis = TimeAxisModel(sample_count=n_t, sampling_interval_seconds=1.0)
    f_axis = FrequencyAxisModel(
        channel_count=n_f, reference_frequency_hz=1420.0e6, channel_spacing_hz=1000.0
    )
    return t_axis, f_axis


def test_synthetic_contamination_injector_non_destructive() -> None:
    """Contamination injector must produce clean isolated regions without mutating input."""
    base = np.zeros((20, 40), dtype=float)
    base_copy = base.copy()

    # 1. Broadband burst
    burst_data, burst_reg = SyntheticContaminationInjector.inject_broadband_burst(
        base, time_idx=5, amplitude=25.0
    )
    assert np.array_equal(base, base_copy)  # original untouched
    assert burst_reg.artifact_type == "broadband_burst"
    assert burst_reg.time_start == 5 and burst_reg.time_stop == 6
    assert np.all(burst_data[5, :] == 25.0)

    # 2. Persistent channel
    chan_data, chan_reg = SyntheticContaminationInjector.inject_persistent_channel(
        base, channel_idx=15, amplitude=30.0
    )
    assert np.array_equal(base, base_copy)
    assert chan_reg.artifact_type == "persistent_channel"
    assert chan_reg.freq_start == 15 and chan_reg.freq_stop == 16
    assert np.all(chan_data[:, 15] == 30.0)

    # 3. Impulse spike
    spike_data, spike_reg = SyntheticContaminationInjector.inject_impulsive_spike(
        base, time_idx=8, channel_idx=22, amplitude=50.0
    )
    assert np.array_equal(base, base_copy)
    assert spike_reg.artifact_type == "impulsive_spike"
    assert spike_data[8, 22] == 50.0
    assert spike_data[8, 21] == 0.0


def test_evaluator_recovers_contamination_metrics() -> None:
    """Evaluator must accurately quantify contamination flagging and clean background rates."""
    rng = np.random.default_rng(42)
    # 30 time steps, 50 channels
    clean_obs = rng.standard_normal((30, 50))

    # Inject broadband burst at t=10 and persistent channel at f=35
    obs_with_rfi, reg_burst = SyntheticContaminationInjector.inject_broadband_burst(
        clean_obs, time_idx=10, amplitude=25.0
    )
    obs_with_rfi, reg_chan = SyntheticContaminationInjector.inject_persistent_channel(
        obs_with_rfi, channel_idx=35, amplitude=25.0
    )
    contaminations = [reg_burst, reg_chan]

    t_axis, f_axis = _create_axes(30, 50)
    cfg = ProcessingPipelineConfig()
    result = run_processing_pipeline(obs_with_rfi, "obs_eval_01", t_axis, f_axis, config=cfg)

    evaluator = PreprocessingEvaluator()
    metrics: PreprocessingEvaluationMetrics = evaluator.evaluate(
        result=result,
        contaminations=contaminations,
        original_input_copy=obs_with_rfi,
    )

    assert metrics.raw_array_preserved is True
    assert metrics.contamination_cells_count == (
        50 + 30 - 1
    )  # 50 + 30 minus intersection at (10, 35)
    assert metrics.contamination_flag_rate == 1.0  # All RFI cells flagged
    assert metrics.clean_false_flag_rate is not None
    assert metrics.clean_false_flag_rate < 0.02


def test_evaluator_with_synthetic_target_signal() -> None:
    """Evaluator must quantify target signal retention when target signal and RFI are present."""
    geom = ObservationGeometryConfig(
        n_time=32,
        n_freq=64,
        sampling_interval_s=1.0,
        f_min_hz=1000.0,
        f_step_hz=10.0,
    )
    bg_cfg = NoiseBackgroundConfig(mean=0.0, std_dev=1.0)
    bg_mat, bg_meta = generate_noise_background(geom, bg_cfg, np.random.default_rng(101))

    # Target stationary tone at channel 12
    sig_cfg = SignalConfig(
        signal_id="sig_tone_12",
        family="stationary_tone",
        f_start_hz=1000.0 + 12 * 10.0,
        snr=10.0,
        t_start_s=4.0,
        duration_s=20.0,
    )

    inj_result = inject_signals(
        background_matrix=bg_mat,
        background_metadata=bg_meta,
        geometry=geom,
        injections=[sig_cfg],
        dataset_id="eval_dataset",
        observation_id="obs_target_01",
    )
    raw_obs = inj_result.canonical_slice.values
    ground_truth = inj_result.ground_truth

    # Inject simulated RFI at channel 45 (distinct from target channel 12)
    obs_with_rfi, reg_chan = SyntheticContaminationInjector.inject_persistent_channel(
        raw_obs, channel_idx=45, amplitude=25.0
    )

    process_cfg = ProcessingPipelineConfig()
    result = run_processing_pipeline(
        obs_with_rfi,
        "obs_target_01",
        inj_result.canonical_slice.time_axis,
        inj_result.canonical_slice.frequency_axis,
        config=process_cfg,
    )

    evaluator = PreprocessingEvaluator()
    metrics = evaluator.evaluate(
        result=result,
        ground_truth=ground_truth,
        contaminations=[reg_chan],
        original_input_copy=obs_with_rfi,
    )

    assert metrics.raw_array_preserved is True
    assert metrics.target_signal_cells_count > 0
    # Default pipeline preserves target in raw array, unmasked in transformed array
    assert metrics.target_signal_retention_rate == 1.0
    # Contaminated channel 45 is flagged
    assert metrics.contamination_flag_rate == 1.0


def test_overlapping_target_and_contamination_handling() -> None:
    """Overlapping target signal and contamination must not corrupt evaluation metrics."""
    geom = ObservationGeometryConfig(
        n_time=25,
        n_freq=50,
        sampling_interval_s=1.0,
        f_min_hz=500.0,
        f_step_hz=5.0,
    )
    bg_cfg = NoiseBackgroundConfig(mean=0.0, std_dev=1.0)
    bg_mat, bg_meta = generate_noise_background(geom, bg_cfg, np.random.default_rng(202))

    sig_cfg = SignalConfig(
        signal_id="sig_overlap_target",
        family="stationary_tone",
        f_start_hz=500.0 + 20 * 5.0,
        snr=8.0,
        t_start_s=2.0,
        duration_s=15.0,
    )

    inj_result = inject_signals(
        background_matrix=bg_mat,
        background_metadata=bg_meta,
        geometry=geom,
        injections=[sig_cfg],
        dataset_id="eval_dataset",
        observation_id="obs_overlap_01",
    )
    raw_obs = inj_result.canonical_slice.values
    ground_truth = inj_result.ground_truth

    # Inject broadband burst that deliberately intersects the target signal at time 10
    obs_with_overlap, reg_burst = SyntheticContaminationInjector.inject_broadband_burst(
        raw_obs, time_idx=10, amplitude=30.0
    )

    process_cfg = ProcessingPipelineConfig()
    result = run_processing_pipeline(
        obs_with_overlap,
        "obs_overlap_01",
        inj_result.canonical_slice.time_axis,
        inj_result.canonical_slice.frequency_axis,
        config=process_cfg,
    )

    evaluator = PreprocessingEvaluator()
    metrics = evaluator.evaluate(
        result=result,
        ground_truth=ground_truth,
        contaminations=[reg_burst],
        original_input_copy=obs_with_overlap,
    )

    assert metrics.raw_array_preserved is True
    assert metrics.contamination_flag_rate == 1.0
    assert metrics.target_signal_flag_rate is not None
    assert metrics.target_signal_flag_rate > 0.0  # Cell at time 10 flagged due to burst evidence


def test_evaluator_zero_denominators_clean_control() -> None:
    """Negative control with zero contaminations or target signals returns None for rates."""
    clean_obs = np.ones((20, 30), dtype=float)
    t_axis, f_axis = _create_axes(20, 30)
    cfg = ProcessingPipelineConfig()
    result = run_processing_pipeline(clean_obs, "obs_clean_01", t_axis, f_axis, config=cfg)

    evaluator = PreprocessingEvaluator()
    metrics = evaluator.evaluate(result=result, ground_truth=None, contaminations=None)

    assert metrics.contamination_cells_count == 0
    assert metrics.target_signal_cells_count == 0
    assert metrics.contamination_flag_rate is None
    assert metrics.target_signal_flag_rate is None
    assert metrics.clean_background_cells_count == 600
    assert metrics.clean_false_flag_rate == 0.0
