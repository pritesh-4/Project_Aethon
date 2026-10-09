"""Benchmark evaluation framework for measuring detector precision, recall, IoU, and drift error."""

from dataclasses import dataclass
from typing import Any

import numpy as np
from pydantic import BaseModel, Field

from app.synthetic.ground_truth import InjectedSignalGroundTruth, ObservationGroundTruth


class CandidatePrediction(BaseModel):
    """A single candidate detection proposed by an algorithm or test fixture."""

    candidate_id: str = Field(..., description="Unique prediction identifier")
    observation_id: str = Field(..., description="Target observation identifier")
    time_start_index: int = Field(..., description="Predicted start time index (inclusive)")
    time_stop_index: int = Field(..., description="Predicted stop time index (exclusive)")
    frequency_start_index: int = Field(
        ..., description="Predicted start frequency index (inclusive)"
    )
    frequency_stop_index: int = Field(..., description="Predicted stop frequency index (exclusive)")
    confidence_score: float = Field(
        default=1.0, description="Detection confidence or significance score"
    )
    estimated_drift_rate_hz_per_s: float | None = Field(
        default=None,
        description="Optional Doppler drift estimate in Hz/s",
    )
    metadata: dict[str, Any] = Field(default_factory=dict)

    @property
    def bounding_box(self) -> tuple[int, int, int, int]:
        """(t_start, t_stop, f_start, f_stop) 0-indexed bounds."""
        return (
            self.time_start_index,
            self.time_stop_index,
            self.frequency_start_index,
            self.frequency_stop_index,
        )


def compute_box_iou(
    box_a: tuple[int, int, int, int],
    box_b: tuple[int, int, int, int],
) -> float:
    """Compute Intersection-over-Union (IoU) between two 2D time-frequency bounding boxes.

    Boxes are represented as (t_start, t_stop, f_start, f_stop) with half-open intervals.
    """
    t_start_a, t_stop_a, f_start_a, f_stop_a = box_a
    t_start_b, t_stop_b, f_start_b, f_stop_b = box_b

    # Time overlap
    t_inter = max(0, min(t_stop_a, t_stop_b) - max(t_start_a, t_start_b))
    # Frequency overlap
    f_inter = max(0, min(f_stop_a, f_stop_b) - max(f_start_a, f_start_b))

    inter_area = t_inter * f_inter
    area_a = max(0, t_stop_a - t_start_a) * max(0, f_stop_a - f_start_a)
    area_b = max(0, t_stop_b - t_start_b) * max(0, f_stop_b - f_start_b)

    union_area = area_a + area_b - inter_area
    if union_area <= 0:
        return 0.0
    return float(inter_area / union_area)


@dataclass
class MatchPair:
    """A true-positive pairing between an injected ground-truth signal and a prediction."""

    signal_id: str
    candidate_id: str
    family: str
    iou: float
    gt_drift_rate_hz_per_s: float
    pred_drift_rate_hz_per_s: float | None
    drift_error_abs_hz_per_s: float | None


class FamilyEvaluationMetric(BaseModel):
    """Evaluation metrics broken down by target signal family."""

    family: str
    total_targets: int
    matched_targets: int
    missed_targets: int
    recall: float | None = None
    mean_iou: float | None = None


class BenchmarkEvaluationResult(BaseModel):
    """Aggregate benchmark evaluation report comparing candidate predictions to ground truth."""

    total_observations_evaluated: int
    negative_control_observations_count: int
    positive_observations_count: int
    total_ground_truth_targets: int
    total_candidate_predictions: int
    true_positive_count: int
    false_positive_count: int
    false_negative_count: int
    negative_control_false_positives: int
    precision: float | None = Field(
        default=None,
        description="TP / (TP + FP). None if no predictions were submitted.",
    )
    recall: float | None = Field(
        default=None,
        description="TP / (TP + FN). None if no ground-truth targets exist.",
    )
    f1_score: float | None = Field(
        default=None,
        description="Harmonic mean of precision and recall.",
    )
    mean_iou: float | None = Field(
        default=None,
        description="Average IoU over all true-positive matches.",
    )
    mean_drift_error_abs_hz_per_s: float | None = Field(
        default=None,
        description="Mean absolute error between estimated and true drift rates.",
    )
    family_breakdown: dict[str, FamilyEvaluationMetric] = Field(default_factory=dict)
    matched_pairs: list[dict[str, Any]] = Field(default_factory=list)
    unmatched_predictions: list[str] = Field(default_factory=list)
    unmatched_ground_truth_ids: list[str] = Field(default_factory=list)
    matching_policy_notes: str = ""


