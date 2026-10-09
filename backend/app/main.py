"""Main application module and factory for AETHON backend service."""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager
from datetime import UTC, datetime
from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.analysis.exceptions import AnalysisError
from app.api.routes import api_router, health
from app.candidates.exceptions import (
    AssessmentNotFoundError,
    CandidateError,
    CandidateNotFoundError,
    IneligibleDetectionError,
    InvalidCandidateStateTransitionError,
)
from app.core.config import Settings
from app.core.config import settings as default_settings
from app.core.logging import get_logger, setup_logging
from app.detection.exceptions import DetectionError
from app.ingestion.exceptions import IngestionError
from app.representation.exceptions import RepresentationError
from app.schemas.error import ApiErrorResponse
from app.storage.repository import ObservationRepository

logger = get_logger("main")


def create_app(custom_settings: Settings | None = None) -> FastAPI:
    """Create and configure an instance of the FastAPI application.

    Args:
        custom_settings: Optional custom Settings instance for isolated testing.

    Returns:
        Configured FastAPI application instance.
    """
    app_settings = custom_settings or default_settings

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
        # Startup phase
        setup_logging(app_settings.log_level)
        logger.info(
            "Initializing %s v%s [Environment: %s]",
            app_settings.app_name,
            app_settings.app_version,
            app_settings.environment,
        )
        # Ensure observation storage directories and SQLite database are initialized
        Path(app_settings.observations_dir).mkdir(parents=True, exist_ok=True)
        Path(app_settings.temp_upload_dir).mkdir(parents=True, exist_ok=True)
        Path(app_settings.db_path).parent.mkdir(parents=True, exist_ok=True)
        repo = ObservationRepository(
            db_path=Path(app_settings.db_path),
            observations_dir=Path(app_settings.observations_dir),
        )
        repo.init_db()

        yield
        # Shutdown phase
        logger.info("Shutting down %s", app_settings.app_name)

    application = FastAPI(
        title=app_settings.app_name,
        description=app_settings.app_description,
        version=app_settings.app_version,
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )

    # Attach settings to application state for easy runtime inspection
    application.state.settings = app_settings

    # Configure CORS middleware
    application.add_middleware(
        CORSMiddleware,
        allow_origins=app_settings.cors_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=[
            "Content-Type",
            "Accept",
            "Authorization",
            "X-Client-Agent",
            "X-Telemetry-Trace",
        ],
    )

    # Consistent Error Handling adhering to frontend ApiErrorPayload contract
    @application.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException) -> JSONResponse:
        error_payload = ApiErrorResponse(
            message=exc.detail,
            code=f"HTTP_{exc.status_code}",
            status=exc.status_code,
            timestamp=datetime.now(UTC),
            details={"path": request.url.path},
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=error_payload.model_dump(mode="json"),
        )

    @application.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        error_payload = ApiErrorResponse(
            message="Request validation failed",
            code="VALIDATION_ERROR",
            status=422,
            timestamp=datetime.now(UTC),
            details={"errors": exc.errors(), "path": request.url.path},
        )
        return JSONResponse(
            status_code=422,
            content=error_payload.model_dump(mode="json"),
        )

    @application.exception_handler(IngestionError)
    async def ingestion_exception_handler(request: Request, exc: IngestionError) -> JSONResponse:
        error_payload = ApiErrorResponse(
            message=exc.message,
            code=exc.code,
            status=exc.status_code,
            timestamp=datetime.now(UTC),
            details=exc.details if exc.details else None,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=error_payload.model_dump(mode="json"),
        )

    @application.exception_handler(RepresentationError)
    async def representation_exception_handler(
        request: Request, exc: RepresentationError
    ) -> JSONResponse:
        error_payload = ApiErrorResponse(
            message=exc.message,
            code=exc.code,
            status=exc.status_code,
            timestamp=datetime.now(UTC),
            details=exc.details if exc.details else None,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=error_payload.model_dump(mode="json"),
        )

    @application.exception_handler(DetectionError)
    async def detection_exception_handler(request: Request, exc: DetectionError) -> JSONResponse:
        error_payload = ApiErrorResponse(
            message=exc.message,
            code=exc.code,
            status=exc.status_code,
            timestamp=datetime.now(UTC),
            details=exc.details if exc.details else None,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=error_payload.model_dump(mode="json"),
        )

    @application.exception_handler(AnalysisError)
    async def analysis_exception_handler(request: Request, exc: AnalysisError) -> JSONResponse:
        error_payload = ApiErrorResponse(
            message=exc.message,
            code=exc.code,
            status=exc.status_code,
            timestamp=datetime.now(UTC),
            details=exc.details if exc.details else None,
        )
        return JSONResponse(
            status_code=exc.status_code,
            content=error_payload.model_dump(mode="json"),
        )

    @application.exception_handler(CandidateError)
    async def candidate_exception_handler(request: Request, exc: CandidateError) -> JSONResponse:
        if isinstance(exc, (CandidateNotFoundError, AssessmentNotFoundError)):
            status_code = status.HTTP_404_NOT_FOUND
            code = "CANDIDATE_NOT_FOUND"
        elif isinstance(exc, (IneligibleDetectionError, InvalidCandidateStateTransitionError)):
            status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
            code = "INVALID_CANDIDATE_STATE"
        else:
            status_code = status.HTTP_400_BAD_REQUEST
            code = "CANDIDATE_ERROR"

        error_payload = ApiErrorResponse(
            message=exc.message,
            code=code,
            status=status_code,
            timestamp=datetime.now(UTC),
            details=exc.details if exc.details else None,
        )
        return JSONResponse(
            status_code=status_code,
            content=error_payload.model_dump(mode="json"),
        )

    @application.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled application exception at %s: %s", request.url.path, exc)
        message = (
            str(exc)
            if app_settings.debug
            else "An unexpected server error occurred during telemetry processing."
        )
        error_payload = ApiErrorResponse(
            message=message,
            code="INTERNAL_SERVER_ERROR",
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            timestamp=datetime.now(UTC),
            details={"path": request.url.path} if app_settings.debug else None,
        )
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_payload.model_dump(mode="json"),
        )

    # Root health probe endpoint (GET /health)
    application.include_router(health.router)

    # API routes mounted under configured prefix (e.g., GET /api/health)
    application.include_router(api_router, prefix=app_settings.api_prefix)

    return application


# Default ASGI application instance
app = create_app()
