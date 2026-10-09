"""Radio-observation FITS (.fits, .fit) format adapters using astropy.io.fits."""

from datetime import UTC, datetime
from pathlib import Path

import astropy.io.fits as fits
from astropy.coordinates import Angle
from astropy.time import Time

from app.ingestion.adapters.base import BaseFormatAdapter, sanitize_header_value
from app.ingestion.exceptions import (
    InvalidFileContentError,
    UnsupportedFitsLayoutError,
)
from app.ingestion.models import ParsedObservation
from app.schemas.observations import Provenance, ScientificMetadata


def _convert_frequency_to_mhz(val: float, unit: str | None) -> tuple[float, str]:
    """Normalize frequency value to MHz according to header unit string."""
    if not unit:
        # If value is > 1e6 without unit, radio convention typically implies Hz
        if abs(val) >= 1e6:
            return round(val / 1e6, 8), "MHz (inferred from Hz)"
        return val, "MHz"

    u = unit.strip().lower()
    if u in ("hz", "hertz"):
        return round(val / 1e6, 8), "MHz"
    if u in ("khz", "kilohertz"):
        return round(val / 1e3, 8), "MHz"
    if u in ("mhz", "megahertz"):
        return val, "MHz"
    if u in ("ghz", "gigahertz"):
        return round(val * 1e3, 8), "MHz"
    return val, unit


def _convert_time_to_seconds(val: float, unit: str | None) -> tuple[float, str]:
    """Normalize time step value to seconds."""
    if not unit:
        return val, "s"
    u = unit.strip().lower()
    if u in ("s", "sec", "second", "seconds"):
        return val, "s"
    if u in ("ms", "millisecond", "milliseconds"):
        return val / 1e3, "s"
    if u in ("us", "microsecond", "microseconds"):
        return val / 1e6, "s"
    return val, unit


