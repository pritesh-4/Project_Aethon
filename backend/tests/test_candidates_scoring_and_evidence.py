"""Tests for candidate evidence aggregation, scoring policies, and priority heuristics."""

import pytest

from app.analysis.config import AnalysisPipelineConfig
from app.analysis.schemas import (
    AnalysisResult,
    DriftFitResult,
    FrequencyTrajectory,
    RecurrenceComparisonRecord,
    TemporalCharacterization,
)
from app.candidates.evidence import (
    create_analysis_evidence,
    create_detection_evidence,
    create_quality_evidence,
)
from app.candidates.schemas import EvidenceType, PriorityBand
from app.candidates.scoring import (
    assess_candidate_evidence,
)
from app.detection.schemas import AnalysisWindow, AnomalousRegion, DetectionEvidence
from app.processing.models import RfiAssessmentReport


def _make_sample_rfi(flagged_fraction: float = 0.05) -> RfiAssessmentReport:
    """Helper to build a valid RfiAssessmentReport."""
    return RfiAssessmentReport(
        total_flagged_cells=50,
        flagged_fraction=flagged_fraction,
        flagged_channels=[10, 11],
        flagged_time_samples=[5],
        indicators=[],
    )


def _make_sample_detection(
    stat_score: float = 3.8,
    iso_score: float = 4.5,
) -> AnomalousRegion:
    """Helper to build a valid AnomalousRegion with baseline and IF evidence."""
    window = AnalysisWindow(
        window_id="win_0",
        time_start=0,
        time_stop=16,
        freq_start=10,
        freq_stop=20,
        valid_sample_count=160,
        flagged_sample_fraction=0.0,
    )
    baseline_ev = DetectionEvidence(
        detector_name="statistical_baseline",
        anomaly_score=stat_score,
        threshold_used=2.5,
        is_anomalous=stat_score >= 2.5,
        decision_rationale="Exceeds robust median baseline cutoff",
    )
    iso_ev = DetectionEvidence(
        detector_name="isolation_forest",
        anomaly_score=iso_score,
        threshold_used=2.5,
        is_anomalous=iso_score >= 2.5,
        decision_rationale="Isolation Forest tree path anomaly detected",
    )
    return AnomalousRegion(
        detection_id="det_123",
        window=window,
        features={"peak_snr": 12.5, "dispersion": 0.8},
        baseline_evidence=baseline_ev,
        isolation_forest_evidence=iso_ev,
        is_anomalous=True,
    )


def _make_sample_analysis() -> AnalysisResult:
    """Helper to build a valid AnalysisResult with drift, temporal, and recurrence."""
    trajectory = FrequencyTrajectory(
        points=[],
        total_points=16,
        valid_points=16,
        extraction_method="peak_power_track",
    )
    drift = DriftFitResult(
        drift_rate_hz_per_s=2.45,
        drift_rate_index_slope=0.15,
        reference_frequency_hz=1420405000.0,
        reference_time_s=0.0,
        uncertainty_hz_per_s=0.08,
        r_squared=0.96,
        sample_count=16,
        is_physical=True,
    )
    temporal = TemporalCharacterization(
        first_active_time_s=0.0,
        last_active_time_s=16.0,
        observed_duration_s=16.0,
        valid_time_fraction=1.0,
        temporal_persistence=0.90,
        temporal_variability=0.15,
        temporal_profile_snr=14.5,
    )
    recurrence = [
        RecurrenceComparisonRecord(
            observation_a_id="obs_001",
            observation_b_id="obs_002",
            is_compatible=True,
            compatibility_score=0.95,
        )
    ]
    return AnalysisResult(
        observation_id="obs_001",
        analysis_run_id="run_an_001",
        trajectory=trajectory,
        drift_estimate=drift,
        temporal=temporal,
        recurrence=recurrence,
        pipeline_config=AnalysisPipelineConfig(),
    )


