"""Candidate eligibility rules determining whether an anomaly detection can form a candidate."""

from typing import Any

from pydantic import BaseModel, Field


class EligibilityResult(BaseModel):
    """Result of evaluating candidate eligibility criteria on a detection or region."""

    is_eligible: bool = Field(
        ..., description="True if detection meets criteria to become a candidate"
    )
    rejection_reasons: list[str] = Field(
        default_factory=list, description="List of reasons if detection was rejected"
    )
    warnings: list[str] = Field(
        default_factory=list,
        description="Advisory warnings for eligible but partially degraded regions",
    )


def check_candidate_eligibility(
    observation_id: str,
    target_region: dict[str, Any],
    valid_sample_count: int | None = None,
    flagged_sample_fraction: float | None = None,
    anomaly_score: float | None = None,
    max_flagged_fraction: float = 0.95,
) -> EligibilityResult:
    """Evaluate whether an anomalous detection region qualifies for persistent candidate creation.

    Partially contaminated regions are permitted if they contain usable samples, treating
    RFI flags as characterization evidence rather than an automatic veto.

    Args:
        observation_id: Identifier of the source observation.
        target_region: Dictionary containing time_start, time_stop, freq_start, freq_stop.
        valid_sample_count: Number of unmasked, finite samples in region.
        flagged_sample_fraction: Fraction of region cells flagged by quality masks.
        anomaly_score: Peak anomaly score from detector.
        max_flagged_fraction: Maximum allowed flagged fraction (default 0.95).

    Returns:
        EligibilityResult: Determination of eligibility, rejection reasons, and warnings.
    """
    reasons: list[str] = []
    warnings: list[str] = []

    # 1. Observation ID validation
    if not observation_id or not str(observation_id).strip():
        reasons.append("Observation identifier is missing or empty.")

    # 2. Region bounds validation
    t_start = target_region.get("time_start")
    t_stop = target_region.get("time_stop")
    f_start = target_region.get("freq_start")
    f_stop = target_region.get("freq_stop")

    if t_start is None or t_stop is None or f_start is None or f_stop is None:
        reasons.append(
            "Target region lacks one or more required index bounds (time/freq start/stop)."
        )
    else:
        if t_start < 0 or f_start < 0:
            reasons.append(
                f"Negative region indices are invalid: time_start={t_start}, freq_start={f_start}."
            )
        if t_stop <= t_start:
            reasons.append(
                f"Invalid time span: time_stop ({t_stop}) must be > time_start ({t_start})."
            )
        if f_stop <= f_start:
            reasons.append(
                f"Invalid frequency span: freq_stop ({f_stop}) must be > freq_start ({f_start})."
            )

    # 3. Usable data requirements
    if valid_sample_count is not None and valid_sample_count <= 0:
        reasons.append("Region contains zero valid (finite, unmasked) samples.")

    if flagged_sample_fraction is not None:
        if flagged_sample_fraction >= 1.0:
            reasons.append("Region is 100% flagged by quality masks; no observable signal remains.")
        elif flagged_sample_fraction > max_flagged_fraction:
            reasons.append(
                f"Flagged fraction ({flagged_sample_fraction:.2%}) "
                f"exceeds allowable limit ({max_flagged_fraction:.2%})."
            )
        elif flagged_sample_fraction > 0.40:
            warnings.append(
                f"Region has elevated quality flag fraction ({flagged_sample_fraction:.2%}); "
                "interference likely present."
            )

    # 4. Detector completion
    if anomaly_score is not None and anomaly_score < 0.0:
        reasons.append(f"Negative anomaly score ({anomaly_score}) is physically invalid.")

    is_eligible = len(reasons) == 0
    return EligibilityResult(
        is_eligible=is_eligible,
        rejection_reasons=reasons,
        warnings=warnings,
    )
