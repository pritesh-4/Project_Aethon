"""Multi-cadence ON/OFF-target pointing sequence evaluation for radio SETI (REQ-RFI-01).

Implements canonical multi-beam / multi-epoch cadence verification (e.g. ABACAD):
- Pointing A: Target of interest (ON-target beam)
- Pointings B, C, D: Off-target reference beams pointing at nearby comparison sky positions.

A bona fide localized celestial source must be detected in ON-target pointings and absent
in OFF-target pointings. Signals persisting in OFF-target pointings enter the telescope via
sidelobes, local oscillators, or terrestrial transmitters and are flagged as RFI.
"""

from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


class CadencePointing(BaseModel):
    """Metadata describing a single observation pointing in a cadence sequence."""

    observation_id: str = Field(..., description="Unique observation identifier")
    pointing_type: Literal["ON", "OFF"] = Field(
        ..., description="Pointing role: 'ON' for target source, 'OFF' for comparison beam"
    )
    source_name: str = Field(..., description="Target or reference astronomical source name")
    start_mjd: float = Field(..., description="Modified Julian Date of observation start")
    start_time_utc: str | None = Field(default=None, description="ISO-8601 UTC timestamp")
    ra_deg: float | None = Field(default=None, description="Right Ascension in degrees")
    dec_deg: float | None = Field(default=None, description="Declination in degrees")


class CadenceHit(BaseModel):
    """Detection state and extracted signal parameters for a specific pointing."""

    observation_id: str = Field(..., description="Observation identifier")
    is_detected: bool = Field(
        ..., description="True if candidate signal was detected in this pointing"
    )
    snr: float | None = Field(
        default=None, description="Measured signal-to-noise ratio if detected"
    )
    drift_rate_hz_per_s: float | None = Field(
        default=None, description="Measured frequency drift rate in Hz/s"
    )
    center_freq_hz: float | None = Field(
        default=None, description="Measured center frequency in Hz"
    )


class CadenceAnalysisResult(BaseModel):
    """Scientific outcome of a multi-cadence ON/OFF comparison with explainable rationale."""

    cadence_id: str = Field(..., description="Identifier for this cadence analysis session")
    target_source: str = Field(..., description="Primary ON-target source name")
    pattern: str = Field(..., description="Cadence pattern string, e.g. 'ABACAD'")
    total_on_pointings: int = Field(..., description="Total ON-target observations in sequence")
    detected_on_pointings: int = Field(
        ..., description="Number of ON observations where signal was detected"
    )
    total_off_pointings: int = Field(..., description="Total OFF-target observations in sequence")
    detected_off_pointings: int = Field(
        ..., description="Number of OFF observations where signal was detected"
    )
    persists_in_off_target: bool = Field(
        ..., description="True if signal was detected in one or more OFF pointings"
    )
    on_consistency: float = Field(
        ..., description="Fraction of ON-target observations containing detection [0.0, 1.0]"
    )
    disposition_recommendation: Literal["CANDIDATE_CONFIRMED", "LIKELY_RFI", "INCONCLUSIVE"] = (
        Field(..., description="Scientific triage disposition recommendation")
    )
    score_multiplier: float = Field(
        ..., description="Score scaling factor applied to candidate priority score [0.0, 1.0]"
    )
    explanations: list[str] = Field(
        default_factory=list,
        description="Array of plain-language human-readable scientific rationale statements",
    )


