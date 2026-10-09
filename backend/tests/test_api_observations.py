"""Integration tests for observation ingestion and querying API endpoints."""

import hashlib
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app
from tests.helpers import (
    create_optical_fits_image,
    create_synthetic_filterbank,
    create_synthetic_fits_bintable,
    create_synthetic_fits_spectral_image,
)


@pytest.fixture
def test_client_and_settings(tmp_path: Path) -> tuple[TestClient, Settings]:
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
        max_upload_size_bytes=1024 * 1024,  # 1 MB for testing
        environment="test",
        debug=True,
    )

    app = create_app(custom_settings=test_settings)
    with TestClient(app) as client:
        yield client, test_settings


def test_upload_filterbank_success(
    test_client_and_settings: tuple[TestClient, Settings], tmp_path: Path
) -> None:
    """Validate successful ingestion of a genuine synthetic SIGPROC .fil file."""
    client, settings = test_client_and_settings

    fil_path = tmp_path / "voyager_test.fil"
    create_synthetic_filterbank(
        file_path=fil_path,
        nchans=32,
        n_ints=8,
        fch1=1420.0,
        foff=-0.05,
        source_name="VOYAGER-1",
        telescope_id=6,
    )

    file_bytes = fil_path.read_bytes()
    expected_sha = hashlib.sha256(file_bytes).hexdigest()

    with open(fil_path, "rb") as f:
        response = client.post(
            "/api/observations",
            files={"file": ("voyager_test.fil", f, "application/octet-stream")},
        )

    assert response.status_code == 201
    data = response.json()

    assert data["original_filename"] == "voyager_test.fil"
    assert data["format"] == "fil"
    assert data["file_size_bytes"] == len(file_bytes)
    assert data["sha256"] == expected_sha
    assert data["status"] == "ingested"
    assert "id" in data

    meta = data["metadata"]
    assert meta["channel_count"] == 32
    assert meta["source_name"] == "VOYAGER-1"
    assert meta["telescope_name"] == "Green Bank Telescope (GBT)"
    assert meta["frequency_reference_mhz"] == 1420.0
    assert meta["channel_spacing_mhz"] == -0.05

    # Check internal stored file
    stored_path = Path(settings.observations_dir) / f"{data['id']}.fil"
    assert stored_path.exists()
    assert stored_path.read_bytes() == file_bytes


def test_upload_fits_spectral_image_success(
    test_client_and_settings: tuple[TestClient, Settings], tmp_path: Path
) -> None:
    """Validate successful ingestion of a radio spectral image FITS file."""
    client, _ = test_client_and_settings

    fits_path = tmp_path / "spectral_image.fits"
    create_synthetic_fits_spectral_image(
        file_path=fits_path,
        nchans=32,
        n_times=16,
        f_ref_hz=1420.0e6,
        df_hz=25.0e3,
        telescope="GBT",
        target="BLC1",
    )

    file_bytes = fits_path.read_bytes()
    expected_sha = hashlib.sha256(file_bytes).hexdigest()

    with open(fits_path, "rb") as f:
        response = client.post(
            "/api/observations",
            files={"file": ("spectral_image.fits", f, "application/fits")},
        )

    assert response.status_code == 201
    data = response.json()
    assert data["format"] == "fits"
    assert data["sha256"] == expected_sha
    assert data["metadata"]["channel_count"] == 32
    assert data["metadata"]["source_name"] == "BLC1"
    assert data["provenance"]["layout"] == "radio_spectral_image"


def test_upload_fits_bintable_success(
    test_client_and_settings: tuple[TestClient, Settings], tmp_path: Path
) -> None:
    """Validate successful ingestion of a radio binary table FITS file."""
    client, _ = test_client_and_settings

    fits_path = tmp_path / "psrfits_subint.fits"
    create_synthetic_fits_bintable(
        file_path=fits_path,
        nchans=16,
        n_subints=4,
        telescope="Parkes",
        source="PSR B1919+21",
    )

    with open(fits_path, "rb") as f:
        response = client.post(
            "/api/observations",
            files={"file": ("psrfits_subint.fits", f, "application/fits")},
        )

    assert response.status_code == 201
    data = response.json()
    assert data["format"] == "fits"
    assert data["metadata"]["channel_count"] == 16
    assert data["metadata"]["source_name"] == "PSR B1919+21"
    assert data["provenance"]["layout"] == "radio_bintable_psrfits"


