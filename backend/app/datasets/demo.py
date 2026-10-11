"""Deterministic offline demo data generation and sample loading service.

Provides guaranteed offline sample data for AETHON:
1. Synthetic Drifting Beacon (reproducible Gaussian noise + drifting tone beacon)
2. Real GBT Observation Sample (validated compact fixture of HIP 35136)

Adheres strictly to the production IngestionService, FilterbankAdapter, and
ObservationRepository lifecycle with SHA-256 deduplication and safe cleanup.
"""

from __future__ import annotations

import hashlib
import time
import uuid
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import numpy as np
from astropy.coordinates import Angle
from blimpy import Waterfall

from app.core.config import Settings
from app.core.logging import get_logger
from app.ingestion.adapters.filterbank import FilterbankAdapter
from app.ingestion.models import ObservationRecordInternal
from app.schemas.public_datasets import DemoLoadResponse, DemoSampleInfo
from app.storage.repository import ObservationRepository

logger = get_logger("datasets.demo")

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"
REAL_GBT_FIXTURE_PATH = FIXTURES_DIR / "hip35136_gbt_cropped.fil"
REAL_GBT_MANIFEST_PATH = FIXTURES_DIR / "hip35136_manifest.json"

SYNTHETIC_SAMPLE_ID = "synthetic-drifting-beacon"
REAL_GBT_SAMPLE_ID = "real-gbt-hip35136"

SUPPORTED_DEMO_PRESETS = (SYNTHETIC_SAMPLE_ID, REAL_GBT_SAMPLE_ID)


def generate_demo_filterbank_fixture(file_path: Path, seed: int = 42) -> dict[str, Any]:
    """Generate a genuine SIGPROC .fil file with a synthetic drifting beacon in Gaussian noise.

    Production-clean, deterministic implementation suitable for local demonstration.
    """
    rng = np.random.default_rng(seed)
    n_ints = 32
    nchans = 64
    fch1 = 1420.0  # MHz
    foff = -0.05  # MHz per channel (descending in raw file)
    tsamp = 0.5  # seconds per integration
    tstart = 59000.0

    # Background standard Gaussian noise
    data = rng.standard_normal(size=(n_ints, 1, nchans)).astype(np.float32)

    # Inject a known drifting tone beacon:
    # Starts at raw channel 40 and drifts by -10 channels over 32 time steps
    # Peak SNR ~ 15.0
    for t_idx in range(n_ints):
        f_idx = round(40 - (t_idx / n_ints) * 10)
        if 0 <= f_idx < nchans:
            data[t_idx, 0, f_idx] += 15.0

    header: dict[str, Any] = {
        "fch1": fch1,
        "foff": foff,
        "nchans": nchans,
        "tsamp": tsamp,
        "nbits": 32,
        "nifs": 1,
        "tstart": tstart,
        "source_name": "SYNTH-BEACON-01",
        "telescope_id": 6,  # Green Bank Telescope
        "src_raj": Angle("19h50m47s"),
        "src_dej": Angle("08d52m06s"),
    }

    file_path.parent.mkdir(parents=True, exist_ok=True)
    wf = Waterfall(header_dict=header, data_array=data)
    wf.write_to_fil(str(file_path))

    return {
        "file_path": str(file_path),
        "source_name": header["source_name"],
        "nchans": nchans,
        "n_ints": n_ints,
        "seed": seed,
        "injected_signal": {
            "type": "drifting_tone",
            "start_channel": 40,
            "drift_channels": -10,
            "snr": 15.0,
        },
    }


def compute_file_sha256(file_path: Path) -> str:
    """Compute SHA-256 digest in buffered chunks."""
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


