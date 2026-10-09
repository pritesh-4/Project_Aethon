"""Controlled target-signal generators with exact ground-truth trajectory tracking."""

from abc import ABC, abstractmethod
from typing import Any

import numpy as np

from app.synthetic.config import ObservationGeometryConfig, SignalConfig
from app.synthetic.exceptions import InvalidSyntheticConfigError, SignalOutOfBoundsError


class GeneratedSignalResult:
    """Output container for a generated signal realization and its ground truth metadata."""

    def __init__(
        self,
        signal_matrix: np.ndarray,
        time_indices: list[int],
        frequency_indices: list[int],
        trajectory_hz: list[float],
        bounding_box: tuple[
            int, int, int, int
        ],  # (t_start_idx, t_stop_idx, f_start_idx, f_stop_idx)
        peak_amplitude: float,
        effective_snr: float,
        is_clipped: bool,
        clipped_samples: int,
        support_cells_count: int,
        details: dict[str, Any],
    ) -> None:
        self.signal_matrix = signal_matrix
        self.time_indices = time_indices
        self.frequency_indices = frequency_indices
        self.trajectory_hz = trajectory_hz
        self.bounding_box = bounding_box
        self.peak_amplitude = peak_amplitude
        self.effective_snr = effective_snr
        self.is_clipped = is_clipped
        self.clipped_samples = clipped_samples
        self.support_cells_count = support_cells_count
        self.details = details


class BaseSignalGenerator(ABC):
    """Abstract base protocol for extensible synthetic radio signal generators."""

    @abstractmethod
    def generate(
        self,
        geometry: ObservationGeometryConfig,
        config: SignalConfig,
        noise_std_dev: float,
    ) -> GeneratedSignalResult:
        """Generate a 2D signal matrix and exact ground-truth trajectory."""
        pass


class StationaryToneGenerator(BaseSignalGenerator):
    """Generates a narrowband tone fixed at a constant frequency channel over an active interval."""

    def generate(
        self,
        geometry: ObservationGeometryConfig,
        config: SignalConfig,
        noise_std_dev: float,
    ) -> GeneratedSignalResult:
        n_t = geometry.n_time
        n_f = geometry.n_freq
        dt = geometry.sampling_interval_s
        df = geometry.f_step_hz
        f_min = geometry.f_min_hz

        # Determine amplitude from SNR or explicit amplitude
        if config.amplitude is not None:
            amplitude = float(config.amplitude)
            effective_snr = amplitude / max(1e-12, noise_std_dev)
        else:
            snr_val = float(config.snr if config.snr is not None else 10.0)
            amplitude = snr_val * noise_std_dev
            effective_snr = snr_val

        signal_mat = np.zeros((n_t, n_f), dtype=np.float32)

        # Compute target frequency channel index
        f_chan_float = (config.f_start_hz - f_min) / df
        f_chan = int(np.round(f_chan_float))

        # Check bounds
        if f_chan < 0 or f_chan >= n_f:
            raise SignalOutOfBoundsError(
                f"Requested frequency {config.f_start_hz} Hz maps to channel {f_chan}, "
                f"which is outside observation range [0, {n_f - 1}]",
                details={"f_start_hz": config.f_start_hz, "f_chan": f_chan, "n_freq": n_f},
            )

        # Time range
        t_start_idx = max(0, int(np.floor(config.t_start_s / dt)))
        if t_start_idx >= n_t:
            raise SignalOutOfBoundsError(
                f"Signal start time {config.t_start_s}s is beyond observation duration",
                details={"t_start_s": config.t_start_s, "n_time": n_t},
            )

        if config.duration_s is not None:
            t_stop_idx = min(n_t, int(np.ceil((config.t_start_s + config.duration_s) / dt)))
        else:
            t_stop_idx = n_t

        if t_stop_idx <= t_start_idx:
            raise InvalidSyntheticConfigError(
                "Signal active time interval contains 0 time samples",
                details={"t_start_idx": t_start_idx, "t_stop_idx": t_stop_idx},
            )

        # Fill signal
        signal_mat[t_start_idx:t_stop_idx, f_chan] = amplitude

        actual_f_hz = f_min + f_chan * df
        t_indices = list(range(t_start_idx, t_stop_idx))
        trajectory = [actual_f_hz for _ in t_indices]
        support_count = len(t_indices)

        return GeneratedSignalResult(
            signal_matrix=signal_mat,
            time_indices=t_indices,
            frequency_indices=[f_chan],
            trajectory_hz=trajectory,
            bounding_box=(t_start_idx, t_stop_idx, f_chan, f_chan + 1),
            peak_amplitude=amplitude,
            effective_snr=effective_snr,
            is_clipped=False,
            clipped_samples=0,
            support_cells_count=support_count,
            details={"center_frequency_hz": actual_f_hz, "channel_index": f_chan},
        )


