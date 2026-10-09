"""FastAPI dependency injection providers."""

from pathlib import Path

from fastapi import Depends, Request

from app.core.config import Settings
from app.core.config import settings as default_settings
from app.ingestion.service import IngestionService
from app.storage.repository import ObservationRepository


def get_settings(request: Request) -> Settings:
    """Retrieve application settings from request app state or fall back to default."""
    return getattr(request.app.state, "settings", default_settings)


def get_repository(settings: Settings = Depends(get_settings)) -> ObservationRepository:
    """Provide ObservationRepository instance configured from active settings."""
    return ObservationRepository(
        db_path=Path(settings.db_path),
        observations_dir=Path(settings.observations_dir),
    )


def get_ingestion_service(
    settings: Settings = Depends(get_settings),
    repository: ObservationRepository = Depends(get_repository),
) -> IngestionService:
    """Provide IngestionService configured from active settings and repository."""
    return IngestionService(settings=settings, repository=repository)
