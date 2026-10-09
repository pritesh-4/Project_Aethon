"""Configuration schemas and mathematical models for the synthetic signal laboratory."""

from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

from app.synthetic.exceptions import InvalidSyntheticConfigError

# Resource limits to prevent accidental unbounded memory exhaustion
MAX_TIME_SAMPLES: int = 8192
MAX_FREQ_CHANNELS: int = 16384
MAX_TOTAL_CELLS: int = 16 * 1024 * 1024  # 16M cells = ~64MB float32


class ObservationGeometryConfig(BaseModel):
    """Spatial and temporal geometry for a synthetic time-frequency observation matrix."""

    n_time: int = Field(default=64, description="Number of time samples (rows, axis 0)")
    n_freq: int = Field(default=256, description="Number of frequency channels (columns, axis 1)")
    sampling_interval_s: float = Field(
        default=1.0, description="Time sampling interval delta_t (s)"
    )
    f_min_hz: float = Field(default=1420.0e6, description="Minimum frequency at channel 0 (Hz)")
    f_step_hz: float = Field(default=1000.0, description="Channel width delta_f (Hz)")
    start_mjd: float = Field(default=60000.0, description="Observation start epoch in MJD")
    unit: str = Field(default="Hz", description="Frequency unit")

    @field_validator("n_time")
    @classmethod
    def validate_n_time(cls, v: int) -> int:
        if v <= 0:
            raise InvalidSyntheticConfigError(
                "n_time must be strictly positive", details={"n_time": v}
            )
        if v > MAX_TIME_SAMPLES:
            raise InvalidSyntheticConfigError(
                f"n_time exceeds maximum limit of {MAX_TIME_SAMPLES}",
                details={"n_time": v, "max": MAX_TIME_SAMPLES},
            )
        return v

    @field_validator("n_freq")
    @classmethod
    def validate_n_freq(cls, v: int) -> int:
        if v <= 0:
            raise InvalidSyntheticConfigError(
                "n_freq must be strictly positive", details={"n_freq": v}
            )
        if v > MAX_FREQ_CHANNELS:
            raise InvalidSyntheticConfigError(
                f"n_freq exceeds maximum limit of {MAX_FREQ_CHANNELS}",
                details={"n_freq": v, "max": MAX_FREQ_CHANNELS},
            )
        return v

    @field_validator("sampling_interval_s")
    @classmethod
    def validate_sampling_interval(cls, v: float) -> float:
        if v <= 0.0:
            raise InvalidSyntheticConfigError(
                "sampling_interval_s must be strictly positive", details={"sampling_interval_s": v}
            )
        return v

    @field_validator("f_step_hz")
    @classmethod
    def validate_f_step(cls, v: float) -> float:
        if v <= 0.0:
            raise InvalidSyntheticConfigError(
                "f_step_hz must be strictly positive", details={"f_step_hz": v}
            )
        return v

    @model_validator(mode="after")
    def validate_total_cells(self) -> "ObservationGeometryConfig":
        total = self.n_time * self.n_freq
        if total > MAX_TOTAL_CELLS:
            raise InvalidSyntheticConfigError(
                f"Total matrix elements {total} exceeds safety limit of {MAX_TOTAL_CELLS}",
                details={"total_cells": total, "limit": MAX_TOTAL_CELLS},
            )
        return self

    @property
    def total_duration_s(self) -> float:
        """Total observation duration in seconds."""
        return self.n_time * self.sampling_interval_s

    @property
    def total_bandwidth_hz(self) -> float:
        """Total observation bandwidth in Hz."""
        return self.n_freq * self.f_step_hz

    @property
    def f_max_hz(self) -> float:
        """Maximum frequency at channel edge in Hz."""
        return self.f_min_hz + self.total_bandwidth_hz


NoiseBackgroundType = Literal["gaussian", "flat_baseline", "time_varying_noise"]


