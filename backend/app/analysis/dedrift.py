"""Linear de-drift compensation transformation."""

import numpy as np

from app.analysis.config import DeDriftConfig
from app.analysis.exceptions import (
    CoordinateMetadataUnavailableError,
    InvalidAnalysisConfigError,
)
from app.analysis.schemas import DeDriftResult
from app.processing.models import QualityMask
from app.representation.axes import FrequencyAxisModel, TimeAxisModel


def apply_linear_dedrift(
    values: np.ndarray,
    drift_rate_hz_per_s: float,
    time_axis: TimeAxisModel,
    frequency_axis: FrequencyAxisModel,
    quality_mask: QualityMask | None = None,
    config: DeDriftConfig | None = None,
) -> tuple[np.ndarray, DeDriftResult]:
    """Shear a time-frequency array to compensate for a declared linear drift hypothesis.

    Shifts rows in frequency as a function of elapsed time such that a carrier following
    f(t) = f_0 + drift_rate * (t - t_0) is aligned into a strictly vertical spectral column.
    Never wraps around opposite boundaries. The input array is completely immutable.

    Args:
        values: 2D numpy array [time_index, freq_index].
        drift_rate_hz_per_s: Linear drift rate to neutralize in Hz/s.
        time_axis: TimeAxisModel providing time resolution in seconds.
        frequency_axis: FrequencyAxisModel providing frequency resolution in Hz.
        quality_mask: Optional QualityMask aligned with values.
        config: DeDriftConfig specifying reference time and fill value.

    Returns:
        tuple: (de_drifted_array: np.ndarray, result_metadata: DeDriftResult)

    Raises:
        InvalidAnalysisConfigError: If input values array is not 2D.
        CoordinateMetadataUnavailableError: If axis metadata is missing or non-positive.
    """
    if values.ndim != 2:
        raise InvalidAnalysisConfigError(f"Array must be 2D, received shape {values.shape}")

    if time_axis.sampling_interval_seconds is None or frequency_axis.channel_spacing_hz is None:
        raise CoordinateMetadataUnavailableError(
            "De-drift transformation requires valid sampling_interval_seconds "
            "and channel_spacing_hz"
        )

    dt = time_axis.sampling_interval_seconds
    df = abs(frequency_axis.channel_spacing_hz)

    if dt <= 0.0 or df <= 0.0:
        raise CoordinateMetadataUnavailableError(
            "Physical sampling interval and spacing must be positive"
        )

    cfg = config or DeDriftConfig()
    n_t, n_f = values.shape

    t_ref_idx = 0.0 if cfg.reference_time_mode == "start" else (n_t - 1.0) / 2.0
    ref_time_s = round(t_ref_idx * dt, 6)

    # Output array allocated cleanly (input is never mutated)
    out_values = np.full((n_t, n_f), cfg.fill_value, dtype=np.float64)

    total_orig_energy = 0.0
    clipped_energy = 0.0

    for t in range(n_t):
        row = values[t, :]
        pos_energy = float(np.sum(np.maximum(0.0, row)))
        total_orig_energy += pos_energy

        time_delta_s = (t - t_ref_idx) * dt
        # Shift to counter the drift
        # If signal drifted right (+rate), we shift left (-rate) to neutralize
        freq_shift_hz = -drift_rate_hz_per_s * time_delta_s
        shift_channels = int(np.round(freq_shift_hz / df))

        if shift_channels == 0:
            out_values[t, :] = row
        elif shift_channels > 0:
            # Shifted right by shift_channels
            if shift_channels < n_f:
                out_values[t, shift_channels:] = row[:-shift_channels]
                clipped_energy += float(np.sum(np.maximum(0.0, row[-shift_channels:])))
            else:
                clipped_energy += pos_energy
        else:  # shift_channels < 0
            # Shifted left by abs_s
            abs_s = abs(shift_channels)
            if abs_s < n_f:
                out_values[t, :-abs_s] = row[abs_s:]
                clipped_energy += float(np.sum(np.maximum(0.0, row[:abs_s])))
            else:
                clipped_energy += pos_energy

    clipped_frac = float(clipped_energy / total_orig_energy) if total_orig_energy > 1e-12 else 0.0

    metadata = DeDriftResult(
        applied_drift_rate_hz_per_s=round(drift_rate_hz_per_s, 6),
        reference_time_s=ref_time_s,
        matrix_shape=[n_t, n_f],
        clipped_energy_fraction=round(clipped_frac, 6),
        de_drifted_values=None,
        provenance={
            "dt_seconds": dt,
            "df_hz": df,
            "fill_value": cfg.fill_value,
            "reference_time_mode": cfg.reference_time_mode,
        },
    )

    return out_values, metadata
