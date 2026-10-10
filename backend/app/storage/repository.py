from __future__ import annotations

import json
import shutil
import sqlite3
from datetime import datetime
from pathlib import Path

from app.ingestion.models import ObservationRecordInternal
from app.schemas.observations import (
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

    def _get_connection(self) -> sqlite3.Connection:
        """Create a configured SQLite connection with row factory and pragmas."""
        conn = sqlite3.connect(
            str(self.db_path),
            timeout=30.0,
            check_same_thread=False,
        )
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA synchronous=NORMAL;")
        return conn

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
