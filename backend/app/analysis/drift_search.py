"""Coherent linear frequency-drift hypothesis grid search."""

import numpy as np

from app.analysis.config import DriftSearchConfig
from app.analysis.exceptions import (
    CoordinateMetadataUnavailableError,
    HypothesisLimitExceededError,
    InvalidAnalysisConfigError,
)
from app.analysis.schemas import DriftHypothesis, DriftSearchResult
from app.processing.models import QualityMask
from app.processing.statistics import compute_mad
from app.representation.axes import FrequencyAxisModel, TimeAxisModel

NORMAL_CONSISTENCY_FACTOR: float = 1.482602218505602


def search_linear_drift_hypotheses(
    values: np.ndarray,
    time_axis: TimeAxisModel,
    frequency_axis: FrequencyAxisModel,
    quality_mask: QualityMask | None = None,
    config: DriftSearchConfig | None = None,
) -> DriftSearchResult:
    """Evaluate candidate linear drift rate hypotheses by coherent de-drift integration.

    Shifts rows in frequency according to each hypothesis slope and measures the peak
    signal-to-noise ratio in the collapsed, integrated 1D spectrum.

    Args:
        values: 2D numpy array [time_index, freq_index].
        time_axis: TimeAxisModel providing sampling interval in seconds.
        frequency_axis: FrequencyAxisModel providing channel spacing in Hz.
        quality_mask: Optional QualityMask aligned with values.
        config: DriftSearchConfig with search boundaries and step size.

    Returns:
        DriftSearchResult: Optimal drift hypothesis, grid details, and diagnostic scores.

    Raises:
        InvalidAnalysisConfigError: If input is not 2D.
        CoordinateMetadataUnavailableError: If axis metadata lacks sampling or channel spacing.
        HypothesisLimitExceededError: If hypothesis count exceeds config.max_hypotheses.
    """
    if values.ndim != 2:
        raise InvalidAnalysisConfigError(f"Array must be 2D, received shape {values.shape}")

    if time_axis.sampling_interval_seconds is None or frequency_axis.channel_spacing_hz is None:
        raise CoordinateMetadataUnavailableError(
            "Drift search requires valid sampling_interval_seconds and channel_spacing_hz"
        )

    cfg = config or DriftSearchConfig()
    dt = time_axis.sampling_interval_seconds
    df = abs(frequency_axis.channel_spacing_hz)

    if dt <= 0.0 or df <= 0.0:
        raise CoordinateMetadataUnavailableError(
            "Physical sampling interval and spacing must be positive"
        )

    # Generate hypothesis grid
    rates = np.arange(
        cfg.min_drift_rate_hz_per_s,
        cfg.max_drift_rate_hz_per_s + (cfg.drift_step_hz_per_s / 2.0),
        cfg.drift_step_hz_per_s,
    )
    n_hypotheses = len(rates)

    if n_hypotheses > cfg.max_hypotheses:
        raise HypothesisLimitExceededError(
            f"Configured drift grid ({n_hypotheses} hypotheses) exceeds "
            f"safety limit of {cfg.max_hypotheses}",
            details={"hypotheses": n_hypotheses, "limit": cfg.max_hypotheses},
        )

    n_t, n_f = values.shape
    primary_mask = quality_mask.primary_mask if quality_mask is not None else None

    # Sanitize masked/invalid data to row medians for robust integration
    clean_vals = np.copy(values)
    for t in range(n_t):
        row = clean_vals[t, :]
        bad_mask = ~np.isfinite(row)
        if primary_mask is not None:
            bad_mask |= primary_mask[t, :]

        valid_data = row[~bad_mask]
        fill_val = float(np.median(valid_data)) if valid_data.size > 0 else 0.0
        row[bad_mask] = fill_val

    # Reference time
    t_ref_idx = 0.0 if cfg.reference_time_mode == "start" else (n_t - 1.0) / 2.0

    hypotheses_records: list[DriftHypothesis] = []
    best_rate = float(rates[0])
    best_score = -1e9

    for rate in rates:
        # Sum shifted rows into 1D integrated profile
        integrated = np.zeros(n_f, dtype=np.float64)
        sample_weights = np.zeros(n_f, dtype=np.float64)

        for t in range(n_t):
            time_delta_s = (t - t_ref_idx) * dt
            # Shift to counter the drift: negative rate * delta_t shifts back to reference channel
            freq_shift_hz = -rate * time_delta_s
            shift_channels = int(np.round(freq_shift_hz / df))

            row = clean_vals[t, :]
            if shift_channels == 0:
                integrated += row
                sample_weights += 1.0
            elif shift_channels > 0:
                # Shifted right
                if shift_channels < n_f:
                    integrated[shift_channels:] += row[:-shift_channels]
                    sample_weights[shift_channels:] += 1.0
            else:  # shift_channels < 0
                abs_s = abs(shift_channels)
                if abs_s < n_f:
                    integrated[:-abs_s] += row[abs_s:]
                    sample_weights[:-abs_s] += 1.0

        # Normalize by valid weight where non-zero
        valid_bins = sample_weights > 0
        if np.count_nonzero(valid_bins) < 3:
            score = 0.0
            peak_chan = 0
        else:
            profile = np.zeros_like(integrated)
            profile[valid_bins] = integrated[valid_bins] / sample_weights[valid_bins]

            prof_med = float(np.median(profile[valid_bins]))
            prof_mad = compute_mad(profile[valid_bins], median=prof_med)
            prof_sigma = max(1e-12, prof_mad * NORMAL_CONSISTENCY_FACTOR)

            peak_val = float(np.max(profile[valid_bins]))
            peak_chan = int(np.argmax(profile))
            score = float(max(0.0, (peak_val - prof_med) / prof_sigma))

        hyp = DriftHypothesis(
            drift_rate_hz_per_s=round(float(rate), 4),
            score=round(score, 4),
            integrated_snr=round(score, 4),
            peak_channel_index=peak_chan,
        )
        hypotheses_records.append(hyp)

        if score > best_score:
            best_score = score
            best_rate = float(rate)

    # Check if best rate is on boundary
    is_boundary = bool(
        abs(best_rate - cfg.min_drift_rate_hz_per_s) < 1e-6
        or abs(best_rate - cfg.max_drift_rate_hz_per_s) < 1e-6
    )

    # Sort top hypotheses by score descending
    sorted_hyps = sorted(hypotheses_records, key=lambda h: h.score, reverse=True)

    return DriftSearchResult(
        hypotheses_evaluated=n_hypotheses,
        best_drift_rate_hz_per_s=round(best_rate, 4),
        best_score=round(best_score, 4),
        is_on_boundary=is_boundary,
        grid_step_hz_per_s=round(cfg.drift_step_hz_per_s, 4),
        search_metric=cfg.metric,
        top_hypotheses=sorted_hyps[:10],
        provenance={
            "dt_seconds": dt,
            "df_hz": df,
            "reference_time_mode": cfg.reference_time_mode,
            "min_rate": cfg.min_drift_rate_hz_per_s,
            "max_rate": cfg.max_drift_rate_hz_per_s,
        },
    )
