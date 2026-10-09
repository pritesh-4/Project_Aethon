"""SIGPROC Filterbank (.fil) bounded slice reader implementation."""

import gc
from pathlib import Path
from typing import Any

import numpy as np
from blimpy import Waterfall

from app.representation.exceptions import (
    InvalidSliceBoundsError,
    ObservationFileNotFoundError,
    UnsupportedSliceLayoutError,
)
from app.representation.readers.base import BaseSliceReader
from app.schemas.observations import ScientificMetadata


class FilterbankSliceReader(BaseSliceReader):
    """Memory-conscious bounded array slice reader for SIGPROC Filterbank (.fil) files."""

    def read_slice(
        self,
        file_path: Path,
        metadata: ScientificMetadata,
        time_start: int,
        time_stop: int,
        frequency_start: int,
        frequency_stop: int,
    ) -> tuple[np.ndarray, bool, str, list[str]]:
        """Read a bounded 2D data matrix in canonical orientation via memory-mapping.

        Extracts rows [time_start:time_stop] and columns [frequency_start:frequency_stop]
        in canonical ascending frequency order.
        """
        if not file_path.exists():
            raise ObservationFileNotFoundError(
                f"Source observation file '{file_path.name}' does not exist on disk."
            )

        n_time = metadata.time_sample_count
        n_freq = metadata.channel_count

        if n_time is None or n_time <= 0 or n_freq is None or n_freq <= 0:
            raise UnsupportedSliceLayoutError(
                f"Filterbank observation '{file_path.name}' has invalid dimensions "
                f"(time={n_time}, freq={n_freq})."
            )

        # Validate range boundaries
        if time_start < 0 or time_stop < time_start or time_stop > n_time:
            raise InvalidSliceBoundsError(
                f"Requested time range [{time_start}, {time_stop}) is invalid "
                f"for observation with {n_time} time samples."
            )

        if frequency_start < 0 or frequency_stop < frequency_start or frequency_stop > n_freq:
            raise InvalidSliceBoundsError(
                f"Requested frequency range [{frequency_start}, {frequency_stop}) is invalid "
                f"for observation with {n_freq} frequency channels."
            )

        warnings: list[str] = []

        # Handle empty slice requests cleanly
        req_time_len = time_stop - time_start
        req_freq_len = frequency_stop - frequency_start
        if req_time_len == 0 or req_freq_len == 0:
            return (
                np.empty((req_time_len, req_freq_len), dtype=np.float32),
                False,
                "np.memmap.fil",
                warnings,
            )

        # Determine binary data offset and format layout
        try:
            wf = Waterfall(str(file_path.resolve()), load_data=False)
            data_offset = int(getattr(wf.container, "idx_data", 0))
            n_ints_file = int(getattr(wf, "n_ints_in_file", n_time) or n_time)
            n_chans_file = int(wf.header.get("nchans", n_freq))
            nbits = int(wf.header.get("nbits", metadata.bits_per_sample or 32))
            nifs = int(wf.header.get("nifs", metadata.polarization_count or 1))
        except Exception as e:
            raise UnsupportedSliceLayoutError(
                f"Failed to inspect filterbank header for slice reading: {e}"
            ) from e

        # Determine numpy data type
        dtype: Any
        if nbits == 32:
            dtype = np.float32
        elif nbits == 16:
            dtype = np.uint16
        elif nbits == 8:
            dtype = np.uint8
        else:
            raise UnsupportedSliceLayoutError(
                f"Unsupported Filterbank bit depth ({nbits} bits/sample) for direct slicing."
            )

        # Channel ordering: SIGPROC files typically have negative foff (descending frequency)
        foff = metadata.channel_spacing_mhz
        is_descending = foff is not None and foff < 0

        # Memory map the binary data region
        shape = (n_ints_file, nifs, n_chans_file)
        mm: np.memmap | None = None
        try:
            mm = np.memmap(
                str(file_path.resolve()),
                dtype=dtype,
                mode="r",
                offset=data_offset,
                shape=shape,
            )

            if is_descending:
                # Canonical frequency [frequency_start, frequency_stop) maps to source channels:
                # canonical channel k corresponds to source channel (n_chans_file - 1 - k).
                c_src_start = n_chans_file - frequency_stop
                c_src_stop = n_chans_file - frequency_start
                raw_slice = mm[time_start:time_stop, 0, c_src_start:c_src_stop]
                # Reverse columns along Axis 1 so canonical column 0 is lowest frequency
                canonical_matrix = np.array(raw_slice[:, ::-1], dtype=np.float32, copy=True)
                frequency_reversed = True
            else:
                raw_slice = mm[time_start:time_stop, 0, frequency_start:frequency_stop]
                canonical_matrix = np.array(raw_slice, dtype=np.float32, copy=True)
                frequency_reversed = False

            return canonical_matrix, frequency_reversed, "np.memmap.fil", warnings

        except Exception as e:
            if isinstance(e, (InvalidSliceBoundsError, UnsupportedSliceLayoutError)):
                raise
            raise UnsupportedSliceLayoutError(
                f"Failed to extract filterbank slice from '{file_path.name}': {e}"
            ) from e
        finally:
            if mm is not None:
                if hasattr(mm, "_mmap") and mm._mmap is not None:
                    try:
                        mm._mmap.close()
                    except Exception:
                        pass
                del mm
                gc.collect()
