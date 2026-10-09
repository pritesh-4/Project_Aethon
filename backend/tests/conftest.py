"""Pytest fixtures for AETHON backend test suite."""

from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app


@pytest.fixture
def test_settings() -> Settings:
    """Return an isolated test settings instance."""
    return Settings(
        app_name="AETHON Radio Signal Discovery Test API",
        app_version="0.1.0-test",
        environment="test",
        debug=True,
        api_prefix="/api",
        cors_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        log_level="DEBUG",
    )


@pytest.fixture
def client(test_settings: Settings) -> Generator[TestClient, None, None]:
    """Provide a TestClient instance configured with test settings."""
    app = create_app(custom_settings=test_settings)
    with TestClient(app) as test_client:
        yield test_client
