"""Integration tests for the Candidate Management HTTP API routes."""

from collections.abc import Generator
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app


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
        environment="test",
        debug=True,
    )

    app = create_app(custom_settings=test_settings)
    with TestClient(app) as client:
        yield client, test_settings


def test_candidate_api_lifecycle_and_endpoints(
    test_client_and_settings: tuple[TestClient, Settings],
) -> None:
    """Test full HTTP API lifecycle: create, list, retrieve, assess, review, dossier, pdf."""
    client, _ = test_client_and_settings

    # 1. POST /api/candidates: Create a candidate
    create_payload = {
        "observation_id": "obs_synth_001",
        "target_region": {
            "time_start": 0,
            "time_stop": 16,
            "freq_start": 100,
            "freq_stop": 150,
        },
        "physical_coordinates": {
            "freq_center_hz": 1420405750.0,
            "bandwidth_hz": 2500.0,
            "duration_s": 8.0,
        },
        "is_synthetic": True,
    }
    resp = client.post("/api/candidates", json=create_payload)
    assert resp.status_code == 201
    cand_data = resp.json()
    cand_id = cand_data["candidate_id"]
    assert cand_id.startswith("cand_")
    assert cand_data["status"] == "unreviewed"
    assert cand_data["current_assessment"] is not None

    # 2. Duplicate Grouping: Submit overlapping region on same observation
    overlap_payload = {
        "observation_id": "obs_synth_001",
        "target_region": {
            "time_start": 2,
            "time_stop": 18,
            "freq_start": 105,
            "freq_stop": 155,
        },
    }
    resp_group = client.post("/api/candidates", json=overlap_payload)
    assert resp_group.status_code == 201
    # Returns the same candidate ID because it was grouped!
    assert resp_group.json()["candidate_id"] == cand_id

    # 3. GET /api/candidates: List candidates
    list_resp = client.get("/api/candidates")
    assert list_resp.status_code == 200
    list_data = list_resp.json()
    assert list_data["total"] >= 1
    assert any(c["candidate_id"] == cand_id for c in list_data["items"])

    # List with filtering
    filt_resp = client.get("/api/candidates?observation_id=obs_synth_001&status=unreviewed")
    assert filt_resp.status_code == 200
    assert filt_resp.json()["total"] >= 1

    # 4. GET /api/candidates/{id}: Retrieve single candidate
    get_resp = client.get(f"/api/candidates/{cand_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["candidate_id"] == cand_id

    # 5. POST /api/candidates/{id}/assess: Re-evaluate assessment
    assess_resp = client.post(
        f"/api/candidates/{cand_id}/assess",
        json={"scoring_config": {"weight_anomaly": 0.40}},
    )
    assert assess_resp.status_code == 200
    assess_data = assess_resp.json()
    assert assess_data["version"] >= 2

    # 6. POST /api/candidates/{id}/review: Valid review transition
    review_payload = {
        "new_status": "under_review",
        "reviewer_id": "scientist_jane",
        "notes": "Candidate triage commenced.",
    }
    rev_resp = client.post(f"/api/candidates/{cand_id}/review", json=review_payload)
    assert rev_resp.status_code == 200
    rev_data = rev_resp.json()
    assert rev_data["candidate"]["status"] == "under_review"
    assert rev_data["review"]["reviewer_id"] == "scientist_jane"

    # 7. GET /api/candidates/{id}/dossier: Retrieve structured case file
    dossier_resp = client.get(f"/api/candidates/{cand_id}/dossier")
    assert dossier_resp.status_code == 200
    dossier_data = dossier_resp.json()
    assert dossier_data["candidate"]["candidate_id"] == cand_id
    assert "reproducibility_appendix" in dossier_data

    # 8. GET /api/candidates/{id}/dossier.pdf: Retrieve vector PDF report
    pdf_resp = client.get(f"/api/candidates/{cand_id}/dossier.pdf")
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"
    assert pdf_resp.content.startswith(b"%PDF-")


def test_candidate_api_error_handling(
    test_client_and_settings: tuple[TestClient, Settings],
) -> None:
    """Test 404, 422, and invalid state transitions."""
    client, _ = test_client_and_settings

    # 1. 404 on nonexistent candidate
    assert client.get("/api/candidates/cand_nonexistent").status_code == 404
    assert client.get("/api/candidates/cand_nonexistent/dossier").status_code == 404
    assert client.get("/api/candidates/cand_nonexistent/dossier.pdf").status_code == 404

    # 2. 422 on invalid region (inverted bounds)
    bad_payload = {
        "observation_id": "obs_001",
        "target_region": {
            "time_start": 20,
            "time_stop": 10,
            "freq_start": 0,
            "freq_stop": 10,
        },
    }
    bad_resp = client.post("/api/candidates", json=bad_payload)
    assert bad_resp.status_code == 422

    # 3. Create candidate then attempt invalid transition directly to interesting
    good_payload = {
        "observation_id": "obs_valid",
        "target_region": {
            "time_start": 0,
            "time_stop": 10,
            "freq_start": 0,
            "freq_stop": 10,
        },
    }
    c_resp = client.post("/api/candidates", json=good_payload)
    c_id = c_resp.json()["candidate_id"]

    inv_rev = client.post(
        f"/api/candidates/{c_id}/review",
        json={"new_status": "interesting", "reviewer_id": "user"},
    )
    assert inv_rev.status_code == 422