class FitsSpectralImageParser:
    """Parser for radio spectral images and cubes (PrimaryHDU or ImageHDU)."""

    def can_parse(self, hdul: fits.HDUList) -> tuple[bool, int]:
        """Check if HDU list contains an image HDU with frequency/time or spectral axes."""
        for idx, hdu in enumerate(hdul):
            if not isinstance(hdu, (fits.PrimaryHDU, fits.ImageHDU)):
                continue
            if hdu.header.get("NAXIS", 0) < 2:
                continue

            header = hdu.header
            # Check for WCS frequency axis
            naxis = header.get("NAXIS", 0)
            has_freq = False
            for i in range(1, naxis + 1):
                ctype = str(header.get(f"CTYPE{i}", "")).upper()
                if any(k in ctype for k in ("FREQ", "OBSFREQ", "RESTFREQ", "SPEC")):
                    has_freq = True
                    break

            # Check alternative radio spectrogram headers (e.g. FCH1/FOFF or FREQ/BANDWID)
            if not has_freq:
                has_freq = any(
                    k in header for k in ("FCH1", "FREQ", "RESTFREQ", "OBSFREQ", "BANDWID")
                )

            # Must NOT be a purely optical spatial image
            # (e.g. RA---TAN and DEC--TAN with no frequency)
            is_optical = False
            ctype1 = str(header.get("CTYPE1", "")).upper()
            ctype2 = str(header.get("CTYPE2", "")).upper()
            if "RA" in ctype1 and "DEC" in ctype2 and not has_freq:
                is_optical = True

            if has_freq and not is_optical:
                return True, idx

        return False, -1

    def parse(self, hdul: fits.HDUList, hdu_idx: int) -> ParsedObservation:
        """Extract scientific metadata from spectral image HDU."""
        hdu = hdul[hdu_idx]
        header = hdu.header
        primary_header = hdul[0].header if hdul else header
        warnings: list[str] = []

        naxis = header.get("NAXIS", 0)
        shape = list(hdu.shape) if hasattr(hdu, "shape") and hdu.shape else None

        # Determine frequency axis index (1-based FITS index)
        freq_axis: int | None = None
        time_axis: int | None = None

        for i in range(1, naxis + 1):
            ctype = str(header.get(f"CTYPE{i}", "")).upper()
            if any(k in ctype for k in ("FREQ", "OBSFREQ", "RESTFREQ", "SPEC")):
                freq_axis = i
            elif any(k in ctype for k in ("TIME", "UTC")):
                time_axis = i

        # Fallback axis assignments for 2D spectrograms if CTYPE is unspecific
        if freq_axis is None:
            if "FCH1" in header or "CRVAL1" in header:
                freq_axis = 1
                time_axis = 2
            elif "CRVAL2" in header:
                freq_axis = 2
                time_axis = 1

        # Extract frequency parameters
        nchans: int | None = None
        f_ref_mhz: float | None = None
        df_mhz: float | None = None
        f_min: float | None = None
        f_max: float | None = None
        bw: float | None = None

        if freq_axis is not None:
            nchans = int(header.get(f"NAXIS{freq_axis}", 0))
            raw_crval = header.get(f"CRVAL{freq_axis}")
            if raw_crval is None and freq_axis == 1:
                raw_crval = header.get("FCH1")
            raw_cdelt = header.get(f"CDELT{freq_axis}")
            if raw_cdelt is None and freq_axis == 1:
                raw_cdelt = header.get("FOFF") or header.get("CHAN_BW")
            cunit = header.get(f"CUNIT{freq_axis}")

            if raw_crval is not None and raw_cdelt is not None and nchans > 0:
                f_ref_mhz, u_notes = _convert_frequency_to_mhz(
                    float(raw_crval), str(cunit) if cunit else None
                )
                df_mhz, _ = _convert_frequency_to_mhz(
                    float(raw_cdelt), str(cunit) if cunit else None
                )
                if "inferred" in u_notes:
                    warnings.append(
                        f"Frequency units inferred as {u_notes} based on reference value."
                    )

                f_min, f_max, bw = BaseFormatAdapter.compute_frequency_bounds(
                    f_ref=f_ref_mhz,
                    df=df_mhz,
                    n_chans=nchans,
                )
            else:
                warnings.append(
                    "Incomplete frequency reference or channel spacing in image header."
                )
        else:
            warnings.append("Could not identify frequency axis in spectral image HDU.")

        # Extract time parameters
        time_sample_count: int | None = None
        time_step_sec: float | None = None

        if time_axis is not None:
            time_sample_count = int(header.get(f"NAXIS{time_axis}", 0))
            raw_tstep = (
                header.get(f"CDELT{time_axis}") or header.get("TSAMP") or header.get("EXPTIME")
            )
            tunit = header.get(f"CUNIT{time_axis}")
            if raw_tstep is not None:
                time_step_sec, _ = _convert_time_to_seconds(
                    float(raw_tstep), str(tunit) if tunit else None
                )
        else:
            # Check other image axes
            if naxis == 2 and freq_axis == 1:
                time_sample_count = int(header.get("NAXIS2", 0))
            elif naxis == 2 and freq_axis == 2:
                time_sample_count = int(header.get("NAXIS1", 0))
            raw_tsamp = header.get("TSAMP") or header.get("EXPTIME")
            if raw_tsamp is not None:
                time_step_sec = float(raw_tsamp)

        # Start epoch
        start_mjd: float | None = None
        start_time_utc: str | None = None
        raw_mjd = header.get("MJD-OBS") or header.get("MJD") or primary_header.get("MJD-OBS")
        raw_date = header.get("DATE-OBS") or primary_header.get("DATE-OBS")

        if raw_mjd is not None:
            try:
                start_mjd = float(raw_mjd)
                start_time_utc = Time(start_mjd, format="mjd", scale="utc").isot
            except Exception:
                warnings.append(f"Failed to convert MJD {raw_mjd} to ISO UTC.")
        elif raw_date is not None:
            try:
                t_obj = Time(str(raw_date), scale="utc")
                start_time_utc = t_obj.isot
                start_mjd = float(t_obj.mjd)
            except Exception:
                start_time_utc = str(raw_date)
                warnings.append(f"Could not compute MJD from DATE-OBS string '{raw_date}'.")
        else:
            warnings.append("Observation start time (DATE-OBS / MJD-OBS) is missing.")

        # Telescope & Source
        telescope = header.get("TELESCOP") or primary_header.get("TELESCOP") or header.get("ORIGIN")
        telescope_name = str(telescope).strip() if telescope else None
        if not telescope_name:
            warnings.append("Telescope name (TELESCOP) is missing.")

        source = header.get("OBJECT") or header.get("SRC_NAME") or primary_header.get("OBJECT")
        source_name = str(source).strip() if source else None
        if not source_name:
            warnings.append("Target source name (OBJECT / SRC_NAME) is missing.")

        # Coordinates
        ra_deg: float | None = None
        dec_deg: float | None = None
        raw_ra = header.get("RA") or primary_header.get("RA")
        raw_dec = header.get("DEC") or primary_header.get("DEC")

        if raw_ra is not None:
            try:
                if isinstance(raw_ra, (int, float)):
                    ra_deg = round(float(raw_ra), 6)
                else:
                    ra_angle = Angle(str(raw_ra), unit="hourangle")
                    ra_deg = round(float(ra_angle.deg), 6)
            except Exception:
                warnings.append(f"Failed to parse Right Ascension value '{raw_ra}'.")

        if raw_dec is not None:
            try:
                if isinstance(raw_dec, (int, float)):
                    dec_deg = round(float(raw_dec), 6)
                else:
                    dec_angle = Angle(str(raw_dec), unit="deg")
                    dec_deg = round(float(dec_angle.deg), 6)
            except Exception:
                warnings.append(f"Failed to parse Declination value '{raw_dec}'.")

        clean_header = {
            str(k): sanitize_header_value(v)
            for k, v in header.items()
            if not k.startswith("COMMENT") and not k.startswith("HISTORY")
        }

        metadata = ScientificMetadata(
            channel_count=nchans,
            frequency_reference_mhz=f_ref_mhz,
            channel_spacing_mhz=df_mhz,
            frequency_unit="MHz",
            frequency_min_mhz=f_min,
            frequency_max_mhz=f_max,
            bandwidth_mhz=bw,
            time_sample_count=time_sample_count,
            time_step_seconds=time_step_sec,
            time_unit="s",
            start_mjd=start_mjd,
            start_time_utc=start_time_utc,
            telescope_name=telescope_name,
            source_name=source_name,
            ra_deg=ra_deg,
            dec_deg=dec_deg,
            ra_str=f"{ra_deg}°" if ra_deg is not None else None,
            dec_str=f"{dec_deg}°" if dec_deg is not None else None,
            data_dimensions=shape,
            bits_per_sample=abs(int(header.get("BITPIX", 32))),
            polarization_count=int(header.get("NAXIS3", 1)) if naxis >= 3 else 1,
            raw_header=clean_header,
        )

        provenance = Provenance(
            parser_name="astropy.fits.spectral_image",
            parser_version=getattr(fits, "__version__", "unknown"),
            parsed_at=datetime.now(UTC).isoformat(),
            source_format="fits",
            layout="radio_spectral_image",
            notes=(
                f"Parsed from HDU #{hdu_idx} ({hdu.name}) via memmap without reading array payload"
            ),
        )

        return ParsedObservation(
            metadata=metadata,
            provenance=provenance,
            warnings=warnings,
        )


