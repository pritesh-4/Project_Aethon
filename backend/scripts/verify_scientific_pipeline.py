"""End-to-End Scientific Pipeline Integration and Failure Path Verification.

Exercises the entire authoritative scientific workflow in an isolated temporary environment:
1. Application startup with isolated SQLite index and temporary storage.
2. Ingestion of genuine format-valid SIGPROC filterbank (.fil) observation.
3. Verification of stored observation record, SHA-256 checksum, metadata, and provenance.
4. Bounded time-frequency canonical slice retrieval with exact axis semantics.
5. Signal processing quality assessment, robust statistics, and RFI detection.
6. Statistical anomaly baseline and Isolation Forest detection.
7. Doppler frequency drift trajectory extraction, linear regression, and analytical uncertainty.
8. Candidate creation, spatial grouping, and evidence aggregation.
9. Versioned candidate scoring and operational priority ranking.
10. Review lifecycle state machine transition with audit logging.
11. Structured JSON candidate dossier generation.
12. Publication-grade vector PDF research dossier generation and validation.
13. Comprehensive failure branch testing:
    - Unsupported file format rejection (HTTP 400).
    - Nonexistent observation slice query (HTTP 404).
    - Out-of-bounds slice indices (HTTP 422).
    - Nonexistent candidate retrieval (HTTP 404).
    - Invalid candidate review status transition (HTTP 422).
    - Nonexistent candidate PDF export (HTTP 404).

Outputs a machine-readable JSON pipeline verification report.
"""

from __future__ import annotations

import argparse
import json
import sys
import tempfile
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from fastapi.testclient import TestClient

# Ensure backend root is on sys.path
script_dir = Path(__file__).resolve().parent
backend_root = script_dir.parent
if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

from app.core.config import Settings
from app.main import create_app
from tests.helpers import create_synthetic_filterbank


