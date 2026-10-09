"""Scientific benchmark evaluation for anomaly detectors against synthetic ground-truth datasets."""

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

import numpy as np
from pydantic import BaseModel, Field

from app.detection.config import DetectionPipelineConfig
from app.detection.isolation_forest import IsolationForestDetector
from app.detection.schemas import DetectionResult
from app.detection.service import DetectionService
from app.synthetic.evaluation import compute_box_iou
from app.synthetic.ground_truth import ObservationGroundTruth


class DetectionMetricsSummary(BaseModel):
    """Aggregate benchmark performance metrics."""

    total_eval_observations: int
    positive_observations_count: int
    negative_control_count: int
    total_injected_targets: int
    matched_targets_count: int
    unmatched_targets_count: int
    total_detected_windows: int
    true_positive_windows: int
    false_positive_windows: int
    target_recall: float
    window_precision: float
    window_recall: float
    window_f1: float
    observation_detection_rate: float
    noise_false_positive_rate: float
    mean_matched_iou: float


class DetectionBenchmarkReport(BaseModel):
    """Machine-readable evaluation report comparing detectors on held-out synthetic datasets."""

    benchmark_id: str
    detector_name: str
    evaluated_at_utc: str = Field(default_factory=lambda: datetime.now(UTC).isoformat())
    dataset_version: str = "1.0.0"
    split_summary: dict[str, Any]
    detector_config: dict[str, Any]
    metrics: DetectionMetricsSummary
    family_breakdown: dict[str, dict[str, float]]
    snr_breakdown: dict[str, dict[str, float]]
    per_observation_results: list[dict[str, Any]]
    warnings: list[str] = Field(default_factory=list)
    scientific_disclaimer: str = (
        "Synthetic benchmark results measure detector response on controlled simulated "
        "signals only and do not establish real-world astronomical discovery rates."
    )


@dataclass
class EvaluationSample:
    """A synthetic observation bundled with its verified ground-truth record."""

    observation_id: str
    values: np.ndarray
    ground_truth: ObservationGroundTruth