class FitsBinTableParser:
    """Parser for radio binary tables (e.g. PSRFITS/SDFITS with SUBINT and DAT_FREQ)."""

    def can_parse(self, hdul: fits.HDUList) -> tuple[bool, int]:
        """Check if HDU list contains a radio observation binary table."""
        for idx, hdu in enumerate(hdul):
            if not isinstance(hdu, (fits.BinTableHDU, fits.TableHDU)):
                continue
            extname = str(hdu.name).upper().strip()
            cols: list[str] = []
            if hasattr(hdu, "columns") and hasattr(hdu.columns, "names"):
                cols = [str(c).upper() for c in hdu.columns.names]

            # Recognized radio table patterns: PSRFITS (SUBINT), SDFITS (SINGLE DISH)
            if extname in ("SUBINT", "SINGLE DISH", "SPECTRA", "RADIO_DATA"):
                return True, idx
            if "DATA" in cols and ("DAT_FREQ" in cols or "TSUBINT" in cols):
                return True, idx

        return False, -1

    def parse(self, hdul: fits.HDUList, hdu_idx: int) -> ParsedObservation:
        """Extract scientific metadata from radio binary table HDU."""
        hdu = hdul[hdu_idx]
        header = hdu.header
        primary_header = hdul[0].header if hdul else header
        warnings: list[str] = []

        # Table rows correspond to time integrations / subintegrations
        time_sample_count: int | None = header.get("NAXIS2") or header.get("NSUBINT")
        if time_sample_count is None and hasattr(hdu, "data") and hdu.data is not None:
            try:
                time_sample_count = len(hdu.data)
            except Exception:
                pass
        if time_sample_count is not None:
            time_sample_count = int(time_sample_count)

        # Frequency channels from DAT_FREQ column or header NCHAN
        nchans: int | None = header.get("NCHAN")
        fch1: float | None = None
        foff: float | None = None
        f_min: float | None = None
        f_max: float | None = None
        bw: float | None = None

        col_names = [str(c).upper() for c in hdu.columns.names]
        if "DAT_FREQ" in col_names:
            try:
                # Read only first row of DAT_FREQ column to avoid large memory allocations
                freqs = hdu.data[0]["DAT_FREQ"]
                if hasattr(freqs, "__len__") and len(freqs) > 0:
                    nchans = len(freqs)
                    fch1 = float(freqs[0])
                    if nchans > 1:
                        foff = float(freqs[1] - freqs[0])
                    else:
                        foff = float(header.get("CHAN_BW", 0.0))
                    f_min, f_max, bw = BaseFormatAdapter.compute_frequency_bounds(
                        f_ref=fch1,
                        df=foff,
                        n_chans=nchans,
                    )
            except Exception as e:
                warnings.append(f"Failed to inspect DAT_FREQ column: {e}")
        elif "CHAN_BW" in header and "CTR_FREQ" in header and nchans:
            chan_bw = float(header["CHAN_BW"])
            ctr_freq = float(header["CTR_FREQ"])
            foff = chan_bw
            fch1 = ctr_freq - ((nchans - 1) * chan_bw / 2.0)
            f_min, f_max, bw = BaseFormatAdapter.compute_frequency_bounds(
                f_ref=fch1,
                df=foff,
                n_chans=nchans,
            )
        else:
            warnings.append("Could not determine frequency channels from binary table.")

        # Time resolution
        time_step_sec: float | None = None
        if "TSUBINT" in header:
            time_step_sec = float(header["TSUBINT"])
        elif "TSUBINT" in col_names and time_sample_count is not None and time_sample_count > 0:
            try:
                time_step_sec = float(hdu.data[0]["TSUBINT"])
            except Exception:
                pass
        elif "TBIN" in header:
            time_step_sec = float(header["TBIN"])

        # Start MJD from primary header (STT_IMJD + STT_SMJD)
        start_mjd: float | None = None
        start_time_utc: str | None = None
        stt_imjd = primary_header.get("STT_IMJD")
        stt_smjd = primary_header.get("STT_SMJD")
        stt_offs = primary_header.get("STT_OFFS", 0.0)

        if stt_imjd is not None and stt_smjd is not None:
            try:
                start_mjd = float(stt_imjd) + (float(stt_smjd) + float(stt_offs)) / 86400.0
                start_time_utc = Time(start_mjd, format="mjd", scale="utc").isot
            except Exception:
                warnings.append("Failed to compute start epoch from STT_IMJD/STT_SMJD.")
        elif "MJD-OBS" in primary_header:
            try:
                start_mjd = float(primary_header["MJD-OBS"])
                start_time_utc = Time(start_mjd, format="mjd", scale="utc").isot
            except Exception:
                pass

        # Telescope & Source
        telescope = primary_header.get("TELESCOP") or header.get("TELESCOP")
        telescope_name = str(telescope).strip() if telescope else None
        if not telescope_name:
            warnings.append("Telescope name is missing from binary table headers.")

        source = primary_header.get("SRC_NAME") or primary_header.get("OBJECT")
        source_name = str(source).strip() if source else None
        if not source_name:
            warnings.append("Source name is missing from binary table headers.")

        # Coordinates
        ra_deg: float | None = None
        dec_deg: float | None = None
        raw_ra = primary_header.get("RA") or primary_header.get("STT_CRD1")
        raw_dec = primary_header.get("DEC") or primary_header.get("STT_CRD2")

        if raw_ra is not None:
            try:
                if isinstance(raw_ra, (int, float)):
                    ra_deg = round(float(raw_ra), 6)
                else:
                    ra_angle = Angle(str(raw_ra), unit="hourangle")
                    ra_deg = round(float(ra_angle.deg), 6)
            except Exception:
                warnings.append(f"Failed to parse RA '{raw_ra}'.")

        if raw_dec is not None:
            try:
                if isinstance(raw_dec, (int, float)):
                    dec_deg = round(float(raw_dec), 6)
                else:
                    dec_angle = Angle(str(raw_dec), unit="deg")
                    dec_deg = round(float(dec_angle.deg), 6)
            except Exception:
                warnings.append(f"Failed to parse Dec '{raw_dec}'.")

        clean_header = {
            str(k): sanitize_header_value(v)
            for k, v in header.items()
            if not k.startswith("COMMENT") and not k.startswith("HISTORY")
        }

        metadata = ScientificMetadata(
            channel_count=nchans,
            frequency_reference_mhz=fch1,
            channel_spacing_mhz=foff,
            frequency_unit="MHz",
            frequency_min_mhz=f_min,
            frequency_max_mhz=f_max,
            bandwidth_mhz=bw,
            time_sample_count=time_sample_count,
            time_step_seconds=time_step_sec,
            time_unit="s",
            start_mjd=start_mjd,
            start_time_utc=start_time_utc,
            telescope_name=telescope_name,
            source_name=source_name,
            ra_deg=ra_deg,
            dec_deg=dec_deg,
            ra_str=f"{ra_deg}°" if ra_deg is not None else None,
            dec_str=f"{dec_deg}°" if dec_deg is not None else None,
            data_dimensions=(
                [time_sample_count or 0, nchans or 0]
                if (time_sample_count is not None or nchans is not None)
                else None
            ),
            bits_per_sample=int(header.get("NBITS", 32)),
            polarization_count=int(header.get("NPOL", 1)),
            raw_header=clean_header,
        )

        provenance = Provenance(
            parser_name="astropy.fits.bintable",
            parser_version=getattr(fits, "__version__", "unknown"),
            parsed_at=datetime.now(UTC).isoformat(),
            source_format="fits",
            layout="radio_bintable_psrfits",
            notes=f"Parsed from BinTable HDU #{hdu_idx} ({hdu.name})",
        )

        return ParsedObservation(
            metadata=metadata,
            provenance=provenance,
            warnings=warnings,
        )


