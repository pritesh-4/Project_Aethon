"""Tests for scientific benchmark evaluation of Doppler drift against Phase 3 ground truth."""

import numpy as np
import pytest

from app.analysis.evaluation import DriftAnalysisEvaluator
from app.representation.axes import FrequencyAxisModel, TimeAxisModel
from app.synthetic.ground_truth import InjectedSignalGroundTruth, ObservationGroundTruth


def _create_synthetic_drifting_test_case(
    n_time: int = 24,
    n_freq: int = 48,
    dt: float = 1.0,
    df: float = 1.0,
    drift_rate_hz_per_s: float = 1.5,
    snr: float = 20.0,
) -> tuple[np.ndarray, ObservationGroundTruth, TimeAxisModel, FrequencyAxisModel]:
    """Create controlled synthetic spectrogram and ground truth with known drifting signal."""
    data = np.random.default_rng(42).standard_normal((n_time, n_freq)).astype(np.float32)

    start_t = 2
    stop_t = 22
    start_f = 10
    f0 = 1420.0e6 + start_f * df

    # Inject linear ridge
    for t in range(start_t, stop_t):
        f_idx = round(start_f + (drift_rate_hz_per_s * (t * dt)) / df)
        if 0 <= f_idx < n_freq:
            data[t, f_idx] += float(snr)

    f_min = start_f
    f_max = round(start_f + (drift_rate_hz_per_s * (stop_t * dt)) / df)
    f_box_start = min(f_min, f_max)
    f_box_stop = max(f_min, f_max) + 2

    gt_sig = InjectedSignalGroundTruth(
        signal_id="sig-drift-01",
        family="linear_chirp",
        time_start_index=start_t,
        time_stop_index=stop_t,
        frequency_start_index=f_box_start,
        frequency_stop_index=f_box_stop,
        bounding_box=(start_t, stop_t, f_box_start, f_box_stop),
        center_frequency_hz=f0,
        drift_rate_hz_per_s=drift_rate_hz_per_s,
        peak_amplitude=float(snr),
        effective_snr=snr,
        support_cells_count=(stop_t - start_t),
    )
    ground_truth = ObservationGroundTruth(
        dataset_id="test_suite",
        observation_id="obs_drift_synth",
        is_negative_control=False,
        target_count=1,
        signals=[gt_sig],
    )
    time_axis = TimeAxisModel(
        sample_count=n_time,
        sampling_interval_seconds=dt,
        reference_time_seconds=0.0,
        unit="s",
        is_valid=True,
    )
    freq_axis = FrequencyAxisModel(
        channel_count=n_freq,
        reference_frequency_hz=1420.0e6,
        channel_spacing_hz=df,
        unit="Hz",
        is_valid=True,
    )

    return data, ground_truth, time_axis, freq_axis


def test_drift_evaluator_recovers_known_drifting_signal() -> None:
    """DriftAnalysisEvaluator should measure synthetic drift rate with high precision."""
    data, gt, time_axis, freq_axis = _create_synthetic_drifting_test_case(
        drift_rate_hz_per_s=2.0,
        snr=25.0,
    )

    evaluator = DriftAnalysisEvaluator(tolerance_hz_per_s=0.25)
    report = evaluator.evaluate_targets(
        values=data,
        ground_truth=gt,
        time_axis=time_axis,
        frequency_axis=freq_axis,
    )

    assert report.total_evaluated_targets == 1
    assert report.successfully_fitted_targets == 1
    assert report.target_recovery_rate == 1.0
    assert report.mean_absolute_drift_error_hz_per_s < 0.25
    assert len(report.items) == 1

    item = report.items[0]
    assert item.is_recovered is True
    assert item.true_drift_rate_hz_per_s == 2.0
    assert item.estimated_drift_rate_hz_per_s == pytest.approx(2.0, abs=0.2)
    assert item.absolute_drift_error_hz_per_s is not None
    assert item.absolute_drift_error_hz_per_s < 0.2
    assert report.scientific_disclaimer is not None


def test_drift_evaluator_stationary_tone() -> None:
    """DriftAnalysisEvaluator should verify 0.0 Hz/s for a stationary tone."""
    data, gt, time_axis, freq_axis = _create_synthetic_drifting_test_case(
        drift_rate_hz_per_s=0.0,
        snr=20.0,
    )

    evaluator = DriftAnalysisEvaluator(tolerance_hz_per_s=0.1)
    report = evaluator.evaluate_targets(
        values=data,
        ground_truth=gt,
        time_axis=time_axis,
        frequency_axis=freq_axis,
    )

    assert report.target_recovery_rate == 1.0
    assert report.items[0].estimated_drift_rate_hz_per_s == pytest.approx(0.0, abs=0.05)
