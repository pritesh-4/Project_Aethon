"""Unit tests for format-specific bounded array slice readers."""

from pathlib import Path

import numpy as np
import pytest
from blimpy import Waterfall

from app.ingestion.adapters.filterbank import FilterbankAdapter
from app.ingestion.adapters.fits import FitsAdapter
from app.representation.exceptions import (
    InvalidSliceBoundsError,
    ObservationFileNotFoundError,
    UnsupportedSliceLayoutError,
)
from app.representation.readers.filterbank import FilterbankSliceReader
from app.representation.readers.fits import FitsSliceReader
from tests.helpers import (
    create_optical_fits_image,
    create_synthetic_filterbank,
    create_synthetic_fits_bintable,
    create_synthetic_fits_spectral_image,
)


def test_filterbank_reader_exact_slice_and_reversal(tmp_path: Path) -> None:
    """Filterbank reader maps descending source frequencies to canonical ascending order."""
    n_chans = 16
    n_ints = 8
    # Populate known values: matrix[t, 0, c] = t * 100 + c
    data = np.zeros((n_ints, 1, n_chans), dtype=np.float32)
    for t in range(n_ints):
        for c in range(n_chans):
            data[t, 0, c] = t * 100.0 + c

    fil_path = tmp_path / "gradient.fil"
    header = {
        "fch1": 1500.0,
        "foff": -1.0,  # Descending: chan 0 is 1500 MHz, chan 15 is 1485 MHz
        "nchans": n_chans,
        "tsamp": 0.5,
        "tstart": 59000.0,
        "nbits": 32,
        "nifs": 1,
    }
    wf = Waterfall(header_dict=header, data_array=data)
    wf.write_to_fil(str(fil_path))

    # Parse metadata
    adapter = FilterbankAdapter()
    parsed = adapter.parse(fil_path)

    reader = FilterbankSliceReader()
    # Request canonical lowest 4 channels [0, 4) at time steps [2, 5)
    matrix, freq_rev, backend, _warnings = reader.read_slice(
        file_path=fil_path,
        metadata=parsed.metadata,
        time_start=2,
        time_stop=5,
        frequency_start=0,
        frequency_stop=4,
    )

    assert matrix.shape == (3, 4)
    assert freq_rev is True
    assert backend == "np.memmap.fil"

    # In source data: lowest frequency is at source channel 15 (1485 MHz).
    # Next lowest is source channel 14 (1486 MHz).
    # For time step 2: source chan 15 has value 215, source chan 14 has 214, etc.
    # Therefore, row 0 (time 2) in canonical matrix must be [215, 214, 213, 212]
    np.testing.assert_allclose(matrix[0], [215.0, 214.0, 213.0, 212.0])
    np.testing.assert_allclose(matrix[1], [315.0, 314.0, 313.0, 312.0])
    np.testing.assert_allclose(matrix[2], [415.0, 414.0, 413.0, 412.0])


def test_filterbank_reader_bounds_validation(tmp_path: Path) -> None:
    """Filterbank reader strictly enforces slice index boundaries."""
    fil_path = tmp_path / "obs.fil"
    create_synthetic_filterbank(fil_path, nchans=32, n_ints=8)
    parsed = FilterbankAdapter().parse(fil_path)
    reader = FilterbankSliceReader()

    # Negative time_start
    with pytest.raises(InvalidSliceBoundsError):
        reader.read_slice(fil_path, parsed.metadata, -1, 4, 0, 8)

    # Inverted time range
    with pytest.raises(InvalidSliceBoundsError):
        reader.read_slice(fil_path, parsed.metadata, 5, 3, 0, 8)

    # Time stop beyond observation length
    with pytest.raises(InvalidSliceBoundsError):
        reader.read_slice(fil_path, parsed.metadata, 0, 10, 0, 8)

    # Frequency stop beyond channel count
    with pytest.raises(InvalidSliceBoundsError):
        reader.read_slice(fil_path, parsed.metadata, 0, 4, 0, 33)

    # Empty slice handling
    empty_mat, _, _, _ = reader.read_slice(fil_path, parsed.metadata, 2, 2, 0, 8)
    assert empty_mat.shape == (0, 8)


def test_filterbank_reader_missing_file() -> None:
    """Filterbank reader raises ObservationFileNotFoundError when file is missing."""
    reader = FilterbankSliceReader()
    fake_path = Path("does_not_exist_xyz.fil")
    from app.schemas.observations import ScientificMetadata

    dummy_meta = ScientificMetadata(
        channel_count=32,
        time_sample_count=8,
    )
    with pytest.raises(ObservationFileNotFoundError):
        reader.read_slice(fake_path, dummy_meta, 0, 2, 0, 4)


def test_fits_spectral_image_reader(tmp_path: Path) -> None:
    """FITS reader extracts bounded slices from radio spectral images."""
    fits_path = tmp_path / "spectral.fits"
    create_synthetic_fits_spectral_image(fits_path, nchans=32, n_times=16)

    adapter = FitsAdapter()
    parsed = adapter.parse(fits_path)
    reader = FitsSliceReader()

    matrix, freq_rev, backend, _warnings = reader.read_slice(
        file_path=fits_path,
        metadata=parsed.metadata,
        time_start=2,
        time_stop=6,
        frequency_start=4,
        frequency_stop=12,
    )

    assert matrix.shape == (4, 8)
    assert backend == "astropy.fits.section"
    # Channel spacing in helper is positive (+25 kHz), so no reversal needed
    assert freq_rev is False


def test_fits_binary_table_reader(tmp_path: Path) -> None:
    """FITS reader extracts bounded slices from radio binary tables (SUBINT)."""
    table_path = tmp_path / "table.fits"
    create_synthetic_fits_bintable(table_path, nchans=16, n_subints=4)

    adapter = FitsAdapter()
    parsed = adapter.parse(table_path)
    reader = FitsSliceReader()

    matrix, freq_rev, backend, _warnings = reader.read_slice(
        file_path=table_path,
        metadata=parsed.metadata,
        time_start=1,
        time_stop=3,
        frequency_start=0,
        frequency_stop=8,
    )

    assert matrix.shape == (2, 8)
    assert backend == "astropy.fits.bintable"
    assert freq_rev is False


def test_fits_reader_rejects_optical_layout(tmp_path: Path) -> None:
    """FITS reader rejects non-radio layouts."""
    optical_path = tmp_path / "optical.fits"
    create_optical_fits_image(optical_path)

    from app.schemas.observations import ScientificMetadata

    dummy_meta = ScientificMetadata(
        channel_count=32,
        time_sample_count=32,
    )
    reader = FitsSliceReader()

    with pytest.raises(UnsupportedSliceLayoutError):
        reader.read_slice(optical_path, dummy_meta, 0, 4, 0, 4)
