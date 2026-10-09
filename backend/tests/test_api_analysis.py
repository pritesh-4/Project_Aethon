"""Integration tests for the Doppler drift and temporal analysis HTTP API endpoint."""

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


def test_analyze_drift_api_endpoint_success(
    test_client_and_settings: tuple[TestClient, Settings], tmp_path: Path
) -> None:
    """Validate POST /api/observations/{id}/analyze-drift successfully analyzes an observation."""
    client, _ = test_client_and_settings

    # 1. Ingest an observation
    fil_path = tmp_path / "drift_test.fil"
    create_synthetic_filterbank(
        file_path=fil_path,
        nchans=32,
        n_ints=32,
        fch1=1420.0,
        foff=-0.05,
        source_name="DRIFT_TEST_TARGET",
    )

    upload_resp = client.post(
        "/api/observations",
        files={"file": ("drift_test.fil", fil_path.read_bytes(), "application/octet-stream")},
    )
    assert upload_resp.status_code == 201
    obs_id = upload_resp.json()["id"]

    # 2. Call analyze-drift endpoint
    analyze_resp = client.post(f"/api/observations/{obs_id}/analyze-drift", json={})
    assert analyze_resp.status_code == 200

    data = analyze_resp.json()
    assert data["observation_id"] == obs_id
    assert "analysis_run_id" in data
    assert "trajectory" in data
    assert "drift_estimate" in data
    assert "temporal" in data
    assert "provenance" in data
    assert "scientific_disclaimer" in data
    assert "Doppler" in data["scientific_disclaimer"]


def test_analyze_drift_api_with_custom_config(
    test_client_and_settings: tuple[TestClient, Settings], tmp_path: Path
) -> None:
    """Validate analyze-drift endpoint with custom bounded region and search enabled."""
    client, _ = test_client_and_settings

    fil_path = tmp_path / "drift_custom.fil"
    create_synthetic_filterbank(
        file_path=fil_path,
        nchans=32,
        n_ints=32,
        fch1=1420.0,
        foff=-0.05,
    )

    upload_resp = client.post(
        "/api/observations",
        files={"file": ("drift_custom.fil", fil_path.read_bytes(), "application/octet-stream")},
    )
    assert upload_resp.status_code == 201
    obs_id = upload_resp.json()["id"]

    payload = {
        "time_start": 0,
        "time_stop": 16,
        "frequency_start": 0,
        "frequency_stop": 16,
        "config": {
            "drift_search": {
                "enabled": True,
                "min_drift_hz_per_sec": -2.0,
                "max_drift_hz_per_sec": 2.0,
                "step_hz_per_sec": 0.5,
            },
            "dedrift": {
                "enabled": True,
            },
        },
    }

    analyze_resp = client.post(f"/api/observations/{obs_id}/analyze-drift", json=payload)
    assert analyze_resp.status_code == 200

    data = analyze_resp.json()
    assert data["drift_search"] is not None
    assert data["drift_search"]["hypotheses_evaluated"] == 9
    assert data["target_region"]["time_stop"] == 16
    assert data["target_region"]["freq_stop"] == 16


def test_analyze_drift_not_found(
    test_client_and_settings: tuple[TestClient, Settings],
) -> None:
    """Non-existent observation ID returns 404."""
    client, _ = test_client_and_settings
    resp = client.post("/api/observations/non-existent-uuid/analyze-drift", json={})
    assert resp.status_code == 404
    assert "not found" in resp.json()["message"].lower()
