"""Test fixture generators for scientific observation files."""

from pathlib import Path
from typing import Any

import astropy.io.fits as fits
import numpy as np
from astropy.coordinates import Angle
from blimpy import Waterfall


def create_synthetic_filterbank(
    file_path: Path,
    nchans: int = 32,
    n_ints: int = 8,
    fch1: float = 1420.0,
    foff: float = -0.05,
    tsamp: float = 0.5,
    tstart: float = 59000.0,
    source_name: str | None = "VOYAGER-1",
    telescope_id: int | None = 6,
    ra_str: str | None = "19h50m47s",
    dec_str: str | None = "08d52m06s",
) -> Path:
    """Generate a genuine synthetic SIGPROC filterbank (.fil) file via blimpy."""
    header: dict[str, Any] = {
        "fch1": fch1,
        "foff": foff,
        "nchans": nchans,
        "tsamp": tsamp,
        "nbits": 32,
        "nifs": 1,
    }
    if tstart is not None:
        header["tstart"] = tstart
    if source_name is not None:
        header["source_name"] = source_name
    if telescope_id is not None:
        header["telescope_id"] = telescope_id
    if ra_str is not None:
        header["src_raj"] = Angle(ra_str)
    if dec_str is not None:
        header["src_dej"] = Angle(dec_str)

    data = np.ones((n_ints, 1, nchans), dtype=np.float32)
    wf = Waterfall(header_dict=header, data_array=data)
    wf.write_to_fil(str(file_path))
    return file_path


def create_synthetic_fits_spectral_image(
    file_path: Path,
    nchans: int = 32,
    n_times: int = 16,
    f_ref_hz: float = 1420.0e6,
    df_hz: float = 25.0e3,
    dt_sec: float = 0.5,
    telescope: str = "Green Bank Telescope",
    target: str = "BLC1-PROXIMA",
) -> Path:
    """Generate a radio spectral image FITS file with WCS frequency/time axes."""
    data = np.zeros((n_times, nchans), dtype=np.float32)
    primary = fits.PrimaryHDU(data=data)
    header = primary.header

    # Axis 1: Frequency
    header["CTYPE1"] = "FREQ"
    header["CRVAL1"] = f_ref_hz
    header["CDELT1"] = df_hz
    header["CUNIT1"] = "Hz"

    # Axis 2: Time
    header["CTYPE2"] = "TIME"
    header["CRVAL2"] = 0.0
    header["CDELT2"] = dt_sec
    header["CUNIT2"] = "s"

    header["TELESCOP"] = telescope
    header["OBJECT"] = target
    header["MJD-OBS"] = 59000.5
    header["RA"] = 297.6958
    header["DEC"] = 8.8683

    primary.writeto(str(file_path), overwrite=True)
    return file_path


def create_synthetic_fits_bintable(
    file_path: Path,
    nchans: int = 16,
    n_subints: int = 4,
    f_start_mhz: float = 1400.0,
    f_end_mhz: float = 1420.0,
    tsubint: float = 10.0,
    telescope: str = "Parkes",
    source: str = "PSR B1919+21",
) -> Path:
    """Generate a radio observation binary table FITS (PSRFITS-style SUBINT table)."""
    primary = fits.PrimaryHDU()
    primary.header["TELESCOP"] = telescope
    primary.header["SRC_NAME"] = source
    primary.header["STT_IMJD"] = 59000
    primary.header["STT_SMJD"] = 43200
    primary.header["RA"] = "19:19:43.0"
    primary.header["DEC"] = "+21:47:16.0"

    freqs_per_row = np.linspace(f_start_mhz, f_end_mhz, nchans)
    freq_array = np.tile(freqs_per_row, (n_subints, 1))

    col_tsub = fits.Column(name="TSUBINT", format="1D", array=np.full(n_subints, tsubint))
    col_freq = fits.Column(name="DAT_FREQ", format=f"{nchans}D", array=freq_array)
    col_data = fits.Column(
        name="DATA", format=f"{nchans}E", array=np.ones((n_subints, nchans), dtype=np.float32)
    )

    bintable = fits.BinTableHDU.from_columns([col_tsub, col_freq, col_data], name="SUBINT")
    bintable.header["NCHAN"] = nchans
    bintable.header["TBIN"] = 0.001

    hdul = fits.HDUList([primary, bintable])
    hdul.writeto(str(file_path), overwrite=True)
    return file_path


def create_optical_fits_image(file_path: Path) -> Path:
    """Generate an optical FITS image (spatial RA/DEC without radio frequency axes)."""
    data = np.zeros((32, 32), dtype=np.float32)
    primary = fits.PrimaryHDU(data=data)
    primary.header["CTYPE1"] = "RA---TAN"
    primary.header["CTYPE2"] = "DEC--TAN"
    primary.header["CRVAL1"] = 150.0
    primary.header["CRVAL2"] = 2.0
    primary.header["OBJECT"] = "COSMOS-OPTICAL"
    primary.writeto(str(file_path), overwrite=True)
    return file_path
