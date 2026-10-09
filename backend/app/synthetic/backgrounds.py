"""Reproducible noise background generators with explicit statistical assumptions."""

from typing import Any

import numpy as np

from app.synthetic.config import NoiseBackgroundConfig, ObservationGeometryConfig
from app.synthetic.exceptions import InvalidSyntheticConfigError


def generate_noise_background(
    geometry: ObservationGeometryConfig,
    config: NoiseBackgroundConfig,
    rng: np.random.Generator,
) -> tuple[np.ndarray, dict[str, Any]]:
    """Generate a reproducible 2D background noise matrix adhering to canonical axis conventions.

    Axes:
        values[time_index][frequency_index]
        Axis 0: Time samples (0 to n_time - 1)
        Axis 1: Frequency channels (0 to n_freq - 1, strictly ascending in Hz)

    Args:
        geometry: Physical and matrix dimensions of the observation.
        config: Statistical background parameters.
        rng: Local numpy.random.Generator instance for deterministic reproducibility.

    Returns:
        tuple containing:
            - 2D numpy ndarray of shape (n_time, n_freq) with requested dtype.
            - Background metadata dictionary including empirical sample statistics.
    """
    n_t = geometry.n_time
    n_f = geometry.n_freq
    target_dtype = np.float32 if config.dtype == "float32" else np.float64

    # 1. Base Gaussian noise realization: standard normal N(0, 1)
    base_noise: np.ndarray = rng.standard_normal(size=(n_t, n_f))

    if config.background_type == "gaussian":
        # Pure stationary Gaussian noise: values = mean + std_dev * N(0, 1)
        matrix: np.ndarray = config.mean + config.std_dev * base_noise

    elif config.background_type == "flat_baseline":
        # Baseline with configurable DC offset and optional linear spectral slope across frequency
        freq_normalized = np.linspace(-0.5, 0.5, n_f, endpoint=False, dtype=np.float64)
        spectral_baseline = config.baseline_offset + config.baseline_slope * freq_normalized
        # Broadcast across time: shape (n_time, n_freq)
        baseline_2d = np.tile(spectral_baseline, (n_t, 1))
        matrix = baseline_2d + config.mean + config.std_dev * base_noise

    elif config.background_type == "time_varying_noise":
        # Time-modulated noise variance simulating gain/system-temperature drift: sigma(t)
        time_seconds = np.arange(n_t, dtype=np.float64) * geometry.sampling_interval_s
        period = max(1e-6, config.time_variation_period_s)
        time_modulation = 1.0 + config.time_variation_amplitude * np.sin(
            2.0 * np.pi * time_seconds / period
        )
        # Reshape to (n_t, 1) for broadcasting
        sigma_t = (config.std_dev * time_modulation)[:, np.newaxis]
        matrix = config.mean + sigma_t * base_noise

    else:
        raise InvalidSyntheticConfigError(
            f"Unsupported background type: {config.background_type}",
            details={"background_type": config.background_type},
        )

    matrix = matrix.astype(target_dtype)

    # Validate that generated values are strictly finite
    if not np.all(np.isfinite(matrix)):
        raise InvalidSyntheticConfigError(
            "Generated background matrix contains non-finite (NaN or Inf) values"
        )

    # Compute empirical validation statistics
    empirical_mean = float(np.mean(matrix))
    empirical_std = float(np.std(matrix))
    empirical_min = float(np.min(matrix))
    empirical_max = float(np.max(matrix))

    metadata: dict[str, Any] = {
        "background_type": config.background_type,
        "theoretical_mean": config.mean,
        "theoretical_std_dev": config.std_dev,
        "empirical_mean": round(empirical_mean, 6),
        "empirical_std_dev": round(empirical_std, 6),
        "empirical_min": round(empirical_min, 6),
        "empirical_max": round(empirical_max, 6),
        "dtype": config.dtype,
        "shape": [n_t, n_f],
        "bit_generator": type(rng.bit_generator).__name__,
        "scientific_caveat": (
            "Synthetic Gaussian background is an idealized statistical model and does not "
            "model real telescope instrumental RFI, 1/f noise, or bandpass ripple."
        ),
    }

    return matrix, metadata
