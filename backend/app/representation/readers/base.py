"""Abstract base reader interface for bounded time-frequency spectral extraction."""

from abc import ABC, abstractmethod
from pathlib import Path

import numpy as np

from app.schemas.observations import ScientificMetadata


class BaseSliceReader(ABC):
    """Abstract interface for format-specific bounded array slice readers."""

    @abstractmethod
    def read_slice(
        self,
        file_path: Path,
        metadata: ScientificMetadata,
        time_start: int,
        time_stop: int,
        frequency_start: int,
        frequency_stop: int,
    ) -> tuple[np.ndarray, bool, str, list[str]]:
        """Extract a bounded 2D data matrix in canonical orientation.

        Args:
            file_path: Absolute path to the raw observation file on disk.
            metadata: Extracted scientific metadata for axis and dimension resolution.
            time_start: Inclusive 0-based time index.
            time_stop: Exclusive 0-based time index.
            frequency_start: Inclusive 0-based canonical frequency index (ascending).
            frequency_stop: Exclusive 0-based canonical frequency index (ascending).

        Returns:
            Tuple of:
            - canonical_matrix: np.ndarray of shape
              (time_stop - time_start, frequency_stop - frequency_start)
              ordered as values[time_idx][frequency_idx] with ascending frequency.
            - frequency_reversed: bool indicating whether frequency axis was flipped.
            - reader_backend: str identifier of low-level reader backend.
            - warnings: list of string diagnostic warnings.

        Raises:
            InvalidSliceBoundsError: If slice indices are invalid or out of bounds.
            ObservationFileNotFoundError: If the source file cannot be read.
            UnsupportedSliceLayoutError: If the data layout cannot be mapped.
        """
        pass
