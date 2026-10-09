"""Radio-observation FITS (.fits, .fit) bounded slice reader implementation."""

import gc
from pathlib import Path

import astropy.io.fits as fits
import numpy as np

from app.ingestion.adapters.fits import FitsBinTableParser, FitsSpectralImageParser
from app.representation.exceptions import (
    InvalidSliceBoundsError,
    ObservationFileNotFoundError,
    UnsupportedSliceLayoutError,
)
from app.representation.readers.base import BaseSliceReader
from app.schemas.observations import ScientificMetadata


class FitsSliceReader(BaseSliceReader):
    """Memory-conscious bounded array slice reader for radio observation FITS files."""

    def __init__(self) -> None:
        self.image_parser = FitsSpectralImageParser()
        self.bintable_parser = FitsBinTableParser()

    def read_slice(
        self,
        file_path: Path,
        metadata: ScientificMetadata,
        time_start: int,
        time_stop: int,
        frequency_start: int,
        frequency_stop: int,
    ) -> tuple[np.ndarray, bool, str, list[str]]:
        """Read a bounded 2D data matrix in canonical orientation from a radio FITS observation."""
        if not file_path.exists():
            raise ObservationFileNotFoundError(
                f"Source observation file '{file_path.name}' does not exist on disk."
            )

        n_time = metadata.time_sample_count
        n_freq = metadata.channel_count

        if n_time is None or n_time <= 0 or n_freq is None or n_freq <= 0:
            raise UnsupportedSliceLayoutError(
                f"FITS observation '{file_path.name}' has invalid dimensions "
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

        req_time_len = time_stop - time_start
        req_freq_len = frequency_stop - frequency_start
        if req_time_len == 0 or req_freq_len == 0:
            return (
                np.empty((req_time_len, req_freq_len), dtype=np.float32),
                False,
                "astropy.fits.slice",
                warnings,
            )

        df = metadata.channel_spacing_mhz
        is_descending = df is not None and df < 0

        hdul: fits.HDUList | None = None
        try:
            # Open without full array caching
            hdul = fits.open(str(file_path.resolve()), memmap=False)

            # Check if spectral image
            can_img, img_idx = self.image_parser.can_parse(hdul)
            if can_img and img_idx >= 0:
                return self._read_spectral_image(
                    hdul,
                    img_idx,
                    n_time,
                    n_freq,
                    is_descending,
                    time_start,
                    time_stop,
                    frequency_start,
                    frequency_stop,
                    warnings,
                )

            # Check if radio binary table
            can_tab, tab_idx = self.bintable_parser.can_parse(hdul)
            if can_tab and tab_idx >= 0:
                return self._read_binary_table(
                    hdul,
                    tab_idx,
                    n_time,
                    n_freq,
                    is_descending,
                    time_start,
                    time_stop,
                    frequency_start,
                    frequency_stop,
                    warnings,
                )

            raise UnsupportedSliceLayoutError(
                f"FITS file '{file_path.name}' does not contain a supported "
                "radio spectral image or binary table HDU."
            )

        except Exception as e:
            if isinstance(e, (InvalidSliceBoundsError, UnsupportedSliceLayoutError)):
                raise
            raise UnsupportedSliceLayoutError(
                f"Failed to extract slice from FITS observation '{file_path.name}': {e}"
            ) from e
        finally:
            if hdul is not None:
                try:
                    hdul.close()
                except Exception:
                    pass
                del hdul
                gc.collect()

    def _read_spectral_image(
        self,
        hdul: fits.HDUList,
        hdu_idx: int,
        n_time: int,
        n_freq: int,
        is_descending: bool,
        time_start: int,
        time_stop: int,
        frequency_start: int,
        frequency_stop: int,
        warnings: list[str],
    ) -> tuple[np.ndarray, bool, str, list[str]]:
        """Bounded extraction from a radio spectral image HDU."""
        hdu = hdul[hdu_idx]
        header = hdu.header
        naxis = header.get("NAXIS", 2)

        # Map source channel slice indices
        if is_descending:
            c_src_start = n_freq - frequency_stop
            c_src_stop = n_freq - frequency_start
        else:
            c_src_start = frequency_start
            c_src_stop = frequency_stop

        # Determine axes configuration: Axis 1 = Freq, Axis 2 = Time
        # In NumPy C-order: shape is (NAXIS2, NAXIS1) -> (time, freq)
        # Using hdu.section for bounded disk reads
        if hasattr(hdu, "section"):
            if naxis == 2:
                raw_chunk = hdu.section[time_start:time_stop, c_src_start:c_src_stop]
            elif naxis >= 3:
                # 3D cube with Stokes/pol in Axis 3: shape (NAXIS3, NAXIS2, NAXIS1)
                raw_chunk = hdu.section[0, time_start:time_stop, c_src_start:c_src_stop]
            else:
                raw_chunk = hdu.data[time_start:time_stop, c_src_start:c_src_stop]
        else:
            if naxis == 2:
                raw_chunk = hdu.data[time_start:time_stop, c_src_start:c_src_stop]
            elif naxis >= 3:
                raw_chunk = hdu.data[0, time_start:time_stop, c_src_start:c_src_stop]
            else:
                raw_chunk = hdu.data[time_start:time_stop, c_src_start:c_src_stop]

        if is_descending:
            canonical_matrix = np.array(raw_chunk[:, ::-1], dtype=np.float32, copy=True)
            frequency_reversed = True
        else:
            canonical_matrix = np.array(raw_chunk, dtype=np.float32, copy=True)
            frequency_reversed = False

        return canonical_matrix, frequency_reversed, "astropy.fits.section", warnings

    def _read_binary_table(
        self,
        hdul: fits.HDUList,
        hdu_idx: int,
        n_time: int,
        n_freq: int,
        is_descending: bool,
        time_start: int,
        time_stop: int,
        frequency_start: int,
        frequency_stop: int,
        warnings: list[str],
    ) -> tuple[np.ndarray, bool, str, list[str]]:
        """Bounded extraction from a radio binary table (PSRFITS/SDFITS SUBINT)."""
        hdu = hdul[hdu_idx]
        col_data = hdu.data["DATA"][time_start:time_stop]

        if is_descending:
            c_src_start = n_freq - frequency_stop
            c_src_stop = n_freq - frequency_start
        else:
            c_src_start = frequency_start
            c_src_stop = frequency_stop

        # Check dimensionality of DATA column
        if col_data.ndim == 2:
            # Shape: (n_time_slice, n_freq)
            raw_chunk = col_data[:, c_src_start:c_src_stop]
        elif col_data.ndim == 3:
            # Shape: (n_time_slice, npol, n_freq) -> select pol 0
            raw_chunk = col_data[:, 0, c_src_start:c_src_stop]
        elif col_data.ndim == 4:
            # Shape: (n_time_slice, npol, n_freq, nbins) -> average or select bin 0
            raw_chunk = col_data[:, 0, c_src_start:c_src_stop, 0]
        else:
            raise UnsupportedSliceLayoutError(
                f"Unsupported binary table DATA dimensionality: {col_data.ndim}"
            )

        if is_descending:
            canonical_matrix = np.array(raw_chunk[:, ::-1], dtype=np.float32, copy=True)
            frequency_reversed = True
        else:
            canonical_matrix = np.array(raw_chunk, dtype=np.float32, copy=True)
            frequency_reversed = False

        return canonical_matrix, frequency_reversed, "astropy.fits.bintable", warnings
