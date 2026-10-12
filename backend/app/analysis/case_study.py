"""Canonical BLC1 investigation case study demonstrating detection, drift isolation,
cadence comparison, and terrestrial RFI downgrade (REQ-CASE-01).

Scientific Provenance:
- Event: Breakthrough Listen Candidate 1 (BLC1)
- Publication: Sheikh, S. Z. et al. (2021). "Analysis of the Breakthrough Listen candidate signal
  BLC1 with a microwave radio telescope." Nature Astronomy 5, 1153-1162.
- Instrument: Parkes Observatory (Murriyang) 64-m telescope, UWL receiver.
- Primary Frequency: ~982.00254 MHz
- Apparent Drift Rate: +0.0154 Hz/s
- Target: Proxima Centauri (Alpha Centauri C)
- Resolution: Intermodulation product of local ground oscillators (clock harmonics).
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel

from app.analysis.cadence import (
    CadenceHit,
    CadencePointing,
    evaluate_cadence_sequence,
)
from app.analysis.rfi_rules import (
    evaluate_terrestrial_rfi_rules,
)
from app.candidates.review import validate_and_apply_review
from app.candidates.schemas import (
    Candidate,
    CandidateAssessment,
    CandidateStatus,
    EvidenceItem,
    EvidenceType,
)
from app.candidates.scoring import assess_candidate_evidence

BLC1_PROVENANCE_METADATA: dict[str, Any] = {
    "case_study_id": "CASE_BLC1_PROXIMA_CENTAURI_2019",
    "target_name": "Proxima Centauri",
    "observatory": "Parkes Observatory (Murriyang)",
    "instrument": "Ultra-Wideband Low (UWL) receiver",
    "primary_frequency_hz": 982002540.0,
    "apparent_drift_rate_hz_s": 0.0154,
    "scientific_citation": (
        "Sheikh, S. Z., Smith, S., Price, D. C., et al. (2021). "
        "Analysis of the Breakthrough Listen candidate signal BLC1 with a microwave "
        "radio telescope. Nature Astronomy, 5(11), 1153-1162."
    ),
    "conclusion": "Confirmed terrestrial RFI: intermodulation product of site oscillators.",
}


class BLC1CaseStudyOutcome(BaseModel):
    """End-to-end audit trail and outcome for the canonical BLC1 case study."""

    case_study_id: str
    provenance: dict[str, Any]
    initial_candidate: Candidate
    final_candidate: Candidate
    initial_assessment: CandidateAssessment
    final_assessment: CandidateAssessment
    cadence_result: dict[str, Any]
    rfi_rule_result: dict[str, Any]
    final_status: CandidateStatus
    is_downgraded_to_rfi: bool
    audit_notes: list[str]


def run_blc1_investigation() -> BLC1CaseStudyOutcome:
    """Execute the end-to-end BLC1 investigation workflow.

    Demonstrates:
    1. Initial detection of drifting narrowband carrier at 982.00254 MHz on Proxima Centauri.
    2. Promotion to INTERESTING / UNDER_REVIEW candidate with high priority score.
    3. Multi-pointing cadence evaluation (ABACAD).
    4. Terrestrial RFI rule evaluation detecting clock harmonic intermodulation.
    5. Systematic downgrade to LIKELY_INTERFERENCE with explainable scientific audit trail.

    Returns:
        BLC1CaseStudyOutcome: Comprehensive verifiable audit record.
    """
    candidate_id = "cand_blc1_proxima_cen_2019"
    obs_on_1 = "obs_blc1_gbt_pks_on_01"
    obs_off_1 = "obs_blc1_gbt_pks_off_01"
    obs_on_2 = "obs_blc1_gbt_pks_on_02"
    obs_off_2 = "obs_blc1_gbt_pks_off_02"
    obs_on_3 = "obs_blc1_gbt_pks_on_03"
    obs_off_3 = "obs_blc1_gbt_pks_off_03"

    f0_hz = BLC1_PROVENANCE_METADATA["primary_frequency_hz"]
    drift_hz_s = BLC1_PROVENANCE_METADATA["apparent_drift_rate_hz_s"]

    # 1. Base Evidence from initial detection
    ev_det = EvidenceItem(
        evidence_id="ev_blc1_det_01",
        evidence_type=EvidenceType.DETECTION,
        source_observation_id=obs_on_1,
        producing_module="detection",
        method_and_version="statistical_baseline_v1",
        scores_or_parameters={"anomaly_score": 8.5},
    )
    ev_drift = EvidenceItem(
        evidence_id="ev_blc1_drift_01",
        evidence_type=EvidenceType.DRIFT,
        source_observation_id=obs_on_1,
        producing_module="drift",
        method_and_version="linear_regression_v1",
        scores_or_parameters={
            "drift_rate_hz_per_s": drift_hz_s,
            "r_squared": 0.992,
            "uncertainty_hz_per_s": 0.0008,
            "is_physical": True,
        },
    )
    ev_temp = EvidenceItem(
        evidence_id="ev_blc1_temp_01",
        evidence_type=EvidenceType.TEMPORAL,
        source_observation_id=obs_on_1,
        producing_module="temporal",
        method_and_version="temporal_v1",
        scores_or_parameters={
            "valid_time_fraction": 1.0,
            "temporal_persistence": 0.95,
        },
    )
    ev_qual = EvidenceItem(
        evidence_id="ev_blc1_qual_01",
        evidence_type=EvidenceType.QUALITY,
        source_observation_id=obs_on_1,
        producing_module="quality",
        method_and_version="rfi_mask_v1",
        scores_or_parameters={"flagged_fraction": 0.01},
    )

    initial_evidence = [ev_det, ev_drift, ev_temp, ev_qual]
    initial_assess = assess_candidate_evidence(
        candidate_id=candidate_id,
        evidence_items=initial_evidence,
        assessment_version=1,
    )

    candidate = Candidate(
        candidate_id=candidate_id,
        source_observation_ids=[obs_on_1],
        target_region={
            "time_start": 0,
            "time_stop": 30,
            "freq_start": 982000,
            "freq_stop": 982005,
        },
        physical_coordinates={
            "freq_center_hz": f0_hz,
            "bandwidth_hz": 4.0,
            "drift_rate_hz_per_s": drift_hz_s,
        },
        status=CandidateStatus.UNREVIEWED,
        current_assessment=initial_assess,
        evidence_items=initial_evidence,
        review_history=[],
    )

    # Transition to UNDER_REVIEW -> INTERESTING (due to initial high score)
    candidate, _ = validate_and_apply_review(
        candidate=candidate,
        new_status=CandidateStatus.UNDER_REVIEW,
        reviewer_id="automated_triage_pipeline",
        notes="Promoted to UNDER_REVIEW following drifting carrier detection at 982.002 MHz.",
        action="triage_promotion",
    )
    candidate, _ = validate_and_apply_review(
        candidate=candidate,
        new_status=CandidateStatus.INTERESTING,
        reviewer_id="scientific_analyst",
        notes="Designated as INTERESTING candidate BLC1; initiating cadence verification.",
        action="scientific_escalation",
    )

    # 2. Multi-Pointing Cadence Evaluation (ABACAD)
    # Sheikh et al. found lookalike emissions appearing in off-target pointings
    pointings = [
        CadencePointing(
            observation_id=obs_on_1,
            pointing_type="ON",
            source_name="Proxima_Centauri",
            start_mjd=58603.10,
        ),
        CadencePointing(
            observation_id=obs_off_1,
            pointing_type="OFF",
            source_name="HIP_65378",
            start_mjd=58603.12,
        ),
        CadencePointing(
            observation_id=obs_on_2,
            pointing_type="ON",
            source_name="Proxima_Centauri",
            start_mjd=58603.14,
        ),
        CadencePointing(
            observation_id=obs_off_2,
            pointing_type="OFF",
            source_name="HD_125455",
            start_mjd=58603.16,
        ),
        CadencePointing(
            observation_id=obs_on_3,
            pointing_type="ON",
            source_name="Proxima_Centauri",
            start_mjd=58603.18,
        ),
        CadencePointing(
            observation_id=obs_off_3,
            pointing_type="OFF",
            source_name="HIP_65378",
            start_mjd=58603.20,
        ),
    ]
    # Follow-up analysis revealed signal persisted in off-target beam HIP_65378
    hits = [
        CadenceHit(
            observation_id=obs_on_1, is_detected=True, snr=22.0, drift_rate_hz_per_s=drift_hz_s
        ),
        CadenceHit(
            observation_id=obs_off_1, is_detected=True, snr=14.5, drift_rate_hz_per_s=drift_hz_s
        ),  # Contamination!
        CadenceHit(
            observation_id=obs_on_2, is_detected=True, snr=21.0, drift_rate_hz_per_s=drift_hz_s
        ),
        CadenceHit(observation_id=obs_off_2, is_detected=False),
        CadenceHit(
            observation_id=obs_on_3, is_detected=True, snr=19.5, drift_rate_hz_per_s=drift_hz_s
        ),
        CadenceHit(
            observation_id=obs_off_3, is_detected=True, snr=12.0, drift_rate_hz_per_s=drift_hz_s
        ),  # Contamination!
    ]

    cadence_res = evaluate_cadence_sequence(
        cadence_id="cad_blc1_investigation", pointings=pointings, hits=hits
    )

    # 3. Terrestrial RFI Rule Evaluation
    # BLC1 falls inside 960-1215 MHz allocation and matches 38.4 MHz clock intermod
    rfi_rule_res = evaluate_terrestrial_rfi_rules(
        candidate_id=candidate_id,
        frequency_hz=f0_hz,
        drift_rate_hz_per_s=drift_hz_s,
        bandwidth_hz=4.0,
        associated_carrier_frequencies_hz=[f0_hz - 38.4e6, f0_hz + 38.4e6],  # Lookalikes
    )

    # 4. Integrate Cadence & RFI Evidence into Candidate Assessment
    ev_cad = EvidenceItem(
        evidence_id="ev_blc1_cadence_01",
        evidence_type=EvidenceType.CADENCE,
        source_observation_id=obs_on_1,
        producing_module="cadence",
        method_and_version="cadence_v1",
        scores_or_parameters=cadence_res.model_dump(),
    )
    ev_rfi = EvidenceItem(
        evidence_id="ev_blc1_rfi_rules_01",
        evidence_type=EvidenceType.RFI_RULE,
        source_observation_id=obs_on_1,
        producing_module="rfi_rules",
        method_and_version="rfi_rules_v1",
        scores_or_parameters=rfi_rule_res.model_dump(),
    )

    updated_evidence = [*initial_evidence, ev_cad, ev_rfi]
    final_assess = assess_candidate_evidence(
        candidate_id=candidate_id,
        evidence_items=updated_evidence,
        assessment_version=2,
    )
    candidate.current_assessment = final_assess
    candidate.evidence_items = updated_evidence

    # 5. Apply Formal Review Downgrade
    off_det = cadence_res.detected_off_pointings
    off_tot = cadence_res.total_off_pointings
    downgrade_notes = (
        "Downgraded candidate BLC1 to LIKELY_INTERFERENCE per Sheikh et al. (2021). "
        f"Cadence analysis demonstrated signal persistence in {off_det}/{off_tot} "
        "OFF-target reference pointings (HIP 65378). Spectral rules confirmed candidate "
        "falls inside protected aeronautical radionavigation band with 38.4 MHz "
        "intermodulation lookalikes from local site oscillators."
    )
    candidate, _ = validate_and_apply_review(
        candidate=candidate,
        new_status=CandidateStatus.LIKELY_INTERFERENCE,
        reviewer_id="lead_investigation_astronomer",
        notes=downgrade_notes,
        action="triage_downgrade",
        evidence_references=["ev_blc1_cadence_01", "ev_blc1_rfi_rules_01"],
    )

    p_band = final_assess.priority_band.value.upper()
    audit_notes = [
        "Initial candidate creation: High priority under detection and drift coherence.",
        "Promotion: Transitioned UNREVIEWED -> UNDER_REVIEW -> INTERESTING.",
        f"Cadence finding: Detected in {off_det} OFF-target pointings (HIP 65378).",
        f"RFI finding: Flagged by rules: {', '.join(rfi_rule_res.matched_rule_ids)}.",
        (
            f"Final disposition: Transitioned to LIKELY_INTERFERENCE "
            f"(Band: {p_band}, Score: {final_assess.overall_score})."
        ),
    ]

    return BLC1CaseStudyOutcome(
        case_study_id=BLC1_PROVENANCE_METADATA["case_study_id"],
        provenance=BLC1_PROVENANCE_METADATA,
        initial_candidate=candidate.model_copy(deep=True),
        final_candidate=candidate,
        initial_assessment=initial_assess,
        final_assessment=final_assess,
        cadence_result=cadence_res.model_dump(),
        rfi_rule_result=rfi_rule_res.model_dump(),
        final_status=candidate.status,
        is_downgraded_to_rfi=candidate.status == CandidateStatus.LIKELY_INTERFERENCE,
        audit_notes=audit_notes,
    )
