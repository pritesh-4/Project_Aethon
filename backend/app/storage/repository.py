from __future__ import annotations

import json
import shutil
import sqlite3
import uuid
from collections.abc import Generator
from contextlib import contextmanager
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from app.ingestion.models import ObservationRecordInternal
from app.schemas.observations import (
    AnalysisRunRecord,
    ObservationRecordResponse,
    Provenance,
    ScientificMetadata,
)


class ObservationRepository:
    """Thread-safe SQLite repository managing observation metadata and raw file storage."""

    def __init__(self, db_path: Path, observations_dir: Path) -> None:
        self.db_path = Path(db_path).resolve()
        self.observations_dir = Path(observations_dir).resolve()
        self._ensure_directories()
        self.init_db()

    def _ensure_directories(self) -> None:
        """Create storage directory and database parent directory if they do not exist."""
        self.observations_dir.mkdir(parents=True, exist_ok=True)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)

    @contextmanager
    def _get_connection(self) -> Generator[sqlite3.Connection, None, None]:
        """Create a configured SQLite connection with row factory and pragmas.

        Yields the connection inside a context that commits on success,
        rolls back on exception, and always closes the connection on exit.
        """
        conn = sqlite3.connect(
            str(self.db_path),
            timeout=30.0,
            check_same_thread=False,
        )
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def init_db(self) -> None:
        """Initialize database tables and indices idempotently."""
        with self._get_connection() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS observations (
                    id TEXT PRIMARY KEY,
                    original_filename TEXT NOT NULL,
                    format TEXT NOT NULL,
                    file_size_bytes INTEGER NOT NULL,
                    sha256 TEXT NOT NULL,
                    ingested_at TEXT NOT NULL,
                    status TEXT NOT NULL,
                    file_rel_path TEXT NOT NULL,
                    metadata_json TEXT NOT NULL,
                    provenance_json TEXT NOT NULL,
                    warnings_json TEXT NOT NULL
                );
                """
            )
            conn.execute("CREATE INDEX IF NOT EXISTS idx_obs_sha256 ON observations (sha256);")
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_obs_ingested_at ON observations (ingested_at);"
            )

            # ARCH-001: Durable execution lifecycle table
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS analysis_runs (
                    run_id TEXT PRIMARY KEY,
                    observation_id TEXT NOT NULL,
                    status TEXT NOT NULL,
                    stage TEXT NOT NULL,
                    progress_fraction REAL NOT NULL DEFAULT 0.0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    completed_at TEXT,
                    config_json TEXT NOT NULL DEFAULT '{}',
                    results_summary_json TEXT,
                    error_message TEXT,
                    candidate_ids_json TEXT NOT NULL DEFAULT '[]',
                    warnings_json TEXT NOT NULL DEFAULT '[]',
                    FOREIGN KEY (observation_id) REFERENCES observations(id) ON DELETE CASCADE
                );
                """
            )
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_runs_observation ON analysis_runs (observation_id);"
            )
            conn.execute("CREATE INDEX IF NOT EXISTS idx_runs_status ON analysis_runs (status);")

    def save_observation(
        self,
        internal_record: ObservationRecordInternal,
        temp_file_path: Path,
    ) -> ObservationRecordResponse:
        """Atomically persist staged file and database record.

        Args:
            internal_record: Internal observation record with extracted metadata.
            temp_file_path: Staged temporary file containing validated original bytes.

        Returns:
            ObservationRecordResponse with safe public metadata.
        """
        dest_filename = f"{internal_record.id}.{internal_record.format}"
        dest_path = self.observations_dir / dest_filename
        internal_record.file_rel_path = dest_filename

        # Move staged temporary file into persistent observations directory
        shutil.move(str(temp_file_path), str(dest_path))

        try:
            with self._get_connection() as conn:
                conn.execute(
                    """
                    INSERT INTO observations (
                        id,
                        original_filename,
                        format,
                        file_size_bytes,
                        sha256,
                        ingested_at,
                        status,
                        file_rel_path,
                        metadata_json,
                        provenance_json,
                        warnings_json
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        internal_record.id,
                        internal_record.original_filename,
                        internal_record.format,
                        internal_record.file_size_bytes,
                        internal_record.sha256,
                        internal_record.ingested_at.isoformat(),
                        internal_record.status,
                        internal_record.file_rel_path,
                        internal_record.metadata.model_dump_json(),
                        internal_record.provenance.model_dump_json(),
                        json.dumps(internal_record.warnings),
                    ),
                )
        except Exception:
            # If database write fails, purge moved file to prevent orphan unindexed files
            if dest_path.exists():
                try:
                    dest_path.unlink()
                except Exception:
                    pass
            raise

        return internal_record.to_response()

    def get_observation(self, observation_id: str) -> ObservationRecordResponse | None:
        """Retrieve observation by ID, converting persisted record to public schema."""
        with self._get_connection() as conn:
            cursor = conn.execute(
                """
                SELECT
                    id, original_filename, format, file_size_bytes, sha256,
                    ingested_at, status, file_rel_path, metadata_json,
                    provenance_json, warnings_json
                FROM observations
                WHERE id = ?
                """,
                (observation_id,),
            )
            row = cursor.fetchone()

        if row is None:
            return None

        return self._row_to_response(row)

    def get_observation_by_sha256(self, sha256_hash: str) -> ObservationRecordResponse | None:
        """Retrieve existing observation by SHA-256 digest for deduplication."""
        with self._get_connection() as conn:
            cursor = conn.execute(
                """
                SELECT
                    id, original_filename, format, file_size_bytes, sha256,
                    ingested_at, status, file_rel_path, metadata_json,
                    provenance_json, warnings_json
                FROM observations
                WHERE sha256 = ?
                ORDER BY ingested_at DESC
                LIMIT 1
                """,
                (sha256_hash,),
            )
            row = cursor.fetchone()

        if row is None:
            return None

        return self._row_to_response(row)

    def get_internal_record(self, observation_id: str) -> ObservationRecordInternal | None:
        """Retrieve internal record including internal server file path."""
        with self._get_connection() as conn:
            cursor = conn.execute(
                """
                SELECT
                    id, original_filename, format, file_size_bytes, sha256,
                    ingested_at, status, file_rel_path, metadata_json,
                    provenance_json, warnings_json
                FROM observations
                WHERE id = ?
                """,
                (observation_id,),
            )
            row = cursor.fetchone()

        if row is None:
            return None

        metadata = ScientificMetadata.model_validate_json(row["metadata_json"])
        provenance = Provenance.model_validate_json(row["provenance_json"])
        warnings = json.loads(row["warnings_json"])
        ingested_at = datetime.fromisoformat(row["ingested_at"])

        return ObservationRecordInternal(
            id=row["id"],
            original_filename=row["original_filename"],
            format=row["format"],
            file_size_bytes=row["file_size_bytes"],
            sha256=row["sha256"],
            ingested_at=ingested_at,
            status=row["status"],
            file_rel_path=row["file_rel_path"],
            metadata=metadata,
            provenance=provenance,
            warnings=warnings,
        )

    def list_observations(
        self, limit: int = 20, offset: int = 0
    ) -> tuple[list[ObservationRecordResponse], int]:
        """Query paginated observation records ordered newest first."""
        with self._get_connection() as conn:
            count_cursor = conn.execute("SELECT COUNT(*) AS total FROM observations")
            total = int(count_cursor.fetchone()["total"])

            cursor = conn.execute(
                """
                SELECT
                    id, original_filename, format, file_size_bytes, sha256,
                    ingested_at, status, file_rel_path, metadata_json,
                    provenance_json, warnings_json
                FROM observations
                ORDER BY ingested_at DESC
                LIMIT ? OFFSET ?
                """,
                (limit, offset),
            )
            rows = cursor.fetchall()

        items = [self._row_to_response(row) for row in rows]
        return items, total

    def get_source_file_path(self, observation_id: str) -> Path | None:
        """Get absolute path to raw observation file on server."""
        internal = self.get_internal_record(observation_id)
        if internal is None:
            return None
        file_path = self.observations_dir / internal.file_rel_path
        return file_path if file_path.exists() else None

    @staticmethod
    def _row_to_response(row: sqlite3.Row) -> ObservationRecordResponse:
        """Helper to convert database row into ObservationRecordResponse."""
        metadata = ScientificMetadata.model_validate_json(row["metadata_json"])
        provenance = Provenance.model_validate_json(row["provenance_json"])
        warnings = json.loads(row["warnings_json"])
        ingested_at = datetime.fromisoformat(row["ingested_at"])

        return ObservationRecordResponse(
            id=row["id"],
            original_filename=row["original_filename"],
            format=row["format"],
            file_size_bytes=row["file_size_bytes"],
            sha256=row["sha256"],
            ingested_at=ingested_at,
            status=row["status"],
            metadata=metadata,
            provenance=provenance,
            warnings=warnings,
        )

    # -------------------------------------------------------------------------
    # ARCH-001: Durable Analysis Run Execution Lifecycle Methods
    # -------------------------------------------------------------------------

    def create_analysis_run(
        self,
        observation_id: str,
        run_id: str | None = None,
        config: dict[str, Any] | None = None,
    ) -> AnalysisRunRecord:
        """Create or idempotently retrieve a durable analysis execution run."""
        effective_run_id = run_id or f"run_{uuid.uuid4().hex[:12]}"
        now = datetime.now(UTC).isoformat()
        cfg_dict = config or {}

        with self._get_connection() as conn:
            # Check existing for idempotency
            cursor = conn.execute(
                "SELECT * FROM analysis_runs WHERE run_id = ?",
                (effective_run_id,),
            )
            existing = cursor.fetchone()
            if existing is not None:
                return self._row_to_analysis_run(existing)

            conn.execute(
                """
                INSERT INTO analysis_runs (
                    run_id, observation_id, status, stage, progress_fraction,
                    created_at, updated_at, completed_at, config_json,
                    results_summary_json, error_message, candidate_ids_json, warnings_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    effective_run_id,
                    observation_id,
                    "pending",
                    "initialization",
                    0.0,
                    now,
                    now,
                    None,
                    json.dumps(cfg_dict),
                    None,
                    None,
                    json.dumps([]),
                    json.dumps([]),
                ),
            )

        run_record = self.get_analysis_run(effective_run_id)
        assert run_record is not None, f"Failed to retrieve created run {effective_run_id}"
        return run_record

    def update_analysis_run_progress(
        self,
        run_id: str,
        stage: str,
        progress_fraction: float,
        warnings: list[str] | None = None,
    ) -> AnalysisRunRecord | None:
        """Update progress and stage for an active analysis run."""
        now = datetime.now(UTC).isoformat()
        clamped_progress = min(1.0, max(0.0, progress_fraction))

        with self._get_connection() as conn:
            cursor = conn.execute("SELECT * FROM analysis_runs WHERE run_id = ?", (run_id,))
            row = cursor.fetchone()
            if not row:
                return None

            warns = json.loads(row["warnings_json"])
            if warnings:
                warns.extend(warnings)

            conn.execute(
                """
                UPDATE analysis_runs
                SET status = 'running', stage = ?, progress_fraction = ?,
                    updated_at = ?, warnings_json = ?
                WHERE run_id = ?
                """,
                (stage, clamped_progress, now, json.dumps(warns), run_id),
            )

        return self.get_analysis_run(run_id)

    def complete_analysis_run(
        self,
        run_id: str,
        results_summary: dict[str, Any] | None = None,
        candidate_ids: list[str] | None = None,
        warnings: list[str] | None = None,
    ) -> AnalysisRunRecord | None:
        """Mark run as completed with associated candidate references and summaries."""
        now = datetime.now(UTC).isoformat()
        with self._get_connection() as conn:
            cursor = conn.execute("SELECT * FROM analysis_runs WHERE run_id = ?", (run_id,))
            row = cursor.fetchone()
            if not row:
                return None

            warns = json.loads(row["warnings_json"])
            if warnings:
                warns.extend(warnings)

            cand_ids = candidate_ids or []
            status = "completed_with_warnings" if warns else "completed"

            conn.execute(
                """
                UPDATE analysis_runs
                SET status = ?, stage = 'completed', progress_fraction = 1.0,
                    updated_at = ?, completed_at = ?, results_summary_json = ?,
                    candidate_ids_json = ?, warnings_json = ?
                WHERE run_id = ?
                """,
                (
                    status,
                    now,
                    now,
                    json.dumps(results_summary) if results_summary else None,
                    json.dumps(cand_ids),
                    json.dumps(warns),
                    run_id,
                ),
            )

        return self.get_analysis_run(run_id)

    def fail_analysis_run(
        self,
        run_id: str,
        error_message: str,
        stage: str | None = None,
    ) -> AnalysisRunRecord | None:
        """Mark run as failed with clear, safe error notification."""
        now = datetime.now(UTC).isoformat()
        with self._get_connection() as conn:
            cursor = conn.execute("SELECT * FROM analysis_runs WHERE run_id = ?", (run_id,))
            row = cursor.fetchone()
            if not row:
                return None

            conn.execute(
                """
                UPDATE analysis_runs
                SET status = 'failed', stage = ?, updated_at = ?,
                    completed_at = ?, error_message = ?
                WHERE run_id = ?
                """,
                (stage or "failed", now, now, error_message, run_id),
            )

        return self.get_analysis_run(run_id)

    def get_analysis_run(self, run_id: str) -> AnalysisRunRecord | None:
        """Retrieve durable analysis run by UUID."""
        with self._get_connection() as conn:
            cursor = conn.execute("SELECT * FROM analysis_runs WHERE run_id = ?", (run_id,))
            row = cursor.fetchone()
            if row is None:
                return None
            return self._row_to_analysis_run(row)

    def list_analysis_runs(
        self,
        observation_id: str | None = None,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[AnalysisRunRecord], int]:
        """List analysis runs, optionally filtered by observation."""
        with self._get_connection() as conn:
            if observation_id:
                count_cursor = conn.execute(
                    "SELECT COUNT(*) FROM analysis_runs WHERE observation_id = ?",
                    (observation_id,),
                )
                total = count_cursor.fetchone()[0]
                cursor = conn.execute(
                    """
                    SELECT * FROM analysis_runs
                    WHERE observation_id = ?
                    ORDER BY created_at DESC
                    LIMIT ? OFFSET ?
                    """,
                    (observation_id, limit, offset),
                )
            else:
                count_cursor = conn.execute("SELECT COUNT(*) FROM analysis_runs")
                total = count_cursor.fetchone()[0]
                cursor = conn.execute(
                    """
                    SELECT * FROM analysis_runs
                    ORDER BY created_at DESC
                    LIMIT ? OFFSET ?
                    """,
                    (limit, offset),
                )
            rows = cursor.fetchall()

        items = [self._row_to_analysis_run(row) for row in rows]
        return items, total

    @staticmethod
    def _row_to_analysis_run(row: sqlite3.Row) -> AnalysisRunRecord:
        """Helper to convert database row into AnalysisRunRecord."""
        config = json.loads(row["config_json"]) if row["config_json"] else {}
        results_summary = (
            json.loads(row["results_summary_json"]) if row["results_summary_json"] else None
        )
        candidate_ids = json.loads(row["candidate_ids_json"]) if row["candidate_ids_json"] else []
        warnings = json.loads(row["warnings_json"]) if row["warnings_json"] else []

        return AnalysisRunRecord(
            run_id=row["run_id"],
            observation_id=row["observation_id"],
            status=row["status"],
            stage=row["stage"],
            progress_fraction=float(row["progress_fraction"]),
            created_at=row["created_at"],
            updated_at=row["updated_at"],
            completed_at=row["completed_at"],
            config=config,
            results_summary=results_summary,
            error_message=row["error_message"],
            candidate_ids=candidate_ids,
            warnings=warnings,
        )
