"""End-to-end integration test of the synthetic signal laboratory and evaluation pipeline."""

from pathlib import Path

import pytest

from app.synthetic.dataset import BenchmarkDatasetGenerator, load_benchmark_dataset
from app.synthetic.evaluation import (
    BenchmarkEvaluator,
    CandidatePrediction,
    ToyThresholdBaselineDetector,
)


def test_complete_synthetic_laboratory_pipeline_round_trip(tmp_path: Path) -> None:
    """Full lifecycle: Generate -> serialize -> reload -> detect -> evaluate."""
    # 1. Generate benchmark dataset
    generator = BenchmarkDatasetGenerator(base_seed=100)
    manifest = generator.generate_and_save_suite(
        output_dir=tmp_path, dataset_id="integration_bench"
    )

    assert manifest.total_observations == 9
    assert manifest.total_injected_targets == 9

    # 2. Reload dataset from disk and verify cryptographic hashes
    loaded_manifest, observation_matrices = load_benchmark_dataset(tmp_path, verify_checksums=True)
    assert len(observation_matrices) == 9

    # 3. Run toy threshold baseline detector across all observations
    detector = ToyThresholdBaselineDetector(threshold_sigma=4.5)
    all_predictions: list[CandidatePrediction] = []

    for item in loaded_manifest.observations:
        arr = observation_matrices[item.observation_id]
        obs_preds = detector.detect(item.observation_id, arr)
        all_predictions.extend(obs_preds)

    # 4. Evaluate predictions using BenchmarkEvaluator
    ground_truth_records = [item.ground_truth for item in loaded_manifest.observations]
    evaluator = BenchmarkEvaluator(min_iou_threshold=0.05)
    result = evaluator.evaluate(ground_truth_records, all_predictions)

    # 5. Assert evaluation results sanity
    assert result.total_observations_evaluated == 9
    assert result.negative_control_observations_count == 2
    assert result.positive_observations_count == 7
    assert result.total_ground_truth_targets == 9

    # Toy baseline on threshold 4.5 sigma should detect strong injected signals
    assert result.true_positive_count > 0
    assert result.precision is not None and result.precision > 0.0
    assert result.recall is not None and result.recall > 0.0
    assert result.f1_score is not None

    # Check that family breakdown is populated
    assert "stationary_tone" in result.family_breakdown
    assert "drifting_tone" in result.family_breakdown
    assert "burst" in result.family_breakdown
    assert "broadband_emission" in result.family_breakdown

    # Ensure negative control false alarms are explicitly tracked
    assert result.negative_control_false_positives >= 0


def test_hand_crafted_candidate_predictions_evaluation(tmp_path: Path) -> None:
    """Validate exact matching and drift error evaluation from hand-constructed predictions."""
    generator = BenchmarkDatasetGenerator(base_seed=200)
    manifest = generator.generate_and_save_suite(output_dir=tmp_path, dataset_id="drift_bench")

    # Find the positive drifting tone observation
    drifting_item = next(
        item for item in manifest.observations if "drifting_positive" in item.observation_id
    )
    sig_gt = drifting_item.ground_truth.signals[0]

    # Supply exact prediction matching GT box plus a Doppler drift estimate with 25 Hz/s error
    pred = CandidatePrediction(
        candidate_id="hand_drift_pred_01",
        observation_id=drifting_item.observation_id,
        time_start_index=sig_gt.time_start_index,
        time_stop_index=sig_gt.time_stop_index,
        frequency_start_index=sig_gt.frequency_start_index,
        frequency_stop_index=sig_gt.frequency_stop_index,
        estimated_drift_rate_hz_per_s=sig_gt.drift_rate_hz_per_s + 25.0,
    )

    evaluator = BenchmarkEvaluator(min_iou_threshold=0.5)
    eval_res = evaluator.evaluate([drifting_item.ground_truth], [pred])

    assert eval_res.true_positive_count == 1
    assert eval_res.false_positive_count == 0
    assert eval_res.false_negative_count == 0
    assert eval_res.precision == 1.0
    assert eval_res.recall == 1.0
    assert eval_res.mean_iou == 1.0
    assert pytest.approx(eval_res.mean_drift_error_abs_hz_per_s, 1e-4) == 25.0
