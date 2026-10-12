"""Automated tests for Cross-Origin Resource Sharing (CORS) behavior."""

import logging

import pytest
from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app


def test_cors_allowed_origin(client: TestClient) -> None:
    """Verify that allowed local Vite origin receives appropriate CORS headers."""
    response = client.options(
        "/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "X-Client-Agent,X-Telemetry-Trace",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:5173"
    assert "access-control-allow-credentials" in response.headers


def test_cors_disallowed_origin(client: TestClient) -> None:
    """Verify that an unauthorized origin does not receive CORS allow origin header."""
    response = client.options(
        "/health",
        headers={
            "Origin": "http://unauthorized-external-origin.com",
            "Access-Control-Request-Method": "GET",
        },
    )
    assert response.headers.get("access-control-allow-origin") is None


def test_cors_production_warning_on_localhost_origins(caplog: pytest.LogCaptureFixture) -> None:
    """SEC-001: Verify that production backend emits diagnostic warning if CORS is local-only."""
    prod_settings = Settings(
        environment="production",
        cors_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    )

    with caplog.at_level(logging.WARNING):
        app = create_app(custom_settings=prod_settings)
        with TestClient(app):
            pass

    assert any("Production CORS configuration alert" in record.message for record in caplog.records)


def test_cors_production_no_warning_when_properly_configured(
    caplog: pytest.LogCaptureFixture,
) -> None:
    """SEC-001: Verify no warning is emitted when production has a valid hosted origin."""
    prod_settings = Settings(
        environment="production",
        cors_origins=["https://aethon.astronomy.org"],
    )

    with caplog.at_level(logging.WARNING):
        app = create_app(custom_settings=prod_settings)
        with TestClient(app):
            pass

    assert not any(
        "Production CORS configuration alert" in record.message for record in caplog.records
    )


def test_cors_development_no_production_warning(caplog: pytest.LogCaptureFixture) -> None:
    """SEC-001: Verify development mode allows localhost origins without production warning."""
    dev_settings = Settings(
        environment="development",
        cors_origins=["http://localhost:5173"],
    )

    with caplog.at_level(logging.WARNING):
        app = create_app(custom_settings=dev_settings)
        with TestClient(app):
            pass

    assert not any(
        "Production CORS configuration alert" in record.message for record in caplog.records
    )
