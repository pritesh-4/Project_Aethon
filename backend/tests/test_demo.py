"""Tests for guaranteed offline demo sample generation, persistence, and analysis pipeline."""

from __future__ import annotations

import json
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.datasets.demo import (
    REAL_GBT_FIXTURE_PATH,
    REAL_GBT_MANIFEST_PATH,
    REAL_GBT_SAMPLE_ID,
    SYNTHETIC_SAMPLE_ID,
    compute_file_sha256,
    generate_demo_filterbank_fixture,
)
from app.ingestion.adapters.filterbank import FilterbankAdapter
from app.main import create_app
from app.storage.repository import ObservationRepository


@pytest.fixture
def test_settings(tmp_path: Path) -> Settings:
    """Create isolated settings sandbox for demo test runs."""
    data_dir = tmp_path / "data"
    data_dir.mkdir(parents=True, exist_ok=True)
    obs_dir = data_dir / "observations"
    obs_dir.mkdir(parents=True, exist_ok=True)
    tmp_dir = data_dir / "tmp"
    tmp_dir.mkdir(parents=True, exist_ok=True)

    return Settings(
        environment="development",
        debug=True,
        data_dir=str(data_dir),
        observations_dir=str(obs_dir),
        temp_upload_dir=str(tmp_dir),
        db_path=str(data_dir / "aethon.db"),
        cors_origins=["http://localhost:5173"],
        max_upload_size_bytes=50 * 1024 * 1024,
        max_slice_cells=250000,
        max_processing_cells=1048576,
    )


@pytest.fixture
def client(test_settings: Settings) -> TestClient:
    """FastAPI test client configured with isolated sandbox settings."""
    app = create_app(test_settings)
    return TestClient(app)


def test_synthetic_beacon_generation_is_parseable_by_filterbank_adapter(tmp_path: Path) -> None:
    """Verify generate_demo_filterbank_fixture creates structurally valid .fil."""
    fixture_path = tmp_path / "test_beacon.fil"
    meta = generate_demo_filterbank_fixture(fixture_path, seed=42)

    assert fixture_path.exists()
    assert fixture_path.stat().st_size > 0
    assert meta["source_name"] == "SYNTH-BEACON-01"
    assert meta["nchans"] == 64
    assert meta["n_ints"] == 32

    adapter = FilterbankAdapter()
    parsed = adapter.parse(fixture_path)

    assert parsed.metadata.source_name == "SYNTH-BEACON-01"
    assert parsed.metadata.channel_count == 64
    assert parsed.metadata.time_sample_count == 32
    assert parsed.metadata.telescope_name == "Green Bank Telescope (GBT)"
    assert parsed.metadata.frequency_reference_mhz == 1420.0
    assert parsed.warnings == []


def test_real_gbt_fixture_and_manifest_integrity() -> None:
    """Verify that the bundled real GBT sample matches its manifest checksum and parses."""
    assert REAL_GBT_FIXTURE_PATH.exists(), f"Missing fixture at {REAL_GBT_FIXTURE_PATH}"
    assert REAL_GBT_MANIFEST_PATH.exists(), f"Missing manifest at {REAL_GBT_MANIFEST_PATH}"

    with open(REAL_GBT_MANIFEST_PATH, encoding="utf-8") as f:
        manifest = json.load(f)

    assert manifest["target"] == "HIP35136"
    assert manifest["telescope"] == "Green Bank Telescope (GBT)"
    assert manifest["is_synthetic"] is False
    assert manifest["license"] == "GPL-3.0"

    actual_sha256 = compute_file_sha256(REAL_GBT_FIXTURE_PATH)
    assert actual_sha256 == manifest["local_fixture_sha256"]
    assert REAL_GBT_FIXTURE_PATH.stat().st_size == manifest["local_fixture_size_bytes"]

    # Verify FilterbankAdapter can parse it
    adapter = FilterbankAdapter()
    parsed = adapter.parse(REAL_GBT_FIXTURE_PATH)
    assert parsed.metadata.source_name == "HIP35136"
    assert parsed.metadata.channel_count == 70
    assert parsed.metadata.time_sample_count == 32
    assert parsed.metadata.telescope_name == "Green Bank Telescope (GBT)"


def test_list_demo_samples_api(client: TestClient) -> None:
    """Test GET /api/public-datasets/demo-samples returns synthetic and real presets."""
    res = client.get("/api/public-datasets/demo-samples")
    assert res.status_code == 200

    items = res.json()
    assert len(items) == 2

    ids = [it["id"] for it in items]
    assert SYNTHETIC_SAMPLE_ID in ids
    assert REAL_GBT_SAMPLE_ID in ids

    synth = next(it for it in items if it["id"] == SYNTHETIC_SAMPLE_ID)
    assert synth["is_synthetic"] is True
    assert synth["format"] == ".fil"
    assert synth["channel_count"] == 64
    assert synth["time_sample_count"] == 32

    real = next(it for it in items if it["id"] == REAL_GBT_SAMPLE_ID)
    assert real["is_synthetic"] is False
    assert real["format"] == ".fil"
    assert real["target"] == "HIP35136"
    assert real["channel_count"] == 70


