"""API routes aggregator."""

from fastapi import APIRouter

from app.api.routes import health

api_router = APIRouter()

# Include health probe inside API prefix (e.g. /api/health)
api_router.include_router(health.router)
