"""Data schemas for AETHON backend."""

from app.schemas.error import ApiErrorResponse
from app.schemas.health import HealthStatus
from app.schemas.observations import (
    ObservationListResponse,
    ObservationRecordResponse,
    Provenance,
    ScientificMetadata,
)
from app.schemas.slice import (
    DataQualityInfo,
    SliceIndexRange,
    SliceProvenance,
    SpectralSliceResponse,
)

__all__ = [
    "ApiErrorResponse",
    "DataQualityInfo",
    "HealthStatus",
    "ObservationListResponse",
    "ObservationRecordResponse",
    "Provenance",
    "ScientificMetadata",
    "SliceIndexRange",
    "SliceProvenance",
    "SpectralSliceResponse",
]
