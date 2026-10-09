"""Observation ingestion and querying API endpoints."""

from pathlib import Path

from fastapi import (
    APIRouter,
    File,
    Query,
    Request,
    UploadFile,
    status,
)
from fastapi import (
    Path as PathParam,
)

from app.core.config import settings as default_settings
from app.ingestion.exceptions import ObservationNotFoundError
from app.ingestion.service import IngestionService
from app.schemas.error import ApiErrorResponse
from app.schemas.observations import (
    ObservationListResponse,
    ObservationRecordResponse,
)
from app.storage.repository import ObservationRepository

router = APIRouter(prefix="/observations", tags=["Observations"])


def _get_repository(request: Request) -> ObservationRepository:
    """Retrieve repository initialized from current application settings."""
    app_settings = getattr(request.app.state, "settings", default_settings)
    return ObservationRepository(
        db_path=Path(app_settings.db_path),
        observations_dir=Path(app_settings.observations_dir),
    )


def _get_ingestion_service(request: Request) -> IngestionService:
    """Retrieve ingestion service initialized from current application settings."""
    app_settings = getattr(request.app.state, "settings", default_settings)
    repo = _get_repository(request)
    return IngestionService(settings=app_settings, repository=repo)


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=ObservationRecordResponse,
    summary="Ingest astronomical observation file",
    description=(
        "Upload a scientific radio observation file in SIGPROC Filterbank (.fil) or "
        "supported radio FITS (.fits, .fit) format. The server validates the format and "
        "content structure, streams the file safely with size and checksum checks, extracts "
        "scientific coordinate/frequency/time metadata, persists the raw bytes safely, "
        "and indexes the observation record."
    ),
    responses={
        201: {
            "description": "Observation successfully ingested and indexed",
            "model": ObservationRecordResponse,
        },
        400: {
            "description": "Unsupported file format or empty upload",
            "model": ApiErrorResponse,
        },
        413: {
            "description": "File size exceeds configured upload limit",
            "model": ApiErrorResponse,
        },
        422: {
            "description": "Corrupted file content or unsupported FITS layout",
            "model": ApiErrorResponse,
        },
    },
)
async def ingest_observation(
    request: Request,
    file: UploadFile = File(
        ...,
        description="Raw scientific observation file (.fil, .fits, or .fit)",
    ),
) -> ObservationRecordResponse:
    """Handle multipart file upload, validate scientific content, and persist observation."""
    service = _get_ingestion_service(request)
    return await service.ingest_file(file)


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    response_model=ObservationListResponse,
    summary="List ingested observations",
    description="Retrieve a paginated listing of persisted astronomical observations.",
    responses={
        200: {
            "description": "Paginated list of observation records",
            "model": ObservationListResponse,
        },
    },
)
def list_observations(
    request: Request,
    limit: int = Query(
        default=20,
        ge=1,
        le=100,
        description="Maximum number of observations to return per page (1-100)",
    ),
    offset: int = Query(
        default=0,
        ge=0,
        description="Zero-indexed pagination offset",
    ),
) -> ObservationListResponse:
    """Retrieve persisted observations with pagination."""
    repository = _get_repository(request)
    items, total = repository.list_observations(limit=limit, offset=offset)
    return ObservationListResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{observation_id}",
    status_code=status.HTTP_200_OK,
    response_model=ObservationRecordResponse,
    summary="Get observation details by ID",
    description="Retrieve scientific metadata, provenance, and status for a specific observation.",
    responses={
        200: {
            "description": "Observation details and extracted scientific metadata",
            "model": ObservationRecordResponse,
        },
        404: {
            "description": "Observation identifier was not found",
            "model": ApiErrorResponse,
        },
    },
)
def get_observation(
    request: Request,
    observation_id: str = PathParam(
        ...,
        description="Unique observation identifier UUID",
        examples=["550e8400-e29b-41d4-a716-446655440000"],
    ),
) -> ObservationRecordResponse:
    """Retrieve an observation record by its UUID."""
    repository = _get_repository(request)
    record = repository.get_observation(observation_id)
    if record is None:
        raise ObservationNotFoundError(observation_id=observation_id)
    return record
