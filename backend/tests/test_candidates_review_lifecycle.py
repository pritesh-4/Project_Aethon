"""Tests for candidate human-in-the-loop review lifecycle and audit log preservation."""

from pathlib import Path

import pytest

from app.candidates.exceptions import InvalidCandidateStateTransitionError
from app.candidates.repository import CandidateRepository
from app.candidates.review import validate_and_apply_review
from app.candidates.schemas import Candidate, CandidateStatus


def test_valid_review_state_transitions() -> None:
    """Test full valid progression from unreviewed through triage."""
    cand = Candidate(
        candidate_id="cand_rev_001",
        status=CandidateStatus.UNREVIEWED,
        source_observation_ids=["obs_001"],
        associated_detection_ids=["det_001"],
        target_region={"time_start": 0, "time_stop": 10, "freq_start": 0, "freq_stop": 10},
    )

    # 1. Unreviewed -> Under Review
    cand, rec1 = validate_and_apply_review(
        candidate=cand,
        new_status=CandidateStatus.UNDER_REVIEW,
        reviewer_id="scientist_alice",
        notes="Opening investigation.",
    )
    assert cand.status == CandidateStatus.UNDER_REVIEW
    assert rec1.previous_status == CandidateStatus.UNREVIEWED
    assert rec1.new_status == CandidateStatus.UNDER_REVIEW
    assert len(cand.review_history) == 1

    # 2. Under Review -> Needs More Data
    cand, _rec2 = validate_and_apply_review(
        candidate=cand,
        new_status=CandidateStatus.NEEDS_MORE_DATA,
        reviewer_id="scientist_alice",
        notes="Awaiting follow-up telescope observation.",
    )
    assert cand.status == CandidateStatus.NEEDS_MORE_DATA
    assert len(cand.review_history) == 2

    # 3. Needs More Data -> Under Review
    cand, _rec3 = validate_and_apply_review(
        candidate=cand,
        new_status=CandidateStatus.UNDER_REVIEW,
        reviewer_id="scientist_bob",
        notes="Follow-up observation acquired; resuming review.",
    )
    assert cand.status == CandidateStatus.UNDER_REVIEW
    assert len(cand.review_history) == 3

    # 4. Under Review -> Interesting
    cand, _rec4 = validate_and_apply_review(
        candidate=cand,
        new_status=CandidateStatus.INTERESTING,
        reviewer_id="lead_investigator",
        notes="High linear drift coherence and zero RFI flags.",
    )
    assert cand.status == CandidateStatus.INTERESTING
    assert len(cand.review_history) == 4


def test_invalid_review_state_transitions_rejected() -> None:
    """Invalid transitions raise explicit errors without corrupting record."""
    cand = Candidate(
        candidate_id="cand_rev_002",
        status=CandidateStatus.UNREVIEWED,
        source_observation_ids=["obs_001"],
        associated_detection_ids=["det_001"],
        target_region={"time_start": 0, "time_stop": 10, "freq_start": 0, "freq_stop": 10},
    )

    # Cannot jump directly from UNREVIEWED to INTERESTING
    with pytest.raises(InvalidCandidateStateTransitionError) as exc_info:
        validate_and_apply_review(
            candidate=cand,
            new_status=CandidateStatus.INTERESTING,
            reviewer_id="user_1",
        )
    assert "Illegal lifecycle transition" in str(exc_info.value)
    assert cand.status == CandidateStatus.UNREVIEWED
    assert len(cand.review_history) == 0

    # Transition to UNDER_REVIEW then DISMISSED
    cand, _ = validate_and_apply_review(
        candidate=cand,
        new_status=CandidateStatus.UNDER_REVIEW,
        reviewer_id="user_1",
    )
    cand, _ = validate_and_apply_review(
        candidate=cand,
        new_status=CandidateStatus.DISMISSED,
        reviewer_id="user_1",
    )
    assert cand.status == CandidateStatus.DISMISSED

    # Cannot transition from DISMISSED to INTERESTING
    with pytest.raises(InvalidCandidateStateTransitionError):
        validate_and_apply_review(
            candidate=cand,
            new_status=CandidateStatus.INTERESTING,
            reviewer_id="user_1",
        )


def test_review_history_persistence_in_repository(tmp_path: Path) -> None:
    """Review history is serialized and preserved across repository reloads."""
    db_file = tmp_path / "candidates_test.db"
    repo = CandidateRepository(db_path=db_file)

    cand = Candidate(
        candidate_id="cand_persist_001",
        status=CandidateStatus.UNREVIEWED,
        source_observation_ids=["obs_001"],
        associated_detection_ids=["det_001"],
        target_region={"time_start": 0, "time_stop": 10, "freq_start": 0, "freq_stop": 10},
    )
    repo.save_candidate(cand)

    # Perform review
    cand, _ = validate_and_apply_review(
        candidate=cand,
        new_status=CandidateStatus.UNDER_REVIEW,
        reviewer_id="scientist_clara",
        notes="Reviewing candidate persistence.",
    )
    repo.save_candidate(cand)

    # Re-instantiate repository and verify
    repo2 = CandidateRepository(db_path=db_file)
    loaded = repo2.get_candidate("cand_persist_001")
    assert loaded is not None
    assert loaded.status == CandidateStatus.UNDER_REVIEW
    assert len(loaded.review_history) == 1
    assert loaded.review_history[0].reviewer_id == "scientist_clara"
    assert loaded.review_history[0].notes == "Reviewing candidate persistence."
