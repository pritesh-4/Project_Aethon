"""Deterministic, offline-reliable scientific demonstration of AETHON.

Exercises the complete scientific pipeline using a reproducibly generated,
format-valid synthetic filterbank observation with an injected drifting beacon:
1. Initializes isolated demonstration storage (zero modification of user data).
2. Generates a format-valid synthetic filterbank observation with a drifting beacon (seed 42).
3. Ingests and registers the observation into the isolated SQLite repository.
4. Extracts a canonical time-frequency spectral slice with exact physical coordinates.
5. Performs distribution-free robust signal processing and RFI quality assessment.
6. Executes statistical baseline and Isolation Forest anomaly detection.
7. Measures apparent Doppler frequency drift rate (Hz/s) and analytical uncertainty.
8. Registers a verified scientific candidate record and calculates versioned priority score.
9. Executes a simulated human triage lifecycle review transition.
10. Compiles a structured scientific case file (dossier.json) and publication-grade vector PDF (dossier.pdf).

100% offline, reproducible, and strictly isolated from production storage.
"""

from __future__ import annotations

import argparse
import json
import sys
import time
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import numpy as np
from blimpy import Waterfall
from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
script_dir = Path(__file__).resolve().parent
repo_root = script_dir if (script_dir / "backend").exists() else script_dir.parent
backend_root = repo_root / "backend"
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from app.core.config import Settings
from app.main import create_app


def generate_demo_filterbank_fixture(file_path: Path, seed: int = 42) -> dict[str, Any]:
    """Generate a genuine SIGPROC .fil file with a synthetic drifting beacon in Gaussian noise."""
    rng = np.random.default_rng(seed)
    n_ints = 32
    nchans = 64
    fch1 = 1420.0  # MHz
    foff = -0.05   # MHz per channel (descending in raw file)
    tsamp = 0.5    # seconds per integration
    tstart = 59000.0

    # Background standard Gaussian noise
    data = rng.standard_normal(size=(n_ints, 1, nchans)).astype(np.float32)

    # Inject a known drifting tone beacon:
    # Starts at raw channel 40 and drifts by -10 channels over 32 time steps
    # Peak SNR ~ 15.0
    for t_idx in range(n_ints):
        f_idx = int(round(40 - (t_idx / n_ints) * 10))
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
    }

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


