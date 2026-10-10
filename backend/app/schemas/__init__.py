"""Data schemas for AETHON backend."""

from app.schemas.error import ApiErrorResponse
from app.schemas.health import HealthStatus
from app.schemas.observations import (
    ObservationListResponse,
    ObservationRecordResponse,
    Provenance,
    ScientificMetadata,
)
from app.schemas.public_datasets import (
    PublicDatasetImportRequest,
    PublicDatasetImportResponse,
    PublicDatasetItem,
    PublicDatasetQueryResponse,
    PublicDatasetStatusResponse,
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
    "PublicDatasetImportRequest",
    "PublicDatasetImportResponse",
    "PublicDatasetItem",
    "PublicDatasetQueryResponse",
    "PublicDatasetStatusResponse",
    "ScientificMetadata",
    "SliceIndexRange",
    "SliceProvenance",
    "SpectralSliceResponse",
]
