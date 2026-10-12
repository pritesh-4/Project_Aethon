"""Automated verification test for Canonical BLC1 Case Study (REQ-CASE-01).

Validates end-to-end flow:
1. Candidate BLC1 initial detection at 982.002 MHz on Proxima Centauri with high priority.
2. Review escalation UNREVIEWED -> UNDER_REVIEW -> INTERESTING.
3. Cadence persistence detection in OFF-target beam (HIP 65378).
4. Terrestrial RFI rule matching (aeronautical radionavigation band + clock intermodulation).
5. Formal disposition downgrade from INTERESTING -> LIKELY_INTERFERENCE with complete audit trail.
"""

from app.analysis.case_study import run_blc1_investigation
from app.candidates.schemas import CandidateStatus, PriorityBand


def test_blc1_case_study_end_to_end_investigation() -> None:
    """Execute BLC1 investigation and verify lifecycle, score scaling, and audit trail."""
    outcome = run_blc1_investigation()

    # 1. Provenance
    assert outcome.case_study_id == "CASE_BLC1_PROXIMA_CENTAURI_2019"
    assert "Sheikh" in outcome.provenance["scientific_citation"]
    assert outcome.provenance["primary_frequency_hz"] == 982002540.0

    # 2. Initial Assessment
    init_assess = outcome.initial_assessment
    assert init_assess.overall_score >= 60.0
    assert init_assess.priority_band in (PriorityBand.HIGH, PriorityBand.EXCEPTIONAL)
    assert init_assess.component_contributions["anomaly_evidence"] > 0
    assert init_assess.component_contributions["doppler_drift"] > 0

    # 3. Cadence Evidence Outcome
    cad_res = outcome.cadence_result
    assert cad_res["persists_in_off_target"] is True
    assert cad_res["detected_off_pointings"] == 2
    assert cad_res["disposition_recommendation"] == "LIKELY_RFI"
    assert cad_res["score_multiplier"] == 0.15

    # 4. RFI Rules Outcome
    rfi_res = outcome.rfi_rule_result
    assert rfi_res["is_flagged_as_rfi"] is True
    assert "RULE_TERRESTRIAL_BAND_ALLOCATION" in rfi_res["matched_rule_ids"]
    assert rfi_res["disposition_downgrade_recommended"] is True

    # 5. Final Assessment
    final_assess = outcome.final_assessment
    assert final_assess.overall_score < init_assess.overall_score
    assert final_assess.priority_band == PriorityBand.LOW
    assert final_assess.component_contributions["cadence_multiplier"] == 0.15
    assert len(final_assess.disposition_rationale) > 0

    # 6. Candidate Status & Lifecycle Audit Trail
    final_cand = outcome.final_candidate
    assert final_cand.status == CandidateStatus.LIKELY_INTERFERENCE
    assert outcome.is_downgraded_to_rfi is True

    # Audit history must have 3 transitions:
    # 1. UNREVIEWED -> UNDER_REVIEW
    # 2. UNDER_REVIEW -> INTERESTING
    # 3. INTERESTING -> LIKELY_INTERFERENCE
    history = final_cand.review_history
    assert len(history) == 3

    assert history[0].previous_status == CandidateStatus.UNREVIEWED
    assert history[0].new_status == CandidateStatus.UNDER_REVIEW

    assert history[1].previous_status == CandidateStatus.UNDER_REVIEW
    assert history[1].new_status == CandidateStatus.INTERESTING

    assert history[2].previous_status == CandidateStatus.INTERESTING
    assert history[2].new_status == CandidateStatus.LIKELY_INTERFERENCE
    assert history[2].reviewer_id == "lead_investigation_astronomer"
    assert "Sheikh et al. (2021)" in history[2].notes
    assert "ev_blc1_cadence_01" in history[2].evidence_references
    assert "ev_blc1_rfi_rules_01" in history[2].evidence_references

    # 7. Audit notes summary
    assert len(outcome.audit_notes) == 5