def test_upload_missing_file_field(test_client_and_settings: tuple[TestClient, Settings]) -> None:
    """Validate 422 returned when multipart form is missing required 'file' field."""
    client, _ = test_client_and_settings
    response = client.post("/api/observations", data={"other_field": "test"})
    assert response.status_code == 422
    assert response.json()["code"] == "VALIDATION_ERROR"


def test_upload_empty_file_rejected(test_client_and_settings: tuple[TestClient, Settings]) -> None:
    """Validate 400 returned when uploaded file is empty (0 bytes)."""
    client, _ = test_client_and_settings
    response = client.post(
        "/api/observations",
        files={"file": ("empty.fil", b"", "application/octet-stream")},
    )
    assert response.status_code == 400
    data = response.json()
    assert data["code"] == "EMPTY_FILE"
    assert "empty" in data["message"].lower()


def test_upload_unsupported_extension_rejected(
    test_client_and_settings: tuple[TestClient, Settings],
) -> None:
    """Validate 400 returned when file extension is not among supported formats."""
    client, _ = test_client_and_settings
    response = client.post(
        "/api/observations",
        files={"file": ("data.csv", b"col1,col2\n1,2\n", "text/csv")},
    )
    assert response.status_code == 400
    data = response.json()
    assert data["code"] == "UNSUPPORTED_FORMAT"


def test_upload_corrupted_filterbank_rejected(
    test_client_and_settings: tuple[TestClient, Settings],
) -> None:
    """Validate 422 returned when .fil file content is malformed."""
    client, settings = test_client_and_settings
    response = client.post(
        "/api/observations",
        files={"file": ("corrupt.fil", b"NOT_A_VALID_HEADER_BYTES", "application/octet-stream")},
    )
    assert response.status_code == 422
    data = response.json()
    assert data["code"] == "INVALID_FILE_CONTENT"

    # Verify no orphan staging file was left in temp upload directory
    temp_dir = Path(settings.temp_upload_dir)
    assert len(list(temp_dir.glob("*.tmp"))) == 0


def test_upload_unsupported_fits_layout_rejected(
    test_client_and_settings: tuple[TestClient, Settings], tmp_path: Path
) -> None:
    """Validate 422 returned when FITS container lacks radio observation layout."""
    client, _ = test_client_and_settings

    optical_path = tmp_path / "optical.fits"
    create_optical_fits_image(optical_path)

    with open(optical_path, "rb") as f:
        response = client.post(
            "/api/observations",
            files={"file": ("optical.fits", f, "application/fits")},
        )

    assert response.status_code == 422
    data = response.json()
    assert data["code"] == "UNSUPPORTED_FITS_LAYOUT"
    assert "supported radio observation layout" in data["message"].lower()


def test_upload_file_size_exceeded_rejected(
    test_client_and_settings: tuple[TestClient, Settings],
) -> None:
    """Validate 413 returned when uploaded content exceeds max_upload_size_bytes."""
    client, settings = test_client_and_settings

    # Settings configured max upload to 1 MB (1024 * 1024 bytes)
    oversized_data = b"X" * (1024 * 1024 + 1024)

    response = client.post(
        "/api/observations",
        files={"file": ("oversized.fil", oversized_data, "application/octet-stream")},
    )

    assert response.status_code == 413
    data = response.json()
    assert data["code"] == "FILE_SIZE_EXCEEDED"

    # Ensure temp staging file was purged
    temp_dir = Path(settings.temp_upload_dir)
    assert len(list(temp_dir.glob("*.tmp"))) == 0


def test_path_traversal_filename_sanitized(
    test_client_and_settings: tuple[TestClient, Settings], tmp_path: Path
) -> None:
    """Validate that path traversal sequences in original filenames are sanitized safely."""
    client, settings = test_client_and_settings

    fil_path = tmp_path / "normal.fil"
    create_synthetic_filterbank(fil_path, nchans=8, n_ints=2)

    with open(fil_path, "rb") as f:
        response = client.post(
            "/api/observations",
            files={"file": ("../../../../etc/passwd.fil", f, "application/octet-stream")},
        )

    assert response.status_code == 201
    data = response.json()
    # Filename must be sanitized
    assert ".." not in data["original_filename"]
    assert "/" not in data["original_filename"]
    assert "\\" not in data["original_filename"]
    assert data["original_filename"] == "passwd.fil"

    # Preserved inside observations_dir without escaping
    stored_path = Path(settings.observations_dir) / f"{data['id']}.fil"
    assert stored_path.exists()


