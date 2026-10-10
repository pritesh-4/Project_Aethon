"""API routes aggregator."""

from fastapi import APIRouter

from app.api.routes import candidates, health, observations, public_datasets

api_router = APIRouter()

# Include health probe inside API prefix (e.g. /api/health)
api_router.include_router(health.router)

# Include scientific observation routes (e.g. /api/observations)
api_router.include_router(observations.router)

# Include scientific candidate routes (e.g. /api/candidates)
api_router.include_router(candidates.router)

# Include public astronomy dataset routes (e.g. /api/public-datasets)
api_router.include_router(public_datasets.router)
