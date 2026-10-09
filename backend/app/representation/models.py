"""Internal canonical slice data model holding numpy spectral matrices and axis models."""

from dataclasses import dataclass, field

import numpy as np

from app.representation.axes import FrequencyAxisModel, TimeAxisModel


@dataclass
class CanonicalSlice:
    """Internal canonical 2D spectral slice representation with physical coordinate models."""

    observation_id: str
    source_format: str
    values: np.ndarray  # Canonical shape: (n_time, n_freq)
    time_axis: TimeAxisModel
    frequency_axis: FrequencyAxisModel
    time_start: int
    time_stop: int
    frequency_start: int
    frequency_stop: int
    sample_value_semantics: str = "uncalibrated_detector_power"
    sample_value_unit: str | None = None
    frequency_axis_reversed: bool = False
    reader_backend: str = "unknown"
    source_sha256: str = ""
    warnings: list[str] = field(default_factory=list)

    @property
    def shape(self) -> tuple[int, int]:
        """Matrix dimensions (time_steps, frequency_channels)."""
        return int(self.values.shape[0]), int(self.values.shape[1])