def test_list_observations_endpoint(
    test_client_and_settings: tuple[TestClient, Settings], tmp_path: Path
) -> None:
    """Validate GET /api/observations pagination and ordering."""
    client, _ = test_client_and_settings

    # Ingest 3 observations
    for i in range(3):
        fil_path = tmp_path / f"test_{i}.fil"
        create_synthetic_filterbank(fil_path, nchans=8, n_ints=2, source_name=f"SRC_{i}")
        with open(fil_path, "rb") as f:
            client.post(
                "/api/observations",
                files={"file": (f"test_{i}.fil", f, "application/octet-stream")},
            )

    # Query page 1 (limit 2)
    resp = client.get("/api/observations?limit=2&offset=0")
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 3
    assert len(data["items"]) == 2
    assert data["limit"] == 2
    assert data["offset"] == 0

    # Query page 2 (limit 2, offset 2)
    resp2 = client.get("/api/observations?limit=2&offset=2")
    assert resp2.status_code == 200
    data2 = resp2.json()
    assert data2["total"] == 3
    assert len(data2["items"]) == 1


def test_get_observation_by_id_and_404(
    test_client_and_settings: tuple[TestClient, Settings], tmp_path: Path
) -> None:
    """Validate GET /api/observations/{id} retrieval and 404 behavior."""
    client, _ = test_client_and_settings

    fil_path = tmp_path / "single.fil"
    create_synthetic_filterbank(fil_path, nchans=16, n_ints=4, source_name="PULSAR_TEST")
    with open(fil_path, "rb") as f:
        create_resp = client.post(
            "/api/observations",
            files={"file": ("single.fil", f, "application/octet-stream")},
        )
    obs_id = create_resp.json()["id"]

    # 1. Existing ID
    get_resp = client.get(f"/api/observations/{obs_id}")
    assert get_resp.status_code == 200
    data = get_resp.json()
    assert data["id"] == obs_id
    assert data["metadata"]["source_name"] == "PULSAR_TEST"

    # 2. Unknown ID -> 404
    unknown_resp = client.get("/api/observations/00000000-0000-0000-0000-000000000000")
    assert unknown_resp.status_code == 404
    err_data = unknown_resp.json()
    assert err_data["code"] == "NOT_FOUND"


def test_data_persistence_across_app_restart(tmp_path: Path) -> None:
    """Validate observation records survive application restarts with same storage."""
    data_dir = tmp_path / "persistent_data"
    obs_dir = data_dir / "observations"
    tmp_upload_dir = data_dir / "tmp"
    db_file = data_dir / "aethon.db"

    custom_settings = Settings(
        data_dir=str(data_dir),
        observations_dir=str(obs_dir),
        temp_upload_dir=str(tmp_upload_dir),
        db_path=str(db_file),
        environment="test",
        debug=True,
    )

    # 1. First app instance ingests file
    app1 = create_app(custom_settings=custom_settings)
    fil_path = tmp_path / "survive.fil"
    create_synthetic_filterbank(fil_path, nchans=8, n_ints=2, source_name="SURVIVOR")

    with TestClient(app1) as client1:
        with open(fil_path, "rb") as f:
            resp = client1.post(
                "/api/observations",
                files={"file": ("survive.fil", f, "application/octet-stream")},
            )
            obs_id = resp.json()["id"]

    # 2. Brand new app instance pointing to the same storage
    app2 = create_app(custom_settings=custom_settings)
    with TestClient(app2) as client2:
        resp2 = client2.get(f"/api/observations/{obs_id}")
        assert resp2.status_code == 200
        assert resp2.json()["metadata"]["source_name"] == "SURVIVOR"

        # Also listed in collection
        list_resp = client2.get("/api/observations")
        assert list_resp.status_code == 200
        assert list_resp.json()["total"] == 1
