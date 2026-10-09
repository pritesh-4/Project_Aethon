"""Unit tests for benchmark evaluation framework, metrics, and ground-truth matching."""

import numpy as np
import pytest

from app.synthetic.backgrounds import generate_noise_background
from app.synthetic.config import (
    NoiseBackgroundConfig,
    ObservationGeometryConfig,
    SignalConfig,
)
from app.synthetic.evaluation import (
    BenchmarkEvaluator,
    CandidatePrediction,
    ToyThresholdBaselineDetector,
    compute_box_iou,
)
from app.synthetic.ground_truth import InjectedSignalGroundTruth, ObservationGroundTruth
from app.synthetic.injection import inject_signals


def _create_mock_gt(
    obs_id: str,
    signal_id: str,
    box: tuple[int, int, int, int],
    family: str = "stationary_tone",
    drift_rate: float = 0.0,
) -> ObservationGroundTruth:
    """Helper creating a minimal ObservationGroundTruth for deterministic testing."""
    sig = InjectedSignalGroundTruth(
        signal_id=signal_id,
        family=family,
        time_start_index=box[0],
        time_stop_index=box[1],
        frequency_start_index=box[2],
        frequency_stop_index=box[3],
        bounding_box=box,
        center_frequency_hz=1420.0e6,
        drift_rate_hz_per_s=drift_rate,
        peak_amplitude=10.0,
        effective_snr=10.0,
        support_cells_count=(box[1] - box[0]) * (box[3] - box[2]),
    )
    return ObservationGroundTruth(
        dataset_id="test_suite",
        observation_id=obs_id,
        is_negative_control=False,
        target_count=1,
        signals=[sig],
    )


def test_box_iou_computation() -> None:
    """compute_box_iou must accurately return intersection over union."""
    box_a = (0, 10, 0, 10)  # Area 100
    box_b = (0, 10, 0, 10)  # Identical => IoU = 1.0
    assert compute_box_iou(box_a, box_b) == 1.0

    box_c = (
        5,
        15,
        0,
        10,
    )  # Intersection: t [5, 10), f [0, 10) => Area 50. Union = 100 + 100 - 50 = 150
    assert pytest.approx(compute_box_iou(box_a, box_c), 1e-4) == 50.0 / 150.0

    box_disjoint = (20, 30, 20, 30)
    assert compute_box_iou(box_a, box_disjoint) == 0.0


def test_evaluation_perfect_recovery() -> None:
    """A prediction perfectly matching the single GT signal yields 100% precision and recall."""
    gt = _create_mock_gt("obs_01", "sig_01", (2, 8, 20, 25))
    pred = CandidatePrediction(
        candidate_id="pred_01",
        observation_id="obs_01",
        time_start_index=2,
        time_stop_index=8,
        frequency_start_index=20,
        frequency_stop_index=25,
    )

    evaluator = BenchmarkEvaluator(min_iou_threshold=0.1)
    res = evaluator.evaluate([gt], [pred])

    assert res.true_positive_count == 1
    assert res.false_positive_count == 0
    assert res.false_negative_count == 0
    assert res.precision == 1.0
    assert res.recall == 1.0
    assert res.f1_score == 1.0
    assert res.mean_iou == 1.0


def test_evaluation_missed_detection_and_false_positive() -> None:
    """Unmatched ground truth is FN; unmatched prediction is FP."""
    gt = _create_mock_gt("obs_01", "sig_01", (2, 8, 20, 25))
    # Prediction is completely elsewhere
    pred = CandidatePrediction(
        candidate_id="pred_fp",
        observation_id="obs_01",
        time_start_index=15,
        time_stop_index=20,
        frequency_start_index=50,
        frequency_stop_index=55,
    )

    evaluator = BenchmarkEvaluator(min_iou_threshold=0.1)
    res = evaluator.evaluate([gt], [pred])

    assert res.true_positive_count == 0
    assert res.false_positive_count == 1
    assert res.false_negative_count == 1
    assert res.precision == 0.0
    assert res.recall == 0.0
    assert res.f1_score is None