class DriftingToneGenerator(BaseSignalGenerator):
    """Generates a drifting narrowband tone whose center frequency shifts linearly with time.

    f(t) = f_start + drift_rate * (t - t_start)
    Boundary clipping is strictly enforced without wrapping around the opposite edge.
    """

    def generate(
        self,
        geometry: ObservationGeometryConfig,
        config: SignalConfig,
        noise_std_dev: float,
    ) -> GeneratedSignalResult:
        n_t = geometry.n_time
        n_f = geometry.n_freq
        dt = geometry.sampling_interval_s
        df = geometry.f_step_hz
        f_min = geometry.f_min_hz

        if config.amplitude is not None:
            amplitude = float(config.amplitude)
            effective_snr = amplitude / max(1e-12, noise_std_dev)
        else:
            snr_val = float(config.snr if config.snr is not None else 10.0)
            amplitude = snr_val * noise_std_dev
            effective_snr = snr_val

        signal_mat = np.zeros((n_t, n_f), dtype=np.float32)

        t_start_idx = max(0, int(np.floor(config.t_start_s / dt)))
        if t_start_idx >= n_t:
            raise SignalOutOfBoundsError(
                f"Drifting tone start time {config.t_start_s}s is outside observation duration",
                details={"t_start_s": config.t_start_s, "n_time": n_t},
            )

        if config.duration_s is not None:
            t_stop_idx = min(n_t, int(np.ceil((config.t_start_s + config.duration_s) / dt)))
        else:
            t_stop_idx = n_t

        t_indices: list[int] = []
        f_indices: list[int] = []
        trajectory: list[float] = []
        clipped_samples = 0

        for t_idx in range(t_start_idx, t_stop_idx):
            elapsed_t = (t_idx - t_start_idx) * dt
            f_current = config.f_start_hz + config.drift_rate_hz_per_s * elapsed_t
            k_chan = int(np.round((f_current - f_min) / df))

            # Strictly clip at boundaries: DO NOT wrap around!
            if 0 <= k_chan < n_f:
                signal_mat[t_idx, k_chan] = amplitude
                t_indices.append(t_idx)
                f_indices.append(k_chan)
                trajectory.append(round(f_current, 6))
            else:
                clipped_samples += 1

        if not t_indices:
            raise SignalOutOfBoundsError(
                "Drifting tone is completely outside frequency band for all requested time samples",
                details={
                    "f_start_hz": config.f_start_hz,
                    "drift_rate": config.drift_rate_hz_per_s,
                    "clipped_samples": clipped_samples,
                },
            )

        is_clipped = clipped_samples > 0
        min_t, max_t = min(t_indices), max(t_indices) + 1
        min_f, max_f = min(f_indices), max(f_indices) + 1

        return GeneratedSignalResult(
            signal_matrix=signal_mat,
            time_indices=t_indices,
            frequency_indices=sorted(list(set(f_indices))),
            trajectory_hz=trajectory,
            bounding_box=(min_t, max_t, min_f, max_f),
            peak_amplitude=amplitude,
            effective_snr=effective_snr,
            is_clipped=is_clipped,
            clipped_samples=clipped_samples,
            support_cells_count=len(t_indices),
            details={
                "f_start_hz": config.f_start_hz,
                "drift_rate_hz_per_s": config.drift_rate_hz_per_s,
                "is_clipped": is_clipped,
                "clipped_samples": clipped_samples,
            },
        )


