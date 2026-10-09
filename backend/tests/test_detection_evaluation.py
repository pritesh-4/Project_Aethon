"""Unit tests for synthetic benchmark evaluation framework and metrics."""

import numpy as np

from app.detection.config import DetectionPipelineConfig, WindowConfig
from app.detection.evaluation import (
    DetectionBenchmarkEvaluator,
    EvaluationSample,
)
from app.synthetic.ground_truth import InjectedSignalGroundTruth, ObservationGroundTruth


def _create_mock_signal(
    signal_id: str,
    family: str,
    t_start: int,
    t_stop: int,
    f_start: int,
    f_stop: int,
    snr: float = 10.0,
) -> InjectedSignalGroundTruth:
    """Helper creating a valid InjectedSignalGroundTruth record."""
    return InjectedSignalGroundTruth(
        signal_id=signal_id,
        family=family,
        time_start_index=t_start,
        time_stop_index=t_stop,
        frequency_start_index=f_start,
        frequency_stop_index=f_stop,
        bounding_box=(t_start, t_stop, f_start, f_stop),
        center_frequency_hz=1.42e9,
        peak_amplitude=10.0,
        effective_snr=snr,
        support_cells_count=(t_stop - t_start) * (f_stop - f_start),
    )


def test_evaluator_trivial_control_and_leakage_safety() -> None:
    """Trivial control should produce zero detections and zero false alarms."""
    evaluator = DetectionBenchmarkEvaluator()

    rng = np.random.default_rng(100)
    ref_samples = [
        EvaluationSample(
            observation_id=f"ref_{i}",
            values=rng.normal(0, 1, (32, 32)),
            ground_truth=ObservationGroundTruth(
                dataset_id="test_ds",
                observation_id=f"ref_{i}",
                is_negative_control=True,
            ),
        )
        for i in range(5)
    ]

    eval_samples = [
        EvaluationSample(
            observation_id=f"eval_{i}",
            values=rng.normal(0, 1, (32, 32)),
            ground_truth=ObservationGroundTruth(
                dataset_id="test_ds",
                observation_id=f"eval_{i}",
                is_negative_control=True,
            ),
        )
        for i in range(3)
    ]

    report = evaluator.evaluate_detector(
        detector_name="trivial_control",
        reference_samples=ref_samples,
        evaluation_samples=eval_samples,
    )

    assert report.detector_name == "trivial_control"
    assert report.metrics.total_detected_windows == 0
    assert report.metrics.noise_false_positive_rate == 0.0


def test_evaluator_baseline_on_synthetic_injections() -> None:
    """Evaluator on statistical baseline should successfully recover strong injected signals."""
    evaluator = DetectionBenchmarkEvaluator(min_overlap_iou=0.01)

    rng = np.random.default_rng(200)

    # Reference split (negative controls)
    ref_samples = [
        EvaluationSample(
            observation_id=f"ref_{i}",
            values=rng.normal(10.0, 1.0, (64, 64)),
            ground_truth=ObservationGroundTruth(
                dataset_id="bench_ds",
                observation_id=f"ref_{i}",
                is_negative_control=True,
            ),
        )
        for i in range(6)
    ]

    # Evaluation split: 1 negative control, 2 positive observations
    neg_eval = EvaluationSample(
        observation_id="eval_neg_0",
        values=rng.normal(10.0, 1.0, (64, 64)),
        ground_truth=ObservationGroundTruth(
            dataset_id="bench_ds",
            observation_id="eval_neg_0",
            is_negative_control=True,
        ),
    )

    # Positive obs 1: stationary tone
    pos_val_1 = rng.normal(10.0, 1.0, (64, 64))
    pos_val_1[16:48, 20:25] += 25.0
    sig1 = _create_mock_signal("sig_stat", "stationary_tone", 16, 48, 20, 25, snr=25.0)
    pos_eval_1 = EvaluationSample(
        observation_id="eval_pos_1",
        values=pos_val_1,
        ground_truth=ObservationGroundTruth(
            dataset_id="bench_ds",
            observation_id="eval_pos_1",
            is_negative_control=False,
            target_count=1,
            signals=[sig1],
        ),
    )

    # Positive obs 2: burst
    pos_val_2 = rng.normal(10.0, 1.0, (64, 64))
    pos_val_2[10:18, 30:50] += 30.0
    sig2 = _create_mock_signal("sig_burst", "finite_burst", 10, 18, 30, 50, snr=30.0)
    pos_eval_2 = EvaluationSample(
        observation_id="eval_pos_2",
        values=pos_val_2,
        ground_truth=ObservationGroundTruth(
            dataset_id="bench_ds",
            observation_id="eval_pos_2",
            is_negative_control=False,
            target_count=1,
            signals=[sig2],
        ),
    )

    eval_samples = [neg_eval, pos_eval_1, pos_eval_2]

    cfg = DetectionPipelineConfig(
        window=WindowConfig(time_size=16, freq_size=16, time_stride=8, freq_stride=8)
    )

    report = evaluator.evaluate_detector(
        detector_name="statistical_baseline",
        reference_samples=ref_samples,
        evaluation_samples=eval_samples,
        config=cfg,
    )

    assert report.metrics.positive_observations_count == 2
    assert report.metrics.negative_control_count == 1
    assert report.metrics.total_injected_targets == 2
    assert report.metrics.matched_targets_count == 2
    assert report.metrics.target_recall == 1.0
    assert report.metrics.observation_detection_rate == 1.0

    # Family breakdown
    assert "stationary_tone" in report.family_breakdown
    assert report.family_breakdown["stationary_tone"]["recovery_rate"] == 1.0
    assert "finite_burst" in report.family_breakdown
    assert report.family_breakdown["finite_burst"]["recovery_rate"] == 1.0
