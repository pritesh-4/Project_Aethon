"""Unit tests for unsupervised Isolation Forest detector and model artifact lifecycle."""

from pathlib import Path

import numpy as np
import pytest

from app.detection.config import IsolationForestConfig
from app.detection.exceptions import InvalidModelArtifactError, ModelNotFittedError
from app.detection.features import FEATURE_NAMES
from app.detection.isolation_forest import IsolationForestDetector


def test_isolation_forest_unfitted_raises_error() -> None:
    """Calling score_features or save before fit must raise ModelNotFittedError."""
    detector = IsolationForestDetector()
    with pytest.raises(ModelNotFittedError):
        detector.score_features([{"median_level": 1.0}])

    with pytest.raises(ModelNotFittedError):
        detector.save(Path("unfitted.joblib"))


def test_isolation_forest_deterministic_fitting_and_score_inversion() -> None:
    """Isolation Forest must be deterministic and adhere to inverted score convention."""
    cfg = IsolationForestConfig(n_estimators=50, contamination=0.1, random_state=42)
    det1 = IsolationForestDetector(config=cfg)
    det2 = IsolationForestDetector(config=cfg)

    # 40 normal background points
    rng = np.random.default_rng(99)
    train_data = []
    for _ in range(40):
        item = {name: float(rng.normal(loc=0.0, scale=1.0)) for name in FEATURE_NAMES}
        train_data.append(item)

    det1.fit(train_data)
    det2.fit(train_data)

    # 1 obvious anomalous vector with extreme values
    outlier = {name: 15.0 for name in FEATURE_NAMES}

    res1 = det1.score_features([outlier])[0]
    res2 = det2.score_features([outlier])[0]

    # Determinism
    assert res1.anomaly_score == res2.anomaly_score
    # Inverted score semantics: higher is more anomalous
    assert res1.score_semantics == "higher_indicates_more_anomalous"
    assert res1.is_anomalous
    assert res1.anomaly_score >= 0.0

    # Normal background points should have lower anomaly scores
    bg_res = det1.score_features(train_data[:5])
    for ev in bg_res:
        assert ev.anomaly_score < res1.anomaly_score


def test_isolation_forest_persistence_roundtrip(tmp_path: Path) -> None:
    """Model must serialize and reload cleanly with identical predictions."""
    cfg = IsolationForestConfig(n_estimators=30, contamination=0.05, random_state=7)
    detector = IsolationForestDetector(config=cfg)

    data = [{name: float(i % 5) for name in FEATURE_NAMES} for i in range(30)]
    detector.fit(data)

    test_item = [{name: 100.0 for name in FEATURE_NAMES}]
    original_scores = detector.score_features(test_item)

    model_path = tmp_path / "detector_model.joblib"
    detector.save(model_path)
    assert model_path.is_file()

    loaded_detector = IsolationForestDetector.load(model_path)
    assert loaded_detector.is_fitted
    assert loaded_detector.config.n_estimators == 30

    reloaded_scores = loaded_detector.score_features(test_item)
    assert original_scores[0].anomaly_score == reloaded_scores[0].anomaly_score
    assert original_scores[0].is_anomalous == reloaded_scores[0].is_anomalous


def test_isolation_forest_invalid_artifact_rejection(tmp_path: Path) -> None:
    """Non-.joblib extensions or corrupted files must be safely rejected."""
    detector = IsolationForestDetector()
    data = [{name: 1.0 for name in FEATURE_NAMES} for _ in range(20)]
    detector.fit(data)

    with pytest.raises(ValueError, match=r"must have \.joblib extension"):
        detector.save(tmp_path / "model.pkl")

    corrupted_file = tmp_path / "corrupted.joblib"
    corrupted_file.write_text("random bad content", encoding="utf-8")

    with pytest.raises(InvalidModelArtifactError):
        IsolationForestDetector.load(corrupted_file)
