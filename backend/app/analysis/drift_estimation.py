"""Linear frequency drift estimation, regression fitting, and statistical uncertainty."""

import numpy as np

from app.analysis.config import DriftEstimationConfig
from app.analysis.schemas import DriftFitResult, FrequencyTrajectory


def estimate_linear_drift(
    trajectory: FrequencyTrajectory,
    config: DriftEstimationConfig | None = None,
) -> DriftFitResult:
    """Estimate linear frequency drift rate and standard error from a FrequencyTrajectory.

    Consumes valid trajectory points and computes ordinary least squares (OLS) regression
    over physical coordinates (Hz/s) and index space (channels/step).

    Args:
        trajectory: FrequencyTrajectory containing per-time points.
        config: DriftEstimationConfig specifying minimum required points and method.

    Returns:
        DriftFitResult: Fitted drift rate, standard error uncertainty, and quality diagnostics.
    """
    cfg = config or DriftEstimationConfig()

    valid_points = [p for p in trajectory.points if p.is_valid]
    n_valid = len(valid_points)

    if n_valid < cfg.min_points:
        return DriftFitResult(
            drift_rate_hz_per_s=None,
            drift_rate_index_slope=0.0,
            reference_frequency_hz=None,
            reference_time_s=None,
            uncertainty_hz_per_s=None,
            r_squared=None,
            residual_std_hz=None,
            is_physical=False,
            sample_count=n_valid,
            fitted_trajectory_points=[],
            quality_warning=(
                f"Insufficient valid trajectory points for linear regression "
                f"({n_valid} < {cfg.min_points})"
            ),
        )

    # 1. Index-space regression (always possible)
    t_indices = np.array([p.time_index for p in valid_points], dtype=np.float64)
    f_indices = np.array([p.freq_index for p in valid_points], dtype=np.float64)

    t_idx_mean = float(np.mean(t_indices))
    f_idx_mean = float(np.mean(f_indices))
    t_idx_dev = t_indices - t_idx_mean
    t_idx_denom = float(np.sum(t_idx_dev**2))

    if t_idx_denom < 1e-12:
        index_slope = 0.0
    else:
        index_slope = float(np.sum(t_idx_dev * (f_indices - f_idx_mean)) / t_idx_denom)

    # 2. Check if physical coordinates are present
    has_physical = all(
        p.time_s is not None
        and p.freq_hz is not None
        and np.isfinite(p.time_s)
        and np.isfinite(p.freq_hz)
        for p in valid_points
    )

    if not has_physical:
        return DriftFitResult(
            drift_rate_hz_per_s=None,
            drift_rate_index_slope=round(index_slope, 6),
            reference_frequency_hz=None,
            reference_time_s=None,
            uncertainty_hz_per_s=None,
            r_squared=None,
            residual_std_hz=None,
            is_physical=False,
            sample_count=n_valid,
            fitted_trajectory_points=[],
            quality_warning="Physical coordinates unavailable; reported index slope only",
        )

    # 3. Physical regression (Hz/s)
    t_s = np.array([p.time_s for p in valid_points], dtype=np.float64)
    f_hz = np.array([p.freq_hz for p in valid_points], dtype=np.float64)

    t_mean = float(np.mean(t_s))
    f_mean = float(np.mean(f_hz))

    t_dev = t_s - t_mean
    t_denom = float(np.sum(t_dev**2))

    if t_denom < 1e-12:
        return DriftFitResult(
            drift_rate_hz_per_s=0.0,
            drift_rate_index_slope=0.0,
            reference_frequency_hz=round(f_mean, 3),
            reference_time_s=round(t_mean, 6),
            uncertainty_hz_per_s=None,
            r_squared=1.0,
            residual_std_hz=0.0,
            is_physical=True,
            sample_count=n_valid,
            fitted_trajectory_points=[(round(t_mean, 6), round(f_mean, 3))],
            quality_warning="Degenerate time span: all valid points occupy identical time",
        )

    slope_hz_s = float(np.sum(t_dev * (f_hz - f_mean)) / t_denom)
    intercept_f0 = float(f_mean - slope_hz_s * t_mean)

    # Fitted values and residuals
    f_pred = intercept_f0 + slope_hz_s * t_s
    residuals = f_hz - f_pred
    ss_res = float(np.sum(residuals**2))
    ss_tot = float(np.sum((f_hz - f_mean) ** 2))

    # Fit quality R^2
    if ss_tot < 1e-12:
        # Constant frequency signal
        r2 = 1.0
    else:
        r2 = max(0.0, 1.0 - (ss_res / ss_tot))

    # Uncertainty standard error of the slope
    degrees_of_freedom = n_valid - 2
    if degrees_of_freedom > 0:
        residual_variance = ss_res / degrees_of_freedom
        slope_std_err = float(np.sqrt(max(0.0, residual_variance / t_denom)))
        residual_std = float(np.sqrt(residual_variance))
    else:
        slope_std_err = None
        residual_std = float(np.std(residuals))

    fitted_points = [
        (round(float(t_val), 6), round(float(f_val), 3))
        for t_val, f_val in zip(t_s, f_pred, strict=True)
    ]

    return DriftFitResult(
        drift_rate_hz_per_s=round(slope_hz_s, 6),
        drift_rate_index_slope=round(index_slope, 6),
        reference_frequency_hz=round(intercept_f0, 3),
        reference_time_s=0.0,
        uncertainty_hz_per_s=round(slope_std_err, 6) if slope_std_err is not None else None,
        r_squared=round(r2, 6),
        residual_std_hz=round(residual_std, 3),
        is_physical=True,
        sample_count=n_valid,
        fitted_trajectory_points=fitted_points,
        quality_warning=None,
    )
