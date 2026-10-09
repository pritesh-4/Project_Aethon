"""Cross-observation event comparison and conservative recurrence analysis."""

from datetime import datetime
from typing import Any

from app.analysis.config import RecurrenceConfig
from app.analysis.schemas import RecurrenceComparisonRecord


def compare_observation_events(
    event_a: dict[str, Any],
    event_b: dict[str, Any],
    config: RecurrenceConfig | None = None,
) -> RecurrenceComparisonRecord:
    """Evaluate whether two measured event records meet conservative criteria for recurrence.

    Compares center frequencies, observation epochs, and astronomical source identity
    without assuming missing data indicates non-detection.

    Args:
        event_a: Dictionary with observation and signal metadata for first event.
        event_b: Dictionary with observation and signal metadata for second event.
        config: RecurrenceConfig specifying frequency and time tolerances.

    Returns:
        RecurrenceComparisonRecord: Traceable comparison record and compatibility score.
    """
    cfg = config or RecurrenceConfig()

    obs_a_id = str(event_a.get("observation_id", "unknown_a"))
    obs_b_id = str(event_b.get("observation_id", "unknown_b"))

    warnings: list[str] = []
    criteria: dict[str, Any] = {}
    score_components: list[float] = []

    # 1. Frequency compatibility
    f_a = event_a.get("center_frequency_hz")
    f_b = event_b.get("center_frequency_hz")
    f_delta: float | None = None

    if f_a is not None and f_b is not None:
        f_delta = round(abs(float(f_a) - float(f_b)), 3)
        is_f_compatible = bool(f_delta <= cfg.max_frequency_separation_hz)
        criteria["frequency_delta_hz"] = f_delta
        criteria["frequency_compatible"] = is_f_compatible

        # Frequency score decaying with delta
        f_score = max(0.0, 1.0 - (f_delta / max(1.0, cfg.max_frequency_separation_hz)))
        score_components.append(f_score)
    else:
        warnings.append("One or both events lack valid physical center_frequency_hz metadata.")
        criteria["frequency_compatible"] = False

    # 2. Temporal separation (epochs)
    t_a_mjd = event_a.get("start_mjd")
    t_b_mjd = event_b.get("start_mjd")
    time_delta_days: float | None = None

    if t_a_mjd is not None and t_b_mjd is not None:
        time_delta_days = round(abs(float(t_a_mjd) - float(t_b_mjd)), 4)
        is_t_compatible = bool(time_delta_days <= cfg.max_time_separation_days)
        criteria["time_delta_days"] = time_delta_days
        criteria["time_compatible"] = is_t_compatible

        t_score = max(0.0, 1.0 - (time_delta_days / max(1.0, cfg.max_time_separation_days)))
        score_components.append(t_score)
    else:
        # Check ISO strings if MJD omitted
        iso_a = event_a.get("start_time_utc")
        iso_b = event_b.get("start_time_utc")
        if iso_a and iso_b:
            try:
                dt_a = datetime.fromisoformat(str(iso_a).replace("Z", "+00:00"))
                dt_b = datetime.fromisoformat(str(iso_b).replace("Z", "+00:00"))
                days = abs((dt_b - dt_a).total_seconds()) / 86400.0
                time_delta_days = round(days, 4)
                criteria["time_delta_days"] = time_delta_days
                criteria["time_compatible"] = bool(time_delta_days <= cfg.max_time_separation_days)
                t_score = max(0.0, 1.0 - (time_delta_days / max(1.0, cfg.max_time_separation_days)))
                score_components.append(t_score)
            except Exception:
                warnings.append("Unable to parse ISO observation timestamps for temporal delta.")
        else:
            warnings.append("Observation epoch metadata (MJD or UTC) unavailable.")

    # 3. Source metadata matching (if provided)
    src_a = event_a.get("source_name")
    src_b = event_b.get("source_name")
    if src_a and src_b:
        clean_src_a = str(src_a).strip().upper()
        clean_src_b = str(src_b).strip().upper()
        src_match = clean_src_a == clean_src_b
        criteria["source_match"] = src_match
        score_components.append(1.0 if src_match else 0.2)
        if not src_match:
            warnings.append(f"Source names differ: '{clean_src_a}' vs '{clean_src_b}'")

    composite_score = (
        float(sum(score_components) / len(score_components)) if score_components else 0.0
    )
    is_compatible = bool(
        composite_score >= cfg.min_target_match_confidence
        and f_delta is not None
        and f_delta <= cfg.max_frequency_separation_hz
    )

    status_label = "COMPATIBLE" if is_compatible else "INCOMPATIBLE"
    notes = (
        f"Compared events from {obs_a_id} and {obs_b_id}: "
        f"compatibility score {composite_score:.2f} ({status_label})."
    )

    return RecurrenceComparisonRecord(
        observation_a_id=obs_a_id,
        observation_b_id=obs_b_id,
        is_compatible=is_compatible,
        frequency_delta_hz=f_delta,
        time_delta_days=time_delta_days,
        compatibility_score=round(composite_score, 4),
        criteria_evaluated=criteria,
        notes=notes,
        warnings=warnings,
    )
