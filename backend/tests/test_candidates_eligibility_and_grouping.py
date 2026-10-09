"""Tests for candidate eligibility filtering and 2D bounding-box grouping."""

import pytest

from app.candidates.eligibility import check_candidate_eligibility
from app.candidates.grouping import (
    compute_region_iou,
    find_matching_candidate,
    merge_into_candidate,
)
from app.candidates.schemas import Candidate, CandidateStatus


def test_candidate_eligibility_valid_region() -> None:
    """A valid, unflagged region passes candidate eligibility checks."""
    result = check_candidate_eligibility(
        observation_id="obs_test_001",
        target_region={"time_start": 0, "time_stop": 16, "freq_start": 100, "freq_stop": 200},
        valid_sample_count=1600,
        flagged_sample_fraction=0.05,
        anomaly_score=2.5,
    )
    assert result.is_eligible is True
    assert len(result.rejection_reasons) == 0
    assert len(result.warnings) == 0


def test_candidate_eligibility_missing_observation_id() -> None:
    """Missing or empty observation ID is rejected."""
    result = check_candidate_eligibility(
        observation_id="",
        target_region={"time_start": 0, "time_stop": 16, "freq_start": 100, "freq_stop": 200},
    )
    assert result.is_eligible is False
    assert any("Observation identifier" in r for r in result.rejection_reasons)


def test_candidate_eligibility_inverted_or_negative_bounds() -> None:
    """Inverted or negative bounds are rejected."""
    # Negative start
    res_neg = check_candidate_eligibility(
        observation_id="obs_001",
        target_region={"time_start": -2, "time_stop": 10, "freq_start": 0, "freq_stop": 50},
    )
    assert res_neg.is_eligible is False
    assert any("Negative region indices" in r for r in res_neg.rejection_reasons)

    # Inverted time
    res_inv_t = check_candidate_eligibility(
        observation_id="obs_001",
        target_region={"time_start": 20, "time_stop": 10, "freq_start": 0, "freq_stop": 50},
    )
    assert res_inv_t.is_eligible is False
    assert any("time_stop" in r for r in res_inv_t.rejection_reasons)

    # Inverted frequency
    res_inv_f = check_candidate_eligibility(
        observation_id="obs_001",
        target_region={"time_start": 0, "time_stop": 10, "freq_start": 50, "freq_stop": 50},
    )
    assert res_inv_f.is_eligible is False
    assert any("freq_stop" in r for r in res_inv_f.rejection_reasons)


def test_candidate_eligibility_sample_and_flag_limits() -> None:
    """Regions with 0 samples or 100% flags are rejected; high flags generate warnings."""
    # Zero samples
    res_zero = check_candidate_eligibility(
        observation_id="obs_001",
        target_region={"time_start": 0, "time_stop": 10, "freq_start": 0, "freq_stop": 50},
        valid_sample_count=0,
    )
    assert res_zero.is_eligible is False
    assert any("zero valid" in r for r in res_zero.rejection_reasons)

    # 100% flagged
    res_flag100 = check_candidate_eligibility(
        observation_id="obs_001",
        target_region={"time_start": 0, "time_stop": 10, "freq_start": 0, "freq_stop": 50},
        flagged_sample_fraction=1.0,
    )
    assert res_flag100.is_eligible is False
    assert any("100% flagged" in r for r in res_flag100.rejection_reasons)

    # Exceeds max allowable
    res_exceed = check_candidate_eligibility(
        observation_id="obs_001",
        target_region={"time_start": 0, "time_stop": 10, "freq_start": 0, "freq_stop": 50},
        flagged_sample_fraction=0.98,
    )
    assert res_exceed.is_eligible is False

    # Elevated flag fraction between 0.40 and 0.85 generates warning but remains eligible
    res_warn = check_candidate_eligibility(
        observation_id="obs_001",
        target_region={"time_start": 0, "time_stop": 10, "freq_start": 0, "freq_stop": 50},
        flagged_sample_fraction=0.50,
    )
    assert res_warn.is_eligible is True
    assert len(res_warn.warnings) > 0
    assert any("elevated quality flag fraction" in w for w in res_warn.warnings)


def test_compute_region_iou_identical_and_disjoint() -> None:
    """Test 2D bounding box intersection-over-union behavior."""
    box_a = {"time_start": 0, "time_stop": 10, "freq_start": 0, "freq_stop": 10}
    # Identical box -> IoU = 1.0
    assert compute_region_iou(box_a, box_a) == pytest.approx(1.0)

    # Disjoint box
    box_b = {"time_start": 20, "time_stop": 30, "freq_start": 20, "freq_stop": 30}
    assert compute_region_iou(box_a, box_b) == pytest.approx(0.0)

    # 50% time overlap, 100% freq overlap:
    # A: [0:10, 0:10] (area 100)
    # C: [5:15, 0:10] (area 100)
    # Intersection: [5:10, 0:10] (area 50)
    # Union: 100 + 100 - 50 = 150 -> IoU = 50 / 150 = 1/3
    box_c = {"time_start": 5, "time_stop": 15, "freq_start": 0, "freq_stop": 10}
    assert compute_region_iou(box_a, box_c) == pytest.approx(50.0 / 150.0)


def test_find_matching_candidate_and_merge() -> None:
    """Test candidate de-duplication grouping and bounding box union."""
    cand1 = Candidate(
        candidate_id="cand_orig_001",
        status=CandidateStatus.UNREVIEWED,
        source_observation_ids=["obs_001"],
        associated_detection_ids=["det_001"],
        target_region={"time_start": 0, "time_stop": 10, "freq_start": 100, "freq_stop": 150},
    )

    # Case 1: High overlap detection on same observation matches cand1
    new_reg = {"time_start": 2, "time_stop": 12, "freq_start": 105, "freq_stop": 155}
    matched, rationale = find_matching_candidate(
        observation_id="obs_001",
        target_region=new_reg,
        existing_candidates=[cand1],
        iou_threshold=0.20,
    )
    assert matched is not None
    assert matched.candidate_id == "cand_orig_001"
    assert "IoU" in rationale or "proximity" in rationale

    # Case 2: Merge into cand1 updates target region to bounding union
    updated = merge_into_candidate(
        candidate=matched,
        new_detection_id="det_002",
        new_region=new_reg,
        new_evidence=[],
    )
    assert "det_002" in updated.associated_detection_ids
    assert updated.target_region["time_start"] == 0
    assert updated.target_region["time_stop"] == 12
    assert updated.target_region["freq_start"] == 100
    assert updated.target_region["freq_stop"] == 155

    # Case 3: Distinct signal far away on same observation does NOT match
    far_reg = {"time_start": 50, "time_stop": 60, "freq_start": 500, "freq_stop": 550}
    matched_far, _ = find_matching_candidate(
        observation_id="obs_001",
        target_region=far_reg,
        existing_candidates=[cand1],
        iou_threshold=0.20,
    )
    assert matched_far is None

    # Case 4: Same frequency/time on DIFFERENT observation does NOT match
    matched_diff_obs, _ = find_matching_candidate(
        observation_id="obs_different_999",
        target_region=new_reg,
        existing_candidates=[cand1],
        iou_threshold=0.20,
    )
    assert matched_diff_obs is None
