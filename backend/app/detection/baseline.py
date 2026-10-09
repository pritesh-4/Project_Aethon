"""Statistical baseline anomaly detector using robust multi-feature MAD deviations."""

import numpy as np

from app.detection.config import StatisticalBaselineConfig
from app.detection.exceptions import ModelNotFittedError
from app.detection.features import (
    FEATURE_NAMES,
    NORMAL_CONSISTENCY_FACTOR,
    feature_dict_to_array,
)
from app.detection.schemas import DetectionEvidence
from app.processing.statistics import compute_mad


class StatisticalBaselineDetector:
    """Distribution-free robust statistical baseline detector.

    Scores each analysis window by computing modified z-scores (median/MAD standardized deviations)
    across a documented reference distribution of extracted feature vectors.
    Higher scores indicate greater deviation from the reference background.
    """

    def __init__(self, config: StatisticalBaselineConfig | None = None) -> None:
        self.config = config or StatisticalBaselineConfig()
        self.is_fitted: bool = False
        self.feature_names: tuple[str, ...] = FEATURE_NAMES
        self.reference_medians: dict[str, float] = {}
        self.reference_mads: dict[str, float] = {}
        self.reference_sigmas: dict[str, float] = {}
        self.reference_sample_count: int = 0

    def fit(
        self,
        reference_features: list[dict[str, float]] | np.ndarray,
    ) -> "StatisticalBaselineDetector":
        """Compute reference median and MAD dispersion statistics for each feature.

        Args:
            reference_features: List of feature dicts or a 2D numpy array (n_samples, n_features).

        Returns:
            Self instance (fitted).
        """
        if isinstance(reference_features, list):
            if not reference_features:
                raise ValueError("Cannot fit baseline detector on empty reference feature list.")
            mat = np.array([feature_dict_to_array(f) for f in reference_features], dtype=np.float64)
        else:
            if reference_features.ndim != 2 or reference_features.shape[0] == 0:
                raise ValueError(
                    f"Reference feature array must be 2D non-empty, got {reference_features.shape}"
                )
            mat = np.asarray(reference_features, dtype=np.float64)

        n_samples, _ = mat.shape
        self.reference_sample_count = n_samples

        for idx, feat_name in enumerate(self.feature_names):
            col = mat[:, idx]
            finite_col = col[np.isfinite(col)]
            if finite_col.size == 0:
                med = 0.0
                mad = 0.0
            else:
                med = float(np.median(finite_col))
                mad = compute_mad(finite_col, median=med)

            sigma = mad * NORMAL_CONSISTENCY_FACTOR
            self.reference_medians[feat_name] = med
            self.reference_mads[feat_name] = mad
            self.reference_sigmas[feat_name] = sigma

        self.is_fitted = True
        return self

    def score_features(
        self,
        features_list: list[dict[str, float]],
    ) -> list[DetectionEvidence]:
        """Score candidate windows against the fitted reference distribution.

        Args:
            features_list: List of feature dictionaries to evaluate.

        Returns:
            list[DetectionEvidence]: One evidence object per input feature dictionary.

        Raises:
            ModelNotFittedError: If detector has not been fitted and cannot evaluate.
        """
        if not self.is_fitted:
            raise ModelNotFittedError(
                "StatisticalBaselineDetector must be fitted before scoring features."
            )

        if not features_list:
            return []

        results: list[DetectionEvidence] = []
        threshold = self.config.mad_threshold

        for feat_dict in features_list:
            z_scores: dict[str, float] = {}

            for feat_name in self.feature_names:
                val = feat_dict.get(feat_name, 0.0)
                ref_med = self.reference_medians[feat_name]
                ref_sigma = self.reference_sigmas[feat_name]

                denom = max(1e-12, ref_sigma)
                if abs(val - ref_med) < 1e-12:
                    z = 0.0
                elif ref_sigma < 1e-12:
                    # Non-zero deviation in a feature with zero dispersion in reference
                    z = float(abs(val - ref_med) / 1e-12)
                else:
                    z = float(abs(val - ref_med) / denom)

                z_scores[feat_name] = z

            # Aggregate composite score
            z_vals = list(z_scores.values())
            if self.config.aggregation == "max":
                composite_score = float(np.max(z_vals))
            else:  # robust_mean
                composite_score = float(np.mean(z_vals))

            # Deterministic top contributing feature
            top_feature = max(z_scores.items(), key=lambda item: (item[1], item[0]))
            is_anomalous = composite_score >= threshold

            rationale = (
                f"Composite MAD score {composite_score:.2f} "
                f"{'>=' if is_anomalous else '<'} threshold {threshold:.2f} "
                f"(top deviation: {top_feature[0]} at z={top_feature[1]:.2f})"
            )

            evidence = DetectionEvidence(
                detector_name="statistical_baseline",
                anomaly_score=round(composite_score, 6),
                threshold_used=round(threshold, 6),
                is_anomalous=is_anomalous,
                score_semantics="higher_indicates_more_anomalous",
                decision_rationale=rationale,
                parameters={
                    "aggregation": self.config.aggregation,
                    "reference_mode": self.config.reference_mode,
                    "reference_sample_count": self.reference_sample_count,
                    "top_contributing_feature": top_feature[0],
                    "top_feature_deviation": round(top_feature[1], 4),
                },
            )
            results.append(evidence)

        return results

    def fit_and_score(
        self,
        features_list: list[dict[str, float]],
    ) -> list[DetectionEvidence]:
        """Fit in-situ reference statistics on the ensemble and score the same features."""
        self.fit(features_list)
        return self.score_features(features_list)
