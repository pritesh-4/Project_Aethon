"""Tests for structured candidate case files (dossiers) and vector PDF report generation."""

from pathlib import Path

from app.candidates.dossier import generate_candidate_dossier
from app.candidates.pdf import generate_candidate_pdf
from app.candidates.schemas import (
    Candidate,
    CandidateAssessment,
    CandidateStatus,
    PriorityBand,
)


def _create_sample_candidate() -> Candidate:
    cand = Candidate(
        candidate_id="cand_dossier_sample",
        status=CandidateStatus.UNDER_REVIEW,
        source_observation_ids=["obs_synth_001"],
        associated_detection_ids=["det_42"],
        target_region={"time_start": 0, "time_stop": 16, "freq_start": 50, "freq_stop": 100},
        physical_coordinates={
            "freq_center_hz": 1420405750.0,
            "bandwidth_hz": 2500.0,
            "duration_s": 8.0,
        },
        is_synthetic=True,
    )
    assess = CandidateAssessment(
        assessment_id="assess_v1_001",
        candidate_id=cand.candidate_id,
        version=1,
        policy_name="aethon_triage_heuristic",
        policy_version="1.0.0",
        overall_score=78.5,
        priority_band=PriorityBand.HIGH,
        component_contributions={
            "anomaly_evidence": 30.0,
            "drift_coherence": 22.5,
            "temporal_persistence": 16.0,
            "data_quality": 10.0,
            "recurrence_bonus": 0.0,
        },
        missing_evidence=["repeat_observation_recurrence"],
        detector_disagreement=False,
        explanation="High-priority candidate with coherent linear frequency drift.",
        warnings=["Preliminary engineering triage score."],
    )
    cand.current_assessment = assess
    return cand


def test_generate_candidate_dossier_structure() -> None:
    """Verify structured dossier JSON snapshot contains complete evidence."""
    cand = _create_sample_candidate()
    assert cand.current_assessment is not None

    dossier = generate_candidate_dossier(
        candidate=cand,
        assessment=cand.current_assessment,
    )

    assert dossier.candidate.candidate_id == "cand_dossier_sample"
    assert dossier.assessment.overall_score == 78.5
    assert dossier.reproducibility_appendix["candidate_id"] == "cand_dossier_sample"
    assert dossier.reproducibility_appendix["assessment_version"] == 1
    assert "numpy_version" in dossier.reproducibility_appendix
    assert dossier.scientific_disclaimer != ""
    assert "scientific investigation" in dossier.scientific_disclaimer.lower()


def test_generate_candidate_pdf_creates_valid_pdf_file(tmp_path: Path) -> None:
    """Verify vector PDF export compiles a multi-page document with %PDF magic header."""
    cand = _create_sample_candidate()
    assert cand.current_assessment is not None

    dossier = generate_candidate_dossier(
        candidate=cand,
        assessment=cand.current_assessment,
    )

    pdf_output_path = tmp_path / "test_candidate_dossier.pdf"
    result_path = generate_candidate_pdf(dossier=dossier, output_path=pdf_output_path)

    assert result_path.exists()
    assert result_path.is_file()
    assert result_path.stat().st_size > 5000  # Multi-page vector PDF is non-trivial size

    with open(result_path, "rb") as f:
        header = f.read(5)
    assert header == b"%PDF-"


def test_generate_pdf_handles_sparse_evidence_without_failing(tmp_path: Path) -> None:
    """PDF generation succeeds even when candidate has minimal metadata."""
    sparse_cand = Candidate(
        candidate_id="cand_sparse",
        status=CandidateStatus.UNREVIEWED,
        source_observation_ids=["obs_sparse"],
        associated_detection_ids=[],
        target_region={"time_start": 0, "time_stop": 1, "freq_start": 0, "freq_stop": 1},
    )
    sparse_assess = CandidateAssessment(
        assessment_id="assess_sparse_1",
        candidate_id="cand_sparse",
        version=1,
        policy_name="aethon_triage_heuristic",
        policy_version="1.0.0",
        overall_score=10.0,
        priority_band=PriorityBand.LOW,
        component_contributions={},
        missing_evidence=["all"],
        detector_disagreement=False,
        explanation="Sparse candidate.",
        warnings=[],
    )
    sparse_cand.current_assessment = sparse_assess

    dossier = generate_candidate_dossier(
        candidate=sparse_cand,
        assessment=sparse_assess,
    )

    pdf_path = tmp_path / "sparse_dossier.pdf"
    res = generate_candidate_pdf(dossier=dossier, output_path=pdf_path)
    assert res.exists()
    assert res.stat().st_size > 3000
