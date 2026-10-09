"""SQLite repository for candidate records, assessments, and review history."""

import json
import sqlite3
from pathlib import Path
from typing import Any

from app.candidates.schemas import (
    Candidate,
    CandidateAssessment,
    CandidateStatus,
    EvidenceItem,
    PriorityBand,
    ReviewRecord,
)


class CandidateRepository:
    """Thread-safe SQLite repository managing persistent candidates and assessments."""

    def __init__(self, db_path: Path) -> None:
        self.db_path = Path(db_path).resolve()
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.init_db()

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
        conn.execute("PRAGMA foreign_keys=ON;")
        return conn

    def init_db(self) -> None:
        """Initialize database tables and indices idempotently."""
        with self._get_connection() as conn:
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS candidates (
                    id TEXT PRIMARY KEY,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    status TEXT NOT NULL,
                    source_observation_id TEXT NOT NULL,
                    source_observation_ids_json TEXT NOT NULL,
                    associated_detection_ids_json TEXT NOT NULL,
                    processing_run_ids_json TEXT NOT NULL,
                    analysis_run_ids_json TEXT NOT NULL,
                    target_region_json TEXT NOT NULL,
                    physical_coordinates_json TEXT NOT NULL,
                    evidence_items_json TEXT NOT NULL,
                    review_history_json TEXT NOT NULL,
                    current_assessment_json TEXT,
                    overall_score REAL,
                    schema_version TEXT NOT NULL,
                    is_synthetic INTEGER NOT NULL,
                    provenance_json TEXT NOT NULL,
                    warnings_json TEXT NOT NULL
                );
                """
            )
            conn.execute(
                """
                CREATE TABLE IF NOT EXISTS candidate_assessments (
                    id TEXT PRIMARY KEY,
                    candidate_id TEXT NOT NULL,
                    version INTEGER NOT NULL,
                    created_at TEXT NOT NULL,
                    policy_name TEXT NOT NULL,
                    policy_version TEXT NOT NULL,
                    overall_score REAL NOT NULL,
                    priority_band TEXT NOT NULL,
                    component_contributions_json TEXT NOT NULL,
                    contributing_evidence_ids_json TEXT NOT NULL,
                    missing_evidence_json TEXT NOT NULL,
                    detector_disagreement INTEGER NOT NULL,
                    explanation TEXT NOT NULL,
                    warnings_json TEXT NOT NULL,
                    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE
                );
                """
            )
            conn.execute("CREATE INDEX IF NOT EXISTS idx_cand_status ON candidates (status);")
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_cand_obs ON candidates (source_observation_id);"
            )
            conn.execute("CREATE INDEX IF NOT EXISTS idx_cand_score ON candidates (overall_score);")
            conn.execute(
                "CREATE INDEX IF NOT EXISTS idx_cand_assess_ver "
                "ON candidate_assessments (candidate_id, version);"
            )

    def save_candidate(self, candidate: Candidate) -> Candidate:
        """Atomically insert or update candidate entity in database."""
        current_assess_json = (
            candidate.current_assessment.model_dump_json() if candidate.current_assessment else None
        )
        score = candidate.current_assessment.overall_score if candidate.current_assessment else None

        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO candidates (
                    id, created_at, updated_at, status, source_observation_id,
                    source_observation_ids_json, associated_detection_ids_json,
                    processing_run_ids_json, analysis_run_ids_json, target_region_json,
                    physical_coordinates_json, evidence_items_json, review_history_json,
                    current_assessment_json, overall_score, schema_version,
                    is_synthetic, provenance_json, warnings_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    updated_at=excluded.updated_at,
                    status=excluded.status,
                    source_observation_ids_json=excluded.source_observation_ids_json,
                    associated_detection_ids_json=excluded.associated_detection_ids_json,
                    processing_run_ids_json=excluded.processing_run_ids_json,
                    analysis_run_ids_json=excluded.analysis_run_ids_json,
                    target_region_json=excluded.target_region_json,
                    physical_coordinates_json=excluded.physical_coordinates_json,
                    evidence_items_json=excluded.evidence_items_json,
                    review_history_json=excluded.review_history_json,
                    current_assessment_json=excluded.current_assessment_json,
                    overall_score=excluded.overall_score,
                    provenance_json=excluded.provenance_json,
                    warnings_json=excluded.warnings_json;
                """,
                (
                    candidate.candidate_id,
                    candidate.created_at_utc,
                    candidate.updated_at_utc,
                    candidate.status.value,
                    candidate.source_observation_ids[0]
                    if candidate.source_observation_ids
                    else "unknown",
                    json.dumps(candidate.source_observation_ids),
                    json.dumps(candidate.associated_detection_ids),
                    json.dumps(candidate.processing_run_ids),
                    json.dumps(candidate.analysis_run_ids),
                    json.dumps(candidate.target_region),
                    json.dumps(candidate.physical_coordinates),
                    json.dumps([e.model_dump() for e in candidate.evidence_items]),
                    json.dumps([r.model_dump() for r in candidate.review_history]),
                    current_assess_json,
                    score,
                    candidate.schema_version,
                    1 if candidate.is_synthetic else 0,
                    json.dumps(candidate.provenance),
                    json.dumps(candidate.warnings),
                ),
            )
        return candidate

    def save_assessment(self, assessment: CandidateAssessment) -> CandidateAssessment:
        """Persist a candidate assessment record and record version history."""
        with self._get_connection() as conn:
            conn.execute(
                """
                INSERT INTO candidate_assessments (
                    id, candidate_id, version, created_at, policy_name, policy_version,
                    overall_score, priority_band, component_contributions_json,
                    contributing_evidence_ids_json, missing_evidence_json,
                    detector_disagreement, explanation, warnings_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT(id) DO UPDATE SET
                    overall_score=excluded.overall_score,
                    priority_band=excluded.priority_band,
                    component_contributions_json=excluded.component_contributions_json,
                    explanation=excluded.explanation;
                """,
                (
                    assessment.assessment_id,
                    assessment.candidate_id,
                    assessment.version,
                    assessment.created_at_utc,
                    assessment.policy_name,
                    assessment.policy_version,
                    assessment.overall_score,
                    assessment.priority_band.value,
                    json.dumps(assessment.component_contributions),
                    json.dumps(assessment.contributing_evidence_ids),
                    json.dumps(assessment.missing_evidence),
                    1 if assessment.detector_disagreement else 0,
                    assessment.explanation,
                    json.dumps(assessment.warnings),
                ),
            )
        return assessment

    def get_candidate(self, candidate_id: str) -> Candidate | None:
        """Fetch single candidate record by UUID."""
        with self._get_connection() as conn:
            row = conn.execute("SELECT * FROM candidates WHERE id = ?", (candidate_id,)).fetchone()
        if row is None:
            return None
        return self._row_to_candidate(row)

    def get_assessment(
        self, candidate_id: str, version: int | None = None
    ) -> CandidateAssessment | None:
        """Fetch candidate assessment by version, or latest if version is None."""
        with self._get_connection() as conn:
            if version is not None:
                row = conn.execute(
                    "SELECT * FROM candidate_assessments WHERE candidate_id = ? AND version = ?",
                    (candidate_id, version),
                ).fetchone()
            else:
                query = (
                    "SELECT * FROM candidate_assessments "
                    "WHERE candidate_id = ? ORDER BY version DESC LIMIT 1"
                )
                row = conn.execute(query, (candidate_id,)).fetchone()
        if row is None:
            return None
        return self._row_to_assessment(row)

    def list_assessments(self, candidate_id: str) -> list[CandidateAssessment]:
        """Fetch all historical assessments for a candidate ordered oldest to newest."""
        with self._get_connection() as conn:
            rows = conn.execute(
                "SELECT * FROM candidate_assessments WHERE candidate_id = ? ORDER BY version ASC",
                (candidate_id,),
            ).fetchall()
        return [self._row_to_assessment(r) for r in rows]

    def list_candidates(
        self,
        observation_id: str | None = None,
        status: CandidateStatus | None = None,
        min_score: float | None = None,
        max_score: float | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[Candidate], int]:
        """Query paginated candidates with optional filtering."""
        clauses: list[str] = []
        params: list[Any] = []

        if observation_id:
            clauses.append("source_observation_id = ?")
            params.append(observation_id)
        if status:
            clauses.append("status = ?")
            params.append(status.value)
        if min_score is not None:
            clauses.append("overall_score >= ?")
            params.append(min_score)
        if max_score is not None:
            clauses.append("overall_score <= ?")
            params.append(max_score)

        where_sql = f"WHERE {' AND '.join(clauses)}" if clauses else ""

        with self._get_connection() as conn:
            count_cursor = conn.execute(
                f"SELECT COUNT(*) AS total FROM candidates {where_sql}", params
            )
            total = int(count_cursor.fetchone()["total"])

            query_sql = f"""
                SELECT * FROM candidates {where_sql}
                ORDER BY updated_at DESC
                LIMIT ? OFFSET ?
            """
            rows = conn.execute(query_sql, [*params, limit, offset]).fetchall()

        candidates = [self._row_to_candidate(row) for row in rows]
        return candidates, total

    @staticmethod
    def _row_to_candidate(row: sqlite3.Row) -> Candidate:
        """Convert SQLite row to typed Candidate model."""
        evidence_dicts = json.loads(row["evidence_items_json"])
        evidence_items = [EvidenceItem.model_validate(e) for e in evidence_dicts]

        review_dicts = json.loads(row["review_history_json"])
        review_history = [ReviewRecord.model_validate(r) for r in review_dicts]

        current_assess = None
        if row["current_assessment_json"]:
            current_assess = CandidateAssessment.model_validate_json(row["current_assessment_json"])

        return Candidate(
            candidate_id=row["id"],
            created_at_utc=row["created_at"],
            updated_at_utc=row["updated_at"],
            status=CandidateStatus(row["status"]),
            source_observation_ids=json.loads(row["source_observation_ids_json"]),
            associated_detection_ids=json.loads(row["associated_detection_ids_json"]),
            processing_run_ids=json.loads(row["processing_run_ids_json"]),
            analysis_run_ids=json.loads(row["analysis_run_ids_json"]),
            target_region=json.loads(row["target_region_json"]),
            physical_coordinates=json.loads(row["physical_coordinates_json"]),
            current_assessment=current_assess,
            evidence_items=evidence_items,
            review_history=review_history,
            schema_version=row["schema_version"],
            is_synthetic=bool(row["is_synthetic"]),
            provenance=json.loads(row["provenance_json"]),
            warnings=json.loads(row["warnings_json"]),
        )

    @staticmethod
    def _row_to_assessment(row: sqlite3.Row) -> CandidateAssessment:
        """Convert SQLite row to typed CandidateAssessment model."""
        return CandidateAssessment(
            assessment_id=row["id"],
            candidate_id=row["candidate_id"],
            version=row["version"],
            created_at_utc=row["created_at"],
            policy_name=row["policy_name"],
            policy_version=row["policy_version"],
            overall_score=row["overall_score"],
            priority_band=PriorityBand(row["priority_band"]),
            component_contributions=json.loads(row["component_contributions_json"]),
            contributing_evidence_ids=json.loads(row["contributing_evidence_ids_json"]),
            missing_evidence=json.loads(row["missing_evidence_json"]),
            detector_disagreement=bool(row["detector_disagreement"]),
            explanation=row["explanation"],
            warnings=json.loads(row["warnings_json"]),
        )