def test_evaluation_duplicate_predictions_prevent_double_credit() -> None:
    """Multiple candidate predictions overlapping one GT signal match only once; excess is FP."""
    gt = _create_mock_gt("obs_01", "sig_01", (0, 10, 10, 20))
    pred1 = CandidatePrediction(
        candidate_id="pred_best",
        observation_id="obs_01",
        time_start_index=0,
        time_stop_index=10,
        frequency_start_index=10,
        frequency_stop_index=20,
    )
    pred2 = CandidatePrediction(
        candidate_id="pred_dupe",
        observation_id="obs_01",
        time_start_index=1,
        time_stop_index=9,
        frequency_start_index=11,
        frequency_stop_index=19,
    )

    evaluator = BenchmarkEvaluator(min_iou_threshold=0.1)
    res = evaluator.evaluate([gt], [pred1, pred2])

    assert res.true_positive_count == 1
    assert res.false_positive_count == 1
    assert res.false_negative_count == 0
    assert res.precision == 0.5
    assert res.recall == 1.0


def test_evaluation_negative_control_false_alarms() -> None:
    """Predictions placed on noise-only negative controls are counted as false alarms."""
    neg_gt = ObservationGroundTruth(
        dataset_id="test_suite",
        observation_id="obs_neg",
        is_negative_control=True,
        target_count=0,
        signals=[],
    )
    pred = CandidatePrediction(
        candidate_id="pred_noise",
        observation_id="obs_neg",
        time_start_index=2,
        time_stop_index=5,
        frequency_start_index=10,
        frequency_stop_index=15,
    )

    evaluator = BenchmarkEvaluator()
    res = evaluator.evaluate([neg_gt], [pred])

    assert res.negative_control_observations_count == 1
    assert res.negative_control_false_positives == 1
    assert res.true_positive_count == 0
    assert res.false_positive_count == 1
    assert res.precision == 0.0


def test_evaluation_drift_error_calculation() -> None:
    """Evaluator must compute absolute error between candidate drift estimate and ground truth."""
    gt = _create_mock_gt(
        "obs_01", "sig_drift", (0, 10, 5, 25), family="drifting_tone", drift_rate=500.0
    )
    pred = CandidatePrediction(
        candidate_id="pred_drift",
        observation_id="obs_01",
        time_start_index=0,
        time_stop_index=10,
        frequency_start_index=5,
        frequency_stop_index=25,
        estimated_drift_rate_hz_per_s=550.0,
    )

    evaluator = BenchmarkEvaluator()
    res = evaluator.evaluate([gt], [pred])

    assert res.true_positive_count == 1
    assert res.mean_drift_error_abs_hz_per_s == 50.0
    assert len(res.matched_pairs) == 1
    assert res.matched_pairs[0]["drift_error_abs_hz_per_s"] == 50.0


def test_toy_baseline_detector_on_synthetic_data() -> None:
    """Verify ToyThresholdBaselineDetector finds injected target and yields 0 hits on noise."""
    geom = ObservationGeometryConfig(n_time=16, n_freq=64)
    bg_cfg = NoiseBackgroundConfig(mean=0.0, std_dev=1.0)
    bg_mat, bg_meta = generate_noise_background(geom, bg_cfg, np.random.default_rng(42))

    # Injected high-SNR tone
    sig = SignalConfig(
        family="stationary_tone",
        f_start_hz=1420.0e6 + 30 * 1000.0,
        snr=15.0,
        t_start_s=2.0,
        duration_s=10.0,
    )

    inj_pos = inject_signals(bg_mat, bg_meta, geom, [sig], "ds", "obs_pos")
    inj_neg = inject_signals(bg_mat, bg_meta, geom, [], "ds", "obs_neg")

    detector = ToyThresholdBaselineDetector(threshold_sigma=5.0)

    # Positive observation
    preds_pos = detector.detect("obs_pos", inj_pos.canonical_slice.values)
    assert len(preds_pos) >= 1

    # Negative observation (Gaussian noise with sigma=1 has virtually 0 points > 5 sigma)
    preds_neg = detector.detect("obs_neg", inj_neg.canonical_slice.values)
    assert len(preds_neg) == 0

    # Evaluate using BenchmarkEvaluator
    evaluator = BenchmarkEvaluator(min_iou_threshold=0.1)
    res = evaluator.evaluate(
        [inj_pos.ground_truth, inj_neg.ground_truth],
        preds_pos + preds_neg,
    )

    assert res.true_positive_count >= 1
    assert res.negative_control_false_positives == 0
    assert res.recall == 1.0
