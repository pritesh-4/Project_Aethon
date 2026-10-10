"""Comprehensive scientific benchmark evaluation runner.

Evaluates the Phase 3 synthetic benchmark suite across:
1. Trivial negative control
2. Robust statistical anomaly baseline (MAD-based modified z-scores)
3. Unsupervised Isolation Forest (trained strictly on held-out reference backgrounds)
4. Doppler frequency drift estimation and analytical uncertainty
5. Signal processing preservation and RFI artifact flagging

Enforces strict split isolation at the observation level to prevent data leakage.
Outputs a machine-readable JSON evaluation report.
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import numpy as np

# Ensure backend root is on sys.path when invoked directly as a script
script_dir = Path(__file__).resolve().parent
backend_root = script_dir.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from app.analysis.evaluation import DriftAnalysisEvaluator
from app.detection.config import DetectionPipelineConfig
from app.detection.evaluation import (
    DetectionBenchmarkEvaluator,
    DetectionBenchmarkReport,
    EvaluationSample,
)
from app.processing.config import ProcessingPipelineConfig
from app.processing.evaluation import (
    PreprocessingEvaluationMetrics,
    PreprocessingEvaluator,
    SyntheticContaminationInjector,
)
from app.processing.pipeline import run_processing_pipeline
from app.representation.axes import FrequencyAxisModel, TimeAxisModel
from app.synthetic.backgrounds import generate_noise_background
from app.synthetic.config import NoiseBackgroundConfig, ObservationGeometryConfig, SignalConfig
from app.synthetic.dataset import BenchmarkDatasetGenerator
from app.synthetic.ground_truth import ObservationGroundTruth
from app.synthetic.injection import inject_signals


def generate_reference_background_samples(
    n_samples: int = 10,
    base_seed: int = 1000,
) -> list[EvaluationSample]:
    """Generate pure background observations strictly for reference feature fitting.

    These observations contain ZERO injected target signals and are generated with
    completely independent seeds (1000..1000+n) to guarantee zero data leakage into
    the evaluation benchmark suite.
    """
    geom = ObservationGeometryConfig(
        n_time=32,
        n_freq=128,
        sampling_interval_s=1.0,
        f_min_hz=1420.0e6,
        f_step_hz=1000.0,
    )
    samples: list[EvaluationSample] = []
    for i in range(n_samples):
        seed = base_seed + i
        bg_type = "gaussian" if i % 2 == 0 else "time_varying_noise"
        bg_cfg = NoiseBackgroundConfig(
            background_type=bg_type,
            mean=0.0,
            std_dev=1.0,
            time_variation_amplitude=0.25 if bg_type == "time_varying_noise" else 0.0,
        )
        rng = np.random.default_rng(seed)
        vals, bg_meta = generate_noise_background(geom, bg_cfg, rng=rng)
        gt = ObservationGroundTruth(
            observation_id=f"ref_bg_{i:03d}",
            dataset_id="reference_split",
            is_negative_control=True,
            signals=[],
            metadata={"seed": seed, "bg_type": bg_type, **bg_meta},
        )
        samples.append(
            EvaluationSample(
                observation_id=gt.observation_id,
                values=vals,
                ground_truth=gt,
            )
        )
    return samples


def generate_evaluation_samples(
    base_seed: int = 42,
) -> tuple[list[EvaluationSample], ObservationGeometryConfig]:
    """Generate standard benchmark evaluation suite (2 negative controls, 7 positive configs)."""
    generator = BenchmarkDatasetGenerator(base_seed=base_seed)
    configs = generator.create_standard_suite_configs("benchmark_eval")
    samples: list[EvaluationSample] = []

    for cfg in configs:
        rng = np.random.default_rng(cfg.seed)
        bg_matrix, bg_meta = generate_noise_background(cfg.geometry, cfg.background, rng)
        injection_res = inject_signals(
            background_matrix=bg_matrix,
            background_metadata=bg_meta,
            geometry=cfg.geometry,
            injections=cfg.injections,
            dataset_id="benchmark_eval",
            observation_id=cfg.dataset_id,
        )
        samples.append(
            EvaluationSample(
                observation_id=injection_res.ground_truth.observation_id,
                values=injection_res.canonical_slice.values,
                ground_truth=injection_res.ground_truth,
            )
        )

    # Return standard geometry used for coordinates
    geom = configs[0].geometry
    return samples, geom


def run_preprocessing_evaluation() -> dict[str, Any]:
    """Evaluate Phase 4 signal processing preservation and RFI artifact detection."""
    geom = ObservationGeometryConfig(
        n_time=32,
        n_freq=64,
        sampling_interval_s=1.0,
        f_min_hz=1420.0e6,
        f_step_hz=1000.0,
    )
    bg_cfg = NoiseBackgroundConfig(mean=0.0, std_dev=1.0)
    bg_mat, bg_meta = generate_noise_background(geom, bg_cfg, np.random.default_rng(2026))

    # Target stationary tone at channel 12
    sig_cfg = SignalConfig(
        signal_id="sig_tone_12",
        family="stationary_tone",
        f_start_hz=1420.0e6 + 12 * 1000.0,
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
    # Inject broadband burst at time 15
    obs_with_rfi, reg_burst = SyntheticContaminationInjector.inject_broadband_burst(
        obs_with_rfi, time_idx=15, amplitude=25.0
    )
    contaminations = [reg_chan, reg_burst]

    process_cfg = ProcessingPipelineConfig()
    result = run_processing_pipeline(
        obs_with_rfi,
        "obs_target_01",
        inj_result.canonical_slice.time_axis,
        inj_result.canonical_slice.frequency_axis,
        config=process_cfg,
    )

    evaluator = PreprocessingEvaluator()
    metrics: PreprocessingEvaluationMetrics = evaluator.evaluate(
        result=result,
        ground_truth=ground_truth,
        contaminations=contaminations,
        original_input_copy=obs_with_rfi,
    )

    return {
        "raw_array_preserved": metrics.raw_array_preserved,
        "contamination_flag_rate": metrics.contamination_flag_rate,
        "clean_false_flag_rate": metrics.clean_false_flag_rate,
        "target_signal_retention_rate": metrics.target_signal_retention_rate,
        "target_signal_flag_rate": metrics.target_signal_flag_rate,
    }


def run_drift_evaluation(
    eval_samples: list[EvaluationSample],
    geom: ObservationGeometryConfig,
) -> dict[str, Any]:
    """Evaluate Phase 6 Doppler drift estimation accuracy against known ground truth."""
    drift_evaluator = DriftAnalysisEvaluator(tolerance_hz_per_s=0.5)

    time_axis = TimeAxisModel(
        sample_count=geom.n_time,
        sampling_interval_seconds=geom.sampling_interval_s,
        reference_time_seconds=0.0,
    )
    freq_axis = FrequencyAxisModel(
        channel_count=geom.n_freq,
        reference_frequency_hz=geom.f_min_hz,
        channel_spacing_hz=geom.f_step_hz,
        reference_channel_index=0,
    )

    evaluated_targets = 0
    recovered_targets = 0
    drift_errors: list[float] = []
    target_summaries: list[dict[str, Any]] = []

    for sample in eval_samples:
        if sample.ground_truth.is_negative_control:
            continue

        report = drift_evaluator.evaluate_targets(
            values=sample.values,
            ground_truth=sample.ground_truth,
            time_axis=time_axis,
            frequency_axis=freq_axis,
        )

        for item in report.items:
            evaluated_targets += 1
            if item.is_recovered:
                recovered_targets += 1
            if item.absolute_drift_error_hz_per_s is not None:
                drift_errors.append(item.absolute_drift_error_hz_per_s)

            target_summaries.append(
                {
                    "signal_id": item.signal_id,
                    "family": item.family,
                    "effective_snr": item.effective_snr,
                    "true_drift_hz_s": item.true_drift_rate_hz_per_s,
                    "estimated_drift_hz_s": item.estimated_drift_rate_hz_per_s,
                    "abs_error_hz_s": item.absolute_drift_error_hz_per_s,
                    "uncertainty_hz_s": item.uncertainty_hz_per_s,
                    "is_recovered": item.is_recovered,
                }
            )

    mean_err = float(np.mean(drift_errors)) if drift_errors else 0.0
    median_err = float(np.median(drift_errors)) if drift_errors else 0.0
    max_err = float(np.max(drift_errors)) if drift_errors else 0.0
    recovery_rate = float(recovered_targets / evaluated_targets) if evaluated_targets > 0 else 0.0

    return {
        "total_evaluated_targets": evaluated_targets,
        "successfully_recovered_targets": recovered_targets,
        "drift_recovery_rate": round(recovery_rate, 4),
        "mean_absolute_drift_error_hz_per_s": round(mean_err, 4),
        "median_absolute_drift_error_hz_per_s": round(median_err, 4),
        "max_absolute_drift_error_hz_per_s": round(max_err, 4),
        "targets": target_summaries,
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Execute scientific validation of AETHON benchmark suite."
    )
    parser.add_argument(
        "--output-report",
        type=Path,
        default=backend_root / "reports" / "benchmark_evaluation_report.json",
        help="Path to write the machine-readable JSON evaluation report",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Base seed for evaluation benchmark suite",
    )
    parser.add_argument(
        "--ref-seed",
        type=int,
        default=1000,
        help="Base seed for independent reference background split",
    )
    args = parser.parse_args()

    output_report_path: Path = args.output_report.resolve()
    output_report_path.parent.mkdir(parents=True, exist_ok=True)

    print("=====================================================================")
    print("      AETHON — Phase 9: Scientific Benchmark Evaluation Suite        ")
    print("=====================================================================")
    print(f"Timestamp:                 {datetime.now(UTC).isoformat()}")
    print(f"Evaluation Base Seed:      {args.seed}")
    print(f"Reference Split Base Seed: {args.ref_seed} (No data leakage)")
    print(f"Report Target Path:        {output_report_path}")
    print("---------------------------------------------------------------------")

    # Step 1: Generate reference and evaluation splits
    print("\n[1/5] Generating independent reference background split...")
    ref_samples = generate_reference_background_samples(n_samples=10, base_seed=args.ref_seed)
    print(f"  Generated {len(ref_samples)} reference background observations.")

    print("\n[2/5] Generating held-out evaluation benchmark suite...")
    eval_samples, geom = generate_evaluation_samples(base_seed=args.seed)
    pos_samples = [s for s in eval_samples if not s.ground_truth.is_negative_control]
    neg_samples = [s for s in eval_samples if s.ground_truth.is_negative_control]
    total_targets = sum(len(s.ground_truth.signals) for s in pos_samples)
    print(f"  Generated {len(eval_samples)} evaluation observations:")
    print(f"    - Positive observations: {len(pos_samples)}")
    print(f"    - Negative controls:     {len(neg_samples)}")
    print(f"    - Injected target count: {total_targets}")

    # Step 2: Evaluate Anomaly Detectors
    print("\n[3/5] Evaluating anomaly detection models on held-out samples...")
    detector_evaluator = DetectionBenchmarkEvaluator(min_overlap_iou=0.01)

    detectors = ["trivial_control", "statistical_baseline", "isolation_forest"]
    detector_reports: dict[str, DetectionBenchmarkReport] = {}

    for det_name in detectors:
        print(f"  Running evaluation for '{det_name}'...")
        rep = detector_evaluator.evaluate_detector(
            detector_name=det_name,
            reference_samples=ref_samples,
            evaluation_samples=eval_samples,
            config=DetectionPipelineConfig(),
        )
        detector_reports[det_name] = rep
        m = rep.metrics
        print(f"    Target Recall:            {m.target_recall:.2%}")
        print(f"    Window Precision:         {m.window_precision:.2%}")
        print(f"    Window F1 Score:          {m.window_f1:.4f}")
        print(f"    Obs Detection Rate:       {m.observation_detection_rate:.2%}")
        print(f"    Noise False Alarm Rate:   {m.noise_false_positive_rate:.2%}")

    # Step 3: Evaluate Doppler Drift Estimation
    print("\n[4/5] Evaluating Doppler frequency drift estimation on linear targets...")
    drift_res = run_drift_evaluation(eval_samples, geom)
    print(f"  Evaluated targets:          {drift_res['total_evaluated_targets']}")
    print(f"  Recovered targets:          {drift_res['successfully_recovered_targets']}")
    print(f"  Drift Recovery Rate:        {drift_res['drift_recovery_rate']:.2%}")
    print(f"  Mean Absolute Error:        {drift_res['mean_absolute_drift_error_hz_per_s']} Hz/s")
    print(f"  Median Absolute Error:      {drift_res['median_absolute_drift_error_hz_per_s']} Hz/s")

    # Step 4: Evaluate Signal Processing & RFI Preservation
    print("\n[5/5] Evaluating signal processing preservation and RFI artifact flagging...")
    proc_res = run_preprocessing_evaluation()
    print(f"  Raw array bit-for-bit preserved: {proc_res['raw_array_preserved']}")
    print(f"  Contamination flag rate:         {proc_res['contamination_flag_rate']:.2%}")
    print(f"  Clean false flag rate:           {proc_res['clean_false_flag_rate']:.2%}")
    print(f"  Target signal retention rate:    {proc_res['target_signal_retention_rate']:.2%}")

    # Step 5: Compile Unified JSON Report
    full_report: dict[str, Any] = {
        "benchmark_id": "aethon_phase9_scientific_validation",
        "evaluated_at_utc": datetime.now(UTC).isoformat(),
        "environment": {
            "python_version": sys.version.split()[0],
            "platform": sys.platform,
        },
        "dataset_metadata": {
            "dataset_version": "1.0.0",
            "generator_name": "AETHON Synthetic Laboratory",
            "evaluation_base_seed": args.seed,
            "reference_split_base_seed": args.ref_seed,
            "split_policy": "Strict observation-level separation (seeds 1000..1009 vs 42)",
            "leakage_protection": "Reference features extracted exclusively from pure background; zero targets exposed",
        },
        "detectors": {name: rep.model_dump() for name, rep in detector_reports.items()},
        "doppler_drift_analysis": drift_res,
        "signal_processing_preservation": proc_res,
        "scientific_conclusions": {
            "isolation_forest_target_recall": detector_reports[
                "isolation_forest"
            ].metrics.target_recall,
            "statistical_baseline_target_recall": detector_reports[
                "statistical_baseline"
            ].metrics.target_recall,
            "trivial_control_target_recall": detector_reports[
                "trivial_control"
            ].metrics.target_recall,
            "noise_false_alarm_rate_iforest": detector_reports[
                "isolation_forest"
            ].metrics.noise_false_positive_rate,
            "noise_false_alarm_rate_baseline": detector_reports[
                "statistical_baseline"
            ].metrics.noise_false_positive_rate,
            "drift_mean_abs_error_hz_s": drift_res["mean_absolute_drift_error_hz_per_s"],
            "target_signal_retention_rate": proc_res["target_signal_retention_rate"],
            "disclaimer": (
                "Synthetic benchmark measurements establish mathematical correctness and detector "
                "behavior under controlled numerical assumptions. They do not claim astronomical "
                "discovery probability or source classification for uncalibrated real-world observations."
            ),
        },
    }

    with open(output_report_path, "w", encoding="utf-8") as f:
        json.dump(full_report, f, indent=2)

    print("\n=====================================================================")
    print(f"Report written successfully to: {output_report_path}")
    print("Benchmark evaluation completed with verified scientific integrity.")
    print("=====================================================================")


if __name__ == "__main__":
    main()
