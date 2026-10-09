"""Ground-truth metadata models and serialization for synthetic signal injections."""

from typing import Any

from pydantic import BaseModel, Field


class InjectedSignalGroundTruth(BaseModel):
    """Exact physical and coordinate ground-truth record for a single injected synthetic signal."""

    signal_id: str = Field(..., description="Stable, unique signal identifier")
    family: str = Field(
        ..., description="Signal morphology family (stationary_tone, drifting_tone, etc.)"
    )
    time_start_index: int = Field(..., description="First active time index (inclusive)")
    time_stop_index: int = Field(..., description="Last active time index (exclusive)")
    frequency_start_index: int = Field(
        ..., description="Minimum occupied channel index (inclusive)"
    )
    frequency_stop_index: int = Field(..., description="Maximum occupied channel index (exclusive)")
    bounding_box: tuple[int, int, int, int] = Field(
        ...,
        description="(time_start, time_stop, freq_start, freq_stop) 0-indexed bounds",
    )
    center_frequency_hz: float = Field(..., description="Reference center frequency at start in Hz")
    frequency_trajectory_hz: list[float] = Field(
        default_factory=list,
        description="Exact physical frequency in Hz for each active time step",
    )
    drift_rate_hz_per_s: float = Field(default=0.0, description="Doppler drift rate in Hz/s")
    bandwidth_hz: float = Field(default=0.0, description="Occupied bandwidth in Hz")
    peak_amplitude: float = Field(..., description="Peak additive signal amplitude A_peak")
    effective_snr: float = Field(
        ...,
        description="Peak signal-to-noise ratio: SNR_peak = A_peak / sigma_noise",
    )
    snr_convention: str = Field(
        default="peak_amplitude_over_noise_std_dev",
        description="Formal definition of the reported SNR quantity",
    )
    is_clipped: bool = Field(default=False, description="Whether signal clipped at matrix boundary")
    clipped_samples_count: int = Field(
        default=0, description="Number of samples clipped by matrix edges"
    )
    support_cells_count: int = Field(
        ..., description="Total number of discrete (t, f) cells occupied"
    )
    notes: str = Field(default="", description="Ground-truth interpretation notes")
    parameters: dict[str, Any] = Field(
        default_factory=dict, description="Generator parameters used"
    )


class ObservationGroundTruth(BaseModel):
    """Container for all ground-truth targets injected into a synthetic observation."""

    dataset_id: str = Field(..., description="Parent dataset identifier")
    observation_id: str = Field(..., description="Unique synthetic observation identifier")
    is_negative_control: bool = Field(
        default=False,
        description="True if observation contains no target signals (noise-only control)",
    )
    target_count: int = Field(default=0, description="Number of injected target signals")
    signals: list[InjectedSignalGroundTruth] = Field(
        default_factory=list,
        description="List of ground-truth target records",
    )
    background_metadata: dict[str, Any] = Field(
        default_factory=dict,
        description="Parameters and statistics of the underlying background noise",
    )
    notes: str = Field(
        default="",
        description="Ground-truth notes and documentation of experimental setup",
    )
