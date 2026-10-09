"""Unit tests for Filterbank and FITS scientific format adapters."""

from pathlib import Path

import pytest

from app.ingestion.adapters.base import BaseFormatAdapter
from app.ingestion.adapters.filterbank import FilterbankAdapter
from app.ingestion.adapters.fits import FitsAdapter
from app.ingestion.exceptions import (
    InvalidFileContentError,
    UnsupportedFitsLayoutError,
)
from tests.helpers import (
    create_optical_fits_image,
    create_synthetic_filterbank,
    create_synthetic_fits_bintable,
    create_synthetic_fits_spectral_image,
)


def test_frequency_bounds_computation_descending() -> None:
    """Validate signed channel spacing calculation with descending channels."""
    # fch1 = 1420.0, foff = -0.05, nchans = 4
    # Ch0 center = 1420.0, Ch3 center = 1420.0 + 3*(-0.05) = 1419.85
    # Edge min = 1419.85 - 0.025 = 1419.825
    # Edge max = 1420.0 + 0.025 = 1420.025
    # Bandwidth = 4 * 0.05 = 0.2
    f_min, f_max, bw = BaseFormatAdapter.compute_frequency_bounds(1420.0, -0.05, 4)
    assert f_min == 1419.825
    assert f_max == 1420.025
    assert bw == 0.2


def test_frequency_bounds_computation_ascending() -> None:
    """Validate signed channel spacing calculation with ascending channels."""
    # fch1 = 1400.0, foff = +0.1, nchans = 10
    # Ch0 center = 1400.0, Ch9 center = 1400.9
    # Edge min = 1400.0 - 0.05 = 1399.95
    # Edge max = 1400.9 + 0.05 = 1400.95
    # Bandwidth = 1.0
    f_min, f_max, bw = BaseFormatAdapter.compute_frequency_bounds(1400.0, 0.1, 10)
    assert f_min == 1399.95
    assert f_max == 1400.95
    assert bw == 1.0


def test_filterbank_adapter_valid_descending_frequencies(tmp_path: Path) -> None:
    """Validate FilterbankAdapter extracts correct metadata from descending filterbank."""
    fil_path = tmp_path / "valid_obs.fil"
    create_synthetic_filterbank(
        file_path=fil_path,
        nchans=32,
        n_ints=8,
        fch1=1420.0,
        foff=-0.05,
        tsamp=0.5,
        tstart=59000.0,
        source_name="VOYAGER-1",
        telescope_id=6,
        ra_str="19h50m47s",
        dec_str="08d52m06s",
    )

    adapter = FilterbankAdapter()
    parsed = adapter.parse(fil_path)

    meta = parsed.metadata
    assert meta.channel_count == 32
    assert meta.frequency_reference_mhz == 1420.0
    assert meta.channel_spacing_mhz == -0.05
    assert meta.frequency_unit == "MHz"
    assert meta.bandwidth_mhz == pytest.approx(1.6, abs=1e-5)
    assert meta.time_sample_count == 8
    assert meta.time_step_seconds == 0.5
    assert meta.start_mjd == 59000.0
    assert meta.start_time_utc == "2020-05-31T00:00:00.000"
    assert meta.source_name == "VOYAGER-1"
    assert meta.telescope_name == "Green Bank Telescope (GBT)"
    assert meta.ra_deg is not None and meta.ra_deg > 0
    assert meta.dec_deg is not None and meta.dec_deg > 0
    assert meta.bits_per_sample == 32
    assert meta.polarization_count == 1
    assert meta.data_dimensions == [8, 1, 32]

    assert parsed.provenance.parser_name == "blimpy.filterbank"
    assert parsed.provenance.layout == "sigproc_filterbank"
    assert parsed.provenance.source_format == "fil"
    assert len(parsed.warnings) == 0