class DetectionBenchmarkEvaluator:
    """Evaluates baseline, Isolation Forest, and trivial control detectors on synthetic data.

    Enforces strict train/evaluation splits at the observation level to prevent data leakage.
    Ground-truth parameters are used strictly for scoring and never exposed to detectors.
    """

    def __init__(
        self,
        min_overlap_iou: float = 0.01,
    ) -> None:
        self.min_overlap_iou = min_overlap_iou
        self.service = DetectionService()

    def evaluate_detector(
        self,
        detector_name: str,
        reference_samples: list[EvaluationSample],
        evaluation_samples: list[EvaluationSample],
        config: DetectionPipelineConfig | None = None,
    ) -> DetectionBenchmarkReport:
        """Run reproducible benchmark evaluation for a specified detector.

        Args:
            detector_name: 'statistical_baseline', 'isolation_forest', or 'trivial_control'.
            reference_samples: Unlabeled reference observations used strictly for fitting.
            evaluation_samples: Held-out evaluation observations with ground truth.
            config: Pipeline configuration.

        Returns:
            DetectionBenchmarkReport: Detailed metric breakdown.
        """
        cfg = config or DetectionPipelineConfig()

        # Step 1: Fit detector on reference split (No ground truth exposed)
        trained_iforest: IsolationForestDetector | None = None
        reference_features: list[dict[str, float]] = []

        if detector_name in ("statistical_baseline", "isolation_forest"):
            # Extract features from reference samples to form reference distribution
            for ref_samp in reference_samples:
                ref_res = self.service.analyze_array(
                    values=ref_samp.values,
                    observation_id=ref_samp.observation_id,
                    config=cfg,
                )
                for reg in ref_res.anomalous_regions:
                    reference_features.append(reg.features)

            if detector_name == "isolation_forest" and len(reference_features) >= 10:
                trained_iforest = IsolationForestDetector(config=cfg.isolation_forest)
                trained_iforest.fit(reference_features)

        # Step 2: Score held-out evaluation samples
        total_eval_obs = len(evaluation_samples)
        pos_obs_count = 0
        neg_obs_count = 0
        pos_detected_count = 0
        neg_false_alarms = 0

        total_targets = 0
        matched_targets_count = 0
        total_det_windows = 0
        tp_windows = 0
        fp_windows = 0
        matched_ious: list[float] = []

        family_stats: dict[str, dict[str, int]] = {}
        snr_stats: dict[str, dict[str, int]] = {
            "snr_low_<5": {"total": 0, "detected": 0},
            "snr_med_5-10": {"total": 0, "detected": 0},
            "snr_high_>10": {"total": 0, "detected": 0},
        }
        per_obs_results: list[dict[str, Any]] = []

        for sample in evaluation_samples:
            gt = sample.ground_truth
            is_neg = gt.is_negative_control

            if is_neg:
                neg_obs_count += 1
            else:
                pos_obs_count += 1

            # Run detection
            if detector_name == "trivial_control":
                # Trivial control: never flags any window
                det_result = DetectionResult(
                    observation_id=sample.observation_id,
                    analysis_run_id="trivial",
                    matrix_shape=list(sample.values.shape),
                    total_windows_evaluated=10,
                    anomalous_regions=[],
                    anomalous_fraction=0.0,
                    pipeline_config=cfg,
                )
            else:
                # Configure active detector
                run_cfg = cfg.model_copy(deep=True)
                if detector_name == "statistical_baseline":
                    run_cfg.baseline.enabled = True
                    run_cfg.isolation_forest.enabled = False
                elif detector_name == "isolation_forest":
                    run_cfg.baseline.enabled = False
                    run_cfg.isolation_forest.enabled = True

                det_result = self.service.analyze_array(
                    values=sample.values,
                    observation_id=sample.observation_id,
                    config=run_cfg,
                    trained_iforest=trained_iforest,
                    reference_features=reference_features if reference_features else None,
                )

            detected_regions = det_result.anomalous_regions
            obs_flagged = len(detected_regions) > 0
            if is_neg and obs_flagged:
                neg_false_alarms += 1
            elif not is_neg and obs_flagged:
                pos_detected_count += 1

            total_det_windows += len(detected_regions)

            # Match detected windows to ground truth targets
            obs_targets = gt.signals
            total_targets += len(obs_targets)
            target_matched = [False] * len(obs_targets)

            for det in detected_regions:
                det_box = (
                    det.window.time_start,
                    det.window.time_stop,
                    det.window.freq_start,
                    det.window.freq_stop,
                )
                hit_target = False

                for t_idx, tgt in enumerate(obs_targets):
                    iou = compute_box_iou(det_box, tgt.bounding_box)
                    if iou >= self.min_overlap_iou:
                        hit_target = True
                        target_matched[t_idx] = True
                        matched_ious.append(iou)

                if hit_target:
                    tp_windows += 1
                else:
                    fp_windows += 1

            # Record target-level detections and breakdowns
            for t_idx, tgt in enumerate(obs_targets):
                fam = tgt.family
                if fam not in family_stats:
                    family_stats[fam] = {"total": 0, "detected": 0}
                family_stats[fam]["total"] += 1

                snr = tgt.effective_snr
                snr_bin = (
                    "snr_low_<5"
                    if snr < 5.0
                    else ("snr_med_5-10" if snr <= 10.0 else "snr_high_>10")
                )
                snr_stats[snr_bin]["total"] += 1

                if target_matched[t_idx]:
                    matched_targets_count += 1
                    family_stats[fam]["detected"] += 1
                    snr_stats[snr_bin]["detected"] += 1

            per_obs_results.append(
                {
                    "observation_id": sample.observation_id,
                    "is_negative_control": is_neg,
                    "target_count": len(obs_targets),
                    "windows_flagged": len(detected_regions),
                    "observation_flagged": obs_flagged,
                }
            )

        # Step 3: Compute aggregate metrics
        target_recall = float(matched_targets_count / total_targets) if total_targets > 0 else 0.0
        denom_prec = tp_windows + fp_windows
        win_prec = float(tp_windows / denom_prec) if denom_prec > 0 else 0.0
        denom_rec = tp_windows + (total_targets - matched_targets_count)
        win_rec = float(tp_windows / denom_rec) if denom_rec > 0 else 0.0
        win_f1 = (
            float(2 * (win_prec * win_rec) / (win_prec + win_rec))
            if (win_prec + win_rec) > 0
            else 0.0
        )

        obs_det_rate = float(pos_detected_count / pos_obs_count) if pos_obs_count > 0 else 0.0
        neg_fpr = float(neg_false_alarms / neg_obs_count) if neg_obs_count > 0 else 0.0
        mean_iou = float(np.mean(matched_ious)) if matched_ious else 0.0

        summary = DetectionMetricsSummary(
            total_eval_observations=total_eval_obs,
            positive_observations_count=pos_obs_count,
            negative_control_count=neg_obs_count,
            total_injected_targets=total_targets,
            matched_targets_count=matched_targets_count,
            unmatched_targets_count=total_targets - matched_targets_count,
            total_detected_windows=total_det_windows,
            true_positive_windows=tp_windows,
            false_positive_windows=fp_windows,
            target_recall=round(target_recall, 4),
            window_precision=round(win_prec, 4),
            window_recall=round(win_rec, 4),
            window_f1=round(win_f1, 4),
            observation_detection_rate=round(obs_det_rate, 4),
            noise_false_positive_rate=round(neg_fpr, 4),
            mean_matched_iou=round(mean_iou, 4),
        )

        # Compute breakdown dictionaries
        family_breakdown: dict[str, dict[str, float]] = {}
        for fam, counts in family_stats.items():
            tot = counts["total"]
            num_det = counts["detected"]
            rate = float(num_det / tot) if tot > 0 else 0.0
            family_breakdown[fam] = {
                "total_targets": float(tot),
                "detected_targets": float(num_det),
                "recovery_rate": round(rate, 4),
            }

        snr_breakdown: dict[str, dict[str, float]] = {}
        for snr_bin, counts in snr_stats.items():
            tot = counts["total"]
            num_det = counts["detected"]
            rate = float(num_det / tot) if tot > 0 else 0.0
            snr_breakdown[snr_bin] = {
                "total_targets": float(tot),
                "detected_targets": float(num_det),
                "recovery_rate": round(rate, 4),
            }

        return DetectionBenchmarkReport(
            benchmark_id=f"bench_{detector_name}",
            detector_name=detector_name,
            split_summary={
                "reference_samples_count": len(reference_samples),
                "evaluation_samples_count": len(evaluation_samples),
                "reference_features_extracted": len(reference_features),
            },
            detector_config=cfg.model_dump(),
            metrics=summary,
            family_breakdown=family_breakdown,
            snr_breakdown=snr_breakdown,
            per_observation_results=per_obs_results,
        )
