#!/usr/bin/env python3
"""AETHON Safe Development-Data Seeder.

Generates a format-valid, clearly labeled synthetic SIGPROC filterbank (.fil)
observation and ingests it into an isolated or local development AETHON database.

Features:
- Deterministic synthetic signal generation with background noise and drifting beacon.
- Uses production application interfaces (Settings, ObservationRepository, CandidateRepository, IngestionService).
- Strict safety guards: refuses to overwrite an existing database or non-empty observations directory.
- Detailed provenance manifest written alongside ingested observations.
- 100% offline; requires no HTTP server or external network access.
"""

from __future__ import annotations

import argparse
import asyncio
import hashlib
import json
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

# Resolve repository paths regardless of invocation CWD
_SCRIPT_DIR = Path(__file__).resolve().parent
_REPO_ROOT = _SCRIPT_DIR.parent if _SCRIPT_DIR.name == "scripts" else _SCRIPT_DIR
_BACKEND_DIR = _REPO_ROOT / "backend"

if str(_BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(_BACKEND_DIR))

# Dependency availability check
try:
    import numpy as np
    from app.candidates.repository import CandidateRepository
    from app.core.config import Settings
    from app.ingestion.adapters.filterbank import FilterbankAdapter
    from app.ingestion.service import IngestionService
    from app.storage.repository import ObservationRepository
    from blimpy import Waterfall
    from starlette.datastructures import UploadFile
except ImportError as err:
    print(
        f"ERROR: Missing required backend dependency: {err}\n"
        f"Please run this script using the AETHON backend virtual environment, for example:\n"
        f"  backend\\.venv\\Scripts\\python.exe scripts/seed_dev_data.py\n"
        f"or:\n"
        f"  source backend/.venv/bin/activate && python scripts/seed_dev_data.py",
        file=sys.stderr,
    )
    sys.exit(1)


DEFAULT_SEED = 42
DEFAULT_SOURCE_NAME = "AETHON-SYNTHETIC-DEV"
DEFAULT_FILENAME = "synthetic_dev_beacon.fil"


def compute_file_sha256(path: Path) -> str:
    """Calculate the SHA-256 hex digest of a file in streaming chunks."""
    hasher = hashlib.sha256()
    with open(path, "rb") as f:
        while chunk := f.read(65536):
            hasher.update(chunk)
    return hasher.hexdigest()


def generate_synthetic_filterbank(
    output_path: Path,
    seed: int = DEFAULT_SEED,
) -> dict[str, Any]:
    """Generate a format-valid SIGPROC filterbank file with a drifting tone beacon."""
    rng = np.random.default_rng(seed)

    n_ints = 32  # 32 time integration samples
    nchans = 64  # 64 frequency channels
    fch1 = 1420.0  # MHz (top channel center frequency)
    foff = -0.05  # MHz per channel (descending channel order)
    tsamp = 0.5  # seconds per integration (total 16.0 s)
    tstart = 59000.0  # MJD reference epoch

    # Standard normal Gaussian background noise: shape (n_ints, 1, nchans)
    data = rng.standard_normal(size=(n_ints, 1, nchans)).astype(np.float32)

    # Inject a known drifting tone beacon:
    # Starts at raw channel 40 and drifts by -10 channels across 32 time steps
    # Peak injected SNR = 15.0
    start_channel = 40
    drift_channels = -10
    peak_snr = 15.0

    for t_idx in range(n_ints):
        f_idx = round(start_channel + (t_idx / n_ints) * drift_channels)
        if 0 <= f_idx < nchans:
            data[t_idx, 0, f_idx] += peak_snr

    header: dict[str, Any] = {
        "fch1": fch1,
        "foff": foff,
        "nchans": nchans,
        "tsamp": tsamp,
        "nbits": 32,
        "nifs": 1,
        "tstart": tstart,
        "source_name": DEFAULT_SOURCE_NAME,
        "telescope_id": 0,  # Canonical SIGPROC ID 0: "Fake / Simulated Data"
    }

    output_path.parent.mkdir(parents=True, exist_ok=True)
    wf = Waterfall(header_dict=header, data_array=data)
    wf.write_to_fil(str(output_path))

    # Analytical drift rate:
    # frequency shift = drift_channels * foff = -10 * -0.05 MHz = +0.50 MHz = 500,000 Hz
    # duration = n_ints * tsamp = 32 * 0.5 s = 16.0 s
    # drift rate = 500,000 Hz / 16.0 s = +31,250.0 Hz/s in RF space
    drift_delta_mhz = drift_channels * foff
    duration_seconds = n_ints * tsamp
    drift_rate_hz_s = (drift_delta_mhz * 1e6) / duration_seconds

    return {
        "seed": seed,
        "source_name": DEFAULT_SOURCE_NAME,
        "telescope_id": 0,
        "telescope_desc": "Fake / Simulated Data (SIGPROC ID 0)",
        "n_ints": n_ints,
        "nchans": nchans,
        "fch1_mhz": fch1,
        "foff_mhz": foff,
        "bandwidth_mhz": abs(nchans * foff),
        "tsamp_seconds": tsamp,
        "duration_seconds": duration_seconds,
        "tstart_mjd": tstart,
        "injected_signal": {
            "type": "drifting_tone",
            "start_channel": start_channel,
            "drift_channels": drift_channels,
            "drift_rate_hz_s": drift_rate_hz_s,
            "peak_snr": peak_snr,
        },
    }


