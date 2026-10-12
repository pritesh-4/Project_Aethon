"""Terrestrial radio frequency interference (RFI) rule classifier (REQ-RFI-02, REQ-RFI-03).

Applies evidence-backed domain rules to evaluate whether candidate spectral features
correspond to known terrestrial or observatory-site interference:
1. Digital clock harmonics (Ethernet 125 MHz, FPGA 250 MHz, ref 10/20 MHz, cell 19.2/38.4 MHz).
2. Topocentric stationary emission (near-zero Doppler drift in the topocentric frame).
3. Wideband aeronautical, radar, or satellite navigation allocations.
4. Multi-carrier regular frequency combs (intermodulation or oscillator harmonics).

Provides human-readable, explainable scientific disposition rationales for all evaluated rules.
"""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

# Common base clock oscillator frequencies encountered at observatory backends (in Hz)
COMMON_OBSERVATORY_CLOCKS_HZ: dict[str, float] = {
    "10MHz_Reference": 10.0e6,
    "19.2MHz_Cellular_Base": 19.2e6,
    "20MHz_System_Clock": 20.0e6,
    "25MHz_PCIe_Base": 25.0e6,
    "38.4MHz_Cellular_Doubler": 38.4e6,
    "100MHz_Core_Bus": 100.0e6,
    "125MHz_Gigabit_Ethernet": 125.0e6,
    "250MHz_FPGA_DSP_Clock": 250.0e6,
}

# Protected / High-interference terrestrial radio allocations (in Hz)
KNOWN_TERRESTRIAL_BANDS_HZ: list[dict[str, Any]] = [
    {
        "name": "Aeronautical Radionavigation & DME",
        "f_min_hz": 960.0e6,
        "f_max_hz": 1215.0e6,
        "primary_services": "TACAN, DME, SSR/ADS-B (1030/1090 MHz)",
    },
    {
        "name": "GPS L2 / GLONASS G2",
        "f_min_hz": 1215.0e6,
        "f_max_hz": 1240.0e6,
        "primary_services": "Satellite radionavigation downlink",
    },
    {
        "name": "L-band Air Traffic Radar",
        "f_min_hz": 1240.0e6,
        "f_max_hz": 1370.0e6,
        "primary_services": "Civil and military primary pulse radars",
    },
    {
        "name": "GPS L1 / Galileo E1",
        "f_min_hz": 1559.0e6,
        "f_max_hz": 1610.0e6,
        "primary_services": "GNSS space-to-Earth downlinks",
    },
]


class RFIRuleMatch(BaseModel):
    """Specific RFI rule evaluation finding."""

    rule_id: str = Field(..., description="Unique rule identifier (e.g. 'RULE_CLOCK_HARMONIC')")
    rule_name: str = Field(..., description="Human-readable rule title")
    is_matched: bool = Field(..., description="True if candidate attributes match this RFI pattern")
    confidence: float = Field(
        ..., description="Confidence that matched pattern is terrestrial [0.0, 1.0]"
    )
    rationale: str = Field(..., description="Scientific plain-language explanation of rule outcome")


class RFIEvaluationResult(BaseModel):
    """Aggregate terrestrial RFI assessment report with explainable disposition."""

    candidate_id: str
    frequency_hz: float | None
    drift_rate_hz_per_s: float | None
    bandwidth_hz: float | None
    is_flagged_as_rfi: bool = Field(
        ..., description="True if one or more high-confidence RFI rules matched"
    )
    overall_rfi_confidence: float = Field(
        ..., description="Aggregate probability/confidence of terrestrial origin [0.0, 1.0]"
    )
    disposition_downgrade_recommended: bool = Field(
        ..., description="True if candidate should be transitioned to LIKELY_INTERFERENCE"
    )
    matched_rule_ids: list[str] = Field(default_factory=list)
    rules_evaluated: list[RFIRuleMatch] = Field(default_factory=list)
    explanations: list[str] = Field(
        default_factory=list,
        description="Traceable explanations explaining candidate disposition",
    )


