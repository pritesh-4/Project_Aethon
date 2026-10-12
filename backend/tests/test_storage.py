"""Unit tests for SQLite observation repository and persistent storage."""

import uuid
from datetime import UTC, datetime
from pathlib import Path

from app.ingestion.models import ObservationRecordInternal
from app.schemas.observations import Provenance, ScientificMetadata
from app.storage.repository import ObservationRepository


def _make_dummy_record(
    obs_id: str | None = None,
    filename: str = "test_obs.fil",
    fmt: str = "fil",
) -> ObservationRecordInternal:
    """Helper to produce a valid internal observation record."""
    uid = obs_id or str(uuid.uuid4())
    metadata = ScientificMetadata(
        channel_count=64,
        frequency_reference_mhz=1420.0,
        channel_spacing_mhz=-0.05,
        frequency_unit="MHz",
        bandwidth_mhz=3.2,
        time_sample_count=16,
        time_step_seconds=0.5,
        source_name="TEST_SRC",
        telescope_name="GBT",
    )
    provenance = Provenance(
        parser_name="blimpy.filterbank",
        parser_version="2.1.4",
        parsed_at=datetime.now(UTC).isoformat(),
        source_format=fmt,
        layout="sigproc_filterbank",
    )
    return ObservationRecordInternal(
        id=uid,
        original_filename=filename,
        format=fmt,
        file_size_bytes=1024,
        sha256="abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        ingested_at=datetime.now(UTC),
        status="ingested",
        file_rel_path="",
        metadata=metadata,
        provenance=provenance,
        warnings=["Test warning"],
    )


def test_repository_initialization(tmp_path: Path) -> None:
    """Validate repository initializes SQLite database and storage directory."""
    db_path = tmp_path / "db" / "test.db"
    obs_dir = tmp_path / "obs"

    _ = ObservationRepository(db_path=db_path, observations_dir=obs_dir)

    assert db_path.exists()

    assert obs_dir.exists()


def test_save_and_retrieve_observation(tmp_path: Path) -> None:
    """Validate saving an observation atomically moves the file and persists record."""
    db_path = tmp_path / "test.db"
    obs_dir = tmp_path / "observations"
    stage_dir = tmp_path / "stage"
    stage_dir.mkdir()

    repo = ObservationRepository(db_path=db_path, observations_dir=obs_dir)

    temp_file = stage_dir / "stage_123.tmp"
    temp_file.write_bytes(b"DUMMY_OBSERVATION_BYTES_1024")

    record = _make_dummy_record()
    resp = repo.save_observation(record, temp_file)

    # 1. Staged file moved, no longer in stage dir
    assert not temp_file.exists()
    # 2. File in persistent directory
    final_file = obs_dir / f"{record.id}.{record.format}"
    assert final_file.exists()
    assert final_file.read_bytes() == b"DUMMY_OBSERVATION_BYTES_1024"

    # 3. Public response returned without server paths
    assert resp.id == record.id
    assert resp.original_filename == record.original_filename
    assert not hasattr(resp, "file_rel_path")

    # 4. Retrieved by ID
    retrieved = repo.get_observation(record.id)
    assert retrieved is not None
    assert retrieved.id == record.id
    assert retrieved.metadata.channel_count == 64
    assert retrieved.metadata.source_name == "TEST_SRC"
    assert retrieved.warnings == ["Test warning"]


def test_persistence_across_repository_restart(tmp_path: Path) -> None:
    """Validate records remain accessible when a new repository connects to existing DB."""
    db_path = tmp_path / "persistent.db"
    obs_dir = tmp_path / "obs"
    stage_dir = tmp_path / "stage"
    stage_dir.mkdir()

    repo1 = ObservationRepository(db_path=db_path, observations_dir=obs_dir)
    temp_file = stage_dir / "temp.tmp"
    temp_file.write_bytes(b"BYTES_FOR_RESTART_TEST")
    record = _make_dummy_record()
    repo1.save_observation(record, temp_file)

    # Reopen repository using a fresh instance
    repo2 = ObservationRepository(db_path=db_path, observations_dir=obs_dir)
    retrieved = repo2.get_observation(record.id)

    assert retrieved is not None
    assert retrieved.id == record.id
    assert retrieved.sha256 == record.sha256
    assert retrieved.metadata.source_name == "TEST_SRC"


def test_duplicate_filenames_do_not_collide(tmp_path: Path) -> None:
    """Validate duplicate original filenames receive distinct identifiers and files."""
    db_path = tmp_path / "test.db"
    obs_dir = tmp_path / "obs"
    stage_dir = tmp_path / "stage"
    stage_dir.mkdir()

    repo = ObservationRepository(db_path=db_path, observations_dir=obs_dir)

    # Ingest file 1
    t1 = stage_dir / "t1.tmp"
    t1.write_bytes(b"DATA_1")
    rec1 = _make_dummy_record(filename="gbt_voyager.fil")
    resp1 = repo.save_observation(rec1, t1)

    # Ingest file 2 with same display filename
    t2 = stage_dir / "t2.tmp"
    t2.write_bytes(b"DATA_2")
    rec2 = _make_dummy_record(filename="gbt_voyager.fil")
    resp2 = repo.save_observation(rec2, t2)

    assert resp1.id != resp2.id
    file1 = obs_dir / f"{resp1.id}.fil"
    file2 = obs_dir / f"{resp2.id}.fil"
    assert file1.exists()
    assert file2.exists()
    assert file1.read_bytes() == b"DATA_1"
    assert file2.read_bytes() == b"DATA_2"


