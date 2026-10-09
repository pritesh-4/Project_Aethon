"""Health probe endpoint definition."""

from datetime import UTC, datetime

from fastapi import APIRouter, Request

from app.core.config import settings as default_settings
from app.schemas.health import HealthStatus

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthStatus,
    summary="Service Health Check",
    description="Lightweight health probe returning service operational status and metadata.",
)
async def get_health(request: Request) -> HealthStatus:
    """Return the health status of the AETHON backend service."""
    app_settings = getattr(request.app.state, "settings", default_settings)
    return HealthStatus(
        status="healthy",
        service="aethon-backend",
        version=app_settings.app_version,
        environment=app_settings.environment,
        timestamp=datetime.now(UTC),
    )
