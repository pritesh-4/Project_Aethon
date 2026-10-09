"""SIGPROC Filterbank (.fil) format adapter using blimpy."""

from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import blimpy
from astropy.time import Time
from blimpy import Waterfall
from blimpy.io.sigproc import is_filterbank

from app.ingestion.adapters.base import BaseFormatAdapter, sanitize_header_value
from app.ingestion.exceptions import InvalidFileContentError
from app.ingestion.models import ParsedObservation
from app.schemas.observations import Provenance, ScientificMetadata

# Canonical SIGPROC telescope identifiers
SIGPROC_TELESCOPES: dict[int, str] = {
    0: "Fake / Simulated Data",
    1: "Arecibo Observatory",
    2: "Ooty Radio Telescope",
    3: "Nançay Radio Telescope",
    4: "Parkes Observatory (Murriyang)",
    5: "Jodrell Bank (Lovell Telescope)",
    6: "Green Bank Telescope (GBT)",
    7: "Giant Metrewave Radio Telescope (GMRT)",
    8: "Effelsberg 100m Radio Telescope",
    9: "13.7m Telescope",
    10: "SRT (Sardinia Radio Telescope)",
    11: "MeerKAT Radio Telescope",
}


class FilterbankAdapter(BaseFormatAdapter):
    """Scientific parser for SIGPROC filterbank (.fil) observations via blimpy."""

    def parse(self, file_path: Path) -> ParsedObservation:
        """Inspect filterbank header without loading raw spectral arrays into RAM."""
        file_str = str(file_path.resolve())

        # Preliminary structural check
        try:
            if not is_filterbank(file_str):
                raise InvalidFileContentError(
                    f"File '{file_path.name}' does not contain a valid "
                    "SIGPROC filterbank header marker."
                )

        except Exception as e:
            if isinstance(e, InvalidFileContentError):
                raise
            raise InvalidFileContentError(
                f"Failed to inspect filterbank header structure: {e}"
            ) from e

        # Header extraction using load_data=False for memory conservation
        try:
            wf = Waterfall(file_str, load_data=False)
        except Exception as e:
            raise InvalidFileContentError(
                f"Failed to parse filterbank header via blimpy: {e}"
            ) from e

        header: dict[str, Any] = getattr(wf, "header", {}) or {}
        warnings: list[str] = []

        # 1. Frequency Axis & Channels
        nchans: int | None = header.get("nchans")
        fch1: float | None = header.get("fch1")
        foff: float | None = header.get("foff")

        if nchans is None or fch1 is None or foff is None:
            warnings.append(
                "Essential frequency axis parameters (nchans, fch1, foff) are incomplete."
            )
            f_min, f_max, bw = None, None, None
        else:
            nchans = int(nchans)
            fch1 = float(fch1)
            foff = float(foff)
            f_min, f_max, bw = self.compute_frequency_bounds(
                f_ref=fch1,
                df=foff,
                n_chans=nchans,
            )

        # 2. Time Axis & Integrations
        tsamp: float | None = header.get("tsamp")
        if tsamp is not None:
            tsamp = float(tsamp)
        else:
            warnings.append("Time sampling interval (tsamp) is missing from filterbank header.")

        # Integrations count without loading data
        n_ints: int | None = None
        if hasattr(wf, "n_ints_in_file") and wf.n_ints_in_file is not None:
            n_ints = int(wf.n_ints_in_file)
        elif hasattr(wf, "container") and hasattr(wf.container, "n_ints_in_file"):
            n_ints = int(wf.container.n_ints_in_file)

        if n_ints is None or n_ints <= 0:
            warnings.append(
                "Time integrations count could not be determined from header/file size."
            )

        # 3. Observation Epoch / MJD
        tstart: float | None = header.get("tstart")
        start_mjd: float | None = None
        start_time_utc: str | None = None

        if tstart is not None:
            start_mjd = float(tstart)
            try:
                start_time_utc = Time(start_mjd, format="mjd", scale="utc").isot
            except Exception:
                warnings.append(f"Could not convert MJD epoch {start_mjd} to UTC ISO format.")
        else:
            warnings.append("Observation start epoch (tstart) is missing from header.")

        # 4. Telescope and Target Source
        tel_id = header.get("telescope_id")
        telescope_name: str | None = None
        if tel_id is not None:
            try:
                tel_int = int(tel_id)
                telescope_name = SIGPROC_TELESCOPES.get(tel_int, f"Telescope ID {tel_int}")
            except Exception:
                telescope_name = str(tel_id)
        elif "telescope_name" in header:
            telescope_name = str(header["telescope_name"])
        else:
            warnings.append("Telescope identifier is missing from filterbank header.")

        source_name: str | None = None
        raw_source = header.get("source_name") or header.get("src_name")
        if raw_source is not None:
            source_name = str(raw_source).strip()
        else:
            warnings.append("Astronomical target / source name is missing from filterbank header.")

        # 5. Celestial Coordinates (RA/Dec)
        ra_deg: float | None = None
        dec_deg: float | None = None
        ra_str: str | None = None
        dec_str: str | None = None

        raw_raj = header.get("src_raj")
        raw_dej = header.get("src_dej")

        if raw_raj is not None:
            if hasattr(raw_raj, "deg"):
                ra_deg = round(float(raw_raj.deg), 6)
                ra_str = str(raw_raj)
            elif isinstance(raw_raj, (float, int)):
                ra_deg = round(float(raw_raj), 6)
                ra_str = f"{ra_deg}°"
        else:
            warnings.append("Right Ascension (src_raj) is missing from header.")

        if raw_dej is not None:
            if hasattr(raw_dej, "deg"):
                dec_deg = round(float(raw_dej.deg), 6)
                dec_str = str(raw_dej)
            elif isinstance(raw_dej, (float, int)):
                dec_deg = round(float(raw_dej), 6)
                dec_str = f"{dec_deg}°"
        else:
            warnings.append("Declination (src_dej) is missing from header.")

        # 6. Quantization and Polarization
        nbits: int | None = header.get("nbits")
        if nbits is not None:
            nbits = int(nbits)

        nifs: int | None = header.get("nifs")
        if nifs is not None:
            nifs = int(nifs)

        # 7. Data Dimensions
        data_dimensions: list[int] | None = None
        if n_ints is not None and nchans is not None:
            data_dimensions = [n_ints, nifs or 1, nchans]

        # 8. Filter raw header for JSON serializability
        clean_raw_header = {str(k): sanitize_header_value(v) for k, v in header.items()}

        metadata = ScientificMetadata(
            channel_count=nchans,
            frequency_reference_mhz=fch1,
            channel_spacing_mhz=foff,
            frequency_unit="MHz",
            frequency_min_mhz=f_min,
            frequency_max_mhz=f_max,
            bandwidth_mhz=bw,
            time_sample_count=n_ints,
            time_step_seconds=tsamp,
            time_unit="s",
            start_mjd=start_mjd,
            start_time_utc=start_time_utc,
            telescope_name=telescope_name,
            source_name=source_name,
            ra_deg=ra_deg,
            dec_deg=dec_deg,
            ra_str=ra_str,
            dec_str=dec_str,
            data_dimensions=data_dimensions,
            bits_per_sample=nbits,
            polarization_count=nifs,
            raw_header=clean_raw_header,
        )

        provenance = Provenance(
            parser_name="blimpy.filterbank",
            parser_version=getattr(blimpy, "__version__", "unknown"),
            parsed_at=datetime.now(UTC).isoformat(),
            source_format="fil",
            layout="sigproc_filterbank",
            notes="Parsed via blimpy Waterfall header reader without array loading",
        )

        return ParsedObservation(
            metadata=metadata,
            provenance=provenance,
            warnings=warnings,
        )
