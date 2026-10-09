"""Candidate evidence scoring policy and priority assessment algorithms."""

import uuid

from pydantic import BaseModel, Field

from app.candidates.schemas import (
    CandidateAssessment,
    EvidenceItem,
    EvidenceType,
    PriorityBand,
)


class CandidateScoringConfig(BaseModel):
    """Configurable weights and thresholds for candidate priority assessment."""

    policy_name: str = Field(
        default="aethon_triage_heuristic", description="Name of scoring policy"
    )
    policy_version: str = Field(default="1.0.0", description="Semantic policy version string")

    weight_anomaly: float = Field(default=35.0, ge=0.0, le=100.0)
    weight_drift: float = Field(default=25.0, ge=0.0, le=100.0)
    weight_temporal: float = Field(default=20.0, ge=0.0, le=100.0)
    weight_quality: float = Field(default=20.0, ge=0.0, le=100.0)
    max_recurrence_bonus: float = Field(default=10.0, ge=0.0, le=25.0)

    # Priority band thresholds
    threshold_exceptional: float = Field(default=80.0, ge=0.0, le=100.0)
    threshold_high: float = Field(default=60.0, ge=0.0, le=100.0)
    threshold_moderate: float = Field(default=35.0, ge=0.0, le=100.0)


def assess_candidate_evidence(
    candidate_id: str,
    evidence_items: list[EvidenceItem],
    assessment_version: int = 1,
    config: CandidateScoringConfig | None = None,
) -> CandidateAssessment:
    """Evaluate candidate evidence and compute a versioned, reproducible priority score.

    The investigation priority score [0.0, 100.0] is an operational triage heuristic
    designed to focus scientific attention on reproducible, coherent anomalies while
    accounting for interference and measurement uncertainty. It is NOT a probability of
    extraterrestrial or physical source origin.

    Args:
        candidate_id: Target candidate UUID.
        evidence_items: Aggregated evidence items associated with the candidate.
        assessment_version: Version integer for this assessment run.
        config: CandidateScoringConfig parameters.

    Returns:
        CandidateAssessment: Traceable score breakdown, priority band, and explanation.
    """
    cfg = config or CandidateScoringConfig()
    component_contributions: dict[str, float] = {}
    contributing_ids: list[str] = []
    missing_evidence: list[str] = []
    warnings: list[str] = []

    # Partition evidence by type
    ev_by_type: dict[EvidenceType, list[EvidenceItem]] = {t: [] for t in EvidenceType}
    for ev in evidence_items:
        ev_by_type[ev.evidence_type].append(ev)

    # 1. Anomaly Evidence (weight_anomaly, default 35 pts)
    det_evs = ev_by_type[EvidenceType.DETECTION]
    base_scores: list[float] = []
    if_scores: list[float] = []

    for dev in det_evs:
        contributing_ids.append(dev.evidence_id)
        sc = float(dev.scores_or_parameters.get("anomaly_score", 0.0))
        if dev.method_and_version.startswith("statistical_baseline"):
            # Modified z-score typically in range [0, 10+], map into [0, 1] using soft saturation
            norm_sc = min(1.0, max(0.0, sc / 6.0))
            base_scores.append(norm_sc)
        elif dev.method_and_version.startswith("isolation_forest"):
            # Inverted decision function score in range [0, 1.0]
            norm_sc = min(1.0, max(0.0, sc))
            if_scores.append(norm_sc)

    detector_disagreement = False
    if base_scores and if_scores:
        avg_base = sum(base_scores) / len(base_scores)
        avg_if = sum(if_scores) / len(if_scores)
        if abs(avg_base - avg_if) > 0.40:
            detector_disagreement = True
            warnings.append(
                f"Detector disagreement: baseline score {avg_base:.2f} diverges from "
                f"Isolation Forest score {avg_if:.2f}."
            )
        anomaly_factor = 0.5 * avg_base + 0.5 * avg_if
    elif base_scores:
        anomaly_factor = sum(base_scores) / len(base_scores)
        missing_evidence.append("isolation_forest_detection")
    elif if_scores:
        anomaly_factor = sum(if_scores) / len(if_scores)
        missing_evidence.append("statistical_baseline_detection")
    else:
        anomaly_factor = 0.0
        missing_evidence.append("detection_scores")

    anomaly_pts = round(anomaly_factor * cfg.weight_anomaly, 2)
    component_contributions["anomaly_evidence"] = anomaly_pts

    # 2. Doppler Drift & Coherence (weight_drift, default 25 pts)
    drift_evs = ev_by_type[EvidenceType.DRIFT]
    if drift_evs:
        best_drift = drift_evs[0]
        contributing_ids.append(best_drift.evidence_id)
        params = best_drift.scores_or_parameters

        r_sq = params.get("r_squared")
        unc = params.get("uncertainty_hz_per_s")
        rate = params.get("drift_rate_hz_per_s")
        is_phys = params.get("is_physical", False)

        if is_phys and r_sq is not None and rate is not None:
            # Goodness of fit * uncertainty penalty
            unc_penalty = 1.0
            if unc is not None and abs(float(rate)) > 1e-6:
                rel_unc = abs(float(unc)) / abs(float(rate))
                unc_penalty = max(0.0, 1.0 - min(1.0, rel_unc))

            coherence = max(0.0, float(r_sq)) * unc_penalty
            drift_pts = round(coherence * cfg.weight_drift, 2)
        else:
            # Index slope only or poor fit
            drift_pts = round(0.20 * cfg.weight_drift, 2)
            warnings.append("Doppler analysis lacks physical frequency units or R^2 fit.")
    else:
        drift_pts = 0.0
        missing_evidence.append("doppler_drift_analysis")

    component_contributions["doppler_drift"] = drift_pts

    # 3. Temporal Persistence & Duration (weight_temporal, default 20 pts)
    temp_evs = ev_by_type[EvidenceType.TEMPORAL]
    if temp_evs:
        best_temp = temp_evs[0]
        contributing_ids.append(best_temp.evidence_id)
        t_params = best_temp.scores_or_parameters

        cov_frac = float(t_params.get("valid_time_fraction", 0.0))
        persist = float(t_params.get("temporal_persistence", 0.0))
        temp_factor = 0.5 * min(1.0, max(0.0, cov_frac)) + 0.5 * min(1.0, max(0.0, persist))
        temporal_pts = round(temp_factor * cfg.weight_temporal, 2)
    else:
        temporal_pts = 0.0
        missing_evidence.append("temporal_characterization")

    component_contributions["temporal_persistence"] = temporal_pts

    # 4. Data Quality & RFI Cleanliness (weight_quality, default 20 pts)
    qual_evs = ev_by_type[EvidenceType.QUALITY]
    if qual_evs:
        best_qual = qual_evs[0]
        contributing_ids.append(best_qual.evidence_id)
        q_params = best_qual.scores_or_parameters

        flagged_frac = float(q_params.get("flagged_fraction", 0.0))
        clean_frac = max(0.0, 1.0 - flagged_frac)
        quality_pts = round(clean_frac * cfg.weight_quality, 2)
        if flagged_frac > 0.30:
            warnings.append(f"Candidate region exhibits elevated RFI flags ({flagged_frac:.1%}).")
    else:
        # Neutral default if RFI assessment omitted
        quality_pts = round(0.50 * cfg.weight_quality, 2)
        missing_evidence.append("rfi_quality_assessment")

    component_contributions["data_quality"] = quality_pts

    # 5. Multi-Observation Recurrence Bonus (bonus, up to 10 pts)
    rec_evs = ev_by_type[EvidenceType.RECURRENCE]
    bonus_pts = 0.0
    if rec_evs:
        for rev in rec_evs:
            contributing_ids.append(rev.evidence_id)
            r_params = rev.scores_or_parameters
            if r_params.get("is_compatible", False):
                comp_score = float(r_params.get("compatibility_score", 0.0))
                bonus = round(comp_score * cfg.max_recurrence_bonus, 2)
                bonus_pts = max(bonus_pts, bonus)

    component_contributions["recurrence_bonus"] = bonus_pts

    # Calculate final composite score [0.0, 100.0]
    raw_total = anomaly_pts + drift_pts + temporal_pts + quality_pts + bonus_pts
    final_score = round(min(100.0, max(0.0, raw_total)), 2)

    # Map to priority band
    if final_score >= cfg.threshold_exceptional:
        band = PriorityBand.EXCEPTIONAL
    elif final_score >= cfg.threshold_high:
        band = PriorityBand.HIGH
    elif final_score >= cfg.threshold_moderate:
        band = PriorityBand.MODERATE
    else:
        band = PriorityBand.LOW

    explanation = (
        f"Assigned priority score {final_score:.1f}/100 ({band.value.upper()}) under "
        f"{cfg.policy_name} v{cfg.policy_version}. "
        f"Anomaly contribution: {anomaly_pts}/{cfg.weight_anomaly}, "
        f"Doppler coherence: {drift_pts}/{cfg.weight_drift}, "
        f"Temporal continuity: {temporal_pts}/{cfg.weight_temporal}, "
        f"Data quality: {quality_pts}/{cfg.weight_quality}"
    )
    if bonus_pts > 0:
        explanation += f", Recurrence bonus: +{bonus_pts} pts."
    else:
        explanation += "."

    return CandidateAssessment(
        assessment_id=f"assess_{uuid.uuid4().hex[:12]}",
        candidate_id=candidate_id,
        version=assessment_version,
        policy_name=cfg.policy_name,
        policy_version=cfg.policy_version,
        overall_score=final_score,
        priority_band=band,
        component_contributions=component_contributions,
        contributing_evidence_ids=list(set(contributing_ids)),
        missing_evidence=missing_evidence,
        detector_disagreement=detector_disagreement,
        explanation=explanation,
        warnings=warnings,
    )
