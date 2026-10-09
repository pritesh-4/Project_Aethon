"""End-to-end integration tests for GET /api/observations/{id}/slice endpoint."""

from pathlib import Path

import numpy as np
from blimpy import Waterfall
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app
from tests.helpers import (
    create_synthetic_filterbank,
    create_synthetic_fits_bintable,
    create_synthetic_fits_spectral_image,
)


def test_slice_filterbank_observation_success(client: TestClient, tmp_path: Path) -> None:
    """Extract canonical slice from ingested filterbank observation."""
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

    # Request slice [time 2:6, freq 4:12]
    slice_resp = client.get(
        f"/api/observations/{obs_id}/slice",
        params={
            "time_start": 2,
            "time_stop": 6,
            "frequency_start": 4,
            "frequency_stop": 12,
        },
    )
    assert slice_resp.status_code == 200
    data = slice_resp.json()

    assert data["observation_id"] == obs_id
    assert data["source_format"] == "fil"
    assert data["matrix_shape"] == [4, 8]
    assert data["canonical_axis_convention"] == "values[time_index][frequency_index]"
    assert data["actual_range"] == {
        "time_start": 2,
        "time_stop": 6,
        "frequency_start": 4,
        "frequency_stop": 12,
    }

    # Matrix rows and columns
    values = data["values"]
    assert len(values) == 4
    for row in values:
        assert len(row) == 8

    # Coordinates
    time_coords = data["time_coordinates_seconds"]
    assert time_coords is not None
    assert len(time_coords) == 4
    assert time_coords == [0.5, 0.75, 1.0, 1.25]

    freq_coords = data["frequency_coordinates_hz"]
    assert freq_coords is not None
    assert len(freq_coords) == 8
    # Frequencies must be strictly ascending
    assert all(freq_coords[i] < freq_coords[i + 1] for i in range(len(freq_coords) - 1))
    assert data["frequency_unit"] == "Hz"
    assert data["time_unit"] == "s"

    # Data quality & provenance
    assert data["data_quality"]["total_samples"] == 32
    assert data["data_quality"]["non_finite_sample_count"] == 0
    assert data["data_quality"]["has_non_finite_samples"] is False
    assert data["provenance"]["source_channel_order"] == "descending"
    assert data["provenance"]["frequency_axis_reversed"] is True
    assert data["provenance"]["reader_backend"] == "np.memmap.fil"


def test_slice_endpoint_default_parameters(client: TestClient, tmp_path: Path) -> None:
    """Endpoint applies conservative bounded defaults when range parameters are omitted."""
    fil_path = tmp_path / "obs_defaults.fil"
    create_synthetic_filterbank(fil_path, nchans=32, n_ints=16)

    with open(fil_path, "rb") as f:
        upload_resp = client.post(
            "/api/observations",
            files={"file": ("obs.fil", f, "application/octet-stream")},
        )
    obs_id = upload_resp.json()["id"]

    # Request without query parameters
    slice_resp = client.get(f"/api/observations/{obs_id}/slice")
    assert slice_resp.status_code == 200
    data = slice_resp.json()

    # Defaults: time_start=0, time_stop=min(16, 64)=16, freq_start=0, freq_stop=min(32, 256)=32
    assert data["actual_range"]["time_start"] == 0
    assert data["actual_range"]["time_stop"] == 16
    assert data["actual_range"]["frequency_start"] == 0
    assert data["actual_range"]["frequency_stop"] == 32
    assert data["matrix_shape"] == [16, 32]


def test_slice_fits_spectral_image_success(client: TestClient, tmp_path: Path) -> None:
    """Extract canonical slice from ingested FITS spectral image."""
    fits_path = tmp_path / "spectral.fits"
    create_synthetic_fits_spectral_image(fits_path, nchans=32, n_times=16)

    with open(fits_path, "rb") as f:
        upload_resp = client.post(
            "/api/observations",
            files={"file": ("spectral.fits", f, "application/octet-stream")},
        )
    assert upload_resp.status_code == 201
    obs_id = upload_resp.json()["id"]

    slice_resp = client.get(
        f"/api/observations/{obs_id}/slice",
        params={"time_start": 0, "time_stop": 4, "frequency_start": 0, "frequency_stop": 8},
    )
    assert slice_resp.status_code == 200
    data = slice_resp.json()

    assert data["source_format"] == "fits"
    assert data["matrix_shape"] == [4, 8]
    assert data["provenance"]["reader_backend"] == "astropy.fits.section"
    assert len(data["frequency_coordinates_hz"]) == 8


def test_slice_fits_binary_table_success(client: TestClient, tmp_path: Path) -> None:
    """Extract canonical slice from ingested FITS binary table (PSRFITS SUBINT)."""
    fits_path = tmp_path / "table.fits"
    create_synthetic_fits_bintable(fits_path, nchans=16, n_subints=4)

    with open(fits_path, "rb") as f:
        upload_resp = client.post(
            "/api/observations",
            files={"file": ("table.fits", f, "application/octet-stream")},
        )
    assert upload_resp.status_code == 201
    obs_id = upload_resp.json()["id"]

    slice_resp = client.get(
        f"/api/observations/{obs_id}/slice",
        params={"time_start": 1, "time_stop": 3, "frequency_start": 2, "frequency_stop": 6},
    )
    assert slice_resp.status_code == 200
    data = slice_resp.json()

    assert data["source_format"] == "fits"
    assert data["matrix_shape"] == [2, 4]
    assert data["provenance"]["reader_backend"] == "astropy.fits.bintable"


