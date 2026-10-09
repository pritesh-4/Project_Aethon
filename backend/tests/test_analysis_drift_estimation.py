"""Unit tests for linear drift rate regression and statistical uncertainty."""

from app.analysis.config import DriftEstimationConfig
from app.analysis.drift_estimation import estimate_linear_drift
from app.analysis.schemas import FrequencyTrajectory, TrajectoryPoint


def test_drift_estimation_exact_positive_slope() -> None:
    """Noiseless linear trajectory must recover exact slope in Hz/s with R^2 = 1.0."""
    points = []
    drift_rate = 3.5  # Hz/s
    f0 = 1.42e9

    for t_step in range(10):
        t_s = float(t_step) * 2.0  # dt = 2.0s
        freq_hz = f0 + drift_rate * t_s
        pt = TrajectoryPoint(
            time_index=t_step,
            freq_index=t_step * 2,
            time_s=t_s,
            freq_hz=freq_hz,
            amplitude=10.0,
            snr=20.0,
            is_valid=True,
        )
        points.append(pt)

    traj = FrequencyTrajectory(
        points=points,
        total_points=10,
        valid_points=10,
        extraction_method="test",
    )

    fit = estimate_linear_drift(traj)

    assert fit.is_physical
    assert fit.drift_rate_hz_per_s == 3.5
    assert fit.reference_frequency_hz == f0
    assert fit.r_squared == 1.0
    assert fit.uncertainty_hz_per_s is not None
    assert fit.uncertainty_hz_per_s < 1e-4
    assert fit.sample_count == 10
    assert fit.quality_warning is None


def test_drift_estimation_negative_slope() -> None:
    """Negative drift rate should be recovered with correct negative sign."""
    points = []
    drift_rate = -5.0  # Hz/s
    f0 = 1.0e9

    for t_step in range(8):
        t_s = float(t_step)
        freq_hz = f0 + drift_rate * t_s
        pt = TrajectoryPoint(
            time_index=t_step,
            freq_index=100 - t_step,
            time_s=t_s,
            freq_hz=freq_hz,
            amplitude=5.0,
            snr=15.0,
            is_valid=True,
        )
        points.append(pt)

    traj = FrequencyTrajectory(
        points=points,
        total_points=8,
        valid_points=8,
        extraction_method="test",
    )

    fit = estimate_linear_drift(traj)
    assert fit.drift_rate_hz_per_s == -5.0
    assert fit.is_physical


def test_drift_estimation_insufficient_points() -> None:
    """Fewer than min_points valid entries should yield None drift rate with quality warning."""
    points = [
        TrajectoryPoint(
            time_index=0,
            freq_index=10,
            time_s=0.0,
            freq_hz=1e9,
            amplitude=5.0,
            snr=10.0,
            is_valid=True,
        ),
        TrajectoryPoint(
            time_index=1,
            freq_index=12,
            time_s=1.0,
            freq_hz=1e9 + 5.0,
            amplitude=5.0,
            snr=10.0,
            is_valid=True,
        ),
    ]

    traj = FrequencyTrajectory(
        points=points,
        total_points=2,
        valid_points=2,
        extraction_method="test",
    )

    cfg = DriftEstimationConfig(min_points=3)
    fit = estimate_linear_drift(traj, config=cfg)

    assert fit.drift_rate_hz_per_s is None
    assert fit.quality_warning is not None
    assert "Insufficient valid trajectory points" in fit.quality_warning


def test_drift_estimation_index_space_fallback() -> None:
    """When physical coordinates are missing, fallback to channel-space slope."""
    points = []
    for t_step in range(5):
        pt = TrajectoryPoint(
            time_index=t_step,
            freq_index=20 + t_step * 3,
            time_s=None,
            freq_hz=None,
            amplitude=5.0,
            snr=8.0,
            is_valid=True,
        )
        points.append(pt)

    traj = FrequencyTrajectory(
        points=points,
        total_points=5,
        valid_points=5,
        extraction_method="test",
    )

    fit = estimate_linear_drift(traj)
    assert not fit.is_physical
    assert fit.drift_rate_hz_per_s is None
    assert fit.drift_rate_index_slope == 3.0
