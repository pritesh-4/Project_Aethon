"""Temporal characterization quantifying signal duration, persistence, and coverage."""

import numpy as np

from app.analysis.config import TemporalConfig
from app.analysis.schemas import FrequencyTrajectory, TemporalCharacterization
from app.processing.models import QualityMask
from app.processing.statistics import compute_mad
from app.representation.axes import TimeAxisModel

NORMAL_CONSISTENCY_FACTOR: float = 1.482602218505602


def characterize_temporal_behavior(
    values: np.ndarray,
    trajectory: FrequencyTrajectory | None = None,
    time_axis: TimeAxisModel | None = None,
    quality_mask: QualityMask | None = None,
    config: TemporalConfig | None = None,
) -> TemporalCharacterization:
    """Measure temporal continuity, observed duration, persistence, and gap distributions.

    Args:
        values: 2D numpy array [time_index, freq_index].
        trajectory: Optional extracted FrequencyTrajectory.
        time_axis: Optional TimeAxisModel providing time step in seconds.
        quality_mask: Optional QualityMask aligned with values.
        config: TemporalConfig specifying persistence threshold.

    Returns:
        TemporalCharacterization: Quantified temporal profile and metrics.
    """
    cfg = config or TemporalConfig()
    n_t, _ = values.shape

    if n_t == 0:
        return TemporalCharacterization(
            first_active_time_s=None,
            last_active_time_s=None,
            observed_duration_s=None,
            valid_time_fraction=0.0,
            max_consecutive_gap_s=None,
            temporal_persistence=0.0,
            temporal_variability=0.0,
            temporal_profile_snr=0.0,
            temporal_notes="Empty time dimension",
        )

    dt = time_axis.sampling_interval_seconds if time_axis is not None else None
    t_ref = time_axis.reference_time_seconds if time_axis is not None else 0.0

    # 1. Trajectory-based temporal points
    if trajectory is not None and trajectory.points:
        valid_pts = [p for p in trajectory.points if p.is_valid]
    else:
        valid_pts = []

    if valid_pts:
        valid_times = [p.time_index for p in valid_pts]
        first_idx = min(valid_times)
        last_idx = max(valid_times)
        total_span_steps = (last_idx - first_idx) + 1
        coverage_frac = float(len(valid_times) / total_span_steps) if total_span_steps > 0 else 0.0

        first_s = round(t_ref + first_idx * dt, 6) if dt is not None else None
        last_s = round(t_ref + last_idx * dt, 6) if dt is not None else None
        duration_s = round((last_idx - first_idx) * dt, 6) if dt is not None else None

        # Analyze consecutive gap distribution
        sorted_times = sorted(valid_times)
        gaps = [
            sorted_times[i + 1] - sorted_times[i] - 1
            for i in range(len(sorted_times) - 1)
            if sorted_times[i + 1] - sorted_times[i] > 1
        ]
        max_gap_steps = max(gaps) if gaps else 0
        max_gap_s = round(max_gap_steps * dt, 6) if dt is not None else None
    else:
        first_s = None
        last_s = None
        duration_s = None
        coverage_frac = 0.0
        max_gap_s = None

    # 2. 1D Time-integrated power profile
    primary_mask = quality_mask.primary_mask if quality_mask is not None else None
    time_power = np.zeros(n_t, dtype=np.float64)

    for t in range(n_t):
        row = values[t, :]
        valid_mask = np.isfinite(row)
        if primary_mask is not None:
            valid_mask &= ~primary_mask[t, :]

        if np.any(valid_mask):
            time_power[t] = float(np.median(row[valid_mask]))
        else:
            time_power[t] = 0.0

    med_power = float(np.median(time_power))
    mad_power = compute_mad(time_power, median=med_power)
    sigma_power = max(1e-12, mad_power * NORMAL_CONSISTENCY_FACTOR)

    elevated_count = np.count_nonzero(
        time_power > (med_power + cfg.persistence_threshold_sigma * sigma_power)
    )
    persistence = float(elevated_count / n_t) if n_t > 0 else 0.0
    variability = float(mad_power / max(1e-12, abs(med_power)))
    peak_profile_snr = float(max(0.0, (np.max(time_power) - med_power) / sigma_power))

    notes = ""
    if duration_s is not None:
        notes = (
            f"Measured active duration {duration_s:.3f}s spanning "
            f"{len(valid_pts)} valid time points."
        )
    else:
        notes = "No valid trajectory points above threshold; reported integrated power profile."

    return TemporalCharacterization(
        first_active_time_s=first_s,
        last_active_time_s=last_s,
        observed_duration_s=duration_s,
        valid_time_fraction=round(coverage_frac, 4),
        max_consecutive_gap_s=max_gap_s,
        temporal_persistence=round(persistence, 4),
        temporal_variability=round(variability, 4),
        temporal_profile_snr=round(peak_profile_snr, 4),
        temporal_notes=notes,
    )
