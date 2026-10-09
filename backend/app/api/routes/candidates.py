"""FastAPI HTTP router for scientific candidate management, triage, and case files."""

from pathlib import Path

from fastapi import (
    APIRouter,
    Query,
    Request,
    status,
)
from fastapi import (
    Path as PathParam,
)
from fastapi.responses import FileResponse

from app.candidates.exceptions import CandidateNotFoundError
from app.candidates.repository import CandidateRepository
from app.candidates.schemas import (
    CandidateAssessment,
    CandidateDossier,
    CandidateStatus,
)
from app.candidates.service import CandidateService
from app.core.config import settings as default_settings
from app.schemas.candidates import (
    AssessCandidateRequest,
    CandidateListResponse,
    CandidateResponse,
    CreateCandidateRequest,
    ReviewCandidateRequest,
    ReviewCandidateResponse,
)
from app.schemas.error import ApiErrorResponse

router = APIRouter(prefix="/candidates", tags=["Candidates"])


def _get_candidate_service(request: Request) -> CandidateService:
    """Retrieve CandidateService initialized with application settings."""
    app_settings = getattr(request.app.state, "settings", default_settings)
    repo = CandidateRepository(db_path=Path(app_settings.db_path))
    dossiers_dir = Path(app_settings.data_dir) / "dossiers"
    return CandidateService(repository=repo, dossiers_dir=dossiers_dir)


@router.get(
    "",
    status_code=status.HTTP_200_OK,
    response_model=CandidateListResponse,
    summary="List scientific candidate records with optional filtering",
)
def list_candidates(
    request: Request,
    observation_id: str | None = Query(None, description="Filter by source observation ID"),
    status_filter: CandidateStatus | None = Query(
        None, alias="status", description="Filter by status"
    ),
    min_score: float | None = Query(None, ge=0.0, le=100.0, description="Minimum overall score"),
    max_score: float | None = Query(None, ge=0.0, le=100.0, description="Maximum overall score"),
    limit: int = Query(20, ge=1, le=100, description="Page limit"),
    offset: int = Query(0, ge=0, description="Page offset"),
) -> CandidateListResponse:
    """Query paginated candidate records matching operational filter criteria."""
    service = _get_candidate_service(request)
    items, total = service.list_candidates(
        observation_id=observation_id,
        status=status_filter,
        min_score=min_score,
        max_score=max_score,
        limit=limit,
        offset=offset,
    )
    return CandidateListResponse(
        items=items,
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post(
    "",
    status_code=status.HTTP_201_CREATED,
    response_model=CandidateResponse,
    summary="Create or group a scientific candidate record",
    responses={
        status.HTTP_422_UNPROCESSABLE_ENTITY: {"model": ApiErrorResponse},
    },
)
def create_candidate(
    request: Request,
    payload: CreateCandidateRequest,
) -> CandidateResponse:
    """Create a new candidate or group into an existing candidate based on spatial proximity."""
    service = _get_candidate_service(request)
    candidate, _ = service.create_or_group_candidate(
        observation_id=payload.observation_id,
        target_region=payload.target_region,
        detection_id=payload.detection_id,
        physical_coordinates=payload.physical_coordinates,
        scoring_config=payload.scoring_config,
        is_synthetic=payload.is_synthetic,
    )
    return CandidateResponse(**candidate.model_dump())


@router.get(
    "/{candidate_id}",
    status_code=status.HTTP_200_OK,
    response_model=CandidateResponse,
    summary="Retrieve single candidate record by ID",
    responses={
        status.HTTP_404_NOT_FOUND: {"model": ApiErrorResponse},
    },
)
def get_candidate(
    request: Request,
    candidate_id: str = PathParam(..., description="Unique candidate identifier UUID"),
) -> CandidateResponse:
    """Retrieve a single candidate record including evidence ledger and current assessment."""
    service = _get_candidate_service(request)
    candidate = service.get_candidate(candidate_id)
    return CandidateResponse(**candidate.model_dump())


@router.post(
    "/{candidate_id}/assess",
    status_code=status.HTTP_200_OK,
    response_model=CandidateAssessment,
    summary="Compute a new versioned priority assessment for a candidate",
    responses={
        status.HTTP_404_NOT_FOUND: {"model": ApiErrorResponse},
    },
)
def assess_candidate(
    request: Request,
    candidate_id: str = PathParam(..., description="Unique candidate identifier UUID"),
    payload: AssessCandidateRequest | None = None,
) -> CandidateAssessment:
    """Re-evaluate candidate evidence under a specified scoring policy and record new version."""
    service = _get_candidate_service(request)
    cfg = payload.scoring_config if payload else None
    return service.assess_candidate(candidate_id=candidate_id, scoring_config=cfg)


@router.get(
    "/{candidate_id}/dossier",
    status_code=status.HTTP_200_OK,
    response_model=CandidateDossier,
    summary="Generate structured scientific case file (dossier) snapshot",
    responses={
        status.HTTP_404_NOT_FOUND: {"model": ApiErrorResponse},
    },
)
def get_candidate_dossier(
    request: Request,
    candidate_id: str = PathParam(..., description="Unique candidate identifier UUID"),
    version: int | None = Query(
        None, description="Specific assessment version integer (or latest)"
    ),
) -> CandidateDossier:
    """Compile an immutable, machine-readable scientific case file snapshot."""
    service = _get_candidate_service(request)
    return service.generate_dossier(candidate_id=candidate_id, assessment_version=version)


@router.get(
    "/{candidate_id}/dossier.pdf",
    summary="Download publication-grade scientific PDF dossier",
    responses={
        status.HTTP_404_NOT_FOUND: {"model": ApiErrorResponse},
    },
)
def download_candidate_pdf(
    request: Request,
    candidate_id: str = PathParam(..., description="Unique candidate identifier UUID"),
    version: int | None = Query(
        None, description="Specific assessment version integer (or latest)"
    ),
) -> FileResponse:
    """Render and download vector PDF case file."""
    service = _get_candidate_service(request)
    pdf_path = service.export_dossier_pdf(candidate_id=candidate_id, assessment_version=version)
    if not pdf_path.exists():
        raise CandidateNotFoundError(
            f"PDF dossier for candidate '{candidate_id}' could not be generated."
        )

    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename=pdf_path.name,
    )


@router.post(
    "/{candidate_id}/review",
    status_code=status.HTTP_200_OK,
    response_model=ReviewCandidateResponse,
    summary="Record a human or automated triage review action",
    responses={
        status.HTTP_404_NOT_FOUND: {"model": ApiErrorResponse},
        status.HTTP_422_UNPROCESSABLE_ENTITY: {"model": ApiErrorResponse},
    },
)
def review_candidate(
    request: Request,
    payload: ReviewCandidateRequest,
    candidate_id: str = PathParam(..., description="Unique candidate identifier UUID"),
) -> ReviewCandidateResponse:
    """Submit a validated candidate lifecycle review transition and persist audit log."""
    service = _get_candidate_service(request)
    updated_cand, review = service.review_candidate(
        candidate_id=candidate_id,
        new_status=payload.new_status,
        reviewer_id=payload.reviewer_id,
        notes=payload.notes,
        action=payload.action,
        evidence_references=payload.evidence_references,
    )
    return ReviewCandidateResponse(candidate=updated_cand, review=review)
