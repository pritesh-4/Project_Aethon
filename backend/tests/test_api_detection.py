"""Integration tests for the anomaly detection HTTP API endpoint."""

from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app
from tests.helpers import create_synthetic_filterbank


@pytest.fixture
def test_client_and_settings(
    tmp_path: Path,
) -> Generator[tuple[TestClient, Settings], None, None]:
    """Provide TestClient with isolated temporary data directories and SQLite database."""
    data_dir = tmp_path / "data"
    obs_dir = data_dir / "observations"
    tmp_upload_dir = data_dir / "tmp"
    db_file = data_dir / "test_aethon.db"

    test_settings = Settings(
        data_dir=str(data_dir),
        observations_dir=str(obs_dir),
        temp_upload_dir=str(tmp_upload_dir),
        db_path=str(db_file),
        max_upload_size_bytes=1024 * 1024,
        environment="test",
        debug=True,
    )

    app = create_app(custom_settings=test_settings)
    with TestClient(app) as client:
        yield client, test_settings


def test_detect_anomalies_api_endpoint_success(
    test_client_and_settings: tuple[TestClient, Settings], tmp_path: Path
) -> None:
    """Validate POST /api/observations/{id}/detect successfully evaluates an observation."""
    client, _ = test_client_and_settings

    # 1. Ingest an observation
    fil_path = tmp_path / "detect_test.fil"
    create_synthetic_filterbank(
        file_path=fil_path,
        nchans=32,
        n_ints=32,
        fch1=1420.0,
        foff=-0.05,
        source_name="ANOMALY_TEST",
    )

    upload_resp = client.post(
        "/api/observations",
        files={"file": ("detect_test.fil", fil_path.read_bytes(), "application/octet-stream")},
    )
    assert upload_resp.status_code == 201
    obs_id = upload_resp.json()["id"]

    # 2. Call detection endpoint with default configuration
    detect_resp = client.post(f"/api/observations/{obs_id}/detect")
    assert detect_resp.status_code == 200

    data = detect_resp.json()
    assert data["observation_id"] == obs_id
    assert "analysis_run_id" in data
    assert "total_windows_evaluated" in data
    assert "anomalous_regions" in data
    assert "provenance" in data
    assert "scientific_disclaimer" in data


def test_detect_anomalies_api_with_merging_config(
    test_client_and_settings: tuple[TestClient, Settings], tmp_path: Path
) -> None:
    """Validate POST /api/observations/{id}/detect with custom window config and region merging."""
    client, _ = test_client_and_settings

    fil_path = tmp_path / "detect_merge_test.fil"
    create_synthetic_filterbank(
        file_path=fil_path,
        nchans=32,
        n_ints=32,
        fch1=1420.0,
        foff=-0.05,
    )

    upload_resp = client.post(
        "/api/observations",
        files={
            "file": ("detect_merge_test.fil", fil_path.read_bytes(), "application/octet-stream")
        },
    )
    obs_id = upload_resp.json()["id"]

    payload = {
        "config": {
            "window": {
                "time_size": 16,
                "freq_size": 16,
                "time_stride": 8,
                "freq_stride": 8,
            },
            "merge_overlapping_regions": True,
        }
    }

    resp = client.post(f"/api/observations/{obs_id}/detect", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["merged_regions"] is not None


def test_detect_anomalies_api_not_found(
    test_client_and_settings: tuple[TestClient, Settings],
) -> None:
    """Requesting detection on a non-existent observation returns 404."""
    client, _ = test_client_and_settings
    resp = client.post("/api/observations/00000000-0000-0000-0000-000000000000/detect")
    assert resp.status_code == 404
    assert resp.json()["code"] == "NOT_FOUND"