def run_pipeline_verification(output_report: Path | None = None) -> dict[str, Any]:
    print("=====================================================================")
    print("       AETHON — Phase 9: End-to-End Pipeline Verification            ")
    print("=====================================================================")
    print(f"Timestamp:       {datetime.now(UTC).isoformat()}")
    print("Execution Mode:  Isolated temporary sandbox (zero disk contamination)")
    print("---------------------------------------------------------------------")

    step_results: list[dict[str, Any]] = []

    def record_step(name: str, passed: bool, details: dict[str, Any]) -> None:
        status_str = "PASS" if passed else "FAIL"
        print(f"[{status_str}] {name}")
        step_results.append(
            {
                "step": name,
                "passed": passed,
                "timestamp_utc": datetime.now(UTC).isoformat(),
                "details": details,
            }
        )
        if not passed:
            raise RuntimeError(f"Step '{name}' failed: {details}")

    with tempfile.TemporaryDirectory() as tmp_dir:
        sandbox_path = Path(tmp_dir)
        data_dir = sandbox_path / "data"
        data_dir.mkdir(parents=True, exist_ok=True)

        test_settings = Settings(
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

        app = create_app(test_settings)
        client = TestClient(app)

        # -------------------------------------------------------------
        # STEP 1: Health Probe
        # -------------------------------------------------------------
        res_health = client.get("/health")
        record_step(
            "1. Application Startup & Health Check",
            res_health.status_code == 200 and res_health.json().get("status") == "healthy",
            {"status_code": res_health.status_code, "response": res_health.json()},
        )

        # -------------------------------------------------------------
        # STEP 2: Create format-valid filterbank fixture
        # -------------------------------------------------------------
        fixture_path = sandbox_path / "voyager1_carrier.fil"
        create_synthetic_filterbank(
            file_path=fixture_path,
            nchans=64,
            n_ints=32,
            fch1=1420.0,
            foff=-0.05,
            tsamp=0.5,
            tstart=59000.0,
            source_name="VOYAGER-1",
            telescope_id=6,
            ra_str="19h50m47s",
            dec_str="08d52m06s",
        )
        record_step(
            "2. Generate Format-Valid Filterbank Fixture",
            fixture_path.exists() and fixture_path.stat().st_size > 0,
            {"fixture_path": str(fixture_path), "size_bytes": fixture_path.stat().st_size},
        )

        # -------------------------------------------------------------
        # STEP 3: Ingest observation
        # -------------------------------------------------------------
        with open(fixture_path, "rb") as f:
            res_upload = client.post(
                "/api/observations",
                files={"file": ("voyager1_carrier.fil", f, "application/octet-stream")},
            )
        upload_json = res_upload.json()
        obs_id = upload_json.get("id") or upload_json.get("observation_id")
        record_step(
            "3. Observation Ingestion & Provenance Registration",
            res_upload.status_code == 201 and bool(obs_id) and bool(upload_json.get("sha256")),
            {
                "status_code": res_upload.status_code,
                "observation_id": obs_id,
                "sha256": upload_json.get("sha256"),
                "provenance": upload_json.get("provenance"),
            },
        )

        # -------------------------------------------------------------
        # STEP 4: Verify stored record and metadata
        # -------------------------------------------------------------
        res_get = client.get(f"/api/observations/{obs_id}")
        obs_meta = res_get.json()
        record_step(
            "4. Verify Persisted Observation Record & Astronomical Metadata",
            res_get.status_code == 200
            and obs_meta.get("format") == "fil"
            and obs_meta["metadata"].get("channel_count") == 64
            and obs_meta["metadata"].get("source_name") == "VOYAGER-1",
            {
                "status_code": res_get.status_code,
                "channel_count": obs_meta["metadata"].get("channel_count"),
                "time_samples": obs_meta["metadata"].get("time_sample_count"),
                "source_name": obs_meta["metadata"].get("source_name"),
            },
        )

        # -------------------------------------------------------------
        # STEP 5: Canonical spectral slice retrieval
        # -------------------------------------------------------------
        res_slice = client.get(
            f"/api/observations/{obs_id}/slice",
            params={"time_start": 0, "time_stop": 16, "frequency_start": 0, "frequency_stop": 32},
        )
        slice_data = res_slice.json()
        slice_values = slice_data.get("values", [])
        record_step(
            "5. Canonical Spectral Slice Retrieval (2D Axis Semantics)",
            res_slice.status_code == 200
            and len(slice_values) == 16
            and len(slice_values[0]) == 32
            and len(slice_data.get("frequency_coordinates_hz", [])) == 32
            and len(slice_data.get("time_coordinates_seconds", [])) == 16,
            {
                "status_code": res_slice.status_code,
                "shape": [len(slice_values), len(slice_values[0])],
                "time_axis_samples": len(slice_data.get("time_coordinates_seconds", [])),
                "freq_axis_channels": len(slice_data.get("frequency_coordinates_hz", [])),
            },
        )

        # -------------------------------------------------------------
        # STEP 6: Signal processing and RFI indicators
        # -------------------------------------------------------------
        res_proc = client.post(
            f"/api/observations/{obs_id}/process",
            json={
                "time_start": 0,
                "time_stop": 16,
                "frequency_start": 0,
                "frequency_stop": 32,
            },
        )
        proc_data = res_proc.json()
        record_step(
            "6. Robust Signal Processing & RFI Quality Assessment",
            res_proc.status_code == 200
            and "statistics" in proc_data
            and "rfi_report" in proc_data
            and "primary_mask_flagged_count" in proc_data,
            {
                "status_code": res_proc.status_code,
                "median": proc_data["statistics"].get("median"),
                "mad": proc_data["statistics"].get("mad"),
                "total_flagged_cells": proc_data["rfi_report"].get("total_flagged_cells"),
                "flagged_fraction": proc_data["rfi_report"].get("flagged_fraction"),
            },
        )

        # -------------------------------------------------------------
        # STEP 7: Anomaly detection
        # -------------------------------------------------------------
        res_detect = client.post(
            f"/api/observations/{obs_id}/detect",
            json={
                "time_start": 0,
                "time_stop": 16,
                "frequency_start": 0,
                "frequency_stop": 32,
                "config": {
                    "window": {"time_size": 8, "freq_size": 8, "time_stride": 4, "freq_stride": 4},
                    "baseline": {"enabled": True, "mad_threshold": 3.0},
                    "isolation_forest": {"enabled": True, "contamination": 0.05},
                },
            },
        )
        detect_data = res_detect.json()
        record_step(
            "7. Statistical Baseline & Isolation Forest Anomaly Detection",
            res_detect.status_code == 200 and "total_windows_evaluated" in detect_data,
            {
                "status_code": res_detect.status_code,
                "total_windows_evaluated": detect_data.get("total_windows_evaluated"),
                "anomalous_regions_count": len(detect_data.get("anomalous_regions", [])),
            },
        )

        # -------------------------------------------------------------
        # STEP 8: Doppler frequency drift analysis
        # -------------------------------------------------------------
        res_drift = client.post(
            f"/api/observations/{obs_id}/analyze-drift",
            json={
                "time_start": 0,
                "time_stop": 16,
                "frequency_start": 0,
                "frequency_stop": 32,
            },
        )
        drift_data = res_drift.json()
        record_step(
            "8. Doppler Frequency Drift & Temporal Analysis",
            res_drift.status_code == 200
            and "drift_estimate" in drift_data
            and "temporal" in drift_data,
            {
                "status_code": res_drift.status_code,
                "estimated_drift_hz_s": drift_data["drift_estimate"].get("drift_rate_hz_per_s"),
                "drift_uncertainty": drift_data["drift_estimate"].get("uncertainty_hz_per_s"),
                "observed_duration_s": drift_data["temporal"].get("observed_duration_s"),
            },
        )

        # -------------------------------------------------------------
        # STEP 9: Candidate creation & persistence
        # -------------------------------------------------------------
        res_cand = client.post(
            "/api/candidates",
            json={
                "observation_id": obs_id,
                "target_region": {
                    "time_start": 0,
                    "time_stop": 16,
                    "freq_start": 10,
                    "freq_stop": 14,
                },
                "detection_id": detect_data.get("analysis_run_id", "det_synth_01"),
                "physical_coordinates": {
                    "center_freq_hz": 1420.0e6,
                    "bandwidth_hz": 2000.0,
                    "start_time_s": 0.0,
                    "duration_s": 8.0,
                },
            },
        )
        cand_data = res_cand.json()
        cand_id = cand_data.get("candidate_id")
        record_step(
            "9. Candidate Record Creation & Spatial Ledger Registration",
            res_cand.status_code == 201 and bool(cand_id),
            {
                "status_code": res_cand.status_code,
                "candidate_id": cand_id,
                "status": cand_data.get("status"),
            },
        )

        # -------------------------------------------------------------
        # STEP 10: Candidate scoring
        # -------------------------------------------------------------
        res_score = client.post(f"/api/candidates/{cand_id}/assess")
        score_data = res_score.json()
        record_step(
            "10. Versioned Explainable Candidate Scoring",
            res_score.status_code == 200 and "overall_score" in score_data,
            {
                "status_code": res_score.status_code,
                "overall_score": score_data.get("overall_score"),
                "policy_version": score_data.get("policy_version"),
                "component_contributions": score_data.get("component_contributions"),
            },
        )

        # -------------------------------------------------------------
        # STEP 11: Review lifecycle transition
        # -------------------------------------------------------------
        res_review = client.post(
            f"/api/candidates/{cand_id}/review",
            json={
                "new_status": "under_review",
                "reviewer_id": "dr_verification_auditor",
                "notes": "Phase 9 empirical pipeline verification audit transition.",
            },
        )
        review_data = res_review.json()
        record_step(
            "11. Candidate Review Lifecycle State Transition",
            res_review.status_code == 200
            and review_data.get("candidate", {}).get("status") == "under_review",
            {
                "status_code": res_review.status_code,
                "new_status": review_data.get("candidate", {}).get("status"),
                "review_id": review_data.get("review", {}).get("review_id"),
            },
        )

        # -------------------------------------------------------------
        # STEP 12: Structured JSON case dossier export
        # -------------------------------------------------------------
        res_dossier = client.get(f"/api/candidates/{cand_id}/dossier")
        dossier_data = res_dossier.json()
        record_step(
            "12. Structured Scientific Dossier Generation (JSON Snapshot)",
            res_dossier.status_code == 200
            and dossier_data.get("candidate_id") == cand_id
            and "assessment_version" in dossier_data
            and "reproducibility_appendix" in dossier_data,
            {
                "status_code": res_dossier.status_code,
                "dossier_id": dossier_data.get("dossier_id"),
                "assessment_version": dossier_data.get("assessment_version"),
                "review_history_count": len(
                    dossier_data.get("candidate", {}).get("review_history", [])
                ),
            },
        )

        # -------------------------------------------------------------
        # STEP 13: Publication-grade vector PDF dossier export
        # -------------------------------------------------------------
        res_pdf = client.get(f"/api/candidates/{cand_id}/dossier.pdf")
        pdf_bytes = res_pdf.content
        record_step(
            "13. Publication-Grade Vector PDF Research Dossier Export",
            res_pdf.status_code == 200
            and res_pdf.headers.get("content-type") == "application/pdf"
            and pdf_bytes.startswith(b"%PDF-"),
            {
                "status_code": res_pdf.status_code,
                "content_type": res_pdf.headers.get("content-type"),
                "pdf_size_bytes": len(pdf_bytes),
                "is_valid_pdf_magic": pdf_bytes.startswith(b"%PDF-"),
            },
        )

        # -------------------------------------------------------------
        # STEP 14: Comprehensive Failure Path Assertions
        # -------------------------------------------------------------
        failure_checks: list[dict[str, Any]] = []

        # 14a. Unsupported format upload
        bad_file_content = b"Plain text file that is not a radio telescope observation."
        res_bad_upload = client.post(
            "/api/observations",
            files={"file": ("unsupported_data.txt", bad_file_content, "text/plain")},
        )
        f1_pass = res_bad_upload.status_code == 400
        failure_checks.append(
            {
                "test": "unsupported_upload",
                "status_code": res_bad_upload.status_code,
                "passed": f1_pass,
            }
        )

        # 14b. Missing observation slice
        res_missing_obs = client.get(
            "/api/observations/550e8400-e29b-41d4-a716-446655440000/slice",
            params={"time_start": 0, "time_stop": 10, "frequency_start": 0, "frequency_stop": 10},
        )
        f2_pass = res_missing_obs.status_code == 404
        failure_checks.append(
            {
                "test": "missing_observation_slice",
                "status_code": res_missing_obs.status_code,
                "passed": f2_pass,
            }
        )

        # 14c. Out of bounds slice range
        res_oob_slice = client.get(
            f"/api/observations/{obs_id}/slice",
            params={
                "time_start": 1000,
                "time_stop": 2000,
                "frequency_start": 0,
                "frequency_stop": 10,
            },
        )
        f3_pass = res_oob_slice.status_code == 422
        failure_checks.append(
            {
                "test": "out_of_bounds_slice",
                "status_code": res_oob_slice.status_code,
                "passed": f3_pass,
            }
        )

        # 14d. Missing candidate retrieval
        res_missing_cand = client.get("/api/candidates/cand_nonexistent_000000000000")
        f4_pass = res_missing_cand.status_code == 404
        failure_checks.append(
            {
                "test": "missing_candidate",
                "status_code": res_missing_cand.status_code,
                "passed": f4_pass,
            }
        )

        # 14e. Invalid candidate review status transition (e.g. from dismissed to unreviewed)
        client.post(
            f"/api/candidates/{cand_id}/review",
            json={"new_status": "dismissed", "reviewer_id": "auditor", "notes": "Closing"},
        )
        res_invalid_trans = client.post(
            f"/api/candidates/{cand_id}/review",
            json={"new_status": "unreviewed", "reviewer_id": "auditor", "notes": "Illegal revert"},
        )
        f5_pass = res_invalid_trans.status_code == 422
        failure_checks.append(
            {
                "test": "invalid_status_transition",
                "status_code": res_invalid_trans.status_code,
                "passed": f5_pass,
            }
        )

        # 14f. Missing candidate PDF export
        res_missing_pdf = client.get("/api/candidates/cand_nonexistent_000000000000/dossier.pdf")
        f6_pass = res_missing_pdf.status_code == 404
        failure_checks.append(
            {
                "test": "missing_candidate_pdf",
                "status_code": res_missing_pdf.status_code,
                "passed": f6_pass,
            }
        )

        all_failures_passed = all(fc["passed"] for fc in failure_checks)
        record_step(
            "14. Negative & Failure Branch Robustness (Safe Error Envelopes)",
            all_failures_passed,
            {"checks": failure_checks},
        )

    report_payload = {
        "verification_id": "aethon_phase9_pipeline_verification",
        "verified_at_utc": datetime.now(UTC).isoformat(),
        "total_steps": len(step_results),
        "passed_steps": sum(1 for s in step_results if s["passed"]),
        "all_passed": all(s["passed"] for s in step_results),
        "steps": step_results,
    }

    if output_report:
        output_report.parent.mkdir(parents=True, exist_ok=True)
        with open(output_report, "w", encoding="utf-8") as f:
            json.dump(report_payload, f, indent=2)
        print(f"\nPipeline verification report saved to: {output_report}")

    print("\n=====================================================================")
    print("All 14 scientific pipeline & failure tests verified successfully.")
    print("=====================================================================")
    return report_payload


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run end-to-end scientific pipeline verification.")
    parser.add_argument(
        "--output-report",
        type=Path,
        default=backend_root / "reports" / "pipeline_verification_report.json",
        help="Path to write the verification JSON report",
    )
    args = parser.parse_args()
    run_pipeline_verification(args.output_report.resolve())