def evaluate_terrestrial_rfi_rules(
    candidate_id: str,
    frequency_hz: float | None,
    drift_rate_hz_per_s: float | None,
    bandwidth_hz: float | None = None,
    duration_s: float | None = None,
    associated_carrier_frequencies_hz: list[float] | None = None,
    max_harmonic_delta_hz: float = 250.0,
) -> RFIEvaluationResult:
    """Evaluate candidate measurements against physical and empirical terrestrial RFI rules.

    Args:
        candidate_id: Identifier of the candidate being evaluated.
        frequency_hz: Physical center frequency in Hz.
        drift_rate_hz_per_s: Estimated apparent frequency drift rate in Hz/s.
        bandwidth_hz: Measured equivalent channel bandwidth in Hz.
        duration_s: Total observed duration in seconds.
        associated_carrier_frequencies_hz: Optional list of other carriers detected concurrently.
        max_harmonic_delta_hz: Maximum offset in Hz to match a clock harmonic.

    Returns:
        RFIEvaluationResult: Detailed findings with explainable disposition rationale.
    """
    rule_matches: list[RFIRuleMatch] = []
    explanations: list[str] = []

    # 1. Rule: Digital Clock Harmonics
    matched_clock_harmonic = False
    clock_details: list[str] = []
    if frequency_hz is not None and frequency_hz > 0:
        for clock_name, f_clock in COMMON_OBSERVATORY_CLOCKS_HZ.items():
            harmonic_num = round(frequency_hz / f_clock)
            if harmonic_num > 0:
                exact_harmonic_f = harmonic_num * f_clock
                offset_hz = abs(frequency_hz - exact_harmonic_f)
                if offset_hz <= max_harmonic_delta_hz:
                    matched_clock_harmonic = True
                    clock_details.append(
                        f"Harmonic #{harmonic_num} of {clock_name} ({f_clock / 1e6:.1f} MHz) "
                        f"with offset {offset_hz:.1f} Hz <= {max_harmonic_delta_hz} Hz tolerance"
                    )

    if matched_clock_harmonic and frequency_hz is not None:
        rule_matches.append(
            RFIRuleMatch(
                rule_id="RULE_CLOCK_HARMONIC",
                rule_name="Observatory Digital Clock Harmonic",
                is_matched=True,
                confidence=0.90,
                rationale=(
                    f"Frequency {frequency_hz / 1e6:.6f} MHz matches clock harmonics: "
                    + "; ".join(clock_details)
                    + ". Digital electronics at the telescope backend generate strong stationary "
                    "emissions at these frequencies."
                ),
            )
        )
        explanations.append(rule_matches[-1].rationale)
    else:
        rule_matches.append(
            RFIRuleMatch(
                rule_id="RULE_CLOCK_HARMONIC",
                rule_name="Observatory Digital Clock Harmonic",
                is_matched=False,
                confidence=0.0,
                rationale=(
                    "Candidate frequency does not coincide with standard "
                    "10/19.2/20/25/100/125/250 MHz digital clock harmonics."
                ),
            )
        )

    # 2. Rule: Zero Topocentric Doppler Drift
    # Note: Avoid treating zero drift alone as proof of terrestrial origin!
    if drift_rate_hz_per_s is not None:
        abs_drift = abs(drift_rate_hz_per_s)
        if abs_drift < 0.01:
            dur_text = f" over {duration_s:.1f} s" if duration_s else ""
            rule_matches.append(
                RFIRuleMatch(
                    rule_id="RULE_ZERO_TOPOCENTRIC_DRIFT",
                    rule_name="Zero Topocentric Drift",
                    is_matched=True,
                    confidence=0.45,  # Moderate confidence: corroborating, not standalone proof
                    rationale=(
                        f"Signal exhibits near-zero apparent frequency drift "
                        f"({drift_rate_hz_per_s:+.4f} Hz/s){dur_text} in topocentric frame. "
                        "Earth rotation typically induces non-zero Doppler drift on deep-space "
                        "celestial transmitters (unless pointed near celestial poles); "
                        "zero drift is consistent with a ground transmitter or geostationary "
                        "satellite, but cannot prove terrestrial origin without corroborating "
                        "spatial or cadence evidence."
                    ),
                )
            )
            explanations.append(rule_matches[-1].rationale)
        else:
            rule_matches.append(
                RFIRuleMatch(
                    rule_id="RULE_ZERO_TOPOCENTRIC_DRIFT",
                    rule_name="Zero Topocentric Drift",
                    is_matched=False,
                    confidence=0.0,
                    rationale=(
                        f"Measured drift rate ({drift_rate_hz_per_s:+.4f} Hz/s) "
                        "is non-zero in topocentric frame."
                    ),
                )
            )
    else:
        rule_matches.append(
            RFIRuleMatch(
                rule_id="RULE_ZERO_TOPOCENTRIC_DRIFT",
                rule_name="Zero Topocentric Drift",
                is_matched=False,
                confidence=0.0,
                rationale="Drift rate is unmeasured; zero-drift rule could not be evaluated.",
            )
        )

    # 3. Rule: Terrestrial Radio Allocations / Radar Bands
    matched_terrestrial_band = False
    band_details: list[str] = []
    if frequency_hz is not None:
        for band in KNOWN_TERRESTRIAL_BANDS_HZ:
            if band["f_min_hz"] <= frequency_hz <= band["f_max_hz"]:
                matched_terrestrial_band = True
                band_details.append(f"{band['name']} ({band['primary_services']})")

    if matched_terrestrial_band and frequency_hz is not None:
        rule_matches.append(
            RFIRuleMatch(
                rule_id="RULE_TERRESTRIAL_BAND_ALLOCATION",
                rule_name="Protected Terrestrial Spectrum Allocation",
                is_matched=True,
                confidence=0.85,
                rationale=(
                    f"Frequency {frequency_hz / 1e6:.4f} MHz falls inside known high-power "
                    "terrestrial transmitter bands: " + "; ".join(band_details) + "."
                ),
            )
        )
        explanations.append(rule_matches[-1].rationale)
    else:
        rule_matches.append(
            RFIRuleMatch(
                rule_id="RULE_TERRESTRIAL_BAND_ALLOCATION",
                rule_name="Protected Terrestrial Spectrum Allocation",
                is_matched=False,
                confidence=0.0,
                rationale=(
                    "Frequency does not overlap heavily congested aviation "
                    "radionavigation or primary radar allocations."
                ),
            )
        )

    # 4. Rule: Multi-Carrier Regular Comb
    matched_comb = False
    if (
        associated_carrier_frequencies_hz
        and frequency_hz is not None
        and len(associated_carrier_frequencies_hz) >= 2
    ):
        diffs = [
            abs(frequency_hz - other_f)
            for other_f in associated_carrier_frequencies_hz
            if abs(frequency_hz - other_f) > 10.0
        ]
        if diffs:
            min_diff = min(diffs)
            # Check if differences are integer multiples of min_diff
            multiples_count = sum(
                1 for d in diffs if abs(d - round(d / min_diff) * min_diff) < 50.0
            )
            if multiples_count >= 2:
                matched_comb = True
                rule_matches.append(
                    RFIRuleMatch(
                        rule_id="RULE_HARMONIC_COMB",
                        rule_name="Regular Multi-Carrier Frequency Comb",
                        is_matched=True,
                        confidence=0.88,
                        rationale=(
                            f"Multiple carriers detected concurrently at regular "
                            f"frequency intervals of ~{min_diff / 1e3:.1f} kHz. "
                            "Comb structures are typical artifacts of digital mixing, "
                            "power converter switching, or intermodulation distortion."
                        ),
                    )
                )
                explanations.append(rule_matches[-1].rationale)

    if not matched_comb:
        rule_matches.append(
            RFIRuleMatch(
                rule_id="RULE_HARMONIC_COMB",
                rule_name="Regular Multi-Carrier Frequency Comb",
                is_matched=False,
                confidence=0.0,
                rationale="No multi-carrier regular comb pattern detected.",
            )
        )

    # Aggregate RFI confidence
    active_matches = [m for m in rule_matches if m.is_matched]
    if not active_matches:
        overall_conf = 0.0
        is_rfi = False
        downgrade = False
        explanations.append(
            "No terrestrial RFI rules triggered. "
            "Candidate does not match known local interference signatures."
        )
    else:
        # Combine probabilities using independent noisy-OR model: P = 1 - prod(1 - p_i)
        unconf = 1.0
        for m in active_matches:
            unconf *= 1.0 - m.confidence
        overall_conf = round(1.0 - unconf, 4)
        is_rfi = bool(overall_conf >= 0.70)
        downgrade = is_rfi

    matched_ids = [m.rule_id for m in active_matches]

    return RFIEvaluationResult(
        candidate_id=candidate_id,
        frequency_hz=frequency_hz,
        drift_rate_hz_per_s=drift_rate_hz_per_s,
        bandwidth_hz=bandwidth_hz,
        is_flagged_as_rfi=is_rfi,
        overall_rfi_confidence=overall_conf,
        disposition_downgrade_recommended=downgrade,
        matched_rule_ids=matched_ids,
        rules_evaluated=rule_matches,
        explanations=explanations,
    )
