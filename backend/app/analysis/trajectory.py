"""Frequency-trajectory extraction over time-frequency analysis regions."""

import numpy as np

from app.analysis.config import TrajectoryExtractionConfig
from app.analysis.exceptions import InvalidAnalysisConfigError
from app.analysis.schemas import FrequencyTrajectory, TrajectoryPoint
from app.processing.models import QualityMask
from app.processing.statistics import compute_mad
from app.representation.axes import FrequencyAxisModel, TimeAxisModel

NORMAL_CONSISTENCY_FACTOR: float = 1.482602218505602


def extract_frequency_trajectory(
    values: np.ndarray,
    quality_mask: QualityMask | None = None,
    time_axis: TimeAxisModel | None = None,
    frequency_axis: FrequencyAxisModel | None = None,
    config: TrajectoryExtractionConfig | None = None,
    time_offset_index: int = 0,
    frequency_offset_index: int = 0,
) -> FrequencyTrajectory:
    """Extract per-time frequency positions and intensities across an observation region.

    Identifies the strongest carrier path or ridge at each time step while respecting
    data quality flags and computing robust signal-to-noise ratios.

    Args:
        values: 2D numpy array [time_index, freq_index].
        quality_mask: Optional QualityMask aligned with values.
        time_axis: Optional TimeAxisModel for physical time in seconds.
        frequency_axis: Optional FrequencyAxisModel for physical frequency in Hz.
        config: TrajectoryExtractionConfig governing extraction method and SNR threshold.
        time_offset_index: Absolute starting time index in parent observation.
        frequency_offset_index: Absolute starting channel index in parent observation.

    Returns:
        FrequencyTrajectory: Sequence of per-time trajectory points with diagnostic metadata.

    Raises:
        InvalidAnalysisConfigError: If input values array is not 2D.
    """
    if values.ndim != 2:
        raise InvalidAnalysisConfigError(
            f"Input values array must be 2D [time, freq], got shape {values.shape}"
        )

    cfg = config or TrajectoryExtractionConfig()
    n_t, n_f = values.shape

    if n_t == 0 or n_f == 0:
        return FrequencyTrajectory(
            points=[],
            total_points=0,
            valid_points=0,
            extraction_method=cfg.method,
            extraction_notes="Empty analysis region",
        )

    primary_mask = (
        quality_mask.primary_mask if quality_mask is not None else np.zeros((n_t, n_f), dtype=bool)
    )

    trajectory_points: list[TrajectoryPoint] = []
    valid_times_s: list[float] = []
    valid_freqs_hz: list[float] = []

    dt = time_axis.sampling_interval_seconds if time_axis is not None else None
    t_ref = time_axis.reference_time_seconds if time_axis is not None else 0.0

    for t in range(n_t):
        row = values[t, :]
        row_mask = primary_mask[t, :] | ~np.isfinite(row)
        valid_indices = np.where(~row_mask)[0]

        abs_t = time_offset_index + t
        phys_t_s = round(t_ref + abs_t * dt, 6) if dt is not None else None

        if valid_indices.size == 0:
            # Entire row is invalid/flagged
            trajectory_points.append(
                TrajectoryPoint(
                    time_index=abs_t,
                    freq_index=frequency_offset_index,
                    time_s=phys_t_s,
                    freq_hz=None,
                    amplitude=0.0,
                    snr=0.0,
                    is_valid=False,
                )
            )
            continue

        valid_vals = row[valid_indices]
        row_med = float(np.median(valid_vals))
        row_mad = compute_mad(valid_vals, median=row_med)
        row_sigma = max(1e-12, row_mad * NORMAL_CONSISTENCY_FACTOR)

        # 1. Identify peak channel
        peak_valid_subidx = int(np.argmax(valid_vals))
        peak_f_rel = int(valid_indices[peak_valid_subidx])
        peak_amp = float(row[peak_f_rel])

        # 2. Centroid refinement if configured
        if cfg.method == "centroid" and valid_indices.size >= 3:
            # 3-channel local window around peak
            w_start = max(0, peak_f_rel - 1)
            w_stop = min(n_f, peak_f_rel + 2)
            sub_f = np.arange(w_start, w_stop)
            sub_w = np.maximum(0.0, row[sub_f] - row_med)
            if np.sum(sub_w) > 1e-12:
                refined_f = float(np.sum(sub_f * sub_w) / np.sum(sub_w))
                peak_f_rel = round(refined_f)

        abs_f = frequency_offset_index + peak_f_rel
        snr = float(max(0.0, (peak_amp - row_med) / row_sigma))
        is_valid_point = bool(snr >= cfg.snr_threshold)

        phys_f_hz = None
        if frequency_axis is not None and frequency_axis.is_valid:
            phys_f_hz = frequency_axis.compute_channel_center_hz(abs_f)

        point = TrajectoryPoint(
            time_index=abs_t,
            freq_index=abs_f,
            time_s=phys_t_s,
            freq_hz=phys_f_hz,
            amplitude=round(peak_amp, 6),
            snr=round(snr, 4),
            is_valid=is_valid_point,
        )
        trajectory_points.append(point)

        if is_valid_point:
            if phys_t_s is not None:
                valid_times_s.append(phys_t_s)
            if phys_f_hz is not None:
                valid_freqs_hz.append(phys_f_hz)

    valid_count = sum(1 for p in trajectory_points if p.is_valid)
    t_span = (max(valid_times_s) - min(valid_times_s)) if len(valid_times_s) >= 2 else None
    f_span = (max(valid_freqs_hz) - min(valid_freqs_hz)) if len(valid_freqs_hz) >= 2 else None

    notes = ""
    if valid_count < cfg.min_valid_points:
        notes = (
            f"Trajectory has only {valid_count} valid points (below minimum {cfg.min_valid_points})"
        )

    return FrequencyTrajectory(
        points=trajectory_points,
        total_points=n_t,
        valid_points=valid_count,
        extraction_method=cfg.method,
        extraction_notes=notes,
        time_span_s=round(t_span, 6) if t_span is not None else None,
        frequency_span_hz=round(f_span, 3) if f_span is not None else None,
    )
