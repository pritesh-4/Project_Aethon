"""FastAPI routes for Breakthrough Listen public dataset catalogue and import."""

from __future__ import annotations

from pathlib import Path

from fastapi import APIRouter, HTTPException, Query, Request, status

from app.core.config import settings as default_settings
from app.datasets.archive_client import ArchiveClient
from app.datasets.import_service import DatasetImportService
from app.ingestion.exceptions import (
    FileSizeExceededError,
    InvalidFileContentError,
    UnsupportedFormatError,
)
from app.schemas.error import ApiErrorResponse
from app.schemas.public_datasets import (
    PublicDatasetImportRequest,
    PublicDatasetImportResponse,
    PublicDatasetQueryResponse,
    PublicDatasetStatusResponse,
)
from app.storage.repository import ObservationRepository

router = APIRouter(prefix="/public-datasets", tags=["Public Datasets"])


def _get_archive_client(request: Request) -> ArchiveClient:
    """Retrieve ArchiveClient configured with current application settings."""
    app_settings = getattr(request.app.state, "settings", default_settings)
    return ArchiveClient(settings=app_settings)


def _get_import_service(request: Request) -> DatasetImportService:
    """Retrieve DatasetImportService initialized with repository and settings."""
    app_settings = getattr(request.app.state, "settings", default_settings)
    repo = ObservationRepository(
        db_path=Path(app_settings.db_path),
        observations_dir=Path(app_settings.observations_dir),
    )
    return DatasetImportService(settings=app_settings, repository=repo)


@router.get(
    "/status",
    status_code=status.HTTP_200_OK,
    response_model=PublicDatasetStatusResponse,
    summary="Get Breakthrough Listen archive integration status",
    description="Check whether the external archive is configured, reachable, and reporting data.",
)
async def get_archive_status(request: Request) -> PublicDatasetStatusResponse:
    """Check archive connection health and configuration limits."""
    client = _get_archive_client(request)
    return await client.check_status()


@router.get(
    "/targets",
    status_code=status.HTTP_200_OK,
    response_model=list[str],
    summary="List available astronomical targets",
    description=(
        "Fetch list of known target source names present in the Breakthrough Listen archive."
    ),
)
async def list_archive_targets(request: Request) -> list[str]:
    """Retrieve available targets from the public archive."""
    client = _get_archive_client(request)
    return await client.get_targets()


@router.get(
    "/telescopes",
    status_code=status.HTTP_200_OK,
    response_model=list[str],
    summary="List available observing telescopes",
    description="Fetch list of observing facilities (e.g. GBT, Parkes, APF) in the archive.",
)
async def list_archive_telescopes(request: Request) -> list[str]:
    """Retrieve telescope names from the public archive."""
    client = _get_archive_client(request)
    return await client.get_telescopes()


@router.get(
    "/file-types",
    status_code=status.HTTP_200_OK,
    response_model=list[str],
    summary="List available archive file formats",
    description="Fetch list of file formats (filterbank, HDF5, baseband data) present in archive.",
)
async def list_archive_file_types(request: Request) -> list[str]:
    """Retrieve available file formats from the public archive."""
    client = _get_archive_client(request)
    return await client.get_file_types()


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    response_model=PublicDatasetQueryResponse,
    summary="Search Breakthrough Listen Open Data observations",
    description=(
        "Query public observational datasets from the Breakthrough Listen Open Data archive "
        "with target, telescope, format, quality, and size filters."
    ),
)
async def query_public_datasets(
    request: Request,
    target: str = Query(
        default="3C123",
        description="Target name to search (e.g. 3C123, VOYAGER1, HIP35136)",
    ),
    telescope: str | None = Query(
        default=None,
        description="Optional telescope filter (e.g. GBT, Parkes)",
    ),
    file_type: str | None = Query(
        default=None,
        description="Optional file type filter (e.g. filterbank, HDF5)",
    ),
    quality: str | None = Query(
        default=None,
        description="Optional observation quality filter",
    ),
    max_size_mb: float | None = Query(
        default=None,
        ge=0.1,
        description="Maximum file size in megabytes",
    ),
    limit: int = Query(
        default=25,
        ge=1,
        le=100,
        description="Number of observations to return per page",
    ),
    offset: int = Query(
        default=0,
        ge=0,
        description="Zero-indexed pagination offset",
    ),
) -> PublicDatasetQueryResponse:
    """Search public archive with validated criteria and normalization."""
    client = _get_archive_client(request)
    return await client.query_files(
        target=target,
        telescopes=telescope,
        file_types=file_type,
        quality=quality,
        limit=limit,
        offset=offset,
        max_size_mb=max_size_mb,
    )


@router.post(
    "/import",
    status_code=status.HTTP_201_CREATED,
    response_model=PublicDatasetImportResponse,
    summary="Import remote observation into AETHON",
    description=(
        "Safely stream a selected public observation from an authorized Breakthrough Listen "
        "repository directly into AETHON's scientific storage, validate its headers, compute "
        "its SHA-256 digest, and register a persisted observation record for immediate analysis."
    ),
    responses={
        201: {
            "description": "Observation successfully imported and indexed",
            "model": PublicDatasetImportResponse,
        },
        400: {
            "description": "Invalid URL, SSRF restriction violation, or unsupported format",
            "model": ApiErrorResponse,
        },
        413: {
            "description": "File exceeds configured maximum import byte limit",
            "model": ApiErrorResponse,
        },
        422: {
            "description": "Checksum mismatch or corrupt scientific format",
            "model": ApiErrorResponse,
        },
    },
)
async def import_public_dataset(
    request: Request,
    payload: PublicDatasetImportRequest,
) -> PublicDatasetImportResponse:
    """Stream, validate, and ingest an authorized remote radio observation file."""
    service = _get_import_service(request)
    try:
        return await service.import_dataset(payload)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        ) from e
    except UnsupportedFormatError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message,
        ) from e
    except FileSizeExceededError as e:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=e.message,
        ) from e
    except InvalidFileContentError as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=e.message,
        ) from e