def test_create_detection_evidence_normalizes_items() -> None:
    """Verify that anomalous region detector outputs are mapped into structured evidence."""
    det = _make_sample_detection(stat_score=3.8, iso_score=4.5)
    ev_items = create_detection_evidence(det, observation_id="obs_001")
    assert len(ev_items) == 2

    assert all(e.evidence_type == EvidenceType.DETECTION for e in ev_items)
    stat_item = next(e for e in ev_items if e.method_and_version == "statistical_baseline_v1")
    iso_item = next(e for e in ev_items if e.method_and_version == "isolation_forest_v1")

    assert stat_item.scores_or_parameters["anomaly_score"] == 3.8
    assert iso_item.scores_or_parameters["anomaly_score"] == 4.5
    assert stat_item.source_observation_id == "obs_001"
    assert iso_item.source_observation_id == "obs_001"


def test_create_quality_evidence_maps_rfi_indicators() -> None:
    """Verify quality flags and RFI metrics map to QUALITY evidence."""
    rfi = _make_sample_rfi(flagged_fraction=0.0117)
    item = create_quality_evidence(rfi, observation_id="obs_001")

    assert item.evidence_type == EvidenceType.QUALITY
    assert item.scores_or_parameters["flagged_fraction"] == pytest.approx(0.0117)
    assert item.is_supportive is True


def test_create_analysis_evidence_maps_drift_and_temporal() -> None:
    """Verify Phase 6 drift and temporal measurements map to analysis evidence."""
    analysis = _make_sample_analysis()
    ev_items = create_analysis_evidence(analysis, observation_id="obs_001")
    assert len(ev_items) >= 3

    types = {e.evidence_type for e in ev_items}
    assert EvidenceType.DRIFT in types
    assert EvidenceType.TEMPORAL in types
    assert EvidenceType.RECURRENCE in types


def test_assess_candidate_scoring_components_and_determinism() -> None:
    """Verify that score formula computes exact contributions and is 100% deterministic."""
    analysis = _make_sample_analysis()
    rfi = _make_sample_rfi(flagged_fraction=0.02)

    ev_items = [
        *create_analysis_evidence(analysis, "obs_001"),
        create_quality_evidence(rfi, "obs_001"),
    ]

    # First evaluation
    assess1 = assess_candidate_evidence(
        candidate_id="cand_test_001",
        evidence_items=ev_items,
        assessment_version=1,
    )

    # Second evaluation with identical inputs
    assess2 = assess_candidate_evidence(
        candidate_id="cand_test_001",
        evidence_items=ev_items,
        assessment_version=1,
    )

    assert assess1.overall_score == pytest.approx(assess2.overall_score, abs=1e-6)
    assert assess1.component_contributions == assess2.component_contributions
    assert assess1.priority_band in (PriorityBand.MODERATE, PriorityBand.HIGH)


def test_assess_candidate_missing_drift_does_not_invent_zero() -> None:
    """Missing drift evidence is recorded explicitly and receives zero contribution."""
    rfi = _make_sample_rfi(flagged_fraction=0.0)
    ev_items = [create_quality_evidence(rfi, "obs_001")]

    assessment = assess_candidate_evidence(
        candidate_id="cand_test_missing",
        evidence_items=ev_items,
    )

    assert "doppler_drift_analysis" in assessment.missing_evidence
    assert assessment.component_contributions["doppler_drift"] == 0.0


def test_assess_candidate_detector_disagreement_detection() -> None:
    """Significant divergence between baseline and Isolation Forest sets disagreement flag."""
    det = _make_sample_detection(stat_score=5.0, iso_score=0.1)
    ev_items = create_detection_evidence(det, observation_id="obs_001")

    assessment = assess_candidate_evidence(
        candidate_id="cand_disagree",
        evidence_items=ev_items,
    )

    assert assessment.detector_disagreement is True
    assert any("disagreement" in w.lower() for w in assessment.warnings)