def evaluate_cadence_sequence(
    cadence_id: str,
    pointings: list[CadencePointing],
    hits: list[CadenceHit],
    min_on_consistency: float = 0.50,
) -> CadenceAnalysisResult:
    """Evaluate a multi-pointing observation cadence sequence.

    Args:
        cadence_id: Identifier for the cadence session.
        pointings: Ordered list of telescope pointings (e.g. ABACAD sequence).
        hits: Detection hits mapped to the corresponding observation IDs.
        min_on_consistency: Minimum fraction of ON-target pointings required
            for candidate confirmation.

    Returns:
        CadenceAnalysisResult: Structured evaluation with explainable downgrade rationale.
    """
    if not pointings:
        return CadenceAnalysisResult(
            cadence_id=cadence_id,
            target_source="UNKNOWN",
            pattern="",
            total_on_pointings=0,
            detected_on_pointings=0,
            total_off_pointings=0,
            detected_off_pointings=0,
            persists_in_off_target=False,
            on_consistency=0.0,
            disposition_recommendation="INCONCLUSIVE",
            score_multiplier=0.5,
            explanations=["No telescope pointings provided for cadence verification."],
        )

    # Map hits by observation_id
    hit_map = {h.observation_id: h for h in hits}

    on_pointings = [p for p in pointings if p.pointing_type == "ON"]
    off_pointings = [p for p in pointings if p.pointing_type == "OFF"]

    total_on = len(on_pointings)
    total_off = len(off_pointings)

    # Derive cadence pattern label (e.g. ABACAD)
    target_name = on_pointings[0].source_name if on_pointings else "UNKNOWN"
    pattern_letters: list[str] = []
    off_sources: dict[str, str] = {}
    next_letter_code = ord("B")

    for p in pointings:
        if p.pointing_type == "ON":
            pattern_letters.append("A")
        else:
            if p.source_name not in off_sources:
                off_sources[p.source_name] = chr(next_letter_code)
                next_letter_code += 1
            pattern_letters.append(off_sources[p.source_name])

    pattern = "".join(pattern_letters)

    # Count detections
    det_on = sum(
        1
        for p in on_pointings
        if hit_map.get(
            p.observation_id, CadenceHit(observation_id=p.observation_id, is_detected=False)
        ).is_detected
    )
    det_off = sum(
        1
        for p in off_pointings
        if hit_map.get(
            p.observation_id, CadenceHit(observation_id=p.observation_id, is_detected=False)
        ).is_detected
    )

    on_consistency = float(det_on / total_on) if total_on > 0 else 0.0
    persists_in_off = det_off > 0

    explanations: list[str] = []

    disposition: Literal["CANDIDATE_CONFIRMED", "LIKELY_RFI", "INCONCLUSIVE"] = "INCONCLUSIVE"
    multiplier = 0.50

    if total_off == 0:
        # No OFF pointings available
        disposition = "INCONCLUSIVE"
        multiplier = 0.70
        explanations.append(
            f"Observation cadence '{pattern}' lacks off-target reference pointings; "
            "spatial localization cannot be verified."
        )
    elif persists_in_off:
        # Signal detected in off-target pointing: classic RFI signature!
        disposition = "LIKELY_RFI"
        multiplier = 0.15  # 85% score penalty
        explanations.append(
            f"Signal detected in {det_off}/{total_off} OFF-target pointings in cadence {pattern}. "
            "Persistence across off-source telescope pointings indicates local terrestrial "
            "interference or antenna sidelobe entry rather than a localized celestial emitter."
        )
        # Detail which off-targets saw it
        detected_off_names = [
            p.source_name
            for p in off_pointings
            if hit_map.get(
                p.observation_id, CadenceHit(observation_id=p.observation_id, is_detected=False)
            ).is_detected
        ]
        off_summary = ", ".join(sorted(set(detected_off_names)))
        explanations.append(f"Contaminating detections present in reference beams: {off_summary}.")
    elif on_consistency >= min_on_consistency and det_on > 0:
        # Consistent in ON pointings, strictly absent in OFF pointings!
        disposition = "CANDIDATE_CONFIRMED"
        multiplier = 1.0
        explanations.append(
            f"Signal detected in {det_on}/{total_on} ON-target pointings ({target_name}) "
            f"and absent in all {total_off} OFF-target pointings in cadence {pattern}. "
            "Spatial pointing contrast is consistent with a localized extraterrestrial "
            "transmitter or celestial source."
        )
    elif det_on == 0:
        disposition = "INCONCLUSIVE"
        multiplier = 0.0
        explanations.append(
            f"Signal was not detected in any ON-target pointings for source {target_name}."
        )
    else:
        disposition = "INCONCLUSIVE"
        multiplier = 0.50
        explanations.append(
            f"Signal detected in only {det_on}/{total_on} ON pointings "
            f"({on_consistency:.0%} consistency, below {min_on_consistency:.0%} threshold); "
            "temporal recurrence is marginal."
        )

    return CadenceAnalysisResult(
        cadence_id=cadence_id,
        target_source=target_name,
        pattern=pattern,
        total_on_pointings=total_on,
        detected_on_pointings=det_on,
        total_off_pointings=total_off,
        detected_off_pointings=det_off,
        persists_in_off_target=persists_in_off,
        on_consistency=round(on_consistency, 4),
        disposition_recommendation=disposition,
        score_multiplier=round(multiplier, 4),
        explanations=explanations,
    )