class NoiseBackgroundConfig(BaseModel):
    """Statistical configuration for synthetic background noise generation."""

    background_type: NoiseBackgroundType = Field(default="gaussian")
    mean: float = Field(default=0.0, description="Noise background mean value mu")
    std_dev: float = Field(default=1.0, description="Noise background standard deviation sigma")
    baseline_offset: float = Field(default=10.0, description="Additive DC baseline power offset")
    baseline_slope: float = Field(default=0.0, description="Linear spectral tilt in baseline")
    time_variation_amplitude: float = Field(
        default=0.0,
        description="Amplitude of temporal noise fluctuation (relative fraction of std_dev)",
    )
    time_variation_period_s: float = Field(
        default=60.0,
        description="Period of temporal noise fluctuation in seconds",
    )
    dtype: Literal["float32", "float64"] = Field(default="float32")

    @field_validator("std_dev")
    @classmethod
    def validate_std_dev(cls, v: float) -> float:
        if v <= 0.0:
            raise InvalidSyntheticConfigError(
                "Noise std_dev must be strictly positive", details={"std_dev": v}
            )
        return v

    @field_validator("time_variation_amplitude")
    @classmethod
    def validate_time_variation(cls, v: float) -> float:
        if v < 0.0 or v >= 1.0:
            raise InvalidSyntheticConfigError(
                "time_variation_amplitude must be in range [0.0, 1.0)",
                details={"time_variation_amplitude": v},
            )
        return v


SignalFamily = Literal["stationary_tone", "drifting_tone", "burst", "broadband_emission"]
ShapeProfile = Literal["boxcar", "gaussian"]


class SignalConfig(BaseModel):
    """Specification for an injected target signal."""

    signal_id: str | None = Field(
        default=None, description="Unique identifier for signal injection"
    )
    family: SignalFamily = Field(..., description="Target signal family")
    f_start_hz: float = Field(..., description="Center frequency at start of injection (Hz)")
    drift_rate_hz_per_s: float = Field(
        default=0.0,
        description="Doppler drift rate df/dt (Hz/s). Positive = ascending, negative = descending",
    )
    t_start_s: float = Field(default=0.0, description="Start time of signal emission in seconds")
    duration_s: float | None = Field(
        default=None,
        description="Duration of emission in seconds. If None, signal persists until obs end",
    )
    snr: float | None = Field(
        default=None,
        description="Requested peak signal-to-noise ratio: SNR_peak = A_peak / sigma_noise",
    )
    amplitude: float | None = Field(
        default=None,
        description="Direct additive signal amplitude A. Either snr or amplitude must be defined",
    )
    bandwidth_hz: float = Field(
        default=0.0,
        description="Signal bandwidth in Hz. 0.0 indicates single-channel tone",
    )
    shape_profile: ShapeProfile = Field(
        default="boxcar",
        description="Spectral/temporal profile shape (boxcar or gaussian)",
    )

    @field_validator("f_start_hz")
    @classmethod
    def validate_f_start(cls, v: float) -> float:
        if v <= 0.0:
            raise InvalidSyntheticConfigError(
                "f_start_hz must be strictly positive", details={"f_start_hz": v}
            )
        return v

    @field_validator("bandwidth_hz")
    @classmethod
    def validate_bandwidth(cls, v: float) -> float:
        if v < 0.0:
            raise InvalidSyntheticConfigError(
                "bandwidth_hz must be non-negative", details={"bandwidth_hz": v}
            )
        return v

    @field_validator("t_start_s")
    @classmethod
    def validate_t_start(cls, v: float) -> float:
        if v < 0.0:
            raise InvalidSyntheticConfigError(
                "t_start_s must be non-negative", details={"t_start_s": v}
            )
        return v

    @model_validator(mode="after")
    def validate_amplitude_or_snr(self) -> "SignalConfig":
        if self.snr is None and self.amplitude is None:
            # Default to SNR = 10.0 if neither is explicitly provided
            self.snr = 10.0
        if self.snr is not None and self.snr <= 0.0:
            raise InvalidSyntheticConfigError(
                "Requested SNR must be strictly positive", details={"snr": self.snr}
            )
        if self.amplitude is not None and self.amplitude <= 0.0:
            raise InvalidSyntheticConfigError(
                "Requested amplitude must be strictly positive",
                details={"amplitude": self.amplitude},
            )
        return self


class SyntheticDatasetConfig(BaseModel):
    """Complete specification for a reproducible synthetic observation generation run."""

    dataset_id: str = Field(..., description="Stable dataset identifier")
    seed: int = Field(default=42, description="Random seed for reproducible generation")
    geometry: ObservationGeometryConfig = Field(default_factory=ObservationGeometryConfig)
    background: NoiseBackgroundConfig = Field(default_factory=NoiseBackgroundConfig)
    injections: list[SignalConfig] = Field(
        default_factory=list,
        description="List of target signals to inject. Empty list represents a negative control",
    )
    generator_version: str = Field(
        default="1.0.0", description="Synthetic laboratory generator version"
    )
    description: str = Field(default="", description="Human-readable context or test objective")