def test_slice_cell_limit_exceeded_enforced(tmp_path: Path) -> None:
    """Endpoint rejects queries exceeding MAX_SLICE_CELLS configuration."""
    custom_settings = Settings(
        data_dir=str(tmp_path / "data"),
        observations_dir=str(tmp_path / "data" / "obs"),
        temp_upload_dir=str(tmp_path / "data" / "tmp"),
        db_path=str(tmp_path / "data" / "test.db"),
        max_slice_cells=100,  # Strict cell limit for testing
    )
    test_app = create_app(custom_settings)
    test_client = TestClient(test_app)

    fil_path = tmp_path / "large.fil"
    create_synthetic_filterbank(fil_path, nchans=32, n_ints=16)

    with open(fil_path, "rb") as f:
        upload_resp = test_client.post(
            "/api/observations",
            files={"file": ("large.fil", f, "application/octet-stream")},
        )
    obs_id = upload_resp.json()["id"]

    # Request 8 * 16 = 128 cells > limit of 100
    slice_resp = test_client.get(
        f"/api/observations/{obs_id}/slice",
        params={"time_start": 0, "time_stop": 8, "frequency_start": 0, "frequency_stop": 16},
    )
    assert slice_resp.status_code == 422
    err = slice_resp.json()
    assert err["code"] == "SLICE_CELL_LIMIT_EXCEEDED"
    assert "exceeds maximum configured limit of 100 cells" in err["message"]


def test_slice_bounds_validation_errors(client: TestClient, tmp_path: Path) -> None:
    """Endpoint validates boundary semantics and returns 422 for invalid intervals."""
    fil_path = tmp_path / "obs.fil"
    create_synthetic_filterbank(fil_path, nchans=32, n_ints=8)

    with open(fil_path, "rb") as f:
        upload_resp = client.post(
            "/api/observations",
            files={"file": ("obs.fil", f, "application/octet-stream")},
        )
    obs_id = upload_resp.json()["id"]

    # Inverted time
    res = client.get(
        f"/api/observations/{obs_id}/slice",
        params={"time_start": 5, "time_stop": 2},
    )
    assert res.status_code == 422
    assert res.json()["code"] == "INVALID_SLICE_BOUNDS"

    # Time stop exceeds total length (8)
    res = client.get(
        f"/api/observations/{obs_id}/slice",
        params={"time_start": 0, "time_stop": 20},
    )
    assert res.status_code == 422
    assert res.json()["code"] == "INVALID_SLICE_BOUNDS"

    # Frequency stop exceeds total channels (32)
    res = client.get(
        f"/api/observations/{obs_id}/slice",
        params={"frequency_start": 0, "frequency_stop": 50},
    )
    assert res.status_code == 422
    assert res.json()["code"] == "INVALID_SLICE_BOUNDS"


def test_slice_nonexistent_observation_404(client: TestClient) -> None:
    """Requesting a slice for a nonexistent observation returns 404."""
    fake_id = "550e8400-e29b-41d4-a716-446655440000"
    res = client.get(f"/api/observations/{fake_id}/slice")
    assert res.status_code == 404
    assert res.json()["code"] == "NOT_FOUND"


def test_slice_non_finite_sample_handling(client: TestClient, tmp_path: Path) -> None:
    """Non-finite samples (NaN/Inf) are safely serialized to null in JSON response."""
    data = np.ones((8, 1, 16), dtype=np.float32)
    # Inject IEEE non-finite samples
    data[1, 0, 2] = np.nan
    data[2, 0, 4] = np.inf
    data[2, 0, 5] = -np.inf

    header = {
        "fch1": 1420.0,
        "foff": -0.05,
        "nchans": 16,
        "tsamp": 0.5,
        "tstart": 59000.0,
        "nbits": 32,
        "nifs": 1,
    }
    fil_path = tmp_path / "non_finite.fil"
    wf = Waterfall(header_dict=header, data_array=data)
    wf.write_to_fil(str(fil_path))

    with open(fil_path, "rb") as f:
        upload_resp = client.post(
            "/api/observations",
            files={"file": ("non_finite.fil", f, "application/octet-stream")},
        )
    obs_id = upload_resp.json()["id"]

    res = client.get(
        f"/api/observations/{obs_id}/slice",
        params={"time_start": 0, "time_stop": 4, "frequency_start": 0, "frequency_stop": 16},
    )
    assert res.status_code == 200
    data_resp = res.json()

    # Verify quality metrics
    quality = data_resp["data_quality"]
    assert quality["has_non_finite_samples"] is True
    assert quality["non_finite_sample_count"] == 3

    # Verify warning present
    assert any("non-finite samples" in w for w in data_resp["warnings"])

    # Verify JSON null values exist in matrix
    flat_values = [v for row in data_resp["values"] for v in row]
    assert flat_values.count(None) == 3


def test_source_file_remains_unmodified_after_slicing(client: TestClient, tmp_path: Path) -> None:
    """Extracting slices does not alter the original stored raw observation bytes."""
    fil_path = tmp_path / "immutability.fil"
    create_synthetic_filterbank(fil_path, nchans=32, n_ints=8)

    with open(fil_path, "rb") as f:
        upload_resp = client.post(
            "/api/observations",
            files={"file": ("immutability.fil", f, "application/octet-stream")},
        )
    obs_data = upload_resp.json()
    obs_id = obs_data["id"]
    original_sha256 = obs_data["sha256"]

    # Perform slice queries
    client.get(f"/api/observations/{obs_id}/slice", params={"time_start": 0, "time_stop": 4})
    client.get(
        f"/api/observations/{obs_id}/slice",
        params={"frequency_start": 5, "frequency_stop": 15},
    )

    # Retrieve observation to ensure record and stored hash remain identical
    get_resp = client.get(f"/api/observations/{obs_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["sha256"] == original_sha256
