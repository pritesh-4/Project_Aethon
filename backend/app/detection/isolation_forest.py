"""Unsupervised Isolation Forest anomaly detector with reproducible scikit-learn pipeline."""

from pathlib import Path

import joblib
import numpy as np
import sklearn
from sklearn.ensemble import IsolationForest

from app.detection.config import IsolationForestConfig
from app.detection.exceptions import InvalidModelArtifactError, ModelNotFittedError
from app.detection.features import (
    FEATURE_NAMES,
    FEATURE_SCHEMA_VERSION,
    feature_dict_to_array,
)
from app.detection.schemas import DetectionEvidence

MODEL_ARTIFACT_MAGIC = "AETHON_ISOLATION_FOREST_V1"


class IsolationForestDetector:
    """Unsupervised tree-based anomaly detector using scikit-learn's Isolation Forest.

    Public Score Semantics:
        scikit-learn's native decision_function(X) outputs negative values for anomalies
        and positive values for inliers.
        To maintain our transparent public convention, this detector inverts the score:
            anomaly_score = - decision_function(X)
        Higher scores strictly indicate greater anomaly.
        Under default contamination calibration, the decision boundary is threshold = 0.0,
        where anomaly_score >= 0.0 corresponds to an outlier flag.
    """

    def __init__(self, config: IsolationForestConfig | None = None) -> None:
        self.config = config or IsolationForestConfig()
        self.model: IsolationForest | None = None
        self.feature_names: tuple[str, ...] = FEATURE_NAMES
        self.feature_schema_version: str = FEATURE_SCHEMA_VERSION
        self.is_fitted: bool = False

        # Fitted robust scaling parameters (to prevent evaluation data leakage)
        self.scaler_medians: np.ndarray | None = None
        self.scaler_iqrs: np.ndarray | None = None
        self.reference_sample_count: int = 0
        self.calibrated_threshold: float = 0.0

    def _transform_features(self, X: np.ndarray, fit: bool = False) -> np.ndarray:
        """Apply robust median/IQR scaling fitted strictly on reference data."""
        if not self.config.standardize_features:
            return X

        if fit:
            self.scaler_medians = np.median(X, axis=0)
            p75 = np.percentile(X, 75, axis=0)
            p25 = np.percentile(X, 25, axis=0)
            iqr = p75 - p25
            # Clamp zero IQR to avoid division by zero on degenerate features
            self.scaler_iqrs = np.where(iqr < 1e-12, 1.0, iqr)

        if self.scaler_medians is None or self.scaler_iqrs is None:
            raise ModelNotFittedError("Feature scaler has not been fitted.")

        result = (X - self.scaler_medians) / self.scaler_iqrs
        return np.asarray(result, dtype=np.float64)

    def fit(
        self,
        reference_features: list[dict[str, float]] | np.ndarray,
    ) -> "IsolationForestDetector":
        """Fit Isolation Forest on unlabeled reference feature vectors.

        Args:
            reference_features: List of feature dicts or 2D numpy array (n_samples, n_features).

        Returns:
            Self instance (fitted).
        """
        if isinstance(reference_features, list):
            if not reference_features:
                raise ValueError("Cannot fit Isolation Forest on empty reference feature list.")
            mat = np.array([feature_dict_to_array(f) for f in reference_features], dtype=np.float64)
        else:
            if reference_features.ndim != 2 or reference_features.shape[0] == 0:
                raise ValueError(
                    f"Reference feature array must be 2D non-empty, got {reference_features.shape}"
                )
            mat = np.asarray(reference_features, dtype=np.float64)

        n_samples = mat.shape[0]
        self.reference_sample_count = n_samples

        # Transform features
        X_trans = self._transform_features(mat, fit=True)

        # Scikit-learn estimator
        self.model = IsolationForest(
            n_estimators=self.config.n_estimators,
            max_samples=self.config.max_samples,
            contamination=self.config.contamination,
            random_state=self.config.random_state,
            n_jobs=1,  # deterministic single-thread execution
        )
        self.model.fit(X_trans)
        self.is_fitted = True

        # Determine threshold
        if self.config.score_percentile_threshold is not None:
            # Empirical percentile calibration on reference set
            ref_raw = self.model.decision_function(X_trans)
            ref_scores = -ref_raw
            self.calibrated_threshold = float(
                np.percentile(ref_scores, self.config.score_percentile_threshold)
            )
        else:
            # Default scikit-learn decision_function boundary in inverted space is 0.0
            self.calibrated_threshold = 0.0

        return self

    def score_features(
        self,
        features_list: list[dict[str, float]],
    ) -> list[DetectionEvidence]:
        """Score candidate windows against the fitted Isolation Forest distribution.

        Args:
            features_list: List of feature dicts to evaluate.

        Returns:
            list[DetectionEvidence]: Traceable detection evidence records.

        Raises:
            ModelNotFittedError: If model is not fitted.
        """
        if not self.is_fitted or self.model is None:
            raise ModelNotFittedError(
                "IsolationForestDetector must be fitted before scoring features."
            )

        if not features_list:
            return []

        mat = np.array([feature_dict_to_array(f) for f in features_list], dtype=np.float64)
        X_trans = self._transform_features(mat, fit=False)

        # Invert score so higher strictly indicates more anomalous
        raw_decision = self.model.decision_function(X_trans)
        anomaly_scores = -raw_decision

        results: list[DetectionEvidence] = []
        threshold = self.calibrated_threshold

        for idx, score in enumerate(anomaly_scores):
            score_val = float(score)
            is_anomalous = score_val >= threshold

            rationale = (
                f"Inverted decision score {score_val:.4f} "
                f"{'>=' if is_anomalous else '<'} threshold {threshold:.4f} "
                f"(contamination={self.config.contamination})"
            )

            evidence = DetectionEvidence(
                detector_name="isolation_forest",
                anomaly_score=round(score_val, 6),
                threshold_used=round(threshold, 6),
                is_anomalous=is_anomalous,
                score_semantics="higher_indicates_more_anomalous",
                decision_rationale=rationale,
                parameters={
                    "n_estimators": self.config.n_estimators,
                    "contamination": self.config.contamination,
                    "random_state": self.config.random_state,
                    "standardize_features": self.config.standardize_features,
                    "raw_decision_score": round(float(raw_decision[idx]), 6),
                    "reference_sample_count": self.reference_sample_count,
                    "sklearn_version": sklearn.__version__,
                },
            )
            results.append(evidence)

        return results

    def fit_and_score(
        self,
        features_list: list[dict[str, float]],
    ) -> list[DetectionEvidence]:
        """Fit in-situ on window ensemble and return scores."""
        self.fit(features_list)
        return self.score_features(features_list)

    def save(self, file_path: str | Path) -> None:
        """Persist fitted model and scaler state safely to a .joblib artifact.

        Raises:
            ModelNotFittedError: If model is not fitted.
            ValueError: If path does not end with .joblib.
        """
        if not self.is_fitted or self.model is None:
            raise ModelNotFittedError("Cannot save unfitted IsolationForestDetector.")

        path = Path(file_path)
        if path.suffix != ".joblib":
            raise ValueError(f"Model artifact file must have .joblib extension, got '{path.name}'")

        path.parent.mkdir(parents=True, exist_ok=True)

        payload = {
            "magic": MODEL_ARTIFACT_MAGIC,
            "feature_schema_version": self.feature_schema_version,
            "sklearn_version": sklearn.__version__,
            "config": self.config.model_dump(),
            "scaler_medians": self.scaler_medians,
            "scaler_iqrs": self.scaler_iqrs,
            "reference_sample_count": self.reference_sample_count,
            "calibrated_threshold": self.calibrated_threshold,
            "model": self.model,
        }
        joblib.dump(payload, path)

    @classmethod
    def load(cls, file_path: str | Path) -> "IsolationForestDetector":
        """Load and verify a persisted IsolationForestDetector artifact.

        Raises:
            FileNotFoundError: If artifact does not exist.
            InvalidModelArtifactError: If artifact is corrupted, untrusted, or incompatible.
        """
        path = Path(file_path)
        if not path.is_file():
            raise FileNotFoundError(f"Model artifact not found at {path}")

        try:
            payload = joblib.load(path)
        except Exception as exc:
            raise InvalidModelArtifactError(f"Failed to deserialize model artifact: {exc}") from exc

        if not isinstance(payload, dict) or payload.get("magic") != MODEL_ARTIFACT_MAGIC:
            raise InvalidModelArtifactError(
                "Invalid model artifact: Missing AETHON model verification signature."
            )

        art_ver = payload.get("feature_schema_version")
        if art_ver != FEATURE_SCHEMA_VERSION:
            raise InvalidModelArtifactError(
                f"Feature schema mismatch: Artifact version {art_ver} "
                f"!= current version {FEATURE_SCHEMA_VERSION}"
            )

        config_data = payload.get("config", {})
        config = IsolationForestConfig(**config_data)

        detector = cls(config=config)
        detector.model = payload["model"]
        detector.scaler_medians = payload.get("scaler_medians")
        detector.scaler_iqrs = payload.get("scaler_iqrs")
        detector.reference_sample_count = payload.get("reference_sample_count", 0)
        detector.calibrated_threshold = payload.get("calibrated_threshold", 0.0)
        detector.is_fitted = True

        return detector