class FitsAdapter(BaseFormatAdapter):
    """Scientific parser for radio observation FITS (.fits, .fit) files."""

    def __init__(self) -> None:
        self.image_parser = FitsSpectralImageParser()
        self.bintable_parser = FitsBinTableParser()

    def parse(self, file_path: Path) -> ParsedObservation:
        """Inspect FITS container structure and delegate to appropriate layout parser."""
        file_str = str(file_path.resolve())

        try:
            # Memory-mapped header inspection without reading large array payloads
            with fits.open(file_str, memmap=True) as hdul:
                # 1. Try Radio Spectral Image parser
                can_image, img_idx = self.image_parser.can_parse(hdul)
                if can_image:
                    return self.image_parser.parse(hdul, img_idx)

                # 2. Try Radio Binary Table parser
                can_table, tbl_idx = self.bintable_parser.can_parse(hdul)
                if can_table:
                    return self.bintable_parser.parse(hdul, tbl_idx)

                # 3. Neither recognized: reject explicitly
                hdu_summary = [
                    f"HDU#{i}: {h.name} ({type(h).__name__})" for i, h in enumerate(hdul)
                ]
                raise UnsupportedFitsLayoutError(
                    message=(
                        f"FITS file '{file_path.name}' does not contain a supported "
                        f"radio observation layout. Found HDUs: {', '.join(hdu_summary)}. "
                        "Supported layouts are: 1) Radio Spectral Image (NAXIS>=2 with "
                        "frequency axis) or 2) Radio Binary Table (e.g., PSRFITS/SDFITS "
                        "with SUBINT and DAT_FREQ)."
                    ),
                    details={"hdus": hdu_summary},
                )

        except UnsupportedFitsLayoutError:
            raise
        except Exception as e:
            raise InvalidFileContentError(f"Failed to read FITS container structure: {e}") from e