class BurstGenerator(BaseSignalGenerator):
    """Generates a short-duration burst localized in time and frequency."""

    def generate(
        self,
        geometry: ObservationGeometryConfig,
        config: SignalConfig,
        noise_std_dev: float,
    ) -> GeneratedSignalResult:
        n_t = geometry.n_time
        n_f = geometry.n_freq
        dt = geometry.sampling_interval_s
        df = geometry.f_step_hz
        f_min = geometry.f_min_hz

        if config.duration_s is None or config.duration_s <= 0.0:
            raise InvalidSyntheticConfigError(
                "Burst signals must specify a strictly positive duration_s",
                details={"duration_s": config.duration_s},
            )

        if config.amplitude is not None:
            amplitude = float(config.amplitude)
            effective_snr = amplitude / max(1e-12, noise_std_dev)
        else:
            snr_val = float(config.snr if config.snr is not None else 10.0)
            amplitude = snr_val * noise_std_dev
            effective_snr = snr_val

        signal_mat = np.zeros((n_t, n_f), dtype=np.float32)

        # Time range
        t_start_idx = max(0, int(np.floor(config.t_start_s / dt)))
        t_stop_idx = min(n_t, int(np.ceil((config.t_start_s + config.duration_s) / dt)))

        if t_start_idx >= n_t or t_stop_idx <= t_start_idx:
            raise SignalOutOfBoundsError(
                "Burst temporal window is outside observation time range",
                details={"t_start_idx": t_start_idx, "t_stop_idx": t_stop_idx, "n_time": n_t},
            )

        # Frequency range
        center_f_chan = int(np.round((config.f_start_hz - f_min) / df))
        bandwidth = max(0.0, config.bandwidth_hz)
        half_width_chans = int(np.round(bandwidth / (2.0 * df)))

        f_start_chan = max(0, center_f_chan - half_width_chans)
        f_stop_chan = min(n_f, center_f_chan + half_width_chans + 1)

        if f_start_chan >= n_f or f_stop_chan <= 0 or f_start_chan >= f_stop_chan:
            raise SignalOutOfBoundsError(
                "Burst frequency window is completely outside observation bandwidth",
                details={"center_f_chan": center_f_chan, "n_freq": n_f},
            )

        # Fill burst region
        signal_mat[t_start_idx:t_stop_idx, f_start_chan:f_stop_chan] = amplitude

        t_indices = list(range(t_start_idx, t_stop_idx))
        f_indices = list(range(f_start_chan, f_stop_chan))
        center_f_hz = f_min + center_f_chan * df
        trajectory = [center_f_hz for _ in t_indices]
        support_count = len(t_indices) * len(f_indices)

        return GeneratedSignalResult(
            signal_matrix=signal_mat,
            time_indices=t_indices,
            frequency_indices=f_indices,
            trajectory_hz=trajectory,
            bounding_box=(t_start_idx, t_stop_idx, f_start_chan, f_stop_chan),
            peak_amplitude=amplitude,
            effective_snr=effective_snr,
            is_clipped=(f_start_chan == 0 or f_stop_chan == n_f),
            clipped_samples=0,
            support_cells_count=support_count,
            details={
                "burst_duration_s": config.duration_s,
                "center_f_hz": center_f_hz,
                "f_span_channels": [f_start_chan, f_stop_chan],
            },
        )