def test_load_synthetic_demo_and_deduplication(client: TestClient, test_settings: Settings) -> None:
    """Test POST /api/public-datasets/demo-samples/{sample_id}/load and subsequent deduplication."""
    repo = ObservationRepository(
        db_path=Path(test_settings.db_path),
        observations_dir=Path(test_settings.observations_dir),
    )

    # 1. Initial Load
    res1 = client.post(f"/api/public-datasets/demo-samples/{SYNTHETIC_SAMPLE_ID}/load")
    assert res1.status_code == 201
    data1 = res1.json()

    assert data1["sample_id"] == SYNTHETIC_SAMPLE_ID
    assert data1["is_duplicate"] is False
    assert data1["is_synthetic"] is True

    obs1 = data1["observation"]
    obs1_id = obs1["id"]
    assert obs1["format"] == "fil"
    assert obs1["status"] == "ingested"

    # Verify repository persistence
    persisted = repo.get_observation(obs1_id)
    assert persisted is not None
    assert persisted.id == obs1_id

    # 2. Repeated Load (must deduplicate and safely reuse)
    res2 = client.post(f"/api/public-datasets/demo-samples/{SYNTHETIC_SAMPLE_ID}/load")
    assert res2.status_code == 201
    data2 = res2.json()

    assert data2["is_duplicate"] is True
    assert data2["observation"]["id"] == obs1_id
    assert data2["observation"]["sha256"] == obs1["sha256"]


def test_load_real_gbt_demo_sample(client: TestClient) -> None:
    """Test loading the authentic GBT HIP35136 sample."""
    res = client.post(f"/api/public-datasets/demo-samples/{REAL_GBT_SAMPLE_ID}/load")
    assert res.status_code == 201
    data = res.json()

    assert data["sample_id"] == REAL_GBT_SAMPLE_ID
    assert data["is_synthetic"] is False
    assert data["observation"]["metadata"]["source_name"] == "HIP35136"
    assert data["observation"]["metadata"]["channel_count"] == 70


def test_load_demo_invalid_preset_rejected(client: TestClient) -> None:
    """Test that invalid preset names cannot be used to read arbitrary files or URLs."""
    res = client.post("/api/public-datasets/demo-samples/invalid-sample-name/load")
    assert res.status_code == 404
    assert "Invalid demo sample ID" in res.text

    # Path traversal attempt
    res_trav = client.post("/api/public-datasets/demo-samples/..%2F..%2Fetc%2Fpasswd/load")
    assert res_trav.status_code == 404


def test_loaded_demo_end_to_end_analysis_pipeline(client: TestClient) -> None:
    """Verify that loaded demo sample runs the complete scientific analysis pipeline:
    Load -> Slice -> Process -> Detect -> Analyze Drift -> Candidate.
    """
    # 1. Load demo
    res_load = client.post(f"/api/public-datasets/demo-samples/{SYNTHETIC_SAMPLE_ID}/load")
    assert res_load.status_code == 201
    obs_id = res_load.json()["observation"]["id"]

    # 2. Slice retrieval
    res_slice = client.get(
        f"/api/observations/{obs_id}/slice",
        params={"time_start": 0, "time_stop": 32, "frequency_start": 0, "frequency_stop": 64},
    )
    assert res_slice.status_code == 200
    slice_data = res_slice.json()
    assert len(slice_data["values"]) == 32
    assert len(slice_data["values"][0]) == 64

    # 3. Process
    res_proc = client.post(
        f"/api/observations/{obs_id}/process",
        json={"time_start": 0, "time_stop": 32, "frequency_start": 0, "frequency_stop": 64},
    )
    assert res_proc.status_code == 200
    assert "statistics" in res_proc.json()

    # 4. Detect
    res_det = client.post(
        f"/api/observations/{obs_id}/detect",
        json={
            "time_start": 0,
            "time_stop": 32,
            "frequency_start": 0,
            "frequency_stop": 64,
            "config": {
                "window": {"time_size": 8, "freq_size": 8, "time_stride": 4, "freq_stride": 4},
                "baseline": {"enabled": True, "mad_threshold": 3.0},
            },
        },
    )
    assert res_det.status_code == 200
    det_data = res_det.json()
    assert det_data["total_windows_evaluated"] > 0
    # Injected drifting beacon should be detected
    assert len(det_data["anomalous_regions"]) > 0

    # 5. Drift analysis on target window
    top_region = det_data["anomalous_regions"][0]["window"]
    res_drift = client.post(
        f"/api/observations/{obs_id}/analyze-drift",
        json={
            "time_start": top_region["time_start"],
            "time_stop": top_region["time_stop"],
            "frequency_start": top_region["freq_start"],
            "frequency_stop": top_region["freq_stop"],
        },
    )
    assert res_drift.status_code == 200
    drift_data = res_drift.json()
    assert "drift_estimate" in drift_data