def test_get_nonexistent_observation_returns_none(tmp_path: Path) -> None:
    """Validate that unknown observation IDs return None."""
    db_path = tmp_path / "test.db"
    obs_dir = tmp_path / "obs"

    repo = ObservationRepository(db_path=db_path, observations_dir=obs_dir)
    assert repo.get_observation("nonexistent-id-000") is None


def test_list_observations_pagination(tmp_path: Path) -> None:
    """Validate paginated listing query with limit and offset."""
    db_path = tmp_path / "test.db"
    obs_dir = tmp_path / "obs"
    stage_dir = tmp_path / "stage"
    stage_dir.mkdir()

    repo = ObservationRepository(db_path=db_path, observations_dir=obs_dir)

    for i in range(5):
        t = stage_dir / f"t_{i}.tmp"
        t.write_bytes(f"DATA_{i}".encode())
        rec = _make_dummy_record(filename=f"obs_{i}.fil")
        repo.save_observation(rec, t)

    # Page 1: limit 2, offset 0
    items, total = repo.list_observations(limit=2, offset=0)
    assert total == 5
    assert len(items) == 2

    # Page 2: limit 2, offset 2
    items_p2, total_p2 = repo.list_observations(limit=2, offset=2)
    assert total_p2 == 5
    assert len(items_p2) == 2
    assert items_p2[0].id != items[0].id

    # Page 3: limit 2, offset 4
    items_p3, total_p3 = repo.list_observations(limit=2, offset=4)
    assert total_p3 == 5
    assert len(items_p3) == 1


# -----------------------------------------------------------------------------
# ARCH-001: Durable Analysis Run Execution Lifecycle Tests
# -----------------------------------------------------------------------------


def test_analysis_run_lifecycle_success(tmp_path: Path) -> None:
    """ARCH-001: Verify durable analysis run creation, progress updates, and completion."""
    db_path = tmp_path / "test.db"
    obs_dir = tmp_path / "obs"
    repo = ObservationRepository(db_path=db_path, observations_dir=obs_dir)

    obs_id = "obs_archive_001"
    # 1. Create run
    run = repo.create_analysis_run(
        observation_id=obs_id,
        config={"snr_threshold": 3.5, "fft_window": 64},
    )
    assert run.run_id.startswith("run_")
    assert run.observation_id == obs_id
    assert run.status == "pending"
    assert run.stage == "initialization"
    assert run.progress_fraction == 0.0
    assert run.config["snr_threshold"] == 3.5

    # 2. Update progress
    updated = repo.update_analysis_run_progress(
        run_id=run.run_id,
        stage="spectral_processing",
        progress_fraction=0.45,
    )
    assert updated is not None
    assert updated.status == "running"
    assert updated.stage == "spectral_processing"
    assert updated.progress_fraction == 0.45

    # 3. Complete run
    completed = repo.complete_analysis_run(
        run_id=run.run_id,
        results_summary={"candidates_found": 2, "drift_rates": [1.5, -0.4]},
        candidate_ids=["cand_01", "cand_02"],
        warnings=["Slight frequency edge truncation"],
    )
    assert completed is not None
    assert completed.status == "completed_with_warnings"
    assert completed.stage == "completed"
    assert completed.progress_fraction == 1.0
    assert completed.completed_at is not None
    assert completed.candidate_ids == ["cand_01", "cand_02"]
    assert completed.results_summary["candidates_found"] == 2
    assert "Slight frequency edge truncation" in completed.warnings

    # 4. Retrieve by ID
    retrieved = repo.get_analysis_run(run.run_id)
    assert retrieved is not None
    assert retrieved.run_id == run.run_id
    assert retrieved.status == "completed_with_warnings"


def test_analysis_run_lifecycle_failure(tmp_path: Path) -> None:
    """ARCH-001: Verify durable analysis run failure record preservation."""
    db_path = tmp_path / "test.db"
    obs_dir = tmp_path / "obs"
    repo = ObservationRepository(db_path=db_path, observations_dir=obs_dir)

    run = repo.create_analysis_run(observation_id="obs_fail_01")
    failed = repo.fail_analysis_run(
        run_id=run.run_id,
        error_message="Matrix dimension exceeded permissible memory ceiling",
        stage="slicing",
    )
    assert failed is not None
    assert failed.status == "failed"
    assert failed.stage == "slicing"
    assert failed.error_message == "Matrix dimension exceeded permissible memory ceiling"
    assert failed.completed_at is not None

    # Survives retrieval
    retrieved = repo.get_analysis_run(run.run_id)
    assert retrieved is not None
    assert retrieved.status == "failed"
    assert retrieved.error_message == "Matrix dimension exceeded permissible memory ceiling"


def test_analysis_run_idempotency_and_listing(tmp_path: Path) -> None:
    """ARCH-001: Verify idempotency on repeated run IDs and observation filtering."""
    db_path = tmp_path / "test.db"
    obs_dir = tmp_path / "obs"
    repo = ObservationRepository(db_path=db_path, observations_dir=obs_dir)

    custom_run_id = "run_custom_deterministic_123"
    r1 = repo.create_analysis_run(observation_id="obs_idemp", run_id=custom_run_id)
    r2 = repo.create_analysis_run(observation_id="obs_idemp", run_id=custom_run_id)

    assert r1.run_id == custom_run_id
    assert r2.run_id == custom_run_id

    # Create another run for different observation
    repo.create_analysis_run(observation_id="obs_other")

    # List filtered by observation
    runs_idemp, total_idemp = repo.list_analysis_runs(observation_id="obs_idemp")
    assert total_idemp == 1
    assert len(runs_idemp) == 1
    assert runs_idemp[0].run_id == custom_run_id

    # List all
    all_runs, total_all = repo.list_analysis_runs()
    assert total_all == 2
    assert len(all_runs) == 2