class DemoService:
    """Manages available demo presets and their deterministic ingestion into AETHON."""

    def __init__(self, settings: Settings, repository: ObservationRepository) -> None:
        self.settings = settings
        self.repository = repository
        self.temp_dir = Path(settings.temp_upload_dir).resolve()
        self.temp_dir.mkdir(parents=True, exist_ok=True)
        self.adapter = FilterbankAdapter()

    def list_samples(self) -> list[DemoSampleInfo]:
        """Return catalog of available guaranteed demo datasets."""
        synthetic_info = DemoSampleInfo(
            id=SYNTHETIC_SAMPLE_ID,
            name="AETHON Signal Lab — Synthetic Drifting Beacon",
            label="SYNTHETIC DEMO",
            format=".fil",
            target="SYNTH-BEACON-01",
            telescope="Green Bank Telescope (GBT)",
            description=(
                "Controlled synthetic filterbank data containing Gaussian noise and an injected "
                "drifting narrowband beacon (seed 42, SNR=15.0). Designed for guaranteed offline "
                "end-to-end testing of signal representation, anomaly detection, and Doppler drift."
            ),
            is_synthetic=True,
            seed=42,
            file_size_bytes=8382,
            channel_count=64,
            time_sample_count=32,
            frequency_mhz=1420.0,
            bandwidth_mhz=3.2,
            source_url=None,
            provenance_note=(
                "Controlled synthetic data generated locally by AETHON Signal Lab for "
                "demonstrating the scientific pipeline. Not evidence of a real astronomical signal."
            ),
        )

        real_gbt_info = DemoSampleInfo(
            id=REAL_GBT_SAMPLE_ID,
            name="Green Bank Telescope — HIP 35136",
            label="REAL GBT DATA",
            format=".fil",
            target="HIP35136",
            telescope="Green Bank Telescope (GBT)",
            description=(
                "Authentic Breakthrough Listen primary observation from Green Bank Telescope (GBT) "
                "pointing at HIP 35136 (L-band, 1.34 GHz). Compact validated filterbank sample."
            ),
            is_synthetic=False,
            seed=None,
            file_size_bytes=9342,
            channel_count=70,
            time_sample_count=32,
            frequency_mhz=1340.2,
            bandwidth_mhz=0.2003,
            source_url="https://github.com/UCBerkeleySETI/breakthrough",
            provenance_note=(
                "Authentic observation from Breakthrough Listen / UC Berkeley SETI Research Center "
                "(GBT filterbank tutorial, commit 9fbb457da1c1404495927c2527542b25d788a616)."
            ),
        )

        return [synthetic_info, real_gbt_info]

    def load_sample(self, sample_id: str) -> DemoLoadResponse:
        """Deterministically generate or retrieve demo sample and ingest into repository.

        Uses the production FilterbankAdapter and repository persistence.
        Guarantees SHA-256 deduplication and offline execution.
        """
        start_time = time.monotonic()
        clean_id = sample_id.strip()

        if clean_id not in SUPPORTED_DEMO_PRESETS:
            raise ValueError(
                f"Invalid demo sample ID '{clean_id}'. "
                f"Supported presets: {', '.join(SUPPORTED_DEMO_PRESETS)}"
            )

        temp_fil_path = self.temp_dir / f"demo_staging_{uuid.uuid4().hex}.fil"

        try:
            if clean_id == SYNTHETIC_SAMPLE_ID:
                is_synthetic = True
                provenance_notes = (
                    "AETHON Signal Lab — Synthetic Drifting Beacon (seed 42, SNR=15.0). "
                    "Controlled demonstration data for pipeline screening."
                )
                generate_demo_filterbank_fixture(temp_fil_path, seed=42)
                original_filename = "synthetic_drifting_beacon.fil"
            else:
                is_synthetic = False
                provenance_notes = (
                    "Breakthrough Listen real observation: HIP 35136 (Green Bank Telescope, "
                    "L-band). Data courtesy of UC Berkeley SETI Research Center."
                )
                original_filename = "blc04_guppi_57563_69862_HIP35136_0011_cropped.fil"

                if not REAL_GBT_FIXTURE_PATH.exists():
                    raise FileNotFoundError(
                        f"Bundled real astronomy fixture not found at {REAL_GBT_FIXTURE_PATH}"
                    )
                # Copy fixture bytes into temp staging file
                with open(REAL_GBT_FIXTURE_PATH, "rb") as f_src, open(temp_fil_path, "wb") as f_dst:
                    while chunk := f_src.read(65536):
                        f_dst.write(chunk)

            file_size = temp_fil_path.stat().st_size
            sha256_digest = compute_file_sha256(temp_fil_path)

            # Deduplication check
            existing = self.repository.get_observation_by_sha256(sha256_digest)
            if existing is not None:
                duration = time.monotonic() - start_time
                logger.info(
                    "Demo sample '%s' already persisted as %s (reusing existing)",
                    clean_id,
                    existing.id,
                )
                return DemoLoadResponse(
                    sample_id=clean_id,
                    observation=existing,
                    is_duplicate=True,
                    is_synthetic=is_synthetic,
                    duration_seconds=round(duration, 3),
                    message=(
                        f"Demo observation already exists in repository ({existing.id}); "
                        "safely reused existing record."
                    ),
                )

            # Parse via production FilterbankAdapter
            parsed = self.adapter.parse(temp_fil_path)

            obs_id = str(uuid.uuid4())
            now_utc = datetime.now(UTC)

            provenance = parsed.provenance
            provenance.notes = provenance_notes

            internal_record = ObservationRecordInternal(
                id=obs_id,
                original_filename=original_filename,
                format="fil",
                file_size_bytes=file_size,
                sha256=sha256_digest,
                ingested_at=now_utc,
                status="ingested",
                file_rel_path="",
                metadata=parsed.metadata,
                provenance=provenance,
                warnings=parsed.warnings,
            )

            # Save via repository
            obs_response = self.repository.save_observation(internal_record, temp_fil_path)
            duration = time.monotonic() - start_time

            logger.info(
                "Successfully ingested demo sample '%s' as observation %s (%d bytes)",
                clean_id,
                obs_id,
                file_size,
            )

            return DemoLoadResponse(
                sample_id=clean_id,
                observation=obs_response,
                is_duplicate=False,
                is_synthetic=is_synthetic,
                duration_seconds=round(duration, 3),
                message=f"Successfully loaded and ingested {clean_id} into AETHON repository.",
            )

        finally:
            if temp_fil_path.exists():
                try:
                    temp_fil_path.unlink()
                except Exception:
                    pass
