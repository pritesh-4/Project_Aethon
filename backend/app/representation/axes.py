"""Scientific axis models representing physical time and frequency coordinate spaces."""

from dataclasses import dataclass
from typing import Literal


@dataclass(frozen=True)
class FrequencyAxisModel:
    """Explicit mathematical and scientific model for the frequency axis."""

    channel_count: int
    reference_frequency_hz: float | None = None
    channel_spacing_hz: float | None = None
    reference_channel_index: int = 0
    unit: str = "Hz"
    source_ordering: Literal["ascending", "descending", "unknown"] = "unknown"
    is_valid: bool = True
    derivation_notes: str | None = None

    def compute_channel_center_hz(self, canonical_channel_idx: int) -> float | None:
        """Compute the physical center frequency in Hz for a 0-based canonical channel index."""
        if (
            not self.is_valid
            or self.reference_frequency_hz is None
            or self.channel_spacing_hz is None
        ):
            return None
        # Canonical channels are strictly ascending: channel 0 is the lowest frequency
        # channel_spacing_hz in canonical orientation is positive |df|
        abs_spacing = abs(self.channel_spacing_hz)
        return round(self.reference_frequency_hz + canonical_channel_idx * abs_spacing, 6)

    def compute_channel_centers_hz(self, start_idx: int, stop_idx: int) -> list[float] | None:
        """Compute 1D array of channel centers in Hz for half-open range [start, stop)."""
        if (
            not self.is_valid
            or self.reference_frequency_hz is None
            or self.channel_spacing_hz is None
        ):
            return None
        centers = []
        for idx in range(start_idx, stop_idx):
            f = self.compute_channel_center_hz(idx)
            if f is None:
                return None
            centers.append(f)
        return centers


@dataclass(frozen=True)
class TimeAxisModel:
    """Explicit mathematical and scientific model for the time axis."""

    sample_count: int
    sampling_interval_seconds: float | None = None
    reference_time_seconds: float = 0.0
    start_mjd: float | None = None
    start_time_utc: str | None = None
    unit: str = "s"
    is_uniform: bool = True
    is_valid: bool = True
    derivation_notes: str | None = None

    def compute_relative_time_seconds(self, time_idx: int) -> float | None:
        """Compute relative elapsed time in seconds from observation start for time_idx."""
        if not self.is_valid or self.sampling_interval_seconds is None:
            return None
        return round(self.reference_time_seconds + time_idx * self.sampling_interval_seconds, 6)

    def compute_relative_times_seconds(self, start_idx: int, stop_idx: int) -> list[float] | None:
        """Compute 1D array of relative timestamps in seconds for range [start, stop)."""
        if not self.is_valid or self.sampling_interval_seconds is None:
            return None
        return [
            round(self.reference_time_seconds + idx * self.sampling_interval_seconds, 6)
            for idx in range(start_idx, stop_idx)
        ]