def test_filterbank_adapter_missing_optional_metadata(tmp_path: Path) -> None:
    """Validate that missing header metadata is reported in warnings without fabrication."""
    fil_path = tmp_path / "sparse.fil"
    create_synthetic_filterbank(
        file_path=fil_path,
        nchans=16,
        n_ints=4,
        source_name=None,
        telescope_id=None,
        ra_str=None,
        dec_str=None,
    )

    adapter = FilterbankAdapter()
    parsed = adapter.parse(fil_path)

    meta = parsed.metadata
    assert meta.source_name is None
    assert meta.telescope_name is None
    assert meta.ra_deg is None
    assert meta.dec_deg is None

    # Must contain honest warnings about missing optional fields
    warnings_text = " ".join(parsed.warnings).lower()
    assert "source name" in warnings_text
    assert "telescope" in warnings_text
    assert "right ascension" in warnings_text
    assert "declination" in warnings_text


def test_filterbank_adapter_rejects_corrupted_file(tmp_path: Path) -> None:
    """Validate that non-filterbank or corrupted content raises InvalidFileContentError."""
    corrupt_file = tmp_path / "corrupt.fil"
    corrupt_file.write_bytes(b"NOT_A_VALID_HEADER_DATA_1234567890")

    adapter = FilterbankAdapter()
    with pytest.raises(InvalidFileContentError) as exc_info:
        adapter.parse(corrupt_file)

    assert "filterbank header" in exc_info.value.message.lower()


def test_fits_adapter_spectral_image_layout(tmp_path: Path) -> None:
    """Validate FitsAdapter parses radio spectral image HDUs correctly."""
    fits_path = tmp_path / "radio_spectral.fits"
    create_synthetic_fits_spectral_image(
        file_path=fits_path,
        nchans=32,
        n_times=16,
        f_ref_hz=1420.0e6,
        df_hz=25.0e3,
        dt_sec=0.25,
        telescope="GBT",
        target="BLC1",
    )

    adapter = FitsAdapter()
    parsed = adapter.parse(fits_path)

    meta = parsed.metadata
    assert meta.channel_count == 32
    assert meta.frequency_reference_mhz == 1420.0
    assert meta.channel_spacing_mhz == 0.025  # 25 kHz converted to 0.025 MHz
    assert meta.time_sample_count == 16
    assert meta.time_step_seconds == 0.25
    assert meta.source_name == "BLC1"
    assert meta.telescope_name == "GBT"
    assert meta.start_mjd == 59000.5

    assert parsed.provenance.parser_name == "astropy.fits.spectral_image"
    assert parsed.provenance.layout == "radio_spectral_image"


def test_fits_adapter_bintable_layout(tmp_path: Path) -> None:
    """Validate FitsAdapter parses radio observation binary tables (PSRFITS SUBINT)."""
    fits_path = tmp_path / "radio_bintable.fits"
    create_synthetic_fits_bintable(
        file_path=fits_path,
        nchans=16,
        n_subints=4,
        f_start_mhz=1400.0,
        f_end_mhz=1420.0,
        tsubint=5.0,
        telescope="Parkes",
        source="PSR J0437-4715",
    )

    adapter = FitsAdapter()
    parsed = adapter.parse(fits_path)

    meta = parsed.metadata
    assert meta.channel_count == 16
    assert meta.time_sample_count == 4
    assert meta.time_step_seconds == 5.0
    assert meta.source_name == "PSR J0437-4715"
    assert meta.telescope_name == "Parkes"

    assert parsed.provenance.parser_name == "astropy.fits.bintable"
    assert parsed.provenance.layout == "radio_bintable_psrfits"


def test_fits_adapter_rejects_optical_layout(tmp_path: Path) -> None:
    """Validate that an optical spatial FITS layout is explicitly rejected."""
    optical_path = tmp_path / "optical.fits"
    create_optical_fits_image(optical_path)

    adapter = FitsAdapter()
    with pytest.raises(UnsupportedFitsLayoutError) as exc_info:
        adapter.parse(optical_path)

    assert "supported radio observation layout" in exc_info.value.message.lower()


def test_fits_adapter_rejects_corrupted_file(tmp_path: Path) -> None:
    """Validate that malformed FITS content raises InvalidFileContentError."""
    corrupt_fits = tmp_path / "garbage.fits"
    corrupt_fits.write_bytes(b"MALFORMED_FITS_TRUNCATED_BLOCK")

    adapter = FitsAdapter()
    with pytest.raises(InvalidFileContentError) as exc_info:
        adapter.parse(corrupt_fits)

    assert "fits" in exc_info.value.message.lower()
