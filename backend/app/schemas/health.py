"""Health check response schema."""

from datetime import datetime

from pydantic import BaseModel, Field


class HealthStatus(BaseModel):
    """Schema for service health probe response."""

    status: str = Field(
        default="healthy",
        description="Operational health indicator of the service",
        examples=["healthy"],
    )
    service: str = Field(
        default="aethon-backend",
        description="Service identifier",
        examples=["aethon-backend"],
    )
    version: str = Field(
        description="Current running semantic version of the backend service",
        examples=["0.1.0"],
    )
    environment: str = Field(
        description="Active operating environment",
        examples=["development"],
    )
    timestamp: datetime = Field(
        description="ISO-8601 UTC timestamp of the health verification",
    )
