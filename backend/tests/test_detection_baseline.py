"""Unit tests for the distribution-free statistical baseline anomaly detector."""

import numpy as np
import pytest

from app.detection.baseline import StatisticalBaselineDetector
from app.detection.config import StatisticalBaselineConfig
from app.detection.exceptions import ModelNotFittedError
from app.detection.features import FEATURE_NAMES


def test_baseline_detector_unfitted_raises_error() -> None:
    """Calling score_features before fit must raise ModelNotFittedError."""
    detector = StatisticalBaselineDetector()
    with pytest.raises(ModelNotFittedError):
        detector.score_features([{"median_level": 1.0}])


def test_baseline_detector_fit_and_score_in_situ() -> None:
    """Baseline detector in-situ mode fits reference statistics and scores accurately."""
    cfg = StatisticalBaselineConfig(mad_threshold=3.5, aggregation="robust_mean")
    detector = StatisticalBaselineDetector(config=cfg)

    # 20 background windows with modest variations
    rng = np.random.default_rng(123)
    windows = []
    for _ in range(20):
        w = {name: float(rng.normal(loc=1.0, scale=0.1)) for name in FEATURE_NAMES}
        windows.append(w)

    # 1 anomalous window with massive signal feature deviations
    anom_window = {name: float(rng.normal(loc=1.0, scale=0.1)) for name in FEATURE_NAMES}
    anom_window["peak_snr"] = 25.0
    anom_window["channel_peak_contrast"] = 20.0
    anom_window["narrowband_concentration"] = 0.95
    windows.append(anom_window)

    evidence_list = detector.fit_and_score(windows)

    assert len(evidence_list) == 21
    assert detector.is_fitted
    assert detector.reference_sample_count == 21

    # Background windows should have low anomaly scores
    for ev in evidence_list[:20]:
        assert ev.anomaly_score < 3.5
        assert not ev.is_anomalous
        assert ev.detector_name == "statistical_baseline"

    # Anomalous window must exceed threshold
    anom_ev = evidence_list[20]
    assert anom_ev.is_anomalous
    assert anom_ev.anomaly_score >= 3.5
    assert anom_ev.score_semantics == "higher_indicates_more_anomalous"
    assert "top_contributing_feature" in anom_ev.parameters


def test_baseline_detector_max_aggregation() -> None:
    """Max aggregation flags window if any single feature exceeds the MAD threshold."""
    cfg = StatisticalBaselineConfig(mad_threshold=4.0, aggregation="max")
    detector = StatisticalBaselineDetector(config=cfg)

    # Reference windows
    ref_windows = [{name: 1.0 for name in FEATURE_NAMES} for _ in range(10)]
    # Give slight variance to one so MAD is finite
    ref_windows[0]["peak_snr"] = 1.1

    detector.fit(ref_windows)

    # Test window with single elevated feature
    candidate = {name: 1.0 for name in FEATURE_NAMES}
    candidate["channel_peak_contrast"] = 50.0  # huge deviation

    ev = detector.score_features([candidate])[0]
    assert ev.is_anomalous
    assert ev.anomaly_score > 4.0
    assert ev.parameters["top_contributing_feature"] == "channel_peak_contrast"


def test_baseline_detector_zero_dispersion_handling() -> None:
    """If a feature has zero variance across reference, identical input produces zero score."""
    detector = StatisticalBaselineDetector()
    ref_windows = [{name: 5.0 for name in FEATURE_NAMES} for _ in range(10)]
    detector.fit(ref_windows)

    # Identical candidate
    cand = {name: 5.0 for name in FEATURE_NAMES}
    ev = detector.score_features([cand])[0]
    assert ev.anomaly_score == 0.0
    assert not ev.is_anomalous