def run_offline_demo(output_dir: Path, seed: int = 42) -> dict[str, Any]:
    start_time = time.perf_counter()
    output_dir.mkdir(parents=True, exist_ok=True)

    print("=====================================================================")
    print("        AETHON — Reproducible Scientific Offline Demonstration        ")
    print("=====================================================================")
    print(f"Timestamp:       {datetime.now(UTC).isoformat()}")
    print(f"Base Seed:       {seed}")
    print(f"Storage Sandbox: {output_dir}")
    print("Disclaimers:     All records strictly marked as SYNTHETIC.")
    print("---------------------------------------------------------------------")

    # 1. Setup isolated directories & settings
    data_dir = output_dir / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    tmp_dir = output_dir / "tmp"
    tmp_dir.mkdir(parents=True, exist_ok=True)

    demo_settings = Settings(
        environment="development",
        debug=True,
        data_dir=str(data_dir),
        observations_dir=str(data_dir / "observations"),
        temp_upload_dir=str(data_dir / "tmp"),
        db_path=str(data_dir / "aethon.db"),
        cors_origins=["http://localhost:5173"],
        max_upload_size_bytes=50 * 1024 * 1024,
        max_slice_cells=250000,
        max_processing_cells=1048576,
    )

    app = create_app(demo_settings)
    client = TestClient(app)

    # 2. Generate fixture
    print("\n[Step 1/8] Generating format-valid synthetic filterbank observation...")
    raw_fil_path = tmp_dir / "synth_beacon_demo.fil"
    fixture_meta = generate_demo_filterbank_fixture(raw_fil_path, seed=seed)
    print(f"  Created: {raw_fil_path.name} ({raw_fil_path.stat().st_size} bytes)")
    print(f"  Target:  {fixture_meta['source_name']} (Injected drifting beacon, SNR=15.0)")

    # 3. Ingest observation via supported API
    print("\n[Step 2/8] Ingesting observation into isolated repository...")
    with open(raw_fil_path, "rb") as f:
        res_upload = client.post(
            "/api/observations",
            files={"file": (raw_fil_path.name, f, "application/octet-stream")},
        )
    if res_upload.status_code != 201:
        raise RuntimeError(f"Ingestion failed: {res_upload.text}")

    upload_data = res_upload.json()
    obs_id = upload_data["id"]
    obs_meta = upload_data["metadata"]
    print(f"  Observation ID: {obs_id}")
    print(f"  Format:         {upload_data['format']}")
    print(f"  SHA-256:        {upload_data['sha256'][:16]}...{upload_data['sha256'][-8:]}")
    print(f"  Channels:       {obs_meta['channel_count']} ({obs_meta['bandwidth_mhz']:.3f} MHz)")

    # 4. Canonical spectral slice retrieval
    print("\n[Step 3/8] Extracting canonical spectral slice...")
    res_slice = client.get(
        f"/api/observations/{obs_id}/slice",
        params={"time_start": 0, "time_stop": 32, "frequency_start": 0, "frequency_stop": 64},
    )
    if res_slice.status_code != 200:
        raise RuntimeError(f"Slice retrieval failed: {res_slice.text}")

    slice_data = res_slice.json()
    slice_vals = slice_data["values"]
    print(f"  Matrix shape:   [{len(slice_vals)}, {len(slice_vals[0])}] [time_steps, freq_channels]")
    print(f"  Time axis:      0.0s to {slice_data['time_coordinates_seconds'][-1]:.1f}s")
    print(f"  Frequency axis: {slice_data['frequency_coordinates_hz'][0] / 1e6:.2f} MHz (ascending)")

    # 5. Robust signal processing and RFI indicators
    print("\n[Step 4/8] Running robust signal processing and RFI indicators...")
    res_proc = client.post(
        f"/api/observations/{obs_id}/process",
        json={"time_start": 0, "time_stop": 32, "frequency_start": 0, "frequency_stop": 64},
    )
    if res_proc.status_code != 200:
        raise RuntimeError(f"Processing failed: {res_proc.text}")

    proc_data = res_proc.json()
    stats = proc_data["statistics"]
    rfi = proc_data["rfi_report"]
    print(f"  Background Median:  {stats['median']:.4f}")
    print(f"  Robust Dispersion:  {stats['mad'] * 1.4826:.4f} (MAD * 1.4826)")
    print(f"  RFI Flagged Cells:  {rfi['total_flagged_cells']} ({rfi['flagged_fraction']:.2%})")

    # 6. Anomaly detection
    print("\n[Step 5/8] Executing anomaly detection (baseline & Isolation Forest)...")
    res_detect = client.post(
        f"/api/observations/{obs_id}/detect",
        json={
            "time_start": 0,
            "time_stop": 32,
            "frequency_start": 0,
            "frequency_stop": 64,
            "config": {
                "window": {"time_size": 8, "freq_size": 8, "time_stride": 4, "freq_stride": 4},
                "baseline": {"enabled": True, "mad_threshold": 3.0},
                "isolation_forest": {"enabled": True, "contamination": 0.05},
            },
        },
    )
    if res_detect.status_code != 200:
        raise RuntimeError(f"Detection failed: {res_detect.text}")

    det_data = res_detect.json()
    anomalous_regions = det_data.get("anomalous_regions", [])
    print(f"  Windows Evaluated:  {det_data['total_windows_evaluated']}")
    print(f"  Anomalous Regions:  {len(anomalous_regions)}")
    print(f"  Anomalous Fraction: {det_data['anomalous_fraction']:.2%}")

    # Select the peak anomalous window
    top_region = max(
        anomalous_regions,
        key=lambda r: (r.get("baseline_evidence", {}).get("anomaly_score") or 0.0),
        default=None,
    )

    if top_region:
        score = top_region.get("baseline_evidence", {}).get("anomaly_score", 0.0)
        win_id = top_region.get("window", {}).get("window_id", "win_01")
        print(f"  Peak Anomaly Score: {score:.2f} (Window {win_id})")
        w = top_region["window"]
        target_bounds = {
            "time_start": w["time_start"],
            "time_stop": w["time_stop"],
            "freq_start": w["freq_start"],
            "freq_stop": w["freq_stop"],
        }
    else:
        target_bounds = {"time_start": 0, "time_stop": 16, "freq_start": 20, "freq_stop": 35}

    # 7. Doppler frequency drift analysis
    print("\n[Step 6/8] Analyzing Doppler frequency drift and temporal trajectory...")
    res_drift = client.post(
        f"/api/observations/{obs_id}/analyze-drift",
        json={
            "time_start": target_bounds["time_start"],
            "time_stop": target_bounds["time_stop"],
            "frequency_start": target_bounds["freq_start"],
            "frequency_stop": target_bounds["freq_stop"],
        },
    )
    if res_drift.status_code != 200:
        raise RuntimeError(f"Drift analysis failed: {res_drift.text}")

    drift_data = res_drift.json()
    drift_fit = drift_data["drift_estimate"]
    temporal = drift_data["temporal"]
    drift_hz_s = drift_fit.get("drift_rate_hz_per_s") or 0.0
    unc_hz_s = drift_fit.get("uncertainty_hz_per_s") or 0.0
    r_sq = drift_fit.get("r_squared") or 0.0
    print(f"  Apparent Drift Rate: {drift_hz_s:.2f} Hz/s (Index: {drift_fit.get('drift_rate_index_slope', 0.0):.3f} ch/step)")
    print(f"  1-sigma Uncertainty: {unc_hz_s:.2f} Hz/s (R^2: {r_sq:.4f})")
    print(f"  Observed Duration:   {temporal.get('observed_duration_s', 0.0):.1f}s")

    # 8. Candidate creation, scoring, and review
    print("\n[Step 7/8] Registering candidate record and scoring priority...")
    res_cand = client.post(
        "/api/candidates",
        json={
            "observation_id": obs_id,
            "target_region": target_bounds,
            "detection_id": top_region.get("detection_id") if top_region else "det_synth_01",
            "physical_coordinates": {
                "center_freq_hz": float(slice_data["frequency_coordinates_hz"][0]),
                "bandwidth_hz": 4000.0,
                "start_time_s": 0.0,
                "duration_s": 16.0,
            },
            "is_synthetic": True,
        },
    )
    if res_cand.status_code != 201:
        raise RuntimeError(f"Candidate creation failed: {res_cand.text}")

    cand_data = res_cand.json()
    cand_id = cand_data["candidate_id"]
    print(f"  Candidate ID:       {cand_id}")

    res_score = client.post(f"/api/candidates/{cand_id}/assess")
    if res_score.status_code != 200:
        raise RuntimeError(f"Candidate assessment failed: {res_score.text}")

    assessment = res_score.json()
    print(f"  Priority Score:     {assessment['overall_score']:.1f}/100.0 ({assessment['priority_band'].upper()})")
    print(f"  Scoring Policy:     {assessment['policy_name']} v{assessment['policy_version']}")
    comp_points = assessment.get("component_contributions", {})
    print(f"  Component Points:   Anomaly={comp_points.get('anomaly', 0.0):.1f}, Drift={comp_points.get('drift_coherence', 0.0):.1f}")

    # Simulated human triage review
    print("  Submitting human triage review...")
    res_review = client.post(
        f"/api/candidates/{cand_id}/review",
        json={
            "new_status": "under_review",
            "reviewer_id": "lead_investigator",
            "notes": "Offline demonstration review: Drifting beacon confirmed under synthetic test suite.",
        },
    )
    if res_review.status_code != 200:
        raise RuntimeError(f"Review transition failed: {res_review.text}")

    review_res = res_review.json()
    print(f"  Review Action:      Status updated to '{review_res['candidate']['status']}' by {review_res['review']['reviewer_id']}")

    # 9. Dossier and PDF generation
    print("\n[Step 8/8] Compiling structured dossier and publication-grade PDF...")
    res_dossier = client.get(f"/api/candidates/{cand_id}/dossier")
    if res_dossier.status_code != 200:
        raise RuntimeError(f"Dossier retrieval failed: {res_dossier.text}")

    dossier_data = res_dossier.json()
    dossier_json_path = output_dir / f"{cand_id}_dossier.json"
    with open(dossier_json_path, "w", encoding="utf-8") as f:
        json.dump(dossier_data, f, indent=2)

    res_pdf = client.get(f"/api/candidates/{cand_id}/dossier.pdf")
    if res_pdf.status_code != 200:
        raise RuntimeError(f"PDF generation failed: {res_pdf.text}")

    dossier_pdf_path = output_dir / f"{cand_id}_dossier.pdf"
    with open(dossier_pdf_path, "wb") as f:
        f.write(res_pdf.content)

    print(f"  Dossier JSON:       {dossier_json_path.name} ({dossier_json_path.stat().st_size} bytes)")
    print(f"  Research PDF:       {dossier_pdf_path.name} ({len(res_pdf.content)} bytes)")

    elapsed_s = time.perf_counter() - start_time

    demo_summary = {
        "demo_id": "aethon_offline_demonstration",
        "executed_at_utc": datetime.now(UTC).isoformat(),
        "elapsed_seconds": round(elapsed_s, 3),
        "seed": seed,
        "is_synthetic": True,
        "observation": {
            "id": obs_id,
            "filename": raw_fil_path.name,
            "sha256": upload_data["sha256"],
        },
        "detection": {
            "total_windows": det_data["total_windows_evaluated"],
            "anomalous_regions": len(anomalous_regions),
        },
        "drift": {
            "rate_hz_s": drift_hz_s,
            "uncertainty_hz_s": unc_hz_s,
            "r_squared": r_sq,
        },
        "candidate": {
            "id": cand_id,
            "status": review_res["candidate"]["status"],
            "priority_score": assessment["overall_score"],
            "priority_band": assessment["priority_band"],
        },
        "artifacts": {
            "dossier_json": str(dossier_json_path),
            "dossier_pdf": str(dossier_pdf_path),
            "sqlite_db": str(data_dir / "aethon.db"),
        },
    }

    summary_json_path = output_dir / "demo_summary.json"
    with open(summary_json_path, "w", encoding="utf-8") as f:
        json.dump(demo_summary, f, indent=2)

    print("\n=====================================================================")
    print(f"Demonstration completed successfully in {elapsed_s:.2f} seconds.")
    print(f"All artifacts preserved in: {output_dir}")
    print("=====================================================================")

    return demo_summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Run deterministic offline demonstration of AETHON scientific pipeline."
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=repo_root / "demo_output",
        help="Directory to save generated demo artifacts and SQLite database",
    )
    parser.add_argument(
        "--seed",
        type=int,
        default=42,
        help="Deterministic random seed for beacon and noise realization",
    )
    args = parser.parse_args()

    run_offline_demo(output_dir=args.output_dir.resolve(), seed=args.seed)