class BroadbandEmissionGenerator(BaseSignalGenerator):
    """Generates an emission spanning a finite, contiguous frequency bandwidth."""

    def generate(
        self,
        geometry: ObservationGeometryConfig,
        config: SignalConfig,
        noise_std_dev: float,
    ) -> GeneratedSignalResult:
        n_t = geometry.n_time
        n_f = geometry.n_freq
        dt = geometry.sampling_interval_s
        df = geometry.f_step_hz
        f_min = geometry.f_min_hz

        if config.bandwidth_hz <= 0.0:
            raise InvalidSyntheticConfigError(
                "Broadband emission requires bandwidth_hz > 0.0",
                details={"bandwidth_hz": config.bandwidth_hz},
            )

        if config.amplitude is not None:
            amplitude = float(config.amplitude)
            effective_snr = amplitude / max(1e-12, noise_std_dev)
        else:
            snr_val = float(config.snr if config.snr is not None else 10.0)
            amplitude = snr_val * noise_std_dev
            effective_snr = snr_val

        signal_mat = np.zeros((n_t, n_f), dtype=np.float32)

        # Time bounds
        t_start_idx = max(0, int(np.floor(config.t_start_s / dt)))
        if config.duration_s is not None:
            t_stop_idx = min(n_t, int(np.ceil((config.t_start_s + config.duration_s) / dt)))
        else:
            t_stop_idx = n_t

        if t_start_idx >= n_t or t_stop_idx <= t_start_idx:
            raise SignalOutOfBoundsError(
                "Broadband emission temporal window is outside observation range",
                details={"t_start_idx": t_start_idx, "t_stop_idx": t_stop_idx, "n_time": n_t},
            )

        # Frequency bounds
        f_start_chan = max(0, int(np.floor((config.f_start_hz - f_min) / df)))
        f_stop_chan = min(
            n_f,
            int(np.ceil((config.f_start_hz + config.bandwidth_hz - f_min) / df)),
        )

        if f_start_chan >= n_f or f_stop_chan <= 0 or f_start_chan >= f_stop_chan:
            raise SignalOutOfBoundsError(
                "Broadband emission frequency interval is outside observation range",
                details={"f_start_chan": f_start_chan, "f_stop_chan": f_stop_chan, "n_freq": n_f},
            )

        # Fill profile: boxcar or gaussian across channels
        num_chans = f_stop_chan - f_start_chan
        if config.shape_profile == "gaussian" and num_chans > 2:
            center_idx = (num_chans - 1) / 2.0
            sigma_idx = max(1.0, num_chans / 4.0)
            raw_prof = np.exp(-0.5 * ((np.arange(num_chans) - center_idx) / sigma_idx) ** 2)
            profile_1d = (amplitude * (raw_prof / np.max(raw_prof))).astype(np.float32)
        else:
            profile_1d = np.full(num_chans, amplitude, dtype=np.float32)

        signal_mat[t_start_idx:t_stop_idx, f_start_chan:f_stop_chan] = profile_1d

        t_indices = list(range(t_start_idx, t_stop_idx))
        f_indices = list(range(f_start_chan, f_stop_chan))
        mid_freq_hz = f_min + (f_start_chan + f_stop_chan) / 2.0 * df
        trajectory = [mid_freq_hz for _ in t_indices]
        support_count = len(t_indices) * len(f_indices)

        return GeneratedSignalResult(
            signal_matrix=signal_mat,
            time_indices=t_indices,
            frequency_indices=f_indices,
            trajectory_hz=trajectory,
            bounding_box=(t_start_idx, t_stop_idx, f_start_chan, f_stop_chan),
            peak_amplitude=float(np.max(profile_1d)),
            effective_snr=effective_snr,
            is_clipped=(f_start_chan == 0 or f_stop_chan == n_f),
            clipped_samples=0,
            support_cells_count=support_count,
            details={
                "f_start_hz": config.f_start_hz,
                "bandwidth_hz": config.bandwidth_hz,
                "channel_range": [f_start_chan, f_stop_chan],
                "shape_profile": config.shape_profile,
            },
        )


# Generator registry mapping signal family enum to generator implementation
SIGNAL_GENERATORS: dict[str, BaseSignalGenerator] = {
    "stationary_tone": StationaryToneGenerator(),
    "drifting_tone": DriftingToneGenerator(),
    "burst": BurstGenerator(),
    "broadband_emission": BroadbandEmissionGenerator(),
}


def get_signal_generator(family: str) -> BaseSignalGenerator:
    """Retrieve generator instance for the requested signal family."""
    if family not in SIGNAL_GENERATORS:
        raise InvalidSyntheticConfigError(
            f"Unknown signal family '{family}'. Supported: {list(SIGNAL_GENERATORS.keys())}",
            details={"requested_family": family, "available": list(SIGNAL_GENERATORS.keys())},
        )
    return SIGNAL_GENERATORS[family]
