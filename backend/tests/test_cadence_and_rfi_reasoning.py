"""Automated tests for Multi-Cadence Verification (REQ-RFI-01) and RFI Rules (REQ-RFI-02, 03)."""

import pytest

from app.analysis.cadence import (
    CadenceHit,
    CadencePointing,
    evaluate_cadence_sequence,
)
from app.analysis.rfi_rules import (
    evaluate_terrestrial_rfi_rules,
)
from app.candidates.schemas import EvidenceItem, EvidenceType, PriorityBand
from app.candidates.scoring import assess_candidate_evidence


def test_cadence_confirmed_on_target_signal() -> None:
    """Signal present in all ON pointings (A) and absent in OFF pointings (B, C) is confirmed."""
    pointings = [
        CadencePointing(
            observation_id="obs_on_1",
            pointing_type="ON",
            source_name="Proxima_Centauri",
            start_mjd=58600.0,
        ),
        CadencePointing(
            observation_id="obs_off_1",
            pointing_type="OFF",
            source_name="Ref_Star_1",
            start_mjd=58600.02,
        ),
        CadencePointing(
            observation_id="obs_on_2",
            pointing_type="ON",
            source_name="Proxima_Centauri",
            start_mjd=58600.04,
        ),
        CadencePointing(
            observation_id="obs_off_2",
            pointing_type="OFF",
            source_name="Ref_Star_2",
            start_mjd=58600.06,
        ),
        CadencePointing(
            observation_id="obs_on_3",
            pointing_type="ON",
            source_name="Proxima_Centauri",
            start_mjd=58600.08,
        ),
    ]
    hits = [
        CadenceHit(observation_id="obs_on_1", is_detected=True, snr=14.2, drift_rate_hz_per_s=0.15),
        CadenceHit(observation_id="obs_off_1", is_detected=False),
        CadenceHit(observation_id="obs_on_2", is_detected=True, snr=13.8, drift_rate_hz_per_s=0.15),
        CadenceHit(observation_id="obs_off_2", is_detected=False),
        CadenceHit(observation_id="obs_on_3", is_detected=True, snr=15.1, drift_rate_hz_per_s=0.15),
    ]

    res = evaluate_cadence_sequence(cadence_id="cad_001", pointings=pointings, hits=hits)

    assert res.pattern == "ABACA"
    assert res.total_on_pointings == 3
    assert res.detected_on_pointings == 3
    assert res.total_off_pointings == 2
    assert res.detected_off_pointings == 0
    assert res.persists_in_off_target is False
    assert res.on_consistency == 1.0
    assert res.disposition_recommendation == "CANDIDATE_CONFIRMED"
    assert res.score_multiplier == 1.0
    assert any(
        "consistent with a localized extraterrestrial transmitter" in exp
        for exp in res.explanations
    )


def test_cadence_downgrades_signal_persisting_in_off_pointing() -> None:
    """Signal appearing in an OFF-target beam must be flagged as LIKELY_RFI (REQ-RFI-01)."""
    pointings = [
        CadencePointing(
            observation_id="obs_on_1", pointing_type="ON", source_name="Target_A", start_mjd=58600.0
        ),
        CadencePointing(
            observation_id="obs_off_1", pointing_type="OFF", source_name="Off_B", start_mjd=58600.02
        ),
        CadencePointing(
            observation_id="obs_on_2",
            pointing_type="ON",
            source_name="Target_A",
            start_mjd=58600.04,
        ),
    ]
    hits = [
        CadenceHit(observation_id="obs_on_1", is_detected=True, snr=18.0),
        CadenceHit(observation_id="obs_off_1", is_detected=True, snr=17.5),  # Contamination!
        CadenceHit(observation_id="obs_on_2", is_detected=True, snr=18.2),
    ]

    res = evaluate_cadence_sequence(cadence_id="cad_rfi", pointings=pointings, hits=hits)

    assert res.pattern == "ABA"
    assert res.persists_in_off_target is True
    assert res.detected_off_pointings == 1
    assert res.disposition_recommendation == "LIKELY_RFI"
    assert res.score_multiplier == pytest.approx(0.15)
    assert any(
        "Persistence across off-source telescope pointings" in exp for exp in res.explanations
    )
    assert any("Off_B" in exp for exp in res.explanations)


def test_cadence_without_off_pointings_is_inconclusive() -> None:
    """Cadence lacking off-target reference observations cannot verify spatial localization."""
    pointings = [
        CadencePointing(
            observation_id="obs_on_1", pointing_type="ON", source_name="Target_A", start_mjd=58600.0
        ),
    ]
    hits = [
        CadenceHit(observation_id="obs_on_1", is_detected=True, snr=12.0),
    ]

    res = evaluate_cadence_sequence(cadence_id="cad_inconcl", pointings=pointings, hits=hits)

    assert res.disposition_recommendation == "INCONCLUSIVE"
    assert res.total_off_pointings == 0
    assert res.score_multiplier == 0.70
    assert any("lacks off-target reference pointings" in exp for exp in res.explanations)


