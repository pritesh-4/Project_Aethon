"""Application configuration management via Pydantic Settings."""

import json
from typing import Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Core application settings with environment variable resolution."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Core Application Metadata
    app_name: str = Field(
        default="AETHON Radio Signal Discovery API",
        description="Application title displayed in OpenAPI documentation",
    )
    app_version: str = Field(
        default="0.1.0",
        description="Semantic version string of the backend service",
    )
    app_description: str = Field(
        default=(
            "Scientific radio-signal discovery and anomaly detection backend "
            "for high-cadence astronomical telemetry."
        ),
        description="Detailed description for OpenAPI documentation",
    )
    environment: Literal["development", "test", "production"] = Field(
        default="development",
        description="Deployment environment context",
    )
    debug: bool = Field(
        default=True,
        description="Debug flag controlling stack trace exposure and verbosity",
    )

    # Server Networking
    host: str = Field(
        default="127.0.0.1",
        description="Server host interface binding",
    )
    port: int = Field(
        default=8000,
        description="Server listening port",
    )

    # Routing
    api_prefix: str = Field(
        default="/api",
        description="Predictable URL prefix for application routes",
    )

    # Cross-Origin Resource Sharing (CORS)
    cors_origins: list[str] = Field(
        default=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ],
        description="List of allowed CORS origin URLs for frontend clients",
    )

    # Structured Logging
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"] = Field(
        default="INFO",
        description="Minimum log level for application loggers",
    )

    @field_validator("cors_origins", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: str | list[str]) -> list[str]:
        """Parse CORS origins whether supplied as JSON array or comma-separated string."""
        if isinstance(v, str):
            v_stripped = v.strip()
            if v_stripped.startswith("[") and v_stripped.endswith("]"):
                try:
                    parsed = json.loads(v_stripped)
                    if isinstance(parsed, list):
                        return [str(origin).strip() for origin in parsed if str(origin).strip()]
                except json.JSONDecodeError:
                    pass
            return [origin.strip() for origin in v_stripped.split(",") if origin.strip()]
        if isinstance(v, list):
            return [str(origin).strip() for origin in v if str(origin).strip()]
        return v

    @property
    def is_production(self) -> bool:
        """Helper to determine whether the service is running in production."""
        return self.environment == "production"


settings = Settings()
