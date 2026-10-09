"""Internal domain models for observation ingestion and persistence."""

from dataclasses import dataclass, field
from datetime import datetime

from app.schemas.observations import (
    ObservationRecordResponse,
    Provenance,
    ScientificMetadata,
)


@dataclass
class ParsedObservation:
    """Result of scientific file parsing before storage persistence."""

    metadata: ScientificMetadata
    provenance: Provenance
    warnings: list[str] = field(default_factory=list)


@dataclass
class ObservationRecordInternal:
    """Internal representation of a persisted observation record including internal storage path."""

    id: str
    original_filename: str
    format: str
    file_size_bytes: int
    sha256: str
    ingested_at: datetime
    status: str
    file_rel_path: str
    metadata: ScientificMetadata
    provenance: Provenance
    warnings: list[str] = field(default_factory=list)

    def to_response(self) -> ObservationRecordResponse:
        """Convert internal record to public API response schema, withholding server paths."""
        return ObservationRecordResponse(
            id=self.id,
            original_filename=self.original_filename,
            format=self.format,
            file_size_bytes=self.file_size_bytes,
            sha256=self.sha256,
            ingested_at=self.ingested_at,
            status=self.status,
            metadata=self.metadata,
            provenance=self.provenance,
            warnings=self.warnings,
        )