def test_rfi_rule_detects_ethernet_clock_harmonic() -> None:
    """Frequency at 125 MHz Ethernet harmonic triggers RULE_CLOCK_HARMONIC (REQ-RFI-02)."""
    # 8th harmonic of 125 MHz = 1000 MHz = 1.0 GHz
    target_f_hz = 8 * 125.0e6  # 1000.0 MHz
    res = evaluate_terrestrial_rfi_rules(
        candidate_id="cand_clock",
        frequency_hz=target_f_hz,
        drift_rate_hz_per_s=0.0,
    )

    assert res.is_flagged_as_rfi is True
    assert "RULE_CLOCK_HARMONIC" in res.matched_rule_ids
    assert res.disposition_downgrade_recommended is True
    assert any("125MHz_Gigabit_Ethernet" in exp for exp in res.explanations)


def test_rfi_rule_zero_drift_alone_is_corroborating_not_standalone_downgrade() -> None:
    """Near-zero drift triggers advisory flag but does not cause standalone hard downgrade."""
    # Quiet frequency in astronomical band, not matching clock or radar
    quiet_f_hz = 1420405751.0
    res = evaluate_terrestrial_rfi_rules(
        candidate_id="cand_zero_drift_clean",
        frequency_hz=quiet_f_hz,
        drift_rate_hz_per_s=0.002,  # < 0.01 Hz/s
    )

    assert "RULE_ZERO_TOPOCENTRIC_DRIFT" in res.matched_rule_ids
    # Zero drift alone has confidence 0.45 (< 0.70 threshold), so standalone downgrade is false!
    assert res.disposition_downgrade_recommended is False
    assert any(
        "cannot prove terrestrial origin without corroborating spatial or cadence evidence" in exp
        for exp in res.explanations
    )


def test_rfi_rule_radar_band_triggers_allocation_match() -> None:
    """Frequencies inside radionavigation band (e.g. 1090 MHz ADS-B) trigger band rule."""
    adsb_f_hz = 1090.0e6
    res = evaluate_terrestrial_rfi_rules(
        candidate_id="cand_adsb",
        frequency_hz=adsb_f_hz,
        drift_rate_hz_per_s=0.0,
    )

    assert res.is_flagged_as_rfi is True
    assert "RULE_TERRESTRIAL_BAND_ALLOCATION" in res.matched_rule_ids
    assert any("Aeronautical Radionavigation" in exp for exp in res.explanations)


def test_candidate_scoring_integration_with_cadence_and_rfi_downgrade() -> None:
    """Assessment applies cadence penalties and records explainable rationale (REQ-RFI-03)."""
    # Create detection evidence
    det_ev = EvidenceItem(
        evidence_id="ev_det_1",
        evidence_type=EvidenceType.DETECTION,
        source_observation_id="obs_001",
        producing_module="detection",
        method_and_version="statistical_baseline_v1",
        scores_or_parameters={"anomaly_score": 6.0},
    )
    drift_ev = EvidenceItem(
        evidence_id="ev_drift_1",
        evidence_type=EvidenceType.DRIFT,
        source_observation_id="obs_001",
        producing_module="drift",
        method_and_version="linear_regression_v1",
        scores_or_parameters={
            "drift_rate_hz_per_s": 1.25,
            "r_squared": 0.98,
            "uncertainty_hz_per_s": 0.02,
            "is_physical": True,
        },
    )

    # 1. Candidate evaluated without RFI (baseline)
    clean_assess = assess_candidate_evidence(
        candidate_id="cand_clean",
        evidence_items=[det_ev, drift_ev],
    )
    assert clean_assess.priority_band in (
        PriorityBand.HIGH,
        PriorityBand.EXCEPTIONAL,
        PriorityBand.MODERATE,
    )

    # 2. Add Cadence RFI evidence (persists in OFF beam)
    cad_ev = EvidenceItem(
        evidence_id="ev_cad_off",
        evidence_type=EvidenceType.CADENCE,
        source_observation_id="obs_001",
        producing_module="cadence",
        method_and_version="cadence_v1",
        scores_or_parameters={
            "score_multiplier": 0.15,
            "persists_in_off_target": True,
            "explanations": [
                "Cadence failure: candidate detected in off-target comparison beam Ref_Star_B."
            ],
        },
    )

    rfi_assess = assess_candidate_evidence(
        candidate_id="cand_downgraded",
        evidence_items=[det_ev, drift_ev, cad_ev],
    )

    # Score must be severely reduced by 85% penalty
    assert rfi_assess.overall_score < clean_assess.overall_score
    assert rfi_assess.priority_band == PriorityBand.LOW
    assert rfi_assess.component_contributions["cadence_multiplier"] == 0.15
    assert any("Cadence verification failure" in w for w in rfi_assess.warnings)
    assert any("Cadence failure" in exp for exp in rfi_assess.disposition_rationale)
