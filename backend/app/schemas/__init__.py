"""Data schemas for AETHON backend."""

from app.schemas.error import ApiErrorResponse
from app.schemas.health import HealthStatus
from app.schemas.observations import (
    ObservationListResponse,
    ObservationRecordResponse,
    Provenance,
    ScientificMetadata,
)

__all__ = [
    "ApiErrorResponse",
    "HealthStatus",
    "ObservationListResponse",
    "ObservationRecordResponse",
    "Provenance",
    "ScientificMetadata",
]
