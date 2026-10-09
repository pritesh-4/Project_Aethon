"""Standardized API error schema conforming to frontend ApiErrorPayload."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class ApiErrorResponse(BaseModel):
    """Unified error response model across all API endpoints."""

    message: str = Field(
        description="Human-readable explanation of the error",
        examples=["Requested resource was not found"],
    )
    code: str | None = Field(
        default="ERROR",
        description="Categorical application error code",
        examples=["NOT_FOUND"],
    )
    status: int = Field(
        description="HTTP status code",
        examples=[404],
    )
    timestamp: datetime = Field(
        description="ISO-8601 UTC timestamp of error generation",
    )
    details: dict[str, Any] | None = Field(
        default=None,
        description="Optional diagnostic context or validation issues",
    )
