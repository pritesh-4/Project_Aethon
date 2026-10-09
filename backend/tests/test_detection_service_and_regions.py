"""Unit tests for DetectionService and spatial region merging logic."""

import numpy as np
import pytest

from app.detection.config import DetectionPipelineConfig, WindowConfig
from app.detection.exceptions import (
    DetectionDimensionLimitExceededError,
)
from app.detection.regions import do_windows_overlap_or_touch, merge_anomalous_windows
from app.detection.schemas import AnalysisWindow, AnomalousRegion, DetectionEvidence
from app.detection.service import DetectionService
from app.detection.windows import generate_analysis_windows
from app.processing.models import QualityMask
from app.representation.axes import FrequencyAxisModel, TimeAxisModel


def test_window_generator_and_safety_ceiling() -> None:
    """Window generator partitions 2D array and enforces safety ceiling."""
    arr = np.zeros((64, 64), dtype=np.float64)
    q_mask = QualityMask(primary_mask=np.zeros((64, 64), dtype=bool))
    w_cfg = WindowConfig(time_size=16, freq_size=16, time_stride=8, freq_stride=8)

    windows = generate_analysis_windows(arr, q_mask, config=w_cfg)
    assert len(windows) > 0

    # Ensure dimension limit triggers
    with pytest.raises(DetectionDimensionLimitExceededError):
        generate_analysis_windows(arr, q_mask, config=w_cfg, max_windows_limit=5)


def test_overlap_and_touch_detection() -> None:
    """Bounding box adjacency and overlap logic."""
    b1 = (0, 10, 0, 10)
    b2 = (5, 15, 5, 15)  # overlaps b1
    b3 = (10, 20, 10, 20)  # touches b1 at border
    b4 = (30, 40, 30, 40)  # completely disjoint

    assert do_windows_overlap_or_touch(b1, b2)
    assert do_windows_overlap_or_touch(b1, b3)
    assert not do_windows_overlap_or_touch(b1, b4)


def test_merge_anomalous_windows() -> None:
    """Contiguous anomalous windows should merge into a single bounding box."""
    w1 = AnalysisWindow(
        window_id="win_0",
        time_start=0,
        time_stop=16,
        freq_start=0,
        freq_stop=16,
        valid_sample_count=256,
        flagged_sample_fraction=0.0,
    )
    w2 = AnalysisWindow(
        window_id="win_1",
        time_start=8,
        time_stop=24,
        freq_start=8,
        freq_stop=24,
        valid_sample_count=256,
        flagged_sample_fraction=0.0,
    )
    w_disjoint = AnalysisWindow(
        window_id="win_2",
        time_start=40,
        time_stop=56,
        freq_start=40,
        freq_stop=56,
        valid_sample_count=256,
        flagged_sample_fraction=0.0,
    )

    ev1 = DetectionEvidence(
        detector_name="statistical_baseline",
        anomaly_score=5.0,
        threshold_used=4.0,
        is_anomalous=True,
        decision_rationale="test",
    )
    ev2 = DetectionEvidence(
        detector_name="statistical_baseline",
        anomaly_score=7.0,
        threshold_used=4.0,
        is_anomalous=True,
        decision_rationale="test",
    )

    r1 = AnomalousRegion(detection_id="d1", window=w1, features={}, baseline_evidence=ev1)
    r2 = AnomalousRegion(detection_id="d2", window=w2, features={}, baseline_evidence=ev2)
    r3 = AnomalousRegion(detection_id="d3", window=w_disjoint, features={}, baseline_evidence=ev1)

    t_axis = TimeAxisModel(sampling_interval_seconds=0.5, sample_count=64)
    f_axis = FrequencyAxisModel(
        reference_frequency_hz=1.4e9, channel_spacing_hz=1e3, channel_count=64
    )

    merged = merge_anomalous_windows([r1, r2, r3], time_axis=t_axis, frequency_axis=f_axis)

    # Should form 2 clusters: (r1 + r2) and (r3)
    assert len(merged) == 2

    cluster1 = merged[0]
    assert cluster1.time_start == 0
    assert cluster1.time_stop == 24
    assert cluster1.freq_start == 0
    assert cluster1.freq_stop == 24
    assert cluster1.max_anomaly_score == 7.0
    assert cluster1.mean_anomaly_score == 6.0
    assert cluster1.contributing_window_ids == ["win_0", "win_1"]
    assert cluster1.time_center_s is not None
    assert cluster1.freq_center_hz is not None


def test_detection_service_pipeline_end_to_end() -> None:
    """DetectionService should execute complete pipeline and find injected signal."""
    service = DetectionService()

    # Observation with noise background + single strong narrowband signal
    rng = np.random.default_rng(42)
    data = rng.normal(loc=1.0, scale=0.1, size=(64, 64))
    # Inject signal in time 10:30, freq 20:25
    data[10:30, 20:25] += 15.0

    cfg = DetectionPipelineConfig(
        window=WindowConfig(time_size=16, freq_size=16, time_stride=8, freq_stride=8),
        merge_overlapping_regions=True,
    )

    result = service.analyze_array(
        values=data,
        observation_id="test_obs_123",
        config=cfg,
    )

    assert result.observation_id == "test_obs_123"
    assert result.total_windows_evaluated > 0
    assert len(result.anomalous_regions) > 0
    assert result.merged_regions is not None
    assert len(result.merged_regions) >= 1

    # Injected signal region should be covered
    found_signal = False
    for reg in result.anomalous_regions:
        if (
            reg.window.time_start <= 20 <= reg.window.time_stop
            and reg.window.freq_start <= 22 <= reg.window.freq_stop
        ):
            found_signal = True
            break
    assert found_signal, "Injected signal was not flagged in anomalous regions"
    assert "scientific_disclaimer" in result.model_dump()