class BenchmarkEvaluator:
    """Evaluates candidate detector predictions against synthetic ground-truth records."""

    def __init__(self, min_iou_threshold: float = 0.05) -> None:
        self.min_iou_threshold = min_iou_threshold

    def evaluate(
        self,
        ground_truths: list[ObservationGroundTruth],
        predictions: list[CandidatePrediction],
    ) -> BenchmarkEvaluationResult:
        """Evaluate candidate detections against ground truth using 1-to-1 greedy IoU matching.

        Rules:
            1. Predictions only compete for ground truth within the same observation_id.
            2. Candidate order does not influence fairness: candidates are evaluated by overlap.
            3. Each ground-truth target matches at most one candidate prediction
               (highest IoU >= min_iou).
            4. Unmatched predictions count as False Positives (FP).
            5. Unmatched ground-truth targets count as False Negatives (FN).
        """
        # Group predictions by observation_id
        preds_by_obs: dict[str, list[CandidatePrediction]] = {}
        for p in predictions:
            preds_by_obs.setdefault(p.observation_id, []).append(p)

        total_obs = len(ground_truths)
        neg_control_count = 0
        pos_obs_count = 0
        total_gt_targets = 0
        total_predictions = len(predictions)

        all_matched_pairs: list[MatchPair] = []
        all_unmatched_pred_ids: list[str] = []
        all_unmatched_gt_ids: list[str] = []
        neg_control_fps = 0

        # Track per-family counts
        family_totals: dict[str, int] = {}
        family_matched: dict[str, int] = {}
        family_ious: dict[str, list[float]] = {}

        for obs_gt in ground_truths:
            obs_id = obs_gt.observation_id
            obs_preds = preds_by_obs.get(obs_id, [])

            if obs_gt.is_negative_control:
                neg_control_count += 1
                # All predictions in a negative control are false alarms
                neg_control_fps += len(obs_preds)
                all_unmatched_pred_ids.extend([p.candidate_id for p in obs_preds])
                continue

            pos_obs_count += 1
            total_gt_targets += len(obs_gt.signals)

            for sig in obs_gt.signals:
                family_totals[sig.family] = family_totals.get(sig.family, 0) + 1

            # Match signals in this observation
            gt_matched_ids: set[str] = set()
            pred_matched_ids: set[str] = set()

            # Precalculate pairwise IoUs
            candidate_pairs: list[tuple[float, InjectedSignalGroundTruth, CandidatePrediction]] = []
            for sig in obs_gt.signals:
                for pred in obs_preds:
                    iou = compute_box_iou(sig.bounding_box, pred.bounding_box)
                    if iou >= self.min_iou_threshold:
                        candidate_pairs.append((iou, sig, pred))

            # Sort descending by IoU for greedy assignment
            candidate_pairs.sort(key=lambda x: x[0], reverse=True)

            for iou, sig, pred in candidate_pairs:
                if (
                    sig.signal_id not in gt_matched_ids
                    and pred.candidate_id not in pred_matched_ids
                ):
                    gt_matched_ids.add(sig.signal_id)
                    pred_matched_ids.add(pred.candidate_id)

                    # Drift error computation if drift estimate was provided
                    drift_err = None
                    if pred.estimated_drift_rate_hz_per_s is not None:
                        drift_err = abs(
                            pred.estimated_drift_rate_hz_per_s - sig.drift_rate_hz_per_s
                        )

                    all_matched_pairs.append(
                        MatchPair(
                            signal_id=sig.signal_id,
                            candidate_id=pred.candidate_id,
                            family=sig.family,
                            iou=iou,
                            gt_drift_rate_hz_per_s=sig.drift_rate_hz_per_s,
                            pred_drift_rate_hz_per_s=pred.estimated_drift_rate_hz_per_s,
                            drift_error_abs_hz_per_s=drift_err,
                        )
                    )
                    family_matched[sig.family] = family_matched.get(sig.family, 0) + 1
                    family_ious.setdefault(sig.family, []).append(iou)

            # Unmatched in this observation
            for sig in obs_gt.signals:
                if sig.signal_id not in gt_matched_ids:
                    all_unmatched_gt_ids.append(sig.signal_id)

            for pred in obs_preds:
                if pred.candidate_id not in pred_matched_ids:
                    all_unmatched_pred_ids.append(pred.candidate_id)

        # Handle any predictions submitted for non-existent observation IDs
        known_obs_ids = {gt.observation_id for gt in ground_truths}
        for p in predictions:
            if p.observation_id not in known_obs_ids:
                all_unmatched_pred_ids.append(p.candidate_id)

        tp = len(all_matched_pairs)
        fp = len(all_unmatched_pred_ids)
        fn = len(all_unmatched_gt_ids)

        precision = (float(tp) / float(tp + fp)) if (tp + fp) > 0 else None
        recall = (float(tp) / float(tp + fn)) if (tp + fn) > 0 else None
        f1: float | None = None
        if precision is not None and recall is not None and (precision + recall) > 0:
            f1 = float(2.0 * precision * recall / (precision + recall))

        mean_iou = float(np.mean([p.iou for p in all_matched_pairs])) if all_matched_pairs else None

        drift_errors = [
            p.drift_error_abs_hz_per_s
            for p in all_matched_pairs
            if p.drift_error_abs_hz_per_s is not None
        ]
        mean_drift_err = float(np.mean(drift_errors)) if drift_errors else None

        # Build per-family metrics
        family_breakdown: dict[str, FamilyEvaluationMetric] = {}
        for family, tot in family_totals.items():
            matched_count = family_matched.get(family, 0)
            missed_count = tot - matched_count
            fam_recall = (float(matched_count) / float(tot)) if tot > 0 else None
            fam_mean_iou = float(np.mean(family_ious[family])) if family_ious.get(family) else None
            family_breakdown[family] = FamilyEvaluationMetric(
                family=family,
                total_targets=tot,
                matched_targets=matched_count,
                missed_targets=missed_count,
                recall=fam_recall,
                mean_iou=fam_mean_iou,
            )

        matched_pairs_dict = [
            {
                "signal_id": m.signal_id,
                "candidate_id": m.candidate_id,
                "family": m.family,
                "iou": round(m.iou, 4),
                "gt_drift_rate_hz_per_s": m.gt_drift_rate_hz_per_s,
                "pred_drift_rate_hz_per_s": m.pred_drift_rate_hz_per_s,
                "drift_error_abs_hz_per_s": (
                    round(m.drift_error_abs_hz_per_s, 4)
                    if m.drift_error_abs_hz_per_s is not None
                    else None
                ),
            }
            for m in all_matched_pairs
        ]

        return BenchmarkEvaluationResult(
            total_observations_evaluated=total_obs,
            negative_control_observations_count=neg_control_count,
            positive_observations_count=pos_obs_count,
            total_ground_truth_targets=total_gt_targets,
            total_candidate_predictions=total_predictions,
            true_positive_count=tp,
            false_positive_count=fp,
            false_negative_count=fn,
            negative_control_false_positives=neg_control_fps,
            precision=round(precision, 4) if precision is not None else None,
            recall=round(recall, 4) if recall is not None else None,
            f1_score=round(f1, 4) if f1 is not None else None,
            mean_iou=round(mean_iou, 4) if mean_iou is not None else None,
            mean_drift_error_abs_hz_per_s=(
                round(mean_drift_err, 4) if mean_drift_err is not None else None
            ),
            family_breakdown=family_breakdown,
            matched_pairs=matched_pairs_dict,
            unmatched_predictions=all_unmatched_pred_ids,
            unmatched_ground_truth_ids=all_unmatched_gt_ids,
            matching_policy_notes=(
                f"1-to-1 greedy IoU matching with threshold >= {self.min_iou_threshold}. "
                "Negative controls strictly contribute to false alarms."
            ),
        )