def seed_development_data(
    data_dir: Path,
    seed: int = DEFAULT_SEED,
) -> dict[str, Any]:
    """Execute safe seeding of development data under the specified data directory."""
    resolved_data_dir = data_dir.resolve()
    db_path = resolved_data_dir / "aethon.db"
    obs_dir = resolved_data_dir / "observations"
    tmp_dir = resolved_data_dir / "tmp"

    print("=====================================================================")
    print("              AETHON — Safe Development-Data Seeder                  ")
    print("=====================================================================")
    print(f"Timestamp:       {datetime.now(UTC).isoformat()}")
    print(f"Target Data Dir: {resolved_data_dir}")
    print(f"Target Database: {db_path}")
    print(f"Observations:    {obs_dir}")
    print(f"Random Seed:     {seed}")
    print("---------------------------------------------------------------------")

    # Safety Guard 1: Refuse to overwrite an existing database
    if db_path.exists():
        raise RuntimeError(
            f"SAFETY ABORT: Target database already exists at:\n"
            f"  {db_path} ({db_path.stat().st_size} bytes)\n"
            f"The seeder refuses to overwrite or alter an existing database.\n"
            f"To seed a clean environment, specify an isolated directory using:\n"
            f"  python scripts/seed_dev_data.py --data-dir <path_to_clean_directory>"
        )

    # Safety Guard 2: Refuse to overwrite non-empty observations directory
    if obs_dir.exists():
        existing_files = [p for p in obs_dir.iterdir() if p.is_file()]
        if existing_files:
            raise RuntimeError(
                f"SAFETY ABORT: Target observations directory already contains {len(existing_files)} file(s) at:\n"
                f"  {obs_dir}\n"
                f"The seeder refuses to overwrite or inject into a non-empty observations directory.\n"
                f"To seed a clean environment, specify an isolated directory using:\n"
                f"  python scripts/seed_dev_data.py --data-dir <path_to_clean_directory>"
            )

    # Initialize destination directories
    resolved_data_dir.mkdir(parents=True, exist_ok=True)
    obs_dir.mkdir(parents=True, exist_ok=True)
    tmp_dir.mkdir(parents=True, exist_ok=True)

    created_artifacts: list[Path] = []
    staged_file = tmp_dir / f"stage_{DEFAULT_FILENAME}"

    try:
        # Step 1: Generate format-valid synthetic filterbank observation in staging
        print(
            "\n[Step 1/4] Generating format-valid synthetic filterbank observation..."
        )
        gen_meta = generate_synthetic_filterbank(staged_file, seed=seed)
        created_artifacts.append(staged_file)
        staged_size = staged_file.stat().st_size
        print(f"  Staged:     {staged_file.name} ({staged_size} bytes)")
        print(f"  Source:     {gen_meta['source_name']}")
        print(f"  Telescope:  {gen_meta['telescope_desc']}")
        print(
            f"  Dimensions: {gen_meta['n_ints']} integrations x {gen_meta['nchans']} channels "
            f"({gen_meta['bandwidth_mhz']:.2f} MHz)"
        )
        print(
            f"  Signal:     Drifting tone (SNR={gen_meta['injected_signal']['peak_snr']}, "
            f"drift={gen_meta['injected_signal']['drift_rate_hz_s']:.1f} Hz/s)"
        )

        # Step 2: Ingest via production application services
        print(
            "\n[Step 2/4] Ingesting observation via production application services..."
        )
        settings = Settings(
            environment="development",
            debug=True,
            data_dir=str(resolved_data_dir),
            observations_dir=str(obs_dir),
            temp_upload_dir=str(tmp_dir),
            db_path=str(db_path),
        )

        # Initialize SQLite repositories
        obs_repo = ObservationRepository(
            db_path=Path(settings.db_path),
            observations_dir=Path(settings.observations_dir),
        )
        # Initialize candidate repository schema idempotently without adding candidates
        CandidateRepository(db_path=Path(settings.db_path))

        ingestion_service = IngestionService(settings=settings, repository=obs_repo)

        async def _execute_ingestion():
            with open(staged_file, "rb") as f_stream:  # noqa: ASYNC230
                upload = UploadFile(file=f_stream, filename=DEFAULT_FILENAME)
                return await ingestion_service.ingest_file(upload)

        obs_record = asyncio.run(_execute_ingestion())
        persisted_fil_path = obs_dir / f"{obs_record.id}.fil"
        created_artifacts.append(persisted_fil_path)

        print(f"  Observation ID: {obs_record.id}")
        print(f"  Stored File:    {persisted_fil_path.name}")
        print(f"  Stored SHA-256: {obs_record.sha256}")
        print(f"  Database Path:  {db_path.name}")

        # Step 3: Write provenance and fixture manifest
        print("\n[Step 3/4] Writing fixture provenance manifest...")
        manifest_path = obs_dir / "synthetic_fixture_manifest.json"
        manifest_content: dict[str, Any] = {
            "manifest_schema_version": "1.0.0",
            "fixture_classification": "synthetic_development_fixture",
            "generator": "scripts/seed_dev_data.py",
            "seed": seed,
            "generated_at_utc": datetime.now(UTC).isoformat(),
            "disclaimer": (
                "Strictly synthetic numerical development fixture. Generated offline "
                "for software development, UI testing, and API verification. Does not "
                "represent real astronomical radio telescope observations. Not associated "
                "with Voyager, Proxima Centauri, BLC1, Parkes, Green Bank Telescope, or any observatory."
            ),
            "observation": {
                "id": obs_record.id,
                "original_filename": DEFAULT_FILENAME,
                "stored_filename": f"{obs_record.id}.fil",
                "stored_relative_path": str(
                    persisted_fil_path.relative_to(resolved_data_dir)
                ),
                "format": obs_record.format,
                "file_size_bytes": persisted_fil_path.stat().st_size,
                "sha256": obs_record.sha256,
                "source_name": obs_record.metadata.source_name,
                "telescope_name": obs_record.metadata.telescope_name,
                "channel_count": obs_record.metadata.channel_count,
                "time_sample_count": obs_record.metadata.time_sample_count,
                "time_step_seconds": obs_record.metadata.time_step_seconds,
                "frequency_reference_mhz": obs_record.metadata.frequency_reference_mhz,
                "channel_spacing_mhz": obs_record.metadata.channel_spacing_mhz,
                "bandwidth_mhz": obs_record.metadata.bandwidth_mhz,
                "start_mjd": obs_record.metadata.start_mjd,
            },
            "synthetic_parameters": gen_meta,
        }

        with open(manifest_path, "w", encoding="utf-8") as f_manifest:
            json.dump(manifest_content, f_manifest, indent=2)
        created_artifacts.append(manifest_path)
        print(f"  Manifest Path:  {manifest_path.name}")

        # Step 4: Post-ingestion verification
        print("\n[Step 4/4] Verifying database persistence and file integrity...")
        if not db_path.exists():
            raise RuntimeError("Verification failed: Database file was not created.")

        db_record = obs_repo.get_observation(obs_record.id)
        if db_record is None:
            raise RuntimeError("Verification failed: Record not found in database.")

        if not persisted_fil_path.exists():
            raise RuntimeError(
                f"Verification failed: Observation file missing at {persisted_fil_path}."
            )

        actual_sha256 = compute_file_sha256(persisted_fil_path)
        if actual_sha256 != obs_record.sha256 or actual_sha256 != db_record.sha256:
            raise RuntimeError(
                f"Verification failed: Checksum mismatch. "
                f"Actual: {actual_sha256}, Stored: {obs_record.sha256}"
            )

        # Verify readability with filterbank adapter
        adapter = FilterbankAdapter()
        parsed = adapter.parse(persisted_fil_path)
        if parsed.metadata.source_name != DEFAULT_SOURCE_NAME:
            raise RuntimeError(
                f"Verification failed: Parsed source_name '{parsed.metadata.source_name}' "
                f"does not match expected '{DEFAULT_SOURCE_NAME}'."
            )

        print("  Database Record:  Verified (Status: ingested)")
        print("  On-Disk File:     Verified (SHA-256 match)")
        print("  Filterbank Parse: Verified (Valid SIGPROC header)")
        print("  Manifest Record:  Verified")
        print("=====================================================================")
        print("SUCCESS: AETHON development data seeded and verified successfully.")
        print("=====================================================================")

        return {
            "status": "success",
            "observation_id": obs_record.id,
            "data_dir": str(resolved_data_dir),
            "db_path": str(db_path),
            "observation_path": str(persisted_fil_path),
            "manifest_path": str(manifest_path),
            "sha256": actual_sha256,
        }

    except Exception as err:
        print(f"\nERROR: Seeding failed: {err}", file=sys.stderr)
        # Clean up temporary staging file if left behind
        if staged_file.exists():
            try:
                staged_file.unlink()
            except OSError:
                pass
        raise


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Seed local AETHON development database with a safe, verified synthetic observation.",
    )
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=_REPO_ROOT / "data",
        help="Target data directory (default: <repo_root>/data)",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=DEFAULT_SEED,
        help="Deterministic random seed for synthetic array generation (default: 42)",
    )

    args = parser.parse_args()

    try:
        seed_development_data(data_dir=args.data_dir, seed=args.seed)
    except RuntimeError as e:
        print(str(e), file=sys.stderr)
        sys.exit(1)
    except Exception as e:  # noqa: BLE001
        print(f"Unexpected fatal error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
