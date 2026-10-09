"""Observation ingestion and querying API endpoints."""

from pathlib import Path

import numpy as np
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
from app.processing.pipeline import ProcessingService
from app.representation.service import SliceService
from app.schemas.error import ApiErrorResponse
from app.schemas.observations import (
    ObservationListResponse,
    ObservationRecordResponse,
)
from app.schemas.processing import (
    ProcessedObservationResponse,
    ProcessingRequestPayload,
)
from app.schemas.slice import SpectralSliceResponse
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


def _get_slice_service(request: Request) -> SliceService:
    """Retrieve slice service initialized from current application settings."""
    app_settings = getattr(request.app.state, "settings", default_settings)
    repo = _get_repository(request)
    return SliceService(repository=repo, settings=app_settings)


@router.get(
    "/{observation_id}/slice",
    status_code=status.HTTP_200_OK,
    response_model=SpectralSliceResponse,
    summary="Get bounded canonical spectral slice",
    description=(
        "Retrieve a bounded 2D numerical spectral data matrix from an ingested observation "
        "conforming to AETHON's canonical scientific representation: "
        "values[time_index][frequency_index] with ascending frequency columns. "
        "Queries are indexed using half-open ranges [start, stop). Bounded reads are "
        "streamed directly from disk without loading full raw observations into memory. "
        "Maximum matrix cell volume is bounded by MAX_SLICE_CELLS configuration."
    ),
    responses={
        200: {
            "description": "Canonical spectral slice matrix and physical coordinate arrays",
            "model": SpectralSliceResponse,
        },
        404: {
            "description": "Observation or source file not found",
            "model": ApiErrorResponse,
        },
        422: {
            "description": "Invalid slice bounds, limit exceeded, or unsupported layout",
            "model": ApiErrorResponse,
        },
    },
)
def get_observation_slice(
    request: Request,
    observation_id: str = PathParam(
        ...,
        description="Unique observation identifier UUID",
        examples=["550e8400-e29b-41d4-a716-446655440000"],
    ),
    time_start: int | None = Query(
        default=None,
        ge=0,
        description="Inclusive 0-based time index start. Defaults to 0.",
    ),
    time_stop: int | None = Query(
        default=None,
        ge=0,
        description="Exclusive 0-based time index stop. Defaults to min(total_time, 64).",
    ),
    frequency_start: int | None = Query(
        default=None,
        ge=0,
        description="Inclusive 0-based canonical frequency index start. Defaults to 0.",
    ),
    frequency_stop: int | None = Query(
        default=None,
        ge=0,
        description=(
            "Exclusive 0-based canonical frequency index stop. Defaults to min(channel_count, 256)."
        ),
    ),
) -> SpectralSliceResponse:
    """Extract bounded spectral slice adhering to AETHON canonical data contract."""
    service = _get_slice_service(request)
    return service.get_slice(
        observation_id=observation_id,
        time_start=time_start,
        time_stop=time_stop,
        frequency_start=frequency_start,
        frequency_stop=frequency_stop,
    )


@router.post(
    "/{observation_id}/process",
    status_code=status.HTTP_200_OK,
    response_model=ProcessedObservationResponse,
    summary="Process observation slice with quality assessment and RFI indicators",
    description=(
        "Executes robust statistical characterization, frequency-channel and time-sample "
        "RFI indicators, background estimation, and optional reproducible transformations on "
        "a bounded canonical observation slice. The raw source observation remains immutable."
    ),
    responses={
        status.HTTP_404_NOT_FOUND: {"model": ApiErrorResponse},
        status.HTTP_422_UNPROCESSABLE_ENTITY: {"model": ApiErrorResponse},
    },
)
def process_observation(
    request: Request,
    observation_id: str = PathParam(
        ...,
        description="Unique observation identifier UUID",
        examples=["550e8400-e29b-41d4-a716-446655440000"],
    ),
    payload: ProcessingRequestPayload | None = None,
) -> ProcessedObservationResponse:
    """Run processing pipeline on a bounded observation slice."""
    req_payload = payload or ProcessingRequestPayload()
    slice_service = _get_slice_service(request)

    canonical_slice = slice_service.get_canonical_slice(
        observation_id=observation_id,
        time_start=req_payload.time_start,
        time_stop=req_payload.time_stop,
        frequency_start=req_payload.frequency_start,
        frequency_stop=req_payload.frequency_stop,
    )

    proc_service = ProcessingService()
    result = proc_service.process_slice(canonical_slice, config=req_payload.config)

    # Format transformed values if present
    transformed_list = None
    if result.transformed_values is not None:
        transformed_list = [
            [float(v) if np.isfinite(v) else None for v in row] for row in result.transformed_values
        ]

    reason_counts = {
        reason: int(np.count_nonzero(mask))
        for reason, mask in result.quality_mask.reason_masks.items()
    }

    return ProcessedObservationResponse(
        observation_id=observation_id,
        matrix_shape=list(result.raw_values.shape),
        statistics=result.statistics,
        rfi_report=result.rfi_report,
        primary_mask_flagged_count=result.quality_mask.flagged_count,
        primary_mask_flagged_fraction=round(result.quality_mask.flagged_fraction, 6),
        reason_flag_counts=reason_counts,
        sample_value_semantics=result.sample_value_semantics,
        sample_value_unit=result.sample_value_unit,
        has_transformed_values=result.transformed_values is not None,
        transformed_values=transformed_list,
        transformation_history=result.transformation_history,
        pipeline_version=result.pipeline_version,
        warnings=result.warnings,
    )
