"""End-to-end integration tests for POST /api/observations/{id}/process endpoint."""

from pathlib import Path

from fastapi.testclient import TestClient

from tests.helpers import create_synthetic_filterbank, create_synthetic_fits_spectral_image


def test_process_observation_default_options(client: TestClient, tmp_path: Path) -> None:
    """Process an ingested filterbank observation with default pipeline settings."""
    fil_path = tmp_path / "obs.fil"
    create_synthetic_filterbank(
        fil_path,
        nchans=32,
        n_ints=16,
        fch1=1420.0,
        foff=-0.05,
        tsamp=0.25,
        tstart=59000.0,
    )

    with open(fil_path, "rb") as f:
        upload_resp = client.post(
            "/api/observations",
            files={"file": ("obs.fil", f, "application/octet-stream")},
        )
    assert upload_resp.status_code == 201
    obs_id = upload_resp.json()["id"]
    original_sha = upload_resp.json()["sha256"]

    # Call processing endpoint
    proc_resp = client.post(
        f"/api/observations/{obs_id}/process",
        json={
            "time_start": 0,
            "time_stop": 12,
            "frequency_start": 0,
            "frequency_stop": 24,
        },
    )
    assert proc_resp.status_code == 200
    data = proc_resp.json()

    assert data["observation_id"] == obs_id
    assert data["matrix_shape"] == [12, 24]
    assert "median" in data["statistics"]
    assert "mad" in data["statistics"]
    assert "rfi_report" in data
    assert "indicators" in data["rfi_report"]
    assert len(data["rfi_report"]["indicators"]) == 3
    assert data["has_transformed_values"] is False
    assert data["transformed_values"] is None
    assert len(data["transformation_history"]) == 0

    # Verify stored observation record retains identical sha256 checksum
    obs_detail = client.get(f"/api/observations/{obs_id}")
    assert obs_detail.status_code == 200
    assert obs_detail.json()["sha256"] == original_sha


def test_process_observation_with_custom_transformations(
    client: TestClient, tmp_path: Path
) -> None:
    """Process observation with per-channel background subtraction and robust scaling."""
    fil_path = tmp_path / "obs_transform.fil"
    create_synthetic_filterbank(
        fil_path,
        nchans=32,
        n_ints=16,
        fch1=1420.0,
        foff=-0.05,
        tsamp=0.25,
        tstart=59000.0,
    )

    with open(fil_path, "rb") as f:
        upload_resp = client.post(
            "/api/observations",
            files={"file": ("obs_transform.fil", f, "application/octet-stream")},
        )
    assert upload_resp.status_code == 201
    obs_id = upload_resp.json()["id"]

    proc_resp = client.post(
        f"/api/observations/{obs_id}/process",
        json={
            "time_start": 0,
            "time_stop": 8,
            "frequency_start": 0,
            "frequency_stop": 16,
            "config": {
                "transformations": {
                    "subtract_channel_background": True,
                    "robust_standardization": True,
                }
            },
        },
    )
    assert proc_resp.status_code == 200
    data = proc_resp.json()

    assert data["has_transformed_values"] is True
    assert data["transformed_values"] is not None
    assert len(data["transformed_values"]) == 8
    assert len(data["transformed_values"][0]) == 16
    assert len(data["transformation_history"]) == 2
    assert "standardized" in data["sample_value_semantics"].lower()


def test_process_fits_spectral_image_observation(client: TestClient, tmp_path: Path) -> None:
    """Process an ingested FITS spectral image observation."""
    fits_path = tmp_path / "spectral.fits"
    create_synthetic_fits_spectral_image(fits_path, nchans=24, n_times=12)

    with open(fits_path, "rb") as f:
        upload_resp = client.post(
            "/api/observations",
            files={"file": ("spectral.fits", f, "application/fits")},
        )
    assert upload_resp.status_code == 201
    obs_id = upload_resp.json()["id"]

    proc_resp = client.post(
        f"/api/observations/{obs_id}/process",
        json={"time_start": 0, "time_stop": 8, "frequency_start": 0, "frequency_stop": 16},
    )
    assert proc_resp.status_code == 200
    data = proc_resp.json()
    assert data["matrix_shape"] == [8, 16]
    assert data["statistics"]["finite_samples"] == 128


def test_process_nonexistent_observation_404(client: TestClient) -> None:
    """Requesting processing for unknown observation returns 404."""
    proc_resp = client.post(
        "/api/observations/550e8400-e29b-41d4-a716-446655440000/process",
        json={},
    )
    assert proc_resp.status_code == 404
    err = proc_resp.json()
    assert err["code"] == "NOT_FOUND"


def test_process_invalid_bounds_422(client: TestClient, tmp_path: Path) -> None:
    """Inverted bounds must trigger 422 Unprocessable Entity."""
    fil_path = tmp_path / "obs_err.fil"
    create_synthetic_filterbank(fil_path, nchans=16, n_ints=8)

    with open(fil_path, "rb") as f:
        upload_resp = client.post(
            "/api/observations",
            files={"file": ("obs_err.fil", f, "application/octet-stream")},
        )
    assert upload_resp.status_code == 201
    obs_id = upload_resp.json()["id"]

    # Inverted time bounds
    proc_resp = client.post(
        f"/api/observations/{obs_id}/process",
        json={"time_start": 6, "time_stop": 2},
    )
    assert proc_resp.status_code == 422
