"""API routes aggregator."""

from fastapi import APIRouter

from app.api.routes import health, observations

api_router = APIRouter()

# Include health probe inside API prefix (e.g. /api/health)
api_router.include_router(health.router)

# Include scientific observation routes (e.g. /api/observations)
api_router.include_router(observations.router)