class ToyThresholdBaselineDetector:
    """Toy threshold-based baseline used strictly for benchmark validation.

    SCIENTIFIC NOTE:
    This is an elementary threshold-crossing baseline used exclusively to verify that the
    benchmark evaluation machinery functions correctly. It is NOT AETHON's production anomaly
    detector, RFI classifier, or Doppler estimator.
    """

    def __init__(self, threshold_sigma: float = 4.0) -> None:
        self.threshold_sigma = threshold_sigma

    def detect(self, observation_id: str, values: np.ndarray) -> list[CandidatePrediction]:
        """Detect contiguous time-frequency bounding boxes where power exceeds mean + k * sigma."""
        mean = float(np.mean(values))
        std = float(np.std(values))
        threshold = mean + self.threshold_sigma * std

        # Mask of threshold crossings
        mask = values > threshold
        if not np.any(mask):
            return []

        # Find simple bounding box around clusters per column/channel
        predictions: list[CandidatePrediction] = []

        # Group threshold-crossing columns
        active_cols = np.where(np.any(mask, axis=0))[0]
        if len(active_cols) == 0:
            return []

        # Cluster adjacent columns into intervals
        clusters: list[list[int]] = []
        current_cluster = [int(active_cols[0])]
        for c in active_cols[1:]:
            if c == current_cluster[-1] + 1:
                current_cluster.append(int(c))
            else:
                clusters.append(current_cluster)
                current_cluster = [int(c)]
        clusters.append(current_cluster)

        for idx, cluster in enumerate(clusters):
            f_start = min(cluster)
            f_stop = max(cluster) + 1
            cluster_mask = mask[:, f_start:f_stop]
            active_rows = np.where(np.any(cluster_mask, axis=1))[0]
            if len(active_rows) == 0:
                continue
            t_start = int(np.min(active_rows))
            t_stop = int(np.max(active_rows)) + 1

            predictions.append(
                CandidatePrediction(
                    candidate_id=f"toy_cand_{idx + 1:03d}",
                    observation_id=observation_id,
                    time_start_index=t_start,
                    time_stop_index=t_stop,
                    frequency_start_index=f_start,
                    frequency_stop_index=f_stop,
                    confidence_score=float(np.max(values[t_start:t_stop, f_start:f_stop])),
                    metadata={
                        "method": "toy_threshold_baseline",
                        "threshold_sigma": self.threshold_sigma,
                    },
                )
            )

        return predictions
